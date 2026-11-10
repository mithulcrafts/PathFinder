const recorded = new Set<string>();

// Local development diagnostics only. Never log tokens, query strings, or user data.
export function recordWebStartup(phase: string) {
  if (!__DEV__ || typeof window === 'undefined' || !window.performance || recorded.has(phase)) return;
  recorded.add(phase);
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const relevant = resources.filter(entry => /\.(bundle|ttf|woff2?)(\?|$)/.test(entry.name));
  console.info('[PathFinder startup]', JSON.stringify({
    phase,
    elapsedMs: Math.round(performance.now()),
    resources: relevant.map(entry => ({
      file: (new URL(entry.name).searchParams.get('unstable_path') || new URL(entry.name).pathname).split('/').pop(),
      startMs: Math.round(entry.startTime),
      durationMs: Math.round(entry.duration),
      responseMs: Math.round(entry.responseStart - entry.startTime),
      bodyMs: Math.round(entry.responseEnd - entry.responseStart),
    })),
  }));
}
