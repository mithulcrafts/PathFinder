import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Compile the pure utility with the same TypeScript dependency used by Expo.
// React Native and the API module are not loaded: the journey import is type-only.
function loadTypeScript(filename) {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const require = specifier => specifier.startsWith('.')
    ? loadTypeScript(resolve(dirname(filename), `${specifier}.ts`))
    : createRequire(filename)(specifier);
  new Function('require', 'module', 'exports', outputText)(require, module, module.exports);
  return module.exports;
}

const { buildJourneyGraphElements, createJourneyGraphHtml } = loadTypeScript(
  fileURLToPath(new URL('../utils/journeyGraph.ts', import.meta.url)),
);

const { groupCommunityPaths, layoutCommunityPath, PATH_CARD_WIDTH, PATH_CARD_HEIGHT } = loadTypeScript(
  fileURLToPath(new URL('../utils/communityGraph.ts', import.meta.url)),
);
const { buildPublicJourneyUrl } = loadTypeScript(
  fileURLToPath(new URL('../utils/publicJourneyUrl.ts', import.meta.url)),
);

const graphNode = id => ({ id, title: `Experience ${id}`, authorUsername: 'alex' });
const graphEdge = (fromId, toId) => ({ fromId, toId, label: `${fromId} to ${toId}` });

test('community paths preserve every node and valid connection without joining unrelated paths', () => {
  const nodes = ['b', 'a', 'c', 'd', 'isolated'].map(graphNode);
  const edges = [graphEdge('a', 'b'), graphEdge('c', 'd'), graphEdge('missing', 'a')];
  const before = JSON.stringify({ nodes, edges });
  const paths = groupCommunityPaths(nodes, edges);
  assert.deepEqual(paths.map(path => path.nodes.map(node => node.id)), [['b', 'a'], ['c', 'd'], ['isolated']]);
  assert.deepEqual(paths.flatMap(path => path.edges), edges.slice(0, 2));
  assert.equal(JSON.stringify({ nodes, edges }), before);
  assert.deepEqual(groupCommunityPaths([], []), []);
});

test('community branches and merges use aligned columns with non-overlapping readable cards', () => {
  const path = groupCommunityPaths(['d', 'c', 'b', 'a'].map(graphNode), [
    graphEdge('a', 'b'), graphEdge('a', 'c'), graphEdge('b', 'd'), graphEdge('c', 'd'),
  ])[0];
  const layout = layoutCommunityPath(path);
  const byId = Object.fromEntries(layout.nodes.map(node => [node.id, node]));
  assert.ok(byId.a.x < byId.b.x && byId.b.x < byId.d.x);
  assert.equal(byId.b.x, byId.c.x);
  assert.ok(Math.abs(byId.b.y - byId.c.y) >= PATH_CARD_HEIGHT);
  for (const node of layout.nodes) {
    assert.ok(node.x >= 0 && node.y >= 0);
    assert.ok(node.x + PATH_CARD_WIDTH <= layout.width);
    assert.ok(node.y + PATH_CARD_HEIGHT <= layout.height);
  }
  assert.deepEqual(layout.connections.map(({ d, ...edge }) => edge), path.edges);
});

test('community cycles, self-loops and skipped columns retain their real directed connections', () => {
  const path = groupCommunityPaths(['a', 'b', 'c'].map(graphNode), [
    graphEdge('a', 'b'), graphEdge('b', 'c'), graphEdge('c', 'a'), graphEdge('b', 'b'), graphEdge('a', 'c'),
  ])[0];
  const layout = layoutCommunityPath(path);
  assert.equal(new Set(layout.nodes.map(node => node.id)).size, 3);
  assert.equal(layout.connections.length, 5);
  for (const connection of layout.connections) assert.doesNotMatch(connection.d, /NaN|undefined|Infinity/);
  assert.deepEqual(layoutCommunityPath(path), layout);
  assert.deepEqual(layout.connections.map(({ d, ...edge }) => edge), path.edges);
});

test('sharing targets the public app route and encodes usernames as a single path segment', () => {
  assert.equal(buildPublicJourneyUrl('vision-crafter-18', 'https://path-finder-webapp.vercel.app'),
    'https://path-finder-webapp.vercel.app/u/vision-crafter-18');
  assert.equal(buildPublicJourneyUrl('name /?#', 'https://preview.example/'),
    'https://preview.example/u/name%20%2F%3F%23');
});

test('previously shared landing-site URLs redirect to the same public profile route', () => {
  const config = JSON.parse(readFileSync(new URL('../../LandingPage/vercel.json', import.meta.url), 'utf8'));
  const redirect = config.redirects.find(rule => rule.source === '/u/:username');
  assert.equal(redirect.destination.replace(':username', 'vision-crafter-18'),
    buildPublicJourneyUrl('vision-crafter-18', 'https://path-finder-webapp.vercel.app'));
  assert.equal(redirect.permanent, true);
});

const journey = {
  username: 'alex',
  goals: [{ id: 'goal-1', title: 'Become an engineer' }],
  experiences: [
    { id: 'exp-1', title: 'Study', goalIds: ['goal-1'], skills: [{ name: 'TypeScript' }] },
    { id: 'exp-2', title: 'Internship' },
  ],
  transitions: [
    { fromExperienceId: 'exp-1', toExperienceId: 'exp-2', decisionLabel: 'Apply skills' },
    { fromExperienceId: 'missing', toExperienceId: 'exp-2', decisionLabel: 'Hidden experience' },
  ],
};

test('graph elements retain stable identities, labels, relationships and ordering', () => {
  assert.equal(buildJourneyGraphElements(null), '[]');
  const elements = JSON.parse(buildJourneyGraphElements(journey)).map(element => element.data);
  assert.deepEqual(elements.map(data => data.id), [
    'user', 'g_goal-1', 'e_ug_goal-1', 'x_exp-1', 'e_ux_exp-1',
    'e_xg_exp-1_goal-1', 's_exp-1_0', 'e_xs_s_exp-1_0', 'x_exp-2',
    'e_ux_exp-2', 't_0', 't_1',
  ]);
  assert.equal(elements[0].label, '@alex');
  assert.equal(elements[6].label, 'TypeScript');
  assert.deepEqual(elements[5], {
    id: 'e_xg_exp-1_goal-1', source: 'x_exp-1', target: 'g_goal-1', label: 'CONTRIBUTED_TO',
  });
  assert.deepEqual(elements[10], {
    id: 't_0', source: 'x_exp-1', target: 'x_exp-2', label: 'Apply skills',
  });
});

test('query-filtered public journeys exclude transitions whose endpoints are absent', () => {
  const elements = JSON.parse(buildJourneyGraphElements(journey, { filterMissingTransitions: true }));
  assert.deepEqual(elements.filter(({ data }) => data.id.startsWith('t_')), [{
    data: { id: 't_0', source: 'x_exp-1', target: 'x_exp-2', label: 'Apply skills' },
  }]);
  assert.equal(journey.transitions.length, 2, 'building a public graph must not mutate the source');
});

function runGraphDocument(options, platform) {
  const html = createJourneyGraphHtml(buildJourneyGraphElements(journey), options);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const messages = [];
  const handlers = new Map();
  const listeners = new Map();
  const animations = [];
  let configuration;
  let exportOptions;
  const cy = {
    on: (...args) => handlers.set(args.slice(0, -1).join(':'), args.at(-1)),
    animate: options => animations.push(options),
    png: options => { exportOptions = options; return 'data:image/png;base64,image'; },
  };
  const window = {
    parent: { postMessage: (message, origin) => messages.push({ data: JSON.parse(message), origin }) },
    addEventListener: (event, callback) => listeners.set(event, callback),
    ...(platform === 'native' ? {
      ReactNativeWebView: { postMessage: message => messages.push({ data: JSON.parse(message) }) },
    } : {}),
  };
  vm.runInNewContext(scripts[0][1], {
    document: { addEventListener: (_event, callback) => callback(), getElementById: () => ({}) },
    window,
    cytoscape: options => { configuration = options; return cy; },
  });
  return { configuration, handlers, listeners, animations, messages, cy, getExportOptions: () => exportOptions };
}

test('public graphs retain fixed dimensions and have no graph-export listener', () => {
  const { configuration, listeners } = runGraphDocument({}, 'web');
  const style = configuration.style[0].style;
  assert.equal(style.width, '160px');
  assert.equal(style.height, '80px');
  assert.equal(style['text-max-width'], '130px');
  assert.equal(style['font-family'], 'Inter, sans-serif');
  assert.equal(listeners.has('message'), false);
  assert.equal(configuration.layout.name, 'cose');
});

test('personal graphs preserve responsive dimension bounds and export behavior', () => {
  for (const [screenWidth, width, height, textWidth] of [
    [300, '140px', '73px', '100px'],
    [390, '172px', '89px', '132px'],
    [800, '185px', '96px', '145px'],
  ]) {
    const graph = runGraphDocument({ mode: 'personal', screenWidth }, 'web');
    const style = graph.configuration.style[0].style;
    assert.equal(style.width, width);
    assert.equal(style.height, height);
    assert.equal(style['text-max-width'], textWidth);
    graph.listeners.get('message')({ data: 'export' });
    assert.deepEqual(graph.messages[0], {
      data: { type: 'export_result', data: 'data:image/png;base64,image' }, origin: '*',
    });
    assert.equal(JSON.stringify(graph.getExportOptions()), JSON.stringify({ bg: '#FAF9F6', full: true, scale: 2 }));
  }
});

for (const mode of ['public', 'personal']) {
  for (const platform of ['web', 'native']) {
    test(`${mode} graph sends node/background taps through the ${platform} bridge`, () => {
      const graph = runGraphDocument({ mode, screenWidth: 390 }, platform);
      const node = { id: () => 'x_exp-1', data: () => 'Study' };
      graph.handlers.get('tap:node')({ target: node });
      graph.handlers.get('tap')({ target: graph.cy });
      assert.deepEqual(graph.messages.map(message => message.data), [
        { type: 'node_tap', nodeId: 'x_exp-1', nodeLabel: 'Study' }, { type: 'bg_tap' },
      ]);
      assert.equal(graph.animations[0].zoom, 1.4);
      assert.equal(graph.animations[1].fit.padding, 40);
      assert.equal(graph.animations[0].easing, mode === 'personal' ? 'ease-in-out-cubic' : undefined);
    });
  }
}
