import { create } from 'zustand';
import { getSeenIds, markSeen, randInt, MIN_DELAY, MAX_DELAY, FIRST_MIN, FIRST_MAX } from '@/hooks/store/order-notification';

const NOTIF_DURATION = 5_500; // match the 5000ms banner + 500ms buffer

const PALETTES = [
  { bg:'rgba(224,242,254,0.5)', chipBg:'#dbeafe', chipColor:'#1e3a8a', chipBorder:'#93c5fd', dot:'#3b82f6' },
  { bg:'rgba(236,253,245,0.5)', chipBg:'#d1fae5', chipColor:'#065f46', chipBorder:'#6ee7b7', dot:'#10b981' },
  { bg:'rgba(255,247,237,0.5)', chipBg:'#fed7aa', chipColor:'#7c2d12', chipBorder:'#fdba74', dot:'#f97316' },
  { bg:'rgba(253,242,248,0.5)', chipBg:'#fce7f3', chipColor:'#831843', chipBorder:'#f9a8d4', dot:'#ec4899' },
  { bg:'rgba(245,243,255,0.5)', chipBg:'#ede9fe', chipColor:'#3b0764', chipBorder:'#c4b5fd', dot:'#8b5cf6' },
] as const;

export type Palette = typeof PALETTES[number];
const EMOJIS = ['🎉','✨','🌟','💫','🎊','🙌','👏','🔥','💪','🤩'] as const;

export type RawOrder = {
  id: string;
  name: string;
  consultant: { name: string; category: string };
};

export type NotifEntry = {
  orderId: string;
  clientName: string;
  consultantName: string;
  category: string;
  emoji: string;
  palette: Palette;
  isRealtime: boolean;
  createdAt: Date;
};

type Store = {
  current:       NotifEntry | null;
  history:       NotifEntry[];
  dripQueue:     NotifEntry[];
  initDrip:      (todayOrders: RawOrder[]) => void;
  pushRealtime:  (order: RawOrder) => void;
  dismiss:       () => void;
  _scheduleNext: () => void;
};

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEntry(order: RawOrder, isRealtime: boolean): NotifEntry {
  return {
    orderId:        order.id,
    clientName:     order.name,
    consultantName: order.consultant.name,
    category:       order.consultant.category,
    emoji:          pickRandom(EMOJIS),
    palette:        pickRandom(PALETTES),
    isRealtime,
    createdAt:      new Date(),
  };
}

let nextTimer: ReturnType<typeof setTimeout> | null = null;

function clearNext() {
  if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
}

function _show(entry: NotifEntry) {
  markSeen(entry.orderId);
  useNotifStore.setState((s) => ({
    current: entry,
    history: [entry, ...s.history].slice(0, 50),
  }));
}

// show one item then wait NOTIF_DURATION + random gap before next
function _showThenSchedule(entry: NotifEntry, rest: NotifEntry[]) {
  _show(entry);
  useNotifStore.setState({ dripQueue: rest });

  // wait for banner to fully show AND dismiss before queuing next
  nextTimer = setTimeout(() => {
    useNotifStore.getState()._scheduleNext();
  }, NOTIF_DURATION + randInt(MIN_DELAY, MAX_DELAY));
}

export const useNotifStore = create<Store>((set, get) => ({
  current:   null,
  history:   [],
  dripQueue: [],

  initDrip: (todayOrders) => {
    const seen  = getSeenIds();
    const queue = todayOrders
      .filter((o) => !seen.has(o.id))
      .sort(() => Math.random() - 0.5)
      .map((o)  => buildEntry(o, false));

    set({ dripQueue: queue });
    if (queue.length === 0) return;

    // first notif: wait FIRST_MIN–FIRST_MAX after mount
    clearNext();
    nextTimer = setTimeout(() => {
      const [first, ...rest] = get().dripQueue;
      if (!first) return;
      _showThenSchedule(first, rest);
    }, randInt(FIRST_MIN, FIRST_MAX));
  },

  pushRealtime: (order) => {
    clearNext(); // cancel pending drip
    const entry = buildEntry(order, true);
    // remove from queue if already there
    set((s) => ({
      dripQueue: s.dripQueue.filter((o) => o.orderId !== order.id),
    }));
    // show immediately, then resume drip after it finishes
    _show(entry);
    useNotifStore.setState({ dripQueue: get().dripQueue }); // no-op, keeps queue intact
    nextTimer = setTimeout(() => {
      get()._scheduleNext();
    }, NOTIF_DURATION + randInt(MIN_DELAY, MAX_DELAY));
  },

  dismiss: () => set({ current: null }),

  _scheduleNext: () => {
    clearNext();
    const { dripQueue } = get();
    if (dripQueue.length === 0) return;
    const [next, ...rest] = dripQueue;
    nextTimer = setTimeout(() => {
      _showThenSchedule(next, rest);
    }, randInt(MIN_DELAY, MAX_DELAY));
  },
}));