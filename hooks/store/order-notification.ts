export const STORAGE_KEY = 'seen_orders_v1';
export const MIN_DELAY  = 5_000;
export const MAX_DELAY  = 10_000;
export const FIRST_MIN  =  5_000;
export const FIRST_MAX  = 10_000;

export function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return new Set();
    return new Set(ids);
  } catch { return new Set(); }
}

export function markSeen(id: string) {
  try {
    const ids = [...getSeenIds(), id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: new Date().toDateString(),
      ids,
    }));
  } catch {}
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}