/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// pricing step 4: a single session only in the consultant's effective lengths. every flow through
// quoteBooking (website Pay, the coupon preview, the instant price, the app's quote and create
// routes) and the fixed products beside it (pleading, reconciliation, programs, packages, instant).
// the real Pay / PayPleading / PayReconciliation, quoteBooking, reserveConsultant, reserveProgram
// and the app routes; the database, settings, gateways and side effects are recorders
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------------------------
// the world (reset before each test)
// ---------------------------------------------------------------------------------------------
type Row = { cost30: number; cost45: number; cost60: number; costs: unknown; durations: number[] };

const world = {
  consultant: null as Row | null,
  moyasar: [] as number[],
  tabby: [] as number[],
  meetings: [] as string[],
  instant: [] as number[],
  appCreated: [] as number[],
};

const consultant = (over: Partial<Row> = {}): Row => ({ cost30: 150, cost45: 200, cost60: 250, costs: {}, durations: [], ...over });

// ---------------------------------------------------------------------------------------------
// stand-ins
// ---------------------------------------------------------------------------------------------
const tx = {
  $queryRaw: async () => [{ exists: false }],
  order: {
    create: async ({ data }: any) => {
      const duration = data.meeting.create.duration;
      world.meetings.push(duration);
      return {
        oid: 900 + world.meetings.length, id: "o", ...data,
        payment: { id: `pay-${world.meetings.length}`, ...data.payment.create },
        meeting: [{ mid: `m${world.meetings.length}`, session: 1, duration }],
        consultant: { userId: null, name: "c", phone: "" },
      };
    },
  },
};
const db: any = {
  $queryRaw: tx.$queryRaw,
  $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx),
  consultant: {
    findUnique: async () => (world.consultant ? { ...world.consultant, centerId: null } : null),
    findFirst: async () => ({ name: "مستشار", commission: 60, centerId: null, center: null }),
  },
  discountConsultant: { findFirst: async () => null },
  package: { findUnique: async () => ({ cost: 900, consultantId: 7, isActive: true }) },
  program: { findUnique: async () => ({ price: 400, status: "PUBLISHED" }) },
  collaboration: { findUnique: async () => null },
  orderMessage: { create: async () => ({}) },
};
stubModule("@/lib/database/db", { __esModule: true, default: db, prismaAll: db });
stubModule("@/data/admin/settings/pricing", {
  getPricingSettings: async () => ({
    catalog: [{ minutes: 30, min: 120 }, { minutes: 45, min: 155 }, { minutes: 60, min: 175 }],
    defaultDurations: [30, 60],
    maxPackageDiscountPercent: 40,
    daftraDefaultProductId: null,
  }),
});
stubModule("@/data/admin/settings/finance", {
  getFinanceConfig: async () => ({ tax: 15, commission: 60, couponEnabled: true, payments: ["visaMoyasar", "tabby"] }),
  getPleadingCommission: async () => 70,
  getReconciliationConfig: async () => ({ cid: 77, price: 175, commission: 65 }),
});
stubModule("@/data/blocked", { CheckIsBlocked: async () => false });
stubModule("@/data/booking/lock", { lockConsultantBookings: async () => undefined });
stubModule("@/data/booking/slots", { isBookableSlot: async () => true });
stubModule("@/data/meeting-log", { logBookedMeeting: async () => undefined, writeMeetingLog: async () => undefined });
stubModule("@/data/online", {
  reserveInstant: async (data: any, total: number) => {
    world.instant.push(total);
    return { state: true, order: { oid: 950, type: "INSTANT", payment: { id: "pay-i", total }, meeting: [{ mid: "mi" }] } };
  },
});
stubModule("@/data/pleading", {
  getPleadingForCheckout: async () => ({
    id: "pl-1", price: 300, state: "QUOTED", expiresAt: new Date(Date.now() + 86400e3),
    consultant: { name: "محامي" }, consultantId: 7, phone: "966500000000", name: "عميل", author: "user-1", orderId: null,
  }),
  getPleadingCheckout: async () => null,
  linkPleadingCheckout: async () => true,
  linkPaidPleading: async () => null,
});
stubModule("@/data/reconciliation", { attachReconciliation: async () => true });
stubModule("@/lib/api/gatewaies/moyasar", {
  createMoyasarCheckout: async (_oid: number, total: number) => {
    world.moyasar.push(total);
    return "https://moyasar.test/pay";
  },
});
stubModule("@/lib/api/gatewaies/tabby", {
  createTabbyCheckout: async (_o: unknown, total: number) => {
    world.tabby.push(total);
    return "https://tabby.test/pay";
  },
});
class Redirect extends Error {}
stubModule("next/navigation", { redirect: () => { throw new Redirect(); } });
stubModule("@/lib/rate-limit", { getClientIp: async () => "127.0.0.1", rateLimit: async () => ({ success: true }) });
stubModule("@/lib/bot-protection", { checkHuman: async () => true });
stubModule("@/lib/auth/guards", { sessionUser: async () => ({ id: "user-1" }), isConsultant: async () => false, ownConsultantCid: async () => null });
stubModule("@/lib/auth/require-mobile-user", { requireMobileUser: async () => ({ id: "user-1" }) });
stubModule("@/data/mobile/booking", {
  accountPhone: async () => null,
  unpaidOrderLimitReached: async () => false,
  instantLimitReached: async () => false,
  ownUnpaidAtSlot: async () => [],
  cancelUnpaidOrders: async () => undefined,
  packageSessionCount: async () => 4,
});
stubModule("@/data/mobile/instant-availability", { instantAvailability: async () => null, INSTANT_BUSY: "busy", INSTANT_UNAVAILABLE: "unavailable" });
stubModule("@/handlers/admin/order/app-booking", {
  planAppPayment: async () => ({}),
  finishAppBooking: async (order: any, _plan: unknown, _m: unknown, total: number) => {
    world.appCreated.push(total);
    return { oid: order.oid, total };
  },
});
const noop = async () => undefined;
for (const m of [
  "@/lib/api/telegram/telegram",
  "@/lib/notifications/site",
  "@/lib/notifications/mobile/notify/reservation",
  "@/lib/notifications/mobile/notify/instant",
  "@/data/rooms",
  "@/lib/daftra/auto",
  "@/lib/api/realtime/consultant-busy",
  "@/data/wallet",
  "@/data/instant-payment",
])
  stubModule(m, new Proxy({}, { get: (_t, k) => (k === "__esModule" ? false : noop) }));

// reconciliation's slot check reads the weekly timings: one free slot at 10:00 (the rest is real)
const consultantData = require("@/data/consultant");
stubModule("@/data/consultant", { ...consultantData, getConsultantAvailableTimes: async () => ({ day: ["10:00"] }) });

const { Pay, PayPleading, PayReconciliation } = require("@/handlers/admin/order/payment");
const { DURATION_NOT_OFFERED } = require("@/handlers/admin/order/booking-quote");
const { applyCoupon } = require("@/actions/site");
const { getInstantPrice } = require("@/actions/booking");
const quoteRoute = require("@/app/api/mobile/reservations/quote/route");
const createRoute = require("@/app/api/mobile/reservations/route");
const { withTax } = require("@/utils/tax");
const { dateToString } = require("@/utils/date");

beforeEach(() => {
  world.consultant = consultant();
  world.moyasar = [];
  world.tabby = [];
  world.meetings = [];
  world.instant = [];
  world.appCreated = [];
});

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
const inTwoDays = () => new Date(`${dateToString(new Date(Date.now() + 2 * 86400e3))}T00:00:00Z`);

const single = (over: Record<string, unknown> = {}) => ({
  order: "consultant", user: "user-1", cid: 7, consultant: "مستشار", collaboration: null, unavailable: [],
  cost: { 30: 150, 60: 250 }, scale: null, times: {},
  finance: { tax: 15, commission: 60, payments: ["visaMoyasar", "tabby"], couponEnabled: true },
  type: "SCHEDULED", sessionType: "ONCE", sessions: 1, package: null, date: inTwoDays(), time: "10:00",
  duration: "30", name: "عميل", phone: "966500000000", notes: "", hasBeneficiary: false, method: "visaMoyasar",
  hasCoupon: false, acceptTerms: true, ...over,
});

async function pay(fn: (d: any) => Promise<unknown>, data: unknown) {
  try {
    return { result: await fn(data) };
  } catch (e) {
    if (e instanceof Redirect) return { redirected: true };
    throw e;
  }
}

// the app's routes check x-app-secret against APP_SECRET (route-factory → requireAppSecret): a test value
process.env.APP_SECRET = "test-app-secret";
const post = (handler: any, body: unknown) =>
  handler.POST(
    new Request("https://shwerni.test/api", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", "x-app-secret": "test-app-secret" },
    }) as any,
    { params: Promise.resolve({}) },
  );

const appQuote = (body: Record<string, unknown>) => post(quoteRoute, { order: "consultant", cid: 7, ...body });
const appCreate = (body: Record<string, unknown>) =>
  post(createRoute, { cid: 7, date: dateToString(inTwoDays()), time: "10:00", name: "عميل", phone: "966500000000", method: "visaMoyasar", ...body });

// ---------------------------------------------------------------------------------------------
describe("single sessions (website Pay)", () => {
  test("30 and 60 charge what they did (the Pay baseline is unchanged)", async () => {
    for (const [duration, base] of [["30", 150], ["60", 250]] as const) {
      world.moyasar = [];
      const out = await pay(Pay, single({ duration }));
      assert.ok(out.redirected);
      assert.deepEqual(world.moyasar, [withTax(base)]);
    }
  });

  test("45 for a [30, 60] consultant is refused with the message; nothing created or charged", async () => {
    const out = await pay(Pay, single({ duration: "45" }));
    assert.deepEqual(out.result, { state: false, step: "duration", message: DURATION_NOT_OFFERED });
    assert.deepEqual(world.meetings, []);
    assert.deepEqual(world.moyasar, []);
  });

  test("45 for a consultant with the override [30, 45, 60] works, at cost45", async () => {
    world.consultant = consultant({ durations: [30, 45, 60] });
    const out = await pay(Pay, single({ duration: "45", method: "tabby" }));
    assert.ok(out.redirected);
    assert.deepEqual(world.tabby, [withTax(200)]);
    assert.deepEqual(world.meetings, ["45"]);
  });

  test("an override without 30 refuses 30", async () => {
    world.consultant = consultant({ durations: [45, 60] });
    const out = await pay(Pay, single({ duration: "30" }));
    assert.equal((out.result as { step?: string } | undefined)?.step, "duration");
  });
});

describe("the app (quote and create routes)", () => {
  test("45 for a [30, 60] consultant: 400 with the message on the quote and on create", async () => {
    for (const res of [await appQuote({ duration: 45 }), await appCreate({ duration: 45 })]) {
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: DURATION_NOT_OFFERED });
    }
    assert.deepEqual(world.appCreated, []);
    assert.deepEqual(world.meetings, []);
  });

  test("30 still quotes and books as before", async () => {
    const q = await appQuote({ duration: 30 });
    assert.equal(q.status, 200);
    assert.equal((await q.json()).total, withTax(150));
    const c = await appCreate({ duration: 30 });
    assert.equal(c.status, 200);
    assert.deepEqual(world.appCreated, [withTax(150)]);
  });

  test("45 with the override [30, 45, 60] quotes and books", async () => {
    world.consultant = consultant({ durations: [30, 45, 60] });
    assert.equal((await appQuote({ duration: 45 })).status, 200);
    const c = await appCreate({ duration: 45 });
    assert.equal(c.status, 200);
    assert.deepEqual(world.meetings, ["45"]);
  });

  test("the duration is a positive whole number now (not only 30/45/60); 0 or 30.5 is bad input", async () => {
    assert.equal((await appQuote({ duration: 90 })).status, 400, "90 reaches the quote, which refuses it");
    assert.deepEqual(await (await appQuote({ duration: 90 })).json(), { error: DURATION_NOT_OFFERED });
    for (const duration of [0, 30.5]) assert.equal((await appQuote({ duration })).status, 400);
  });
});

describe("the other flows through quoteBooking, unaffected", () => {
  test("coupon preview: the same refusal message for a length the consultant doesn't sell", async () => {
    const r = await applyCoupon("SAVE10", { order: "consultant", cid: 7, duration: "45" });
    assert.deepEqual(r, { state: false, message: DURATION_NOT_OFFERED });
  });

  test("instant: priced at 30 even under an override [45, 60] (website Pay, app quote, instant price)", async () => {
    world.consultant = consultant({ durations: [45, 60] });
    const out = await pay(Pay, { order: "instant", user: "user-1", cid: 7, phone: "966500000000", method: "visaMoyasar" });
    assert.ok(out.redirected);
    assert.deepEqual(world.instant, [150]);
    assert.equal((await post(quoteRoute, { order: "instant", cid: 7 })).status, 200);
    assert.deepEqual(await getInstantPrice(7), { cost: 150, discounted: false });
  });

  test("package: a [30, 60] consultant sells it, every session stored as 45 (website Pay and the app)", async () => {
    const web = await pay(Pay, single({ package: "pkg-1", sessionType: "MULTIPLE", sessions: 4, duration: "45" }));
    assert.ok(web.redirected);
    assert.deepEqual(world.moyasar, [withTax(900)]);
    const app = await appCreate({ package: "pkg-1" });
    assert.equal(app.status, 200);
    assert.deepEqual(world.meetings, ["45", "45"]);
  });

  test("program: its own price and duration (90 here), no length check", async () => {
    const out = await pay(Pay, {
      order: "program", user: "user-1", prid: 2, sessions: 4, times: {},
      finance: { tax: 15, commission: 60, payments: ["visaMoyasar"], couponEnabled: false },
      cost: 400, duration: 90, name: "عميل", phone: "966500000000", cid: 7, consultant: "c",
      date: inTwoDays(), time: "10:00", method: "visaMoyasar", hasCoupon: false, acceptTerms: true,
    });
    assert.ok(out.redirected);
    assert.deepEqual(world.moyasar, [withTax(400)]);
    assert.deepEqual(world.meetings, ["90"]);
  });
});

describe("fixed 60-minute products (they don't go through quoteBooking)", () => {
  test("pleading: 60 minutes at the quoted price, for a [30, 45] consultant too", async () => {
    world.consultant = consultant({ durations: [30, 45] });
    const out = await pay(PayPleading, {
      token: "a".repeat(43), date: inTwoDays(), time: "10:00", method: "visaMoyasar", acceptTerms: true,
    });
    assert.ok(out.redirected);
    assert.deepEqual(world.moyasar, [withTax(300)]);
    assert.deepEqual(world.meetings, ["60"]);
  });

  test("reconciliation: 60 minutes at the configured price, for a [30, 45] consultant too", async () => {
    world.consultant = consultant({ durations: [30, 45] });
    const out = await pay(
      (input: unknown) => PayReconciliation(input, "user-1"),
      {
        date: inTwoDays(), time: "10:00", name: "عميل", phone: "966500000000", description: "",
        otherName: "الطرف", otherPhone: "966500000001", relation: "SPOUSE", gender: "FEMALE",
        method: "visaMoyasar", acceptTerms: true,
      },
    );
    assert.ok(out.redirected, JSON.stringify(out.result));
    assert.deepEqual(world.moyasar, [withTax(175)]);
    assert.deepEqual(world.meetings, ["60"]);
  });
});
