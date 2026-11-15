import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page=readFileSync(new URL('../app/u/[username].tsx',import.meta.url),'utf8');
const results=readFileSync(new URL('../app/results.tsx',import.meta.url),'utf8');
test('search journey navigation passes display name without replacing username path',()=>{
 assert.ok(results.includes('pathname: `/u/${user.username}`'));
 assert.ok(results.includes("displayName: user.displayName ?? ''"));
});
test('public journey uses optional display name but shares stable username URL',()=>{
 assert.ok(page.includes('displayName: displayName?.trim() || null'));
 assert.ok(page.includes('journey.displayName?.trim() || `@${journey.username}`'));
 assert.ok(page.includes('buildPublicJourneyUrl(journey.username)'));
});
