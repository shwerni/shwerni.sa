/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// pricing step 5: minimum prices on every save path. the real checkPrices, the profile handler
// (website saveConsultant and the app's PATCH / GET), the packages action and data, and the two
// forms rendered to html; the database, the settings, the mobile session and next's cache are recorders
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ---------------------------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------------------------
type Row = {
  cid: number; userId: string; name: string; approved: string; statusA: string; centerId: number | null;
  cost30: number; cost45: number; cost60: number; costs: unknown; durations: number[]; packagesActive: boolean;
};

const world = {
  row: null as Row | null,
  writes: [] as any[],
  tags: [] as string[],
};

const settings = {
  catalog: [{ minutes: 30, min: 120 }, { minutes: 45, min: 155 }, { minutes: 60, min: 175 }],
  defaultDurations: [30, 60],
  maxPackageDiscountPercent: 40,
  daftraDefaultProductId: null,
};

const row = (over: Partial<Row> = {}): Row => ({
  cid: 7, userId: "user-1", name: "مستشار تجربة", approved: "PENDING", statusA: "HOLD", centerId: null,
  cost30: 150, cost45: 200, cost60: 250, costs: {}, durations: [], packagesActive: false, ...over,
});

// ---------------------------------------------------------------------------------------------
// stand-ins
// ---------------------------------------------------------------------------------------------
const consultantDb = {
  findUnique: async ({ select }: any) => {
    if (!world.row) return null;
    const r = world.row;
    const base = { ...r, packages: r.packagesActive ? [{ id: "p" }] : [] };
    return select ? base : base;
  },
  update: async ({ data }: any) => {
    world.writes.push({ op: "update", data });
    return { ...world.row, ...data };
  },
  create: async ({ data }: any) => {
    world.writes.push({ op: "create", data });
    return { cid: 8, centerId: null, ...data };
  },
};
const tx = { consultant: consultantDb, bankAccount: { create: async () => ({}), upsert: async () => ({}) } };
const db: any = { consultant: consultantDb, $transaction: async (fn: any) => fn(tx), bankAccount: tx.bankAccount };
stubModule("@/lib/database/db", { __esModule: true, default: db, prismaAll: db });
stubModule("@/data/admin/settings/pricing", { getPricingSettings: async () => structuredClone(settings) });
stubModule("@/data/admin/settings/finance", { getTaxCommission: async () => ({ commission: 60, tax: 15 }), getFinanceConfig: async () => null });
stubModule("@/data/blocked", { CheckIsBlocked: async () => false });
stubModule("@/lib/api/ai/ai", { aiAcceptOwners: async () => false });
stubModule("@/lib/api/telegram/templates/owner", { sendReviewerNotification: async () => undefined });
stubModule("next/cache", {
  revalidateTag: (tag: string) => world.tags.push(tag),
  revalidatePath: () => undefined,
  cacheTag: () => undefined,
  cacheLife: () => undefined,
});
stubModule("@/lib/auth/guards", { ownConsultantCid: async () => 7, sessionUser: async () => ({ id: "user-1", phone: "966500000000" }), isConsultant: async () => true });
stubModule("@/lib/auth/require-approved-owner", { requireMobileOwner: async () => ({ id: "user-1" }), requireApprovedOwner: async () => ({ id: "user-1", cid: 7 }) });
stubModule("@/data/mobile/owner-profile", {
  getOwnerProfileRow: async () => (world.row ? { ...world.row, created_at: new Date("2024-01-01"), bankAccount: { holderName: "صاحب الحساب", iban: IBAN, bankCode: "80" } } : null),
  ownsUploads: async () => true,
  getOwnerPhone: async () => "966500000000",
  ownerRowExists: async () => !!world.row,
  toOwnerProfile: (r: any) => ({ cid: r.cid, cost30: r.cost30, cost45: r.cost45, cost60: r.cost60 }),
});

// a valid saudi iban (bank 80) with its mod-97 check digits
const IBAN = (() => {
  const bban = "80" + "000000608010167519";
  const digits = (bban + "SA00").replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let mod = 0;
  for (const d of digits) mod = (mod * 10 + Number(d)) % 97;
  return `SA${String(98 - mod).padStart(2, "0")}${bban}`;
})();

const { checkPrices, durationLabel, minimumLabel, belowMinimumWarning } = require("@/utils/pricing");
const { saveConsultant } = require("@/handlers/conusltant/owner/profile");
const { updateConsultantBaseCosts } = require("@/actions/consultant");
const profileRoute = require("@/app/api/mobile/owner/profile/route");
const { PricingSection } = require("@/components/legacy/consultants/owner/profile/pricing-section");
const { BaseCostsForm } = require("@/components/consultant/packages/packages");
const { getProfileFormDefaults } = require("@/schemas/consultant/profile");
const { readCosts } = require("@/utils/pricing");
const { useForm, FormProvider } = require("react-hook-form");

beforeEach(() => {
  world.row = row();
  world.writes = [];
  world.tags = [];
});

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
const profile = (costs: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  name: "مستشار تجربة",
  title: "مستشار أسري معتمد",
  category: "FAMILY",
  gender: "MALE",
  costs,
  nabout: "نبذة قصيرة عن المستشار",
  neducation: ["بكالوريوس علم النفس"],
  nexperiences: ["خبرة عشر سنوات"],
  preference: "BOTH",
  ...extra,
});

const websiteSave = (costs: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  saveConsultant(
    "user-1", "966500000000", profile(costs, extra), "", "https://x/cv.pdf", "https://x/edu.pdf", "",
    "نبذة قصيرة عن المستشار", ["خبرة عشر سنوات"], ["بكالوريوس علم النفس"], "BOTH", new Date("2015-01-01").toISOString(),
    { holderName: "صاحب الحساب", iban: IBAN },
  );

process.env.APP_SECRET = "test-app-secret";
const appRequest = (method: string, body?: unknown) =>
  new Request("https://shwerni.test/api/mobile/owner/profile", {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
    headers: { "content-type": "application/json", "x-app-secret": "test-app-secret" },
  }) as any;
const appPatch = (prices: Record<string, unknown>) =>
  profileRoute.PATCH(
    appRequest("PATCH", {
      name: "مستشار تجربة", title: "مستشار أسري معتمد", category: "FAMILY", gender: "MALE",
      nabout: "نبذة قصيرة عن المستشار", neducation: ["بكالوريوس علم النفس"], nexperiences: ["خبرة عشر سنوات"],
      preference: "BOTH", years: 10, image: "https://x/i.png", cv: "https://x/cv.pdf", edu: "https://x/edu.pdf", cert: "",
      ...prices,
    }),
    { params: Promise.resolve({}) },
  );

const lastUpdate = () => world.writes.filter((w) => w.op === "update").at(-1)?.data;

// ---------------------------------------------------------------------------------------------
describe("checkPrices (the shared rule)", () => {
  const current = { 30: 100, 45: 200, 60: 250 };

  test("a new price below the minimum is refused; at the minimum accepted", () => {
    const low = checkPrices(settings, [30, 60], { 30: 119, 60: 250 }, current);
    assert.equal(low.ok, false);
    assert.equal(low.errors["30"], "يجب أن تكون التكلفة 120 على الأقل");
    assert.deepEqual(checkPrices(settings, [30, 60], { 30: 120, 60: 250 }, current), { ok: true, costs: { 30: 120, 60: 250 }, kept: [] });
  });

  test("an unchanged stored price below the minimum is kept and flagged", () => {
    assert.deepEqual(checkPrices(settings, [30, 60], { 30: 100, 60: 250 }, current), { ok: true, costs: { 30: 100, 60: 250 }, kept: [30] });
  });

  test("a missing price is refused; a length outside the fields is ignored; a max is enforced", () => {
    assert.equal(checkPrices(settings, [30, 60], { 30: 150 }, current).ok, false);
    assert.deepEqual(checkPrices(settings, [30, 60], { 30: 150, 60: 250, 45: 1 }, current).costs, { 30: 150, 60: 250 });
    const capped = { ...settings, catalog: [{ minutes: 30, min: 120, max: 500 }, ...settings.catalog.slice(1)] };
    assert.equal(checkPrices(capped, [30], { 30: 501 }, null).ok, false);
  });

  test("labels in arabic-indic digits", () => {
    assert.equal(durationLabel(30), "٣٠ دقيقة");
    assert.equal(minimumLabel(120), "الحد الأدنى ١٢٠ ر.س");
    assert.equal(belowMinimumWarning(120), "سعرك الحالي أقل من الحد الأدنى (١٢٠ ر.س)، برجاء تحديثه");
  });
});

describe("website profile save (saveConsultant)", () => {
  test("a new price below the minimum is refused with the message; nothing written", async () => {
    const res = await websiteSave({ 30: 110, 60: 250 });
    assert.deepEqual(res, { state: false, message: "٣٠ دقيقة: يجب أن تكون التكلفة 120 على الأقل" });
    assert.deepEqual(world.writes, []);
    assert.deepEqual(world.tags, []);
  });

  test("the minimum is accepted; dual-write (costs json merged + columns) and the caches purged", async () => {
    world.row = row({ costs: { 90: 400 } });
    const res = await websiteSave({ 30: 120, 60: 175 });
    assert.equal(res.state, true, res.message);
    const data = lastUpdate();
    assert.deepEqual(data.costs, { 90: 400, 30: 120, 60: 175 });
    assert.equal(data.cost30, 120);
    assert.equal(data.cost60, 175);
    assert.equal("cost45" in data, false, "a length the save doesn't hold keeps its column");
    assert.deepEqual(world.tags, ["consultant:7", "consultants"]);
  });

  test("an unchanged stored price below the minimum doesn't block saving other fields", async () => {
    world.row = row({ cost30: 100 });
    const res = await websiteSave({ 30: 100, 60: 250 }, { title: "عنوان جديد للمستشار" });
    assert.equal(res.state, true, res.message);
    assert.equal(lastUpdate().cost30, 100);
    assert.equal(lastUpdate().title, "عنوان جديد للمستشار");
  });

  test("a client-sent durations is ignored: not written, and the database override decides the fields", async () => {
    const res = await websiteSave({ 30: 150, 60: 250, 45: 10 }, { durations: [30, 45, 60] });
    assert.equal(res.state, true, res.message);
    assert.equal("durations" in lastUpdate(), false);
    assert.equal(lastUpdate().cost45, undefined, "45 isn't his length: ignored, not written");
  });

  test("with the override [30, 45, 60] the 45 price is checked too", async () => {
    world.row = row({ durations: [30, 45, 60] });
    const res = await websiteSave({ 30: 150, 45: 150, 60: 250 });
    assert.equal(res.message, "٤٥ دقيقة: يجب أن تكون التكلفة 155 على الأقل");
  });

  test("a center consultant also purges his center's list", async () => {
    world.row = row({ centerId: 3 });
    await websiteSave({ 30: 150, 60: 250 });
    assert.deepEqual(world.tags, ["consultant:7", "consultants", "center-consultants:3"]);
  });

  test("a new consultant: his prices plus the catalog minimum in the columns he doesn't sell", async () => {
    world.row = null;
    const res = await websiteSave({ 30: 130, 60: 180 });
    assert.equal(res.state, true, res.message);
    const created = world.writes.find((w) => w.op === "create").data;
    assert.deepEqual([created.cost30, created.cost45, created.cost60], [130, 155, 180]);
    assert.deepEqual(created.costs, { 30: 130, 60: 180 });
  });
});

describe("the app's owner profile route", () => {
  test("PATCH with the legacy fields: a new price below the minimum → 400 with the message", async () => {
    const res = await appPatch({ cost30: 110, cost45: 200, cost60: 250 });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "٣٠ دقيقة: يجب أن تكون التكلفة 120 على الأقل" });
    assert.deepEqual(world.writes, []);
  });

  test("PATCH with the legacy fields at the minimum is saved (45 outside his set ignored)", async () => {
    const res = await appPatch({ cost30: 120, cost45: 1, cost60: 175 });
    assert.equal(res.status, 200);
    assert.deepEqual(lastUpdate().costs, { 30: 120, 60: 175 });
    assert.deepEqual(world.tags, ["consultant:7", "consultants"]);
  });

  test("PATCH with a costs map", async () => {
    const res = await appPatch({ costs: { 30: 140, 60: 200 } });
    assert.equal(res.status, 200);
    assert.deepEqual([lastUpdate().cost30, lastUpdate().cost60], [140, 200]);
  });

  test("GET meta: minCosts and pricing come from the settings", async () => {
    world.row = row({ durations: [30, 45, 60] });
    const res = await profileRoute.GET(appRequest("GET"), { params: Promise.resolve({}) });
    const { meta } = await res.json();
    assert.deepEqual(meta.minCosts, { cost30: 120, cost45: 155, cost60: 175 });
    assert.deepEqual(meta.pricing.durations, [30, 45, 60]);
    assert.equal(meta.pricing.packageMinutes, 45);
    assert.deepEqual(meta.pricing.catalog[0], { minutes: 30, min: 120, label: "٣٠ دقيقة" });
    assert.deepEqual(meta.pricing.costs, { 30: 150, 45: 200, 60: 250 });
  });
});

describe("packages page (updateConsultantBaseCosts)", () => {
  test("packages on: the 45 package price is required and checked against the 45 minimum", async () => {
    world.row = row({ packagesActive: true });
    assert.deepEqual(await updateConsultantBaseCosts({ 30: 150, 60: 250 }), { success: false, message: "٤٥ دقيقة: السعر مطلوب" });
    assert.deepEqual(await updateConsultantBaseCosts({ 30: 150, 45: 150, 60: 250 }), { success: false, message: "٤٥ دقيقة: يجب أن تكون التكلفة 155 على الأقل" });
    assert.deepEqual(await updateConsultantBaseCosts({ 30: 150, 45: 155, 60: 250 }), { success: true });
    assert.equal(lastUpdate().cost45, 155);
  });

  test("packages off and no 45 in his set: 45 is ignored", async () => {
    assert.deepEqual(await updateConsultantBaseCosts({ 30: 150, 45: 1, 60: 250 }), { success: true });
    assert.equal("cost45" in lastUpdate(), false);
  });

  test("the old browser-only 100 minimum is gone: 100 is refused on the server", async () => {
    assert.equal((await updateConsultantBaseCosts({ 30: 100, 60: 250 })).success, false);
    assert.deepEqual(world.writes, []);
  });

  test("dual-write and purge", async () => {
    await updateConsultantBaseCosts({ 30: 160, 60: 260 });
    assert.deepEqual(lastUpdate(), { costs: { 30: 160, 60: 260 }, cost30: 160, cost60: 260 });
    assert.deepEqual(world.tags, ["consultant:7", "consultants"]);
  });

  test("an unchanged low price doesn't block the save", async () => {
    world.row = row({ cost60: 170 });
    assert.deepEqual(await updateConsultantBaseCosts({ 30: 150, 60: 170 }), { success: true });
  });
});

describe("the forms (rendered to html)", () => {
  const pricing = (r: Row) => ({ settings, durations: r.durations.length ? r.durations : [30, 60], current: readCosts(r) });

  function ProfilePrices({ r }: { r: Row }) {
    const p = pricing(r);
    const form = useForm({ defaultValues: getProfileFormDefaults(r as any, null, p) });
    return React.createElement(FormProvider, form, React.createElement(PricingSection, { disabled: false, pricing: p }));
  }

  test("profile: one field per length he sells, arabic labels, the minimum and the warning", () => {
    const html = renderToStaticMarkup(React.createElement(ProfilePrices, { r: row({ cost30: 100 }) }));
    assert.ok(html.includes("٣٠ دقيقة") && html.includes("٦٠ دقيقة"));
    assert.ok(!html.includes("٤٥ دقيقة"), "45 isn't his length");
    assert.ok(html.includes("الحد الأدنى ١٢٠ ر.س") && html.includes("الحد الأدنى ١٧٥ ر.س"));
    assert.ok(html.includes(belowMinimumWarning(120)), "the unchanged low 30 price is flagged");
    assert.ok(!html.includes(belowMinimumWarning(175)));
    assert.ok(html.includes("يدفع العميل"), "the with-tax preview stays");
  });

  test("packages page: the package session price field while packages are on", () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCostsForm, { settings, fields: [30, 45, 60], durations: [30, 60], current: { 30: 150, 45: 140, 60: 250 } }),
    );
    assert.ok(html.includes("سعر جلسة الباقة (٤٥ دقيقة)"));
    assert.ok(html.includes("الحد الأدنى ١٥٥ ر.س"));
    assert.ok(html.includes(belowMinimumWarning(155)), "his low 45 price is flagged");
  });
});
