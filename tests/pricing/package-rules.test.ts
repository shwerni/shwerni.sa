/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// package rules: the "disable all packages" switch and the maximum package discount. the real data
// functions, actions, quoteBooking / Pay, the app's owner and public package routes, the app's quote
// and create routes, the next-session pick and PackageForm (rendered); the database, settings,
// gateways and next's cache are recorders (the package store evaluates the where shapes used here)
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------------------------
type Pkg = { id: string; consultantId: number; count: number; cost: number; isActive: boolean; updated_at: Date };

const world = {
  consultant: { cid: 7, cost30: 150, cost45: 155, cost60: 250, costs: {}, durations: [] as number[], centerId: null as number | null, packagesDisabled: false },
  packages: [] as Pkg[],
  tags: [] as string[],
  paths: [] as string[],
  charges: [] as number[],
  meetings: [] as string[],
  sql: [] as string[],
  order: null as any,
  maxDiscount: 40,
};

const pkg = (count: number, cost: number, isActive = true): Pkg => ({
  id: `pkg-${count}`, consultantId: 7, count, cost, isActive, updated_at: new Date(Date.now() - count * 1000),
});

// the where shapes the package queries use
const matches = (p: Pkg, where: any = {}) => {
  if (where.consultantId !== undefined && p.consultantId !== where.consultantId) return false;
  if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
  if (where.id?.in && !where.id.in.includes(p.id)) return false;
  const rel = where.consultant?.is;
  if (rel && "packagesDisabled" in rel && world.consultant.packagesDisabled !== rel.packagesDisabled) return false;
  if (rel && "centerId" in rel && rel.centerId === null && world.consultant.centerId !== null) return false;
  return true;
};

const packageDb = {
  findMany: async ({ where }: any = {}) => world.packages.filter((p) => matches(p, where)).sort((a, b) => +a.updated_at - +b.updated_at),
  findUnique: async ({ where, select }: any) => {
    const p = where.id
      ? world.packages.find((x) => x.id === where.id)
      : world.packages.find((x) => x.consultantId === where.consultantId_count.consultantId && x.count === where.consultantId_count.count);
    if (!p) return null;
    return select?.consultant ? { ...p, consultant: { packagesDisabled: world.consultant.packagesDisabled } } : p;
  },
  upsert: async ({ where, update, create }: any) => {
    const p = world.packages.find((x) => x.count === where.consultantId_count.count);
    if (p) Object.assign(p, update, { updated_at: new Date() });
    else world.packages.push({ id: `pkg-${create.count}`, ...create, updated_at: new Date() });
    return {};
  },
  updateMany: async ({ where, data }: any) => {
    for (const p of world.packages.filter((x) => matches(x, where))) Object.assign(p, data);
    return {};
  },
};

const tx: any = {
  $queryRaw: async () => [{ exists: false }],
  package: packageDb,
  order: {
    create: async ({ data }: any) => {
      world.meetings.push(data.meeting.create.duration);
      return { oid: 900, ...data, payment: { id: "pay-900", ...data.payment.create }, meeting: [{ mid: "m900", session: 1 }], consultant: { userId: null, name: "c", phone: "" } };
    },
  },
  meeting: { create: async ({ data }: any) => { world.meetings.push(data.duration); return { mid: "m-next", ...data }; } },
};
const db: any = {
  ...tx,
  $transaction: async (fn: any) => fn(tx),
  $queryRaw: async (query: any, ...values: any[]) => {
    // a tagged template: its strings plus the nested Prisma.sql fragments (the shared where)
    const text = Array.isArray(query)
      ? [...query, ...values.map((v) => (typeof v?.sql === "string" ? v.sql : ""))].join(" ")
      : String(query?.sql ?? query);
    world.sql.push(text);
    return /count\(\*\)/i.test(text) ? [{ count: 0 }] : [];
  },
  consultant: {
    findUnique: async () => ({ ...world.consultant }),
    findFirst: async () => ({ name: "مستشار", commission: 60, centerId: null, center: null }),
    update: async ({ data }: any) => {
      Object.assign(world.consultant, data);
      return { ...world.consultant };
    },
  },
  discountConsultant: { findFirst: async () => null },
  collaboration: { findUnique: async () => null },
  orderMessage: { create: async () => ({}) },
  order: { ...tx.order, findUnique: async () => world.order },
};
stubModule("@/lib/database/db", { __esModule: true, default: db, prismaAll: db });
stubModule("@/data/admin/settings/pricing", {
  getPricingSettings: async () => ({
    catalog: [{ minutes: 30, min: 120 }, { minutes: 45, min: 155 }, { minutes: 60, min: 175 }],
    defaultDurations: [30, 60], maxPackageDiscountPercent: world.maxDiscount, daftraDefaultProductId: null,
  }),
});
stubModule("@/data/admin/settings/finance", {
  getFinanceConfig: async () => ({ tax: 15, commission: 60, couponEnabled: true, payments: ["visaMoyasar", "tabby"] }),
  getPleadingCommission: async () => 70,
  getReconciliationConfig: async () => ({}),
});
stubModule("next/cache", {
  revalidateTag: (tag: string) => world.tags.push(tag),
  revalidatePath: (path: string) => world.paths.push(path),
  cacheTag: () => undefined,
  cacheLife: () => undefined,
});
stubModule("@/data/blocked", { CheckIsBlocked: async () => false });
stubModule("@/data/booking/lock", { lockConsultantBookings: async () => undefined });
stubModule("@/data/booking/slots", { isBookableSlot: async () => true });
stubModule("@/data/meeting-log", { logBookedMeeting: async () => undefined, writeMeetingLog: async () => undefined });
stubModule("@/data/rooms", { createNewMeeting: async () => null, ensureMeetingParticipant: async () => "tok" });
stubModule("@/lib/api/gatewaies/moyasar", { createMoyasarCheckout: async (_o: number, total: number) => { world.charges.push(total); return "https://m/pay"; } });
stubModule("@/lib/api/gatewaies/tabby", { createTabbyCheckout: async (_o: unknown, total: number) => { world.charges.push(total); return "https://t/pay"; } });
class Redirect extends Error {}
stubModule("next/navigation", { redirect: () => { throw new Redirect(); } });
stubModule("@/lib/rate-limit", { getClientIp: async () => "127.0.0.1", rateLimit: async () => ({ success: true }) });
stubModule("@/lib/bot-protection", { checkHuman: async () => true });
stubModule("@/lib/auth/guards", { ownConsultantCid: async () => 7, sessionUser: async () => ({ id: "user-1" }), isConsultant: async () => true });
stubModule("@/lib/auth/require-mobile-user", { requireMobileUser: async () => ({ id: "user-1" }) });
stubModule("@/lib/auth/require-approved-owner", { requireApprovedOwner: async () => ({ consultant: { cid: 7 } }), requireMobileOwner: async () => ({ id: "user-1" }) });
stubModule("@/data/mobile/booking", {
  accountPhone: async () => null, unpaidOrderLimitReached: async () => false, instantLimitReached: async () => false,
  ownUnpaidAtSlot: async () => [], cancelUnpaidOrders: async () => undefined, packageSessionCount: async () => 3,
});
stubModule("@/data/mobile/instant-availability", { instantAvailability: async () => null, INSTANT_BUSY: "b", INSTANT_UNAVAILABLE: "u" });
stubModule("@/handlers/admin/order/app-booking", { planAppPayment: async () => ({}), finishAppBooking: async (o: any, _p: unknown, _m: unknown, total: number) => ({ oid: o.oid, total }) });
const noop = async () => undefined;
for (const m of [
  "@/lib/api/telegram/telegram", "@/lib/notifications/site", "@/lib/notifications/mobile/notify/reservation",
  "@/lib/notifications/mobile/notify/instant", "@/lib/daftra/auto", "@/lib/api/realtime/consultant-busy",
  "@/data/wallet", "@/data/instant-payment", "@/data/pleading", "@/data/reconciliation", "@/data/online",
])
  stubModule(m, new Proxy({}, { get: (_t, k) => (k === "__esModule" ? false : noop) }));

const { getClientPackages, getConsultantsPackages, getPublicPackages, getPublicPackageConsultants } = require("@/data/packages");
const { setPackagesDisabled, upsertConsultantPackage } = require("@/actions/consultant");
const { Pay } = require("@/handlers/admin/order/payment");
const { PACKAGES_DISABLED } = require("@/handlers/admin/order/booking-quote");
const { pickNextSession } = require("@/handlers/clients/package-session");
const ownerRoute = require("@/app/api/mobile/owner/packages/route");
const publicRoute = require("@/app/api/mobile/consultants/consultant/packages/route");
const quoteRoute = require("@/app/api/mobile/reservations/quote/route");
const createRoute = require("@/app/api/mobile/reservations/route");
const { PackageForm } = require("@/components/consultant/packages/packages");
const { packageFloor, packageFloorLabel, packageBelowFloorWarning } = require("@/utils/pricing");
const { withTax } = require("@/utils/tax");
const { dateToString } = require("@/utils/date");

beforeEach(() => {
  Object.assign(world.consultant, { cost45: 155, packagesDisabled: false, centerId: null });
  world.packages = [pkg(3, 300), pkg(5, 500), pkg(8, 1000, false)];
  world.tags = [];
  world.paths = [];
  world.charges = [];
  world.meetings = [];
  world.sql = [];
  world.order = null;
  world.maxDiscount = 40;
});

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
process.env.APP_SECRET = "pkg-test";
const appRequest = (url: string, method: string, body?: unknown) =>
  new NextRequest(url, { method, ...(body ? { body: JSON.stringify(body) } : {}), headers: { "content-type": "application/json", "x-app-secret": "pkg-test" } }) as any;
const ctx = { params: Promise.resolve({}) };
const day = dateToString(new Date(Date.now() + 3 * 86400e3));

const packageBooking = () => ({
  order: "consultant", user: "user-1", cid: 7, consultant: "مستشار", collaboration: null, unavailable: [],
  cost: { 30: 300, 45: 300, 60: 300 }, scale: null, times: {},
  finance: { tax: 15, commission: 60, payments: ["visaMoyasar"], couponEnabled: true },
  type: "SCHEDULED", sessionType: "MULTIPLE", sessions: 3, package: "pkg-3", date: new Date(`${day}T00:00:00Z`), time: "10:00",
  duration: "45", name: "عميل", phone: "966500000000", notes: "", hasBeneficiary: false, method: "visaMoyasar", hasCoupon: false, acceptTerms: true,
});
async function pay(data: unknown) {
  try {
    return { result: await Pay(data) };
  } catch (e) {
    if (e instanceof Redirect) return { charged: world.charges.at(-1) };
    throw e;
  }
}
const nextPick = () => {
  world.order = { oid: 77, consultantId: 7, session: "MULTIPLE", sessionCount: 3, packageId: "pkg-3", name: "عميل", phone: "966500000000", program: null, payment: { payment: "PAID" }, consultant: { name: "c", phone: "" }, meeting: [{ session: 1, duration: "45" }] };
  return pickNextSession(77, { date: day, time: "11:00" });
};

// ---------------------------------------------------------------------------------------------
describe("the disable-all-packages switch", () => {
  test("on: hidden from clients (his page, the app), shown to him; the /packages listing filters it", async () => {
    assert.equal((await getClientPackages(7, true)).length, 2);
    assert.deepEqual(await setPackagesDisabled(true), { success: true });

    assert.deepEqual(await getClientPackages(7, true), [], "his page (reserve.tsx)");
    const res = await publicRoute.GET(appRequest("https://x/api?cid=7", "GET"), ctx);
    assert.deepEqual(await res.json(), [], "the app's public route");
    assert.equal((await getConsultantsPackages(7)).length, 3, "his own packages page still lists all three");

    await getPublicPackages({ search: "", category: [], gender: [], sessions: [], page: 1, sort: "recommended" });
    await getPublicPackageConsultants({ search: "", category: [], gender: [], sessions: [], page: 1, sort: "recommended" });
    assert.ok(world.sql.length >= 2 && world.sql.every((sql) => sql.includes(`c."packagesDisabled" = false`)), "the /packages SQL");
  });

  test("on: a new package booking is refused on website Pay and the app (400)", async () => {
    await setPackagesDisabled(true);
    const web = await pay(packageBooking());
    assert.deepEqual(web.result, { state: false, step: "packages_disabled", message: PACKAGES_DISABLED });
    for (const res of [
      await quoteRoute.POST(appRequest("https://x/api", "POST", { order: "consultant", cid: 7, package: "pkg-3" }), ctx),
      await createRoute.POST(appRequest("https://x/api", "POST", { cid: 7, date: day, time: "10:00", package: "pkg-3", name: "عميل", phone: "966500000000", method: "visaMoyasar" }), ctx),
    ]) {
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: PACKAGES_DISABLED });
    }
    assert.deepEqual(world.charges, []);
    assert.deepEqual(world.meetings, []);
  });

  test("on: a client who already bought a package can still pick the next session (45)", async () => {
    await setPackagesDisabled(true);
    const res = await nextPick();
    assert.equal(res.ok, true);
    assert.deepEqual(world.meetings, ["45"]);
  });

  test("off again: the same packages come back, untouched; caches purged both times", async () => {
    const before = JSON.stringify(world.packages);
    await setPackagesDisabled(true);
    await setPackagesDisabled(false);
    assert.equal(JSON.stringify(world.packages), before);
    assert.equal((await getClientPackages(7, true)).length, 2);
    assert.deepEqual(world.tags, ["consultant:7", "consultants", "consultant:7", "consultants"]);
    assert.deepEqual(world.paths, ["/packages", "/packages"]);
    const out = await pay(packageBooking());
    assert.equal(out.charged, withTax(300));
  });

  test("the app's PATCH sets it and GET reports it", async () => {
    const res = await ownerRoute.PATCH(appRequest("https://x/api", "PATCH", { disabled: true }), ctx);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).packagesDisabled, true);
    assert.equal(world.consultant.packagesDisabled, true);
    assert.equal((await ownerRoute.PATCH(appRequest("https://x/api", "PATCH", { disabled: "yes" }), ctx)).status, 400);
  });
});

describe("the maximum package discount", () => {
  test("the floor: his 45 price × sessions × (1 − max discount), rounded up", () => {
    assert.equal(packageFloor(155, 3, 40), 279);
    assert.equal(packageFloor(168, 6, 40), 605);
    assert.equal(packageFloor(155, 3, 50), 233);
    assert.equal(packageFloorLabel(279), "أقل سعر مسموح لهذه الباقة ٢٧٩ ر.س");
  });

  test("website: a new or edited package below the floor is refused; at the floor accepted", async () => {
    world.packages = [];
    assert.deepEqual(await upsertConsultantPackage(0, 3, 278, true), { success: false, message: packageFloorLabel(279) });
    assert.deepEqual(world.packages, []);
    assert.deepEqual(await upsertConsultantPackage(0, 3, 279, true), { success: true });
    assert.deepEqual(await upsertConsultantPackage(0, 3, 200, true), { success: false, message: packageFloorLabel(279) }, "an edit too");
  });

  test("app PUT: below the floor → 400 with the message; at the floor → saved; GET carries the floors", async () => {
    world.packages = [];
    const low = await ownerRoute.PUT(appRequest("https://x/api", "PUT", { count: 5, cost: 400, isActive: true }), ctx);
    assert.equal(low.status, 400);
    assert.deepEqual(await low.json(), { error: packageFloorLabel(465) });
    const ok = await ownerRoute.PUT(appRequest("https://x/api", "PUT", { count: 5, cost: 465, isActive: true }), ctx);
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.floors[5], 465);
    assert.equal(body.maxDiscountPercent, 40);
    assert.equal(body.packageSessionPrice, 155);
  });

  test("an existing package below the floor: still sells, can be deactivated or re-saved unchanged, flagged", async () => {
    world.packages = [pkg(3, 200)];
    const out = await pay(packageBooking());
    assert.equal(out.charged, withTax(200), "checkout never checks the floor");

    assert.deepEqual(await upsertConsultantPackage(0, 3, 200, true), { success: true }, "unchanged");
    assert.deepEqual(await upsertConsultantPackage(0, 3, 200, false), { success: true }, "deactivated");
    assert.deepEqual(await upsertConsultantPackage(0, 3, 200, true), { success: false, message: packageFloorLabel(279) }, "re-activating is an edit");

    world.packages = [pkg(3, 200)];
    const res = await ownerRoute.GET(appRequest("https://x/api", "GET"), ctx);
    const listed = (await res.json()).packages[0];
    assert.deepEqual([listed.floor, listed.belowFloor], [279, true]);
  });

  test("a lower 45 price later doesn't invalidate existing packages (the floor applies on the next edit)", async () => {
    world.consultant.cost45 = 300;
    world.packages = [pkg(3, 300)];
    const out = await pay(packageBooking());
    assert.equal(out.charged, withTax(300));
  });

  test("the floor follows the settings' max discount", async () => {
    world.maxDiscount = 50;
    world.packages = [];
    assert.deepEqual(await upsertConsultantPackage(0, 3, 233, true), { success: true });
  });

  test("PackageForm: the floor line live, and the warning for a saved package below it", () => {
    const html = renderToStaticMarkup(
      React.createElement(PackageForm, { consultantId: 7, sessionCount: 3, initialCost: 200, initialActive: true, floor: 279 }),
    );
    assert.ok(html.includes(packageFloorLabel(279)));
    assert.ok(html.includes(packageBelowFloorWarning(279)));
    const fine = renderToStaticMarkup(
      React.createElement(PackageForm, { consultantId: 7, sessionCount: 3, initialCost: 300, initialActive: true, floor: 279 }),
    );
    assert.ok(!fine.includes(packageBelowFloorWarning(279)));
  });
});
