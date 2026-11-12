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
test('home route mounts its session gate without waiting for unrelated app fonts', () => {
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

function landingSession({ signedIn = true, loaded = true, getToken = async () => 'test-token', syncUser, startOAuthFlow = async () => ({}), refreshOAuth = false }) {
  const hooks = [], navigations = [], alerts = [], renders = [];
  let cursor = 0, pendingEffects = [], scheduled = false, landing;
  const router = { replace: path => navigations.push(path) };
  const auth = { isLoaded: loaded, isSignedIn: signedIn, getToken };
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
    if (name === 'react-native') return {
      Platform: { OS: 'ios' }, Alert: { alert: (_title, message) => alerts.push(message) },
      View: 'View', Text: 'Text', TouchableOpacity: 'Button', ActivityIndicator: 'Spinner',
    };
    if (name.includes('constants/colors')) return { UI: {} };
    if (name.includes('startupTiming')) return { recordWebStartup() {} };
    if (name.includes('DesktopLanding')) return { __esModule: true, default: 'DesktopLanding' };
    if (name === '@clerk/clerk-expo') return {
      useAuth: () => auth,
      useOAuth: () => ({ startOAuthFlow: refreshOAuth ? () => startOAuthFlow() : startOAuthFlow }),
    };
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
    renders.push(landing);
    for (const effect of pendingEffects) effect();
  }
  render();
  function find(tree, type) {
    if (!tree || typeof tree !== 'object') return;
    if (tree.type === type) return tree;
    return [tree.props?.children].flat().map(child => find(child, type)).find(Boolean);
  }
  return {
    press: () => landing.props.onPressGoogle(),
    retry: () => find(landing, 'Button').props.onPress(),
    get tree() { return landing; },
    get signIn() { return landing.props.onPressGoogle; },
    setAuth: update => { Object.assign(auth, update); render(); },
    navigations, alerts, renders,
  };
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
  assert.ok(!includes(page.tree, 'DesktopLanding'));
  assert.ok(includes(page.tree, 'Button'));
  page.retry();
  await settleSession();
  assert.equal(syncCalls, 2);
  assert.equal(oauthCalls, 0);
  assert.deepEqual(page.navigations, ['/(tabs)/ask']);
  assert.ok(page.renders.every(tree => !includes(tree, 'DesktopLanding')));
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
  const clickSignIn = page.signIn;
  clickSignIn();
  await settleSession();
  clickSignIn();
  await settleSession();
  assert.equal(oauthCalls, 1);
  finishOAuth({ createdSessionId: 'test-session', setActive: async session => activeSessions.push(session) });
  await settleSession();
  assert.deepEqual(activeSessions, [{ session: 'test-session' }]);
  assert.ok(includes(page.tree, 'Spinner'));
  assert.ok(page.renders.slice(1).every(tree => !includes(tree, 'DesktopLanding')));
});

test('failed manual session retry gives feedback without claiming success', async () => {
  const page = landingSession({ syncUser: async () => { throw Error('offline'); } });
  await settleSession();
  assert.deepEqual(page.alerts, []);
  page.retry();
  await settleSession();
  assert.deepEqual(page.navigations, []);
  assert.ok(includes(page.tree, 'Button'));
  assert.match(JSON.stringify(page.tree), /could not connect to the server/);
  assert.ok(page.renders.every(tree => !includes(tree, 'DesktopLanding')));
});

test('unknown session never renders the homepage; confirmed signed-out session does', async () => {
  let syncCalls = 0;
  const page = landingSession({ loaded: false, signedIn: undefined, syncUser: async () => { syncCalls++; } });
  assert.ok(includes(page.tree, 'Spinner'));
  assert.ok(!includes(page.tree, 'DesktopLanding'));
  page.setAuth({ isLoaded: true, isSignedIn: false });
  await settleSession();
  assert.ok(includes(page.tree, 'DesktopLanding'));
  assert.equal(syncCalls, 0);
});

test('restored session stays behind the loader until backend sync and navigation finish', async () => {
  let finishSync;
  const page = landingSession({ loaded: false, syncUser: () => new Promise(resolve => { finishSync = resolve; }) });
  page.setAuth({ isLoaded: true, isSignedIn: true });
  await settleSession();
  assert.ok(includes(page.tree, 'Spinner'));
  assert.deepEqual(page.navigations, []);
  finishSync({ username: 'existing-user' });
  await settleSession();
  assert.deepEqual(page.navigations, ['/(tabs)/ask']);
  assert.ok(page.renders.every(tree => !includes(tree, 'DesktopLanding')));
});

test('successful OAuth does not flash the homepage before Clerk publishes the session', async () => {
  let syncCalls = 0, oauthCalls = 0;
  const page = landingSession({
    signedIn: false,
    refreshOAuth: true,
    startOAuthFlow: async () => { oauthCalls++; return { createdSessionId: 'session', setActive: async () => {} }; },
    syncUser: async () => { syncCalls++; return { username: 'existing-user' }; },
  });
  page.press();
  await settleSession();
  assert.ok(includes(page.tree, 'Spinner'));
  page.setAuth({ isSignedIn: false });
  await settleSession();
  assert.equal(oauthCalls, 1);
  page.setAuth({ isSignedIn: true });
  await settleSession();
  assert.equal(syncCalls, 1);
  assert.deepEqual(page.navigations, ['/(tabs)/ask']);
  assert.ok(page.renders.slice(1).every(tree => !includes(tree, 'DesktopLanding')));
});

for (const failure of ['cancelled', 'failed', 'activation failed']) {
  test(`${failure} OAuth returns signed-out visitors to the homepage`, async () => {
    const page = landingSession({
      signedIn: false,
      syncUser: async () => { throw Error('must not sync'); },
      startOAuthFlow: async () => {
        if (failure === 'failed') throw Error('OAuth unavailable');
        if (failure === 'activation failed') return {
          createdSessionId: 'session', setActive: async () => { throw Error('activation unavailable'); },
        };
        return {};
      },
    });
    page.press();
    await settleSession();
    assert.ok(includes(page.tree, 'DesktopLanding'));
    assert.deepEqual(page.navigations, []);
    assert.equal(page.alerts.length, failure === 'cancelled' ? 0 : 1);
  });
}

test('missing session token offers retry instead of leaving a permanent spinner', async () => {
  const page = landingSession({ getToken: async () => null, syncUser: async () => { throw Error('must not sync'); } });
  await settleSession();
  assert.ok(includes(page.tree, 'Button'));
  assert.ok(!includes(page.tree, 'DesktopLanding'));
  assert.deepEqual(page.navigations, []);
});

test('sign-out reveals the homepage and ignores stale backend sync completion', async () => {
  let finishSync;
  const page = landingSession({ syncUser: () => new Promise(resolve => { finishSync = resolve; }) });
  await settleSession();
  page.setAuth({ isSignedIn: false });
  finishSync({ username: 'previous-user' });
  await settleSession();
  assert.ok(includes(page.tree, 'DesktopLanding'));
  assert.deepEqual(page.navigations, []);
});
