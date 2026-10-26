import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";
import type { Redis } from "@upstash/redis";
import type { Session } from "neo4j-driver";
import { createMaintenanceRouter } from "../src/routes/maintenance.routes.js";
import { keepNeo4jAlive, keepRedisAlive } from "../src/services/maintenance.service.js";

test("maintenance HTTP endpoints require their own secret and report database failures safely", async (t) => {
  const previous = process.env.MAINTENANCE_SECRET;
  t.after(() => {
    if (previous === undefined) delete process.env.MAINTENANCE_SECRET;
    else process.env.MAINTENANCE_SECRET = previous;
  });
  let neo4jCalls = 0;
  let redisCalls = 0;
  let fail = false;
  const app = express();
  app.use("/api/maintenance", createMaintenanceRouter({
    neo4j: async () => { neo4jCalls++; },
    redis: async () => {
      redisCalls++;
      if (fail) throw new Error("sensitive-provider-token");
    },
  }));
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const call = (database: string, secret?: string, method = "POST") => fetch(
    `http://127.0.0.1:${address.port}/api/maintenance/${database}`,
    { method, headers: secret === undefined ? {} : { "X-Maintenance-Secret": secret } },
  );

  delete process.env.MAINTENANCE_SECRET;
  assert.equal((await call("redis", "test-secret")).status, 503);
  process.env.MAINTENANCE_SECRET = "   ";
  assert.equal((await call("redis", "   ")).status, 503);
  process.env.MAINTENANCE_SECRET = "test-secret";
  for (const database of ["neo4j", "redis"]) {
    assert.equal((await call(database)).status, 401);
    assert.equal((await call(database, "wrong")).status, 401);
    assert.equal((await call(database, "test-secret", "GET")).status, 404);
  }
  assert.equal(neo4jCalls + redisCalls, 0);

  const response = await call("neo4j", "test-secret");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok", database: "neo4j" });
  assert.equal(neo4jCalls, 1);
  assert.equal(redisCalls, 0);
  assert.equal((await call("redis", "test-secret")).status, 200);
  assert.equal(redisCalls, 1);

  fail = true;
  const failure = await call("redis", "test-secret");
  assert.equal(failure.status, 503);
  assert.deepEqual(await failure.json(), {
    status: "error", database: "redis", error: "Database maintenance check failed",
  });
});

test("Neo4j maintenance uses a read query and closes its session on success and failure", async () => {
  for (const outcome of ["success", "empty", "invalid", "error"] as const) {
    let closed = false;
    const session = {
      run: async (query: string, _parameters: unknown, options: { timeout: number }) => {
        assert.equal(query, "RETURN true AS ok");
        assert.equal(options.timeout, 10_000);
        if (outcome === "error") throw new Error("Connection failed");
        return { records: outcome === "empty" ? [] : [{ get: (field: string) => {
          assert.equal(field, "ok");
          return outcome === "success";
        } }] };
      },
      close: async () => { closed = true; },
    } as unknown as Pick<Session, "run" | "close">;
    if (outcome === "success") await keepNeo4jAlive(session);
    else await assert.rejects(keepNeo4jAlive(session));
    assert.equal(closed, true);
  }
});

test("Redis maintenance only reads and accepts both missing and existing keys", async () => {
  for (const value of [null, "existing-value"]) {
    let reads = 0;
    const redis = {
      get: async (key: string) => {
        assert.equal(key, "maintenance:keepalive");
        reads++;
        return value;
      },
    } as unknown as Pick<Redis, "get">;
    await Promise.all([keepRedisAlive(redis), keepRedisAlive(redis)]);
    assert.equal(reads, 2);
  }
});

test("Redis maintenance propagates read failures", async () => {
  const redis = {
    get: async () => { throw new Error("Connection failed"); },
  } as unknown as Pick<Redis, "get">;
  await assert.rejects(keepRedisAlive(redis), /Connection failed/);
});
