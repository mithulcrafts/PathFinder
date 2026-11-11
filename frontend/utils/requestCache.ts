// Short-lived, memory-only reuse for consecutive reads by the same session.
export function createRequestCache<T>(ttlMs: number, now = Date.now) {
  let entry: { key: string; promise: Promise<T>; expiresAt: number } | undefined;
  return {
    clear() { entry = undefined; },
    get(key: string, request: () => Promise<T>): Promise<T> {
      if (entry?.key === key && now() < entry.expiresAt) return entry.promise;
      const current = { key, promise: Promise.resolve().then(request), expiresAt: Infinity };
      entry = current;
      current.promise.then(
        () => { current.expiresAt = now() + ttlMs; },
        () => { if (entry === current) entry = undefined; },
      );
      return current.promise;
    },
  };
}
