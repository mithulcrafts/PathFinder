import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createServer, get } from 'node:http';
import { once } from 'node:events';
import { gzipSync } from 'node:zlib';
import { localWebTransport } from '../scripts/local-web-transport.cjs';

const require = createRequire(import.meta.url);
const compression = require('compression');
const bundle = 'console.log("PathFinder");\n'.repeat(200);

test('localhost web bundle bypasses actual compression even when compression runs first', async () => {
  const transport = localWebTransport((_request, response) => {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(bundle);
  });
  const compress = compression();
  const server = createServer((request, response) => compress(request, response, () => transport(request, response)));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const read = path => new Promise((resolve, reject) => {
      get({ hostname: '127.0.0.1', port: server.address().port, path, headers: { 'Accept-Encoding': 'gzip' } }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve({ encoding: response.headers['content-encoding'], body: Buffer.concat(chunks) }));
        response.on('error', reject);
      }).on('error', reject);
    });
    const web = await read('/entry.bundle?platform=web&dev=true');
    assert.equal(web.encoding, undefined);
    assert.equal(web.body.toString(), bundle);
    const native = await read('/entry.bundle?platform=ios&dev=true');
    assert.equal(native.encoding, 'gzip');
    assert.deepEqual(native.body, gzipSync(bundle));
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('LAN, production, fonts, and unrelated requests retain compression negotiation', () => {
  for (const [address, url] of [
    ['192.168.1.20', '/entry.bundle?platform=web&dev=true'],
    ['127.0.0.1', '/entry.bundle?platform=web&dev=false'],
    ['127.0.0.1', '/font.ttf'],
    ['127.0.0.1', '/auth/sync'],
    [undefined, '/entry.bundle?platform=web&dev=true'],
  ]) {
    const request = { socket: { remoteAddress: address }, url, headers: { 'accept-encoding': 'gzip, br' } };
    const response = {}, next = () => {};
    let calls = 0;
    localWebTransport((req, res, callback) => {
      calls++;
      assert.equal(req, request);
      assert.equal(res, response);
      assert.equal(callback, next);
      assert.equal(req.headers['accept-encoding'], 'gzip, br');
    })(request, response, next);
    assert.equal(calls, 1);
  }
});
