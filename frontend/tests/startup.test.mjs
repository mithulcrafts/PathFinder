import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function compile(path, require) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }});
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(require, module, module.exports);
  return module.exports;
}
const { createRequestCache } = compile('../utils/requestCache.ts', () => { throw Error('Unexpected import'); });

test('simultaneous syncs share one request; short-lived result expires', async () => {
  let now = 0, calls = 0;
  const cache = createRequestCache(15, () => now);
  const request = async () => ++calls;
  assert.deepEqual(await Promise.all([cache.get('a', request), cache.get('a', request)]), [1, 1]);
  now = 14;
  assert.equal(await cache.get('a', request), 1);
  now = 15;
  assert.equal(await cache.get('a', request), 2);
});
test('session tokens never share cached user data', async () => {
  const cache = createRequestCache(15);
  assert.equal(await cache.get('alice', async () => 'Alice'), 'Alice');
  assert.equal(await cache.get('bob', async () => 'Bob'), 'Bob');
});
test('failed sync can retry immediately', async () => {
  const cache = createRequestCache(15);
  await assert.rejects(cache.get('a', async () => { throw Error('offline'); }));
  assert.equal(await cache.get('a', async () => 'recovered'), 'recovered');
});
test('logout/profile update invalidation cannot be undone by an older response', async () => {
  const cache = createRequestCache(15);
  let resolve;
  const old = cache.get('a', () => new Promise(done => { resolve = done; }));
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.get('a', async () => 'new'), 'new');
  resolve('old');
  await old;
  assert.equal(await cache.get('a', async () => 'wrong'), 'new');
});

function renderRoot({ home, landingReady, appReady, fontError = null }) {
  let calls = 0;
  const jsx = (type, props) => ({ type, props });
  const root = compile('../app/_layout.tsx', name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useEffect() {} };
    if (name.includes('useDesktopLayout')) return { useDesktopLayout: () => true };
    if (name === 'expo-router') return { useSegments: () => home ? [] : ['(tabs)'], Slot: 'Slot' };
    if (name === '@clerk/clerk-expo') return { ClerkProvider: 'ClerkProvider', ClerkLoaded: 'ClerkLoaded' };
    if (name === 'react-native') return { Platform: { OS: 'web' }, View: 'View', ActivityIndicator: 'Spinner' };
    if (name === 'react-native-gesture-handler') return { GestureHandlerRootView: 'Root' };
    if (name.includes('@expo-google-fonts/')) return { useFonts: () => [calls++ === 0 ? landingReady : appReady, fontError] };
    if (name === 'expo-splash-screen') return { preventAutoHideAsync: async () => {}, hideAsync: async () => {} };
    return {};
  });
  return root.default();
}
function includes(tree, type) {
  if (!tree || typeof tree !== 'object') return false;
  return tree.type === type || [tree.props?.children].flat().some(child => includes(child, type));
}
process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test';
test('Clerk starts while fonts are still loading', () => {
  const tree = renderRoot({ home: true, landingReady: false, appReady: false });
  assert.ok(includes(tree, 'ClerkProvider'));
  assert.ok(includes(tree, 'Spinner'));
});
test('public homepage does not wait for Clerk or unrelated app fonts', () => {
  const tree = renderRoot({ home: true, landingReady: true, appReady: false });
  assert.ok(includes(tree, 'Slot'));
  assert.ok(!includes(tree, 'ClerkLoaded'));
});
test('other screens retain the Clerk readiness gate', () => {
  const tree = renderRoot({ home: false, landingReady: true, appReady: true });
  assert.ok(includes(tree, 'ClerkLoaded'));
});
test('font failure does not leave the homepage spinning forever', () => {
  const tree = renderRoot({ home: true, landingReady: false, appReady: false, fontError: Error('offline') });
  assert.ok(includes(tree, 'Slot'));
});

const { signOutWithoutReload } = compile('../utils/signOut.ts', () => { throw Error('Unexpected import'); });
test('logout suppresses full reload and navigates only after session cleanup', async () => {
  const events = [];
  await signOutWithoutReload(async callback => {
    assert.equal(typeof callback, 'function');
    events.push('revoked');
    callback();
    await Promise.resolve();
    events.push('cleared');
  }, () => events.push('navigate'));
  assert.deepEqual(events, ['revoked', 'cleared', 'navigate']);
});
test('failed logout does not navigate or pretend the session ended', async () => {
  let navigated = false;
  await assert.rejects(signOutWithoutReload(async () => { throw Error('offline'); }, () => { navigated = true; }));
  assert.equal(navigated, false);
});

function landingSession({ signedIn = true, syncUser, startOAuthFlow = async () => ({}) }) {
  const hooks = [], navigations = [], alerts = [];
  let cursor = 0, pendingEffects = [], scheduled = false, landing;
  const router = { replace: path => navigations.push(path) };
  const auth = { isLoaded: true, isSignedIn: signedIn, getToken: async () => 'test-token' };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; render(); });
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      hooks[index] ??= { value: initial };
      return [hooks[index].value, update => {
        const next = typeof update === 'function' ? update(hooks[index].value) : update;
        if (!Object.is(next, hooks[index].value)) {
          hooks[index].value = next;
          schedule();
        }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ??= { current: initial };
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = hooks[index];
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      hooks[index] = { deps };
      pendingEffects.push(() => {
        previous?.cleanup?.();
        hooks[index].cleanup = effect();
      });
    },
  };
  const jsx = (type, props) => ({ type, props });
  const page = compile('../app/index.tsx', name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { Platform: { OS: 'ios' }, Alert: { alert: (_title, message) => alerts.push(message) } };
    if (name === '@clerk/clerk-expo') return { useAuth: () => auth, useOAuth: () => ({ startOAuthFlow }) };
    if (name === 'expo-router') return { useRouter: () => router };
    if (name.includes('auth.api')) return { syncUser, clearSyncedUser() {} };
    if (name.includes('useDesktopLayout')) return { useDesktopLayout: () => true };
    if (name.includes('landingMotion')) return { useLandingViewport: () => ({}) };
    if (name === 'react-native-reanimated') return { useAnimatedScrollHandler() {}, useAnimatedStyle: () => ({}) };
    return {};
  });
  function render() {
    cursor = 0;
    pendingEffects = [];
    const content = page.default().props.children;
    landing = content.type();
    for (const effect of pendingEffects) effect();
  }
  render();
  return { press: () => landing.props.onPressGoogle(), navigations, alerts };
}

const settleSession = () => new Promise(resolve => setImmediate(resolve));

test('signed-in visitor retries failed backend sync without reopening Google OAuth', async () => {
  let syncCalls = 0, oauthCalls = 0;
  const page = landingSession({
    syncUser: async () => {
      if (++syncCalls === 1) throw Error('server unavailable');
      return { username: 'existing-user' };
    },
    startOAuthFlow: async () => { oauthCalls++; return {}; },
  });
  await settleSession();
  assert.deepEqual(page.navigations, []);
  page.press();
  await settleSession();
  assert.equal(syncCalls, 2);
  assert.equal(oauthCalls, 0);
  assert.deepEqual(page.navigations, ['/(tabs)/ask']);
});

test('signed-in visitor without a username still reaches profile setup', async () => {
  const page = landingSession({ syncUser: async () => ({ username: null }) });
  await settleSession();
  assert.deepEqual(page.navigations, ['/(tabs)/profile']);
});

test('signed-out visitor starts Google OAuth once, even with repeated clicks', async () => {
  let oauthCalls = 0, finishOAuth;
  const activeSessions = [];
  const page = landingSession({
    signedIn: false,
    syncUser: async () => { throw Error('must not sync before sign-in'); },
    startOAuthFlow: () => {
      oauthCalls++;
      return new Promise(resolve => { finishOAuth = resolve; });
    },
  });
  page.press();
  await settleSession();
  page.press();
  await settleSession();
  assert.equal(oauthCalls, 1);
  finishOAuth({ createdSessionId: 'test-session', setActive: async session => activeSessions.push(session) });
  await settleSession();
  assert.deepEqual(activeSessions, [{ session: 'test-session' }]);
});

test('failed manual session retry gives feedback without claiming success', async () => {
  const page = landingSession({ syncUser: async () => { throw Error('offline'); } });
  await settleSession();
  assert.deepEqual(page.alerts, []);
  page.press();
  await settleSession();
  assert.deepEqual(page.navigations, []);
  assert.equal(page.alerts.length, 1);
  assert.match(page.alerts[0], /could not connect to the server/);
});
