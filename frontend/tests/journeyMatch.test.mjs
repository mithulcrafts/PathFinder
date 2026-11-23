import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../components/JourneyMatchCard.tsx', import.meta.url), 'utf8');
function harness() {
  let expanded = false;
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  const require = name => {
    if (name === 'react') return { useState: () => [expanded, update => { expanded = update(expanded); }] };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity' };
    if (name.includes('colors')) return { UI: { foreground: '#000', teal: '#064', tealTint: '#eee' } };
    throw new Error('Unexpected import: ' + name);
  };
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', js)(require, module, module.exports);
  return props => module.exports.JourneyMatchCard(props);
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  if (typeof node !== 'object') return String(node);
  return text(node.props?.children);
}
const match = { percentage: 0, computedAt: 'now', method: 'weighted-graph-overlap-v1',
  breakdown: [{ dimension: 'Skills', percentage: 0, weight: 1 }] };
test('zero is a valid displayed score, with no fallback percentage', () => {
  assert.match(text(harness()({ match })), /0% journey match/);
});
test('missing, invalid, or out-of-range score never displays a number', () => {
  for (const value of [undefined, null, { ...match, percentage: NaN }, { ...match, percentage: 101 }, { ...match, percentage: -1 }]) {
    const rendered = text(harness()({ match: value }));
    assert.match(rendered, /unavailable/);
    assert.doesNotMatch(rendered, /% journey match/);
  }
});
test('breakdown expands and collapses with accessible state', () => {
  const render = harness();
  let tree = render({ match });
  let button = tree.props.children[0];
  assert.equal(button.props.accessibilityState.expanded, false);
  assert.doesNotMatch(text(tree), /100% weight/);
  button.props.onPress();
  tree = render({ match });
  assert.equal(tree.props.children[0].props.accessibilityState.expanded, true);
  assert.match(text(tree), /100% weight/);
  assert.match(text(tree), /not a success probability/);
  tree.props.children[0].props.onPress();
  assert.equal(render({ match }).props.children[0].props.accessibilityState.expanded, false);
});
test('search results use actual data rather than synthesized fallback statistics', () => {
  const results = fs.readFileSync(new URL('../app/results.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(results, /getPseudoPct|\|\| 186|\|\| 24|VERIFIED USERS/);
  assert.match(results, /JourneyMatchCard key=\{user.username/);
  assert.match(results, /computedAt/);
});
test('query response is private and matching identity is server-authenticated', () => {
  const controller = fs.readFileSync(
    new URL('../../backend/src/controllers/query.controller.ts', import.meta.url),
    'utf8'
  );

  assert.match(controller, /getAuth\(req\).userId/);
  assert.match(controller, /private, no-store/);
  assert.match(controller, /vary\("Authorization"\)/);

  const api = fs.readFileSync(
    new URL('../api/query.api.ts', import.meta.url),
    'utf8'
  );

  assert.match(api, /import\s*\{\s*apiRequest\s*\}\s*from\s*["']\.\/api["']/);
  assert.equal((api.match(/apiRequest\(/g) ?? []).length, 2);

  const sharedApi = fs.readFileSync(
    new URL('../api/api.ts', import.meta.url),
    'utf8'
  );

  assert.match(sharedApi, /Authorization: `Bearer \$\{token\}`/);
});
