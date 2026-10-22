// the clients' online list timing, shared by the server action's cache and the client hook's
// refetch, so the two can't drift apart.
//
// the invariant: REFETCH_MIN_MS >= ONLINE_LIST_TTL_MS. a refetch caused by a change starts at
// least one ttl after the client heard of it, so any cached list it gets was loaded after the
// change: a consultant who comes online always appears, within REFETCH_MAX_MS plus the request
// (about 4.5s). going offline needs no refetch (the client removes them at once)

// the server action shares one list per instance for this long
export const ONLINE_LIST_TTL_MS = 2_000;

// after a change, each visitor refetches at a random moment in this window, so hundreds of
// visitors spread over 2s instead of calling in the same second
export const REFETCH_MIN_MS = 2_000;
export const REFETCH_MAX_MS = 4_000;

export function refetchDelay(random: () => number = Math.random): number {
  return REFETCH_MIN_MS + random() * (REFETCH_MAX_MS - REFETCH_MIN_MS);
}
