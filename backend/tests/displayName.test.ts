import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTimelineFeed } from '../src/processors/query/timelineFeed.processor.js';
function feed(displayName?: string | null) {
  return buildTimelineFeed({journeys:[{username:'test1',displayName,summary:'Example',expertiseAreas:[],imageUrl:null,reputationScore:0,experienceIds:['e1']}], experiences:[{id:'e1', title:'Project',goalIds:[],transitions:[],skills:[]}],goals:[]} as any)[0]!;
}
test('display name does not change stable journey username', () => {
  const result=feed(' Rohinth ');
  assert.equal(result.displayName,'Rohinth');
  assert.equal(result.username,'test1');
});
test('legacy and empty display names remain absent', () => {
  for (const name of [undefined,null,'','  ']) assert.equal(feed(name).displayName,null);
});
