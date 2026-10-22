/**
 * one result shared by every caller for ttlMs, counted from when its load started: callers
 * arriving while it loads share that same call, and a result is never served once its load
 * started more than ttlMs ago. a failed load is never kept. per server instance (in memory)
 */
export function sharedTtl<T>(load: () => Promise<T>, ttlMs: number) {
  let entry: { promise: Promise<T>; startedAt: number } | null = null;

  return function shared(): Promise<T> {
    const now = Date.now();
    if (entry && now - entry.startedAt < ttlMs) return entry.promise;

    const current = { promise: load(), startedAt: now };
    entry = current;
    current.promise.catch(() => {
      if (entry === current) entry = null;
    });
    return current.promise;
  };
}
