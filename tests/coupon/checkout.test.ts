/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// the coupon from the preview to the gateway: the real Pay, quoteBooking, validateCoupon and the
// coupon form's preview action; the database, pricing, order creation and both gateways are recorders
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------------------------
// the world the code under test sees (reset before each test)
// ---------------------------------------------------------------------------------------------
type Coupon = {
  code: string;
  status: "PUBLISHED" | "HIDDEN";
  discount: number;
  type: "GENERAL" | "PLATFORM" | "CONSULTANT" | "CENTER";
  consultantId: number | null;
  centerId: number | null;
  limits: number | null;
  starts_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
};

// a used_coupons row with its order's author and payment state
type Use = { code: string; paymentId: string; author: string; state: string };

const world = {
  coupons: new Map<string, Coupon>(),
  uses: [] as Use[],
  authorOfPayment: new Map<string, string>(),
  nextOid: 500,
  campaignDurations: [] as number[],
  user: { id: "user-1" } as { id: string } | null,
  // recorded
  reserved: [] as { kind: string; total: number }[],
  moyasar: [] as number[],
  tabby: [] as number[],
  savedCoupons: [] as string[],
};

// a use paid earlier by this client
const paidUse = (author: string, code = "SAVE10") =>
  world.uses.push({ code, paymentId: `old-${world.uses.length}`, author, state: "PAID" });

// the webhook's PAID for a recorded checkout
const markPaid = (paymentId: string) => {
  for (const u of world.uses) if (u.paymentId === paymentId) u.state = "PAID";
};

// the real query's filter: code, the payment's state, the order's author
const matches = (u: Use, where: any) => {
  if (u.code !== where.code) return false;
  const state = where.payment?.payment;
  if (typeof state === "string" && u.state !== state) return false;
  if (state?.in && !state.in.includes(u.state)) return false;
  const author = where.payment?.order?.is?.author;
  return author === undefined || u.author === author;
};

const COST = { 30: 150, 45: 200, 60: 250 };

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  code: "SAVE10",
  status: "PUBLISHED",
  discount: 10,
  type: "PLATFORM",
  consultantId: null,
  centerId: null,
  limits: null,
  starts_at: null,
  expires_at: null,
  created_at: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

const fakeOrder = (total: number, author: string) => {
  const oid = ++world.nextOid;
  const payment = { id: `pay-${oid}`, total };
  world.authorOfPayment.set(payment.id, author);
  return { oid, type: "SCHEDULED", payment, meeting: [{ mid: `m${oid}` }] };
};

// ---------------------------------------------------------------------------------------------
// stand-ins (registered before anything under test loads)
// ---------------------------------------------------------------------------------------------
const db = {
  coupon: {
    findUnique: async ({ where }: any) => {
      const c = world.coupons.get(where.code);
      return c && c.status === where.status ? c : null;
    },
    update: async ({ where }: any) => {
      world.savedCoupons.push(where.code);
      const c = world.coupons.get(where.code)!;
      return { discount: c.discount, code: c.code, type: c.type };
    },
  },
  usedCoupon: {
    count: async ({ where }: any) => world.uses.filter((u) => matches(u, where)).length,
    // saveACoupon right after the order: the checkout is NEW until the webhook says PAID
    create: async ({ data }: any) => {
      world.uses.push({
        code: data.code,
        paymentId: data.paymentId,
        author: world.authorOfPayment.get(data.paymentId) ?? "?",
        state: "NEW",
      });
      return { discount: data.discount };
    },
  },
  consultant: { findUnique: async () => ({ centerId: null }) },
  package: {
    findUnique: async () => ({ cost: 900, consultantId: 7, isActive: true }),
  },
  program: { findUnique: async () => ({ price: 400, status: "PUBLISHED" }) },
};
stubModule("@/lib/database/db", { __esModule: true, default: db, prismaAll: db });

stubModule("@/data/event", {
  resolveConsultantPricing: async () => ({
    // the consultant's effective lengths (the platform default); quoteBooking refuses others
    durations: [30, 60],
    cost: Object.fromEntries(
      Object.entries(COST).map(([d, c]) => [
        d,
        world.campaignDurations.includes(Number(d)) ? 99 : c,
      ]),
    ),
    original: COST,
    discount: world.campaignDurations.length
      ? { did: 3, label: "campaign", durations: world.campaignDurations }
      : null,
  }),
});
stubModule("@/data/admin/settings/finance", {
  getFinanceConfig: async () => ({
    tax: 15,
    commission: 60,
    couponEnabled: true,
    payments: ["visaMoyasar", "tabby"],
  }),
  getPleadingCommission: async () => 60,
  getReconciliationConfig: async () => ({}),
});
stubModule("@/data/blocked", { CheckIsBlocked: async () => false });

const reserve = (kind: string) => async (data: any, total: number) => {
  world.reserved.push({ kind, total });
  return { state: true, order: fakeOrder(total, data.user) };
};
stubModule("@/data/order/reserveation", { reserveConsultant: reserve("consultant") });
stubModule("@/data/online", { reserveInstant: reserve("instant") });
stubModule("@/data/order/program", { reserveProgram: reserve("program") });

stubModule("@/lib/api/gatewaies/moyasar", {
  createMoyasarCheckout: async (_oid: number, total: number) => {
    world.moyasar.push(total);
    return "https://moyasar.test/pay";
  },
});
stubModule("@/lib/api/gatewaies/tabby", {
  createTabbyCheckout: async (_order: unknown, total: number) => {
    world.tabby.push(total);
    return "https://tabby.test/pay";
  },
});
class Redirect extends Error {
  constructor(public url: string) {
    super("redirect");
  }
}
stubModule("next/navigation", {
  redirect: (url: string) => {
    throw new Redirect(url);
  },
});
stubModule("@/lib/rate-limit", {
  getClientIp: async () => "127.0.0.1",
  rateLimit: async () => ({ success: true }),
});
stubModule("@/lib/bot-protection", { checkHuman: async () => true });
stubModule("@/lib/auth/guards", {
  sessionUser: async () => world.user,
  isConsultant: async () => false,
  ownConsultantCid: async () => null,
});

// side effects Pay imports but these paths never reach
const noop = async () => undefined;
for (const m of [
  "@/lib/api/telegram/telegram",
  "@/lib/notifications/site",
  "@/lib/notifications/mobile/notify/reservation",
  "@/lib/notifications/mobile/notify/instant",
  "@/data/rooms",
  "@/data/pleading",
  "@/data/reconciliation",
  "@/lib/daftra/auto",
  "@/lib/api/realtime/consultant-busy",
])
  stubModule(m, new Proxy({}, { get: (_t, k) => (k === "__esModule" ? false : noop) }));

// the code under test
const { Pay } = require("@/handlers/admin/order/payment");
const { applyCoupon } = require("@/actions/site");
const { withTax } = require("@/utils/tax");
const { COUPON_MESSAGES } = require("@/utils/coupon");

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
const scheduled = (over: Record<string, unknown> = {}) => ({
  order: "consultant",
  user: "user-1",
  cid: 7,
  phone: "966500000000",
  duration: "30",
  package: null,
  method: "visaMoyasar",
  ...over,
});
const instant = (over: Record<string, unknown> = {}) => ({
  order: "instant",
  user: "user-1",
  cid: 7,
  phone: "966500000000",
  method: "visaMoyasar",
  ...over,
});

// Pay to the end: the gateway url (a redirect) or Pay's failure result
async function pay(data: Record<string, unknown>) {
  try {
    return { result: await Pay(data) };
  } catch (e) {
    if (e instanceof Redirect) return { redirect: e.url };
    throw e;
  }
}

// what the coupon form shows after "apply": the percent, and the invoice's total with tax
async function preview(code: string, booking: Record<string, unknown>, base: number) {
  const r = await applyCoupon(code, booking);
  return r.state
    ? { ok: true, percent: r.discount, code: r.code, shown: withTax(Math.round(base * (1 - r.discount / 100))) }
    : { ok: false, message: r.message };
}

beforeEach(() => {
  world.coupons = new Map([["SAVE10", coupon()]]);
  world.uses = [];
  world.authorOfPayment = new Map();
  world.campaignDurations = [];
  world.user = { id: "user-1" };
  world.reserved = [];
  world.moyasar = [];
  world.tabby = [];
  world.savedCoupons = [];
});

// ---------------------------------------------------------------------------------------------
// applied: both gateways get the previewed, discounted total
// ---------------------------------------------------------------------------------------------
describe("an applied coupon is charged at the previewed total", () => {
  for (const method of ["visaMoyasar", "tabby"] as const) {
    test(`single session, ${method}`, async () => {
      const shown = await preview(" save10 ", { order: "consultant", cid: 7, duration: "30" }, 150);
      assert.equal(shown.ok, true);

      const out = await pay(scheduled({ method, couponCode: shown.code, couponPercent: shown.percent }));
      assert.ok(out.redirect, "Pay hands off to the gateway");

      const charged = method === "visaMoyasar" ? world.moyasar : world.tabby;
      assert.deepEqual(charged, [withTax(135)]);
      assert.equal(charged[0], shown.shown, "the gateway gets the invoice's total");
      assert.deepEqual(world.reserved, [{ kind: "consultant", total: 135 }]);
      assert.deepEqual(world.savedCoupons, ["SAVE10"], "the stored code is recorded");
    });

    test(`instant session, ${method}`, async () => {
      const shown = await preview("SAVE10", { order: "instant", cid: 7 }, 150);
      assert.equal(shown.ok, true);

      const out = await pay(instant({ method, couponCode: shown.code, couponPercent: shown.percent }));
      assert.ok(out.redirect);

      const charged = method === "visaMoyasar" ? world.moyasar : world.tabby;
      assert.deepEqual(charged, [withTax(135)]);
      assert.equal(charged[0], shown.shown);
      assert.deepEqual(world.reserved, [{ kind: "instant", total: 135 }]);
      assert.deepEqual(world.savedCoupons, ["SAVE10"]);
    });
  }

  test("no coupon: full price (control)", async () => {
    const out = await pay(scheduled());
    assert.ok(out.redirect);
    assert.deepEqual(world.moyasar, [withTax(150)]);
    assert.deepEqual(world.savedCoupons, []);
  });
});

// ---------------------------------------------------------------------------------------------
// refused: the preview and Pay give the same reason; Pay never charges
// ---------------------------------------------------------------------------------------------
type Case = {
  name: string;
  setup?: () => void;
  booking: Record<string, unknown>;
  data: Record<string, unknown>;
  reason: keyof typeof COUPON_MESSAGES;
};

const refused: Case[] = [
  {
    name: "instant on a campaign price",
    setup: () => (world.campaignDurations = [30]),
    booking: { order: "instant", cid: 7 },
    data: instant({ couponCode: "SAVE10", couponPercent: 10 }),
    reason: "discounted",
  },
  {
    name: "single session on a campaign duration",
    setup: () => (world.campaignDurations = [30]),
    booking: { order: "consultant", cid: 7, duration: "30" },
    data: scheduled({ couponCode: "SAVE10", couponPercent: 10 }),
    reason: "discounted",
  },
  {
    name: "a package",
    booking: { order: "consultant", cid: 7, package: "pkg-1" },
    data: scheduled({ package: "pkg-1", couponCode: "SAVE10", couponPercent: 10 }),
    reason: "not_allowed",
  },
  {
    name: "an unknown code",
    booking: { order: "consultant", cid: 7, duration: "30" },
    data: scheduled({ couponCode: "NOPE12", couponPercent: 10 }),
    reason: "not_found",
  },
  {
    name: "an expired coupon",
    setup: () => world.coupons.set("SAVE10", coupon({ expires_at: new Date("2026-01-02T00:00:00Z") })),
    booking: { order: "consultant", cid: 7, duration: "30" },
    data: scheduled({ couponCode: "SAVE10", couponPercent: 10 }),
    reason: "expired",
  },
  {
    name: "another consultant's coupon",
    setup: () => world.coupons.set("SAVE10", coupon({ type: "CONSULTANT", consultantId: 8 })),
    booking: { order: "consultant", cid: 7, duration: "30" },
    data: scheduled({ couponCode: "SAVE10", couponPercent: 10 }),
    reason: "other_consultant",
  },
  {
    name: "usage limit reached (this client already paid with it)",
    setup: () => {
      world.coupons.set("SAVE10", coupon({ limits: 1 }));
      paidUse("user-1");
    },
    booking: { order: "consultant", cid: 7, duration: "30" },
    data: scheduled({ couponCode: "SAVE10", couponPercent: 10 }),
    reason: "limit_reached",
  },
  {
    name: "usage limit reached on an instant session",
    setup: () => {
      world.coupons.set("SAVE10", coupon({ limits: 1 }));
      paidUse("user-1");
    },
    booking: { order: "instant", cid: 7 },
    data: instant({ couponCode: "SAVE10", couponPercent: 10 }),
    reason: "limit_reached",
  },
];

describe("a coupon that doesn't apply: same message in the preview and Pay, no charge", () => {
  for (const c of refused) {
    test(c.name, async () => {
      c.setup?.();

      const shown = await preview(String(c.data.couponCode), c.booking, 150);
      assert.deepEqual(shown, { ok: false, message: COUPON_MESSAGES[c.reason] }, "the form's toast");

      const out = await pay(c.data);
      assert.deepEqual(out.result, { state: false, step: "coupon", message: COUPON_MESSAGES[c.reason] });
      assert.deepEqual(world.reserved, [], "no order");
      assert.deepEqual(world.moyasar, [], "no moyasar checkout");
      assert.deepEqual(world.tabby, [], "no tabby checkout");
    });
  }
});

// ---------------------------------------------------------------------------------------------
// valid at the preview, not at Pay: Pay stops with a message
// ---------------------------------------------------------------------------------------------
describe("the coupon changes between the preview and Pay", () => {
  test("its limit is reached meanwhile: Pay stops, nothing charged", async () => {
    world.coupons.set("SAVE10", coupon({ limits: 1 }));
    const shown = await preview("SAVE10", { order: "consultant", cid: 7, duration: "30" }, 150);
    assert.equal(shown.ok, true);

    paidUse("user-1"); // paid with it in another tab meanwhile
    const out = await pay(scheduled({ couponCode: "SAVE10", couponPercent: shown.percent }));
    assert.deepEqual(out.result, { state: false, step: "coupon", message: COUPON_MESSAGES.limit_reached });
    assert.deepEqual(world.moyasar, []);
    assert.deepEqual(world.reserved, []);
  });

  test("its percent changed: Pay stops instead of charging another total", async () => {
    const shown = await preview("SAVE10", { order: "consultant", cid: 7, duration: "30" }, 150);
    world.coupons.set("SAVE10", coupon({ discount: 5 }));
    const out = await pay(scheduled({ couponCode: "SAVE10", couponPercent: shown.percent }));
    assert.deepEqual(out.result, { state: false, step: "coupon", message: COUPON_MESSAGES.changed });
    assert.deepEqual(world.moyasar, []);
  });

  test("after removing the coupon the client can pay the full price", async () => {
    world.coupons.set("SAVE10", coupon({ limits: 1 }));
    paidUse("user-1");
    const out = await pay(scheduled());
    assert.ok(out.redirect);
    assert.deepEqual(world.moyasar, [withTax(150)]);
  });
});

// ---------------------------------------------------------------------------------------------
// a retry: the client's own unpaid checkout doesn't hold their coupon
// ---------------------------------------------------------------------------------------------
describe("the same client retries with a one-use coupon", () => {
  beforeEach(() => world.coupons.set("SAVE10", coupon({ limits: 1 })));

  for (const [label, data, booking] of [
    ["single session", scheduled, { order: "consultant", cid: 7, duration: "30" }],
    ["instant session", instant, { order: "instant", cid: 7 }],
  ] as const) {
    test(`${label}: the retry right after an unpaid checkout gets the coupon, discounted at the gateway`, async () => {
      // first checkout: order created, coupon recorded, the card fails (still NEW)
      const first = await pay(data({ couponCode: "SAVE10", couponPercent: 10 }));
      assert.ok(first.redirect);
      assert.equal(world.uses.filter((u) => u.state === "NEW").length, 1);

      // back on the form a minute later: the preview still applies it
      const shown = await preview("SAVE10", booking, 150);
      assert.equal(shown.ok, true);

      // and Pay charges the discounted total again
      const retry = await pay(data({ couponCode: "SAVE10", couponPercent: shown.percent }));
      assert.ok(retry.redirect, "the retry reaches the gateway");
      assert.deepEqual(world.moyasar, [withTax(135), withTax(135)]);
      assert.equal(world.moyasar[1], shown.shown);
    });
  }

  test("another client in that window has their own use: not blocked by the first client's checkout", async () => {
    const first = await pay(scheduled({ couponCode: "SAVE10", couponPercent: 10 }));
    assert.ok(first.redirect);

    world.user = { id: "user-2" };
    const shown = await preview("SAVE10", { order: "consultant", cid: 7, duration: "30" }, 150);
    assert.equal(shown.ok, true, "the limit is per client (SAVE10: one use each)");
    const other = await pay(scheduled({ user: "user-2", couponCode: "SAVE10", couponPercent: 10 }));
    assert.ok(other.redirect);
    assert.deepEqual(world.moyasar, [withTax(135), withTax(135)]);
  });

  test("a client whose one use is already paid is refused, in the preview and at Pay", async () => {
    paidUse("user-2");
    world.user = { id: "user-2" };
    const shown = await preview("SAVE10", { order: "consultant", cid: 7, duration: "30" }, 150);
    assert.deepEqual(shown, { ok: false, message: COUPON_MESSAGES.limit_reached });
    const out = await pay(scheduled({ user: "user-2", couponCode: "SAVE10", couponPercent: 10 }));
    assert.deepEqual(out.result, { state: false, step: "coupon", message: COUPON_MESSAGES.limit_reached });
    assert.deepEqual(world.moyasar, []);
  });

  test("once the retry is paid the coupon counts as used once, and a third checkout is refused", async () => {
    await pay(scheduled({ couponCode: "SAVE10", couponPercent: 10 })); // unpaid
    await pay(scheduled({ couponCode: "SAVE10", couponPercent: 10 })); // the retry
    const retryPayment = world.uses.at(-1)!.paymentId;
    markPaid(retryPayment);

    const mine = world.uses.filter((u) => u.author === "user-1");
    assert.equal(mine.filter((u) => u.state === "PAID").length, 1, "one paid use");
    assert.equal(mine.length, 2, "the unpaid first checkout is recorded but not a use");

    const third = await pay(scheduled({ couponCode: "SAVE10", couponPercent: 10 }));
    assert.deepEqual(third.result, { state: false, step: "coupon", message: COUPON_MESSAGES.limit_reached });
    assert.deepEqual(world.moyasar, [withTax(135), withTax(135)], "no third charge");
  });
});
