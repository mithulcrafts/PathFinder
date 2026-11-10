import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Exercise the installed Expo loader: its return value has .then(), but no .catch().
function expoLoader(importAll) {
  const source = readFileSync(new URL('../node_modules/expo/src/async-require/asyncRequireModule.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', '__METRO_GLOBAL_PREFIX__', 'process', outputText)(
    Object.assign(() => {}, { importAll }), module, module.exports, '', { env: { EXPO_OS: 'web' } },
  );
  return () => module.exports(1, null, '../index');
}

function profileMountEffect(loadRoute, loadUserProfile, warn) {
  const source = readFileSync(new URL('../app/(tabs)/profile.tsx', import.meta.url), 'utf8');
  const file = ts.createSourceFile('profile.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useEffect') {
      callback ??= node.arguments[0];
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(callback, 'Profile must load its data on mount');
  const { outputText } = ts.transpileModule(`const mountProfile = ${callback.getText(file)};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    transformers: {
      before: [context => {
        const replaceImport = node => {
          if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            return ts.factory.createCallExpression(ts.factory.createIdentifier('loadRoute'), undefined, []);
          }
          return ts.visitEachChild(node, replaceImport, context);
        };
        return node => ts.visitNode(node, replaceImport);
      }],
    },
  });
  return new Function('loadRoute', 'loadUserProfile', 'console', `${outputText}\nreturn mountProfile;`)(
    loadRoute, loadUserProfile, { warn },
  );
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('opening Profile accepts Expo thenables and does not mount the preloaded home page', async () => {
  let profileLoads = 0, routeLoads = 0, homeMounts = 0;
  const warnings = [];
  const load = expoLoader(() => {
    routeLoads++;
    return { default: () => { homeMounts++; } };
  });
  const mount = profileMountEffect(load, () => { profileLoads++; }, error => warnings.push(error));
  assert.doesNotThrow(mount);
  await settle();
  assert.equal(profileLoads, 1);
  assert.equal(routeLoads, 1);
  assert.equal(homeMounts, 0);
  assert.deepEqual(warnings, []);
});

for (const failure of ['synchronous', 'asynchronous']) {
  test(`${failure} route preload failures cannot crash Profile`, async () => {
    let profileLoads = 0;
    const warnings = [];
    const error = Error('optional route preload failed');
    const load = expoLoader(() => {
      if (failure === 'synchronous') throw error;
      return Promise.reject(error);
    });
    const mount = profileMountEffect(load, () => { profileLoads++; }, error => warnings.push(error));
    assert.doesNotThrow(mount);
    await settle();
    assert.equal(profileLoads, 1);
    assert.deepEqual(warnings, [error]);
  });
}
