import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { expoEnvironment } = require('../scripts/start-expo.cjs');

test('Expo child starts with a larger pool without modifying the parent environment', () => {
  const original = { PATH: '/existing/path', EXPO_PUBLIC_API_BASE_URL: 'http://localhost:5000/api' };
  const child = expoEnvironment(original);
  assert.equal(child.UV_THREADPOOL_SIZE, '16');
  assert.equal(child.PATH, original.PATH);
  assert.equal(child.EXPO_PUBLIC_API_BASE_URL, original.EXPO_PUBLIC_API_BASE_URL);
  assert.equal(original.UV_THREADPOOL_SIZE, undefined);
});
test('an explicit worker pool setting is preserved', () => {
  assert.equal(expoEnvironment({ UV_THREADPOOL_SIZE: '24' }).UV_THREADPOOL_SIZE, '24');
});
