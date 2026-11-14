import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { journeyProofSchema, submitExperienceSchema } from "../src/processors/journey/journeySchema.js";

process.env.GEMINI_API_KEY ??= "fixture";
const { verifyProof } = await import("../src/processors/journey/verifyProof.processor.js");
const { geminiClient } = await import("../src/config/gemini.config.js");

const experience = submitExperienceSchema.parse({
  id: randomUUID(), title: "Software internship", context: "Built a reporting tool",
  timelineSummary: "Built a reporting tool", startDate: "06 2024", goalIds: [], isVerified: false,
});
const github = { id: "github-proof", sourceType: "github", url: "https://github.com/example/reporting/commit/abcdef" } as const;

test("missing uploads and unsupported links return persistable, unverified results", async () => {
  const missing = await verifyProof(experience, { id: "file", sourceType: "pdf" }, null);
  assert.equal(missing.status, "rejected");
  assert.equal(missing.url, null);
  assert.equal(journeyProofSchema.safeParse(missing).success, true);
  const unsupported = await verifyProof(experience, { ...github, sourceType: "link" }, null);
  assert.equal(unsupported.status, "skipped");
  assert.equal(unsupported.verifiedAt, null);
});

test("inline verification distinguishes a valid verdict from missing evidence and processing errors", async t => {
  let httpStatus = 200;
  let verdict = '{"status":"verified","reason":"The commit supports the claim."}';
  t.mock.method(globalThis, "fetch", async () => new Response(
    JSON.stringify({ commit: { message: "Add reporting tool" } }), { status: httpStatus },
  ));
  t.mock.method(geminiClient, "getGenerativeModel", () => ({
    async generateContent() {
      return { response: { text: () => verdict } };
    },
  }));

  const verified = await verifyProof(experience, github, null);
  assert.equal(verified.status, "verified");
  assert.ok(verified.verifiedAt);

  verdict = '{"status":"rejected","reason":"The evidence does not support the claim."}';
  assert.equal((await verifyProof(experience, github, null)).status, "rejected");

  verdict = '{"status":"unknown","reason":"Invalid response."}';
  const failed = await verifyProof(experience, github, null);
  assert.equal(failed.status, "failed");
  assert.equal(failed.verifiedAt, null);

  httpStatus = 404;
  assert.equal((await verifyProof(experience, github, null)).status, "rejected");
  httpStatus = 503;
  assert.equal((await verifyProof(experience, github, null)).status, "failed");
});
