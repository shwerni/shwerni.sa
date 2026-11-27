/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// pricing step 3 (read path): the real getConsultantCost, resolveConsultantPricing, quoteBooking,
// reserveConsultant, reserveProgram, the next-session pick and the center booking section/panel;
// the database, the pricing settings and the side effects are recorders
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ---------------------------------------------------------------------------------------------
// the world (reset before each test)
// ---------------------------------------------------------------------------------------------
type Row = { cost30: number; cost45: number; cost60: number; costs: unknown; durations: number[] };

const world = {
  consultant: null as Row | null,
  campaign: null as null | { did: number; name: string; type: "PERCENT" | "FIXED" | "OVERRIDE"; discount: number; durations: number[] },
  order: null as any,
  queries: { consultant: 0, settings: 0 },
  created: { orders: [] as any[], meetings: [] as any[] },
};

const settings = () => ({
  catalog: [{ minutes: 30, min: 120 }, { minutes: 45, min: 155 }, { minutes: 60, min: 175 }],
  defaultDurations: [30, 60],
  maxPackageDiscountPercent: 40,
  daftraDefaultProductId: null,
});

const consultant = (over: Partial<Row> = {}): Row => ({ cost30: 150, cost45: 200, cost60: 250, costs: {}, durations: [], ...over });

// ---------------------------------------------------------------------------------------------
// stand-ins
// ---------------------------------------------------------------------------------------------
const tx = {
  $queryRaw: async () => [{ exists: false }],
  order: {
    create: async ({ data }: any) => {
      world.created.orders.push(data);
      const duration = data.meeting.create.duration;
      return { oid: 900, ...data, payment: { id: "pay-900", ...data.payment.create }, meeting: [{ mid: "m900", session: 1, duration }], consultant: { userId: null, name: "c", phone: "" } };
    },
  },
  meeting: {
    create: async ({ data }: any) => {
      world.created.meetings.push(data);
      return { mid: "m-next", ...data };
    },
  },
};
const db: any = {
  $queryRaw: tx.$queryRaw,
  $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx),
  consultant: {
    findUnique: async ({ select }: any) => {
      if (select?.durations) world.queries.consultant++;
      return world.consultant ? { ...world.consultant, centerId: null } : null;
    },
    findFirst: async () => ({ name: "مستشار", commission: 60, centerId: null, center: null }),
  },
  discountConsultant: {
    findFirst: async () => (world.campaign ? { discount: { ...world.campaign } } : null),
  },
  package: { findUnique: async () => ({ cost: 900, consultantId: 7, isActive: true }) },
  collaboration: { findUnique: async () => null },
  order: { findUnique: async () => world.order },
  orderMessage: { create: async () => ({}) },
};
stubModule("@/lib/database/db", { __esModule: true, default: db, prismaAll: db });
stubModule("@/data/admin/settings/pricing", {
  getPricingSettings: async () => {
    world.queries.settings++;
    return settings();
  },
});
stubModule("@/data/admin/settings/finance", {
  getFinanceConfig: async () => ({ tax: 15, commission: 60, couponEnabled: true, payments: ["visaMoyasar", "tabby"] }),
  getPleadingCommission: async () => 60,
  getReconciliationConfig: async () => ({}),
});
stubModule("@/data/blocked", { CheckIsBlocked: async () => false });
stubModule("@/data/booking/lock", { lockConsultantBookings: async () => undefined });
stubModule("@/data/booking/slots", { isBookableSlot: async () => true });
stubModule("@/data/meeting-log", { logBookedMeeting: async () => undefined, writeMeetingLog: async () => undefined });
stubModule("@/data/rooms", { createNewMeeting: async () => null, ensureMeetingParticipant: async () => "client-token" });
stubModule("@/lib/auth/server", { userServer: async () => null });
stubModule("@/actions/booking", { Pay: async () => ({ state: false, message: "" }) });
stubModule("@/actions/site", { applyCoupon: async () => ({ state: false, message: "" }) });
stubModule("@/actions/consultant", { getConsultantAvailableTimes: async () => ({}) });
const noop = async () => undefined;
for (const m of [
  "@/handlers/admin/order/payment",
  "@/data/wallet",
  "@/data/instant-payment",
  "@/lib/api/telegram/telegram",
  "@/lib/notifications/site",
])
  stubModule(m, new Proxy({}, { get: (_t, k) => (k === "__esModule" ? false : noop) }));

// the real consultant data, with the center page's two other reads stubbed (getConsultantCost stays real)
const consultantData = require("@/data/consultant");
stubModule("@/data/consultant", {
  ...consultantData,
  getConsultantInfoForBooking: async () => ({ name: "مستشار المركز" }),
  getUnavailableWeekdays: async () => new Set(),
});

const { getConsultantCost } = require("@/data/consultant");
const { resolveConsultantPricing } = require("@/data/event");
const { quoteBooking } = require("@/handlers/admin/order/booking-quote");
const { reserveConsultant } = require("@/data/order/reserveation");
const { reserveProgram } = require("@/data/order/program");
const { pickNextSession } = require("@/handlers/clients/package-session");
const { nextSessionDuration } = require("@/data/sessions");
const { BookingSection } = require("@/components/clients/centers/booking/booking-section");
const { BookingPanel } = require("@/components/clients/centers/booking/booking-panel");
const { withTax } = require("@/utils/tax");
const { defaultBookingDuration, isMeetingDuration } = require("@/utils/pricing");

beforeEach(() => {
  world.consultant = consultant();
  world.campaign = null;
  world.order = null;
  world.queries = { consultant: 0, settings: 0 };
  world.created = { orders: [], meetings: [] };
});

// a booking form the reservation schema accepts
const bookingForm = (over: Record<string, unknown> = {}) => ({
  order: "consultant",
  user: "user-1",
  cid: 7,
  consultant: "مستشار",
  collaboration: null,
  unavailable: [],
  cost: { 30: 150, 60: 250 },
  scale: null,
  times: {},
  finance: { tax: 15, commission: 60, payments: ["visaMoyasar"], couponEnabled: true },
  type: "SCHEDULED",
  sessionType: "ONCE",
  sessions: 1,
  package: null,
  date: new Date("2026-12-01T00:00:00Z"),
  time: "10:00",
  duration: "30",
  name: "عميل",
  phone: "966500000000",
  notes: "",
  hasBeneficiary: false,
  method: "visaMoyasar",
  hasCoupon: false,
  acceptTerms: true,
  ...over,
});

// ---------------------------------------------------------------------------------------------
describe("getConsultantCost", () => {
  test("the legacy columns win over the costs json for 30/45/60", async () => {
    world.consultant = consultant({ cost30: 250, costs: { 30: 200, 90: 400 } });
    const out = await getConsultantCost(7);
    assert.equal(out.costs["30"], 250);
    assert.equal(out.costs["90"], 400, "a length without a column comes from the json");
  });

  test("effective durations: no override → the default [30, 60]; an override is kept", async () => {
    assert.deepEqual((await getConsultantCost(7)).durations, [30, 60]);
    world.consultant = consultant({ durations: [60, 45, 30] });
    assert.deepEqual((await getConsultantCost(7)).durations, [30, 45, 60]);
  });

  test("one consultant query; the settings only through the cached getter", async () => {
    await getConsultantCost(7);
    assert.deepEqual(world.queries, { consultant: 1, settings: 1 });
  });
});

describe("resolveConsultantPricing", () => {
  test("prices only the effective lengths", async () => {
    const p = await resolveConsultantPricing(7);
    assert.deepEqual(p.durations, [30, 60]);
    assert.deepEqual(p.cost, { 30: 150, 60: 250 });
    assert.deepEqual(p.original, { 30: 150, 60: 250 });
  });

  test("`also` adds priced lengths (fixed products) without adding them to durations", async () => {
    const p = await resolveConsultantPricing(7, [30, 45]);
    assert.deepEqual(p.durations, [30, 60]);
    assert.equal(p.original["45"], 200);
  });

  test("the campaign applies to the lengths it covers among the priced ones; none → no discount", async () => {
    world.campaign = { did: 3, name: "c", type: "OVERRIDE", discount: 86.1, durations: [30, 45] };
    const p = await resolveConsultantPricing(7);
    assert.deepEqual(p.discount.durations, [30]);
    assert.equal(p.cost["30"], 86.1);
    assert.equal(p.cost["60"], 250);

    world.campaign = { did: 4, name: "c", type: "OVERRIDE", discount: 99, durations: [45] };
    assert.equal((await resolveConsultantPricing(7)).discount, null);
  });
});

describe("quoteBooking (prices unchanged)", () => {
  test("30 and 60 cost what they did", async () => {
    for (const [duration, base] of [["30", 150], ["60", 250]] as const) {
      const q = await quoteBooking({ order: "consultant", cid: 7, duration });
      assert.equal(q.state, true);
      assert.equal(q.total, withTax(base));
    }
  });

  test("step 4: a 45 single session for a [30, 60] consultant is refused (step 3 still priced it)", async () => {
    const q = await quoteBooking({ order: "consultant", cid: 7, duration: "45" });
    assert.equal(q.state, false);
    assert.equal(q.step, "duration");
  });

  test("instant is priced at 30 even under an override without 30", async () => {
    world.consultant = consultant({ durations: [45, 60] });
    const q = await quoteBooking({ order: "instant", cid: 7 });
    assert.equal(q.state, true);
    assert.equal(q.base, 150);
  });
});

describe("packages: always 45 minutes, for a consultant without 45", () => {
  test("a [30, 60] consultant can be quoted and booked for a package, stored as 45", async () => {
    const q = await quoteBooking({ order: "consultant", cid: 7, package: "pkg-1", duration: "45" });
    assert.equal(q.state, true);
    assert.equal(q.base, 900, "the package's own price");

    const res = await reserveConsultant(
      bookingForm({ package: "pkg-1", sessionType: "MULTIPLE", sessions: 4, duration: "30" }),
      q.cost,
      15,
      60,
    );
    assert.equal(res.state, true);
    assert.equal(world.created.orders[0].meeting.create.duration, "45", "45 even when the form sent 30");
  });

  test("every next package session is 45, whatever the first meeting holds", async () => {
    for (const first of ["45", "30", ""]) {
      world.created.meetings = [];
      world.order = {
        oid: 77, consultantId: 7, session: "MULTIPLE", sessionCount: 4, packageId: "pkg-1", name: "عميل", phone: "966500000000",
        program: null, payment: { payment: "PAID" }, consultant: { name: "c", phone: "" }, meeting: [{ session: 1, duration: first }],
      };
      const res = await pickNextSession(77, { date: "2026-12-02", time: "11:00" });
      assert.equal(res.ok, true, `first "${first}"`);
      assert.equal(world.created.meetings[0].duration, "45");
    }
  });
});

describe("a meeting is never created with an empty duration", () => {
  test("isMeetingDuration", () => {
    for (const ok of ["30", "45", "60", "90"]) assert.equal(isMeetingDuration(ok), true);
    for (const bad of ["", "0", "-30", "30.5", " 30", "abc", null, undefined, 30]) assert.equal(isMeetingDuration(bad), false);
  });

  test("reserveConsultant: an empty duration is refused, nothing created", async () => {
    const res = await reserveConsultant(bookingForm({ duration: "" }), 150, 15, 60);
    assert.equal(res.state, false);
    assert.deepEqual(world.created.orders, []);
  });

  test("reserveProgram: a zero duration is refused, nothing created", async () => {
    const res = await reserveProgram(
      {
        user: "user-1", order: "program", prid: 2, sessions: 4, times: {},
        finance: { tax: 15, commission: 60, payments: ["visaMoyasar"], couponEnabled: false },
        cost: 400, duration: 0, name: "عميل", phone: "966500000000", cid: 7, consultant: "c",
        date: new Date("2026-12-01T00:00:00Z"), time: "10:00", method: "visaMoyasar", hasCoupon: false, acceptTerms: true,
      },
      400,
      15,
    );
    assert.equal(res.state, false);
    assert.deepEqual(world.created.orders, []);
  });

  test("a program's next session with an empty first duration is refused, no meeting", async () => {
    world.order = {
      oid: 78, consultantId: 7, session: "MULTIPLE", sessionCount: 4, packageId: null, name: "عميل", phone: "966500000000",
      program: { title: "p" }, payment: { payment: "PAID" }, consultant: { name: "c", phone: "" }, meeting: [{ session: 1, duration: "" }],
    };
    const res = await pickNextSession(78, { date: "2026-12-02", time: "11:00" });
    assert.equal(res.ok, false);
    assert.deepEqual(world.created.meetings, []);
    assert.equal(nextSessionDuration({ packageId: null }, "60"), "60");
  });
});

// ---------------------------------------------------------------------------------------------
// the center booking page: BookingSection (server) → BookingPanel (rendered to html)
// ---------------------------------------------------------------------------------------------
async function centerOptions() {
  const section = await BookingSection({ cid: 7 });
  assert.equal(section.type, BookingPanel);
  const html = renderToStaticMarkup(React.createElement(BookingPanel, section.props));
  const buttons = [...html.matchAll(/<button[^>]*aria-pressed="(true|false)"[^>]*>(.*?)<\/button>/g)];
  return buttons
    .map(([, pressed, inner]) => {
      const minutes = /<span class="font-medium">(\d+) دقيقة<\/span>/.exec(inner)?.[1];
      const price = /<span class="font-semibold">([\d.]+)<\/span>/.exec(inner)?.[1];
      return minutes ? { minutes: Number(minutes), price: Number(price), selected: pressed === "true" } : null;
    })
    .filter(Boolean) as { minutes: number; price: number; selected: boolean }[];
}

describe("center booking panel", () => {
  test("an override [30, 45, 60] shows 45", async () => {
    world.consultant = consultant({ durations: [30, 45, 60] });
    assert.deepEqual((await centerOptions()).map((o) => o.minutes), [30, 45, 60]);
  });

  test("no override shows only 30 and 60, at the consultant's prices, 30 preselected", async () => {
    assert.deepEqual(await centerOptions(), [
      { minutes: 30, price: 150, selected: true },
      { minutes: 60, price: 250, selected: false },
    ]);
  });

  test("the default is 30 when offered, else the first offered length", async () => {
    world.consultant = consultant({ durations: [45, 60] });
    assert.deepEqual((await centerOptions()).find((o) => o.selected)?.minutes, 45);
    assert.equal(defaultBookingDuration([30, 60]), "30");
    assert.equal(defaultBookingDuration([60]), "60");
  });
});
