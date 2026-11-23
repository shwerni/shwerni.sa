# Session durations and minimum prices → DB settings (main site)

## Context

Today the session durations (30 / 45 / 60) and their minimum prices (120 / 155 / 175) are written into the code in many places in this repo, the dashboard and the app. Some of those places disagree with each other:
- the website profile schema accepts 119 while its message says 120;
- the packages page lets a consultant save prices down to 100, checked in the browser only.

The goal is one source of truth in the `settings` table, read through one cached getter:
- a catalog of durations, each with its minimum price;
- a platform default set of durations for single sessions;
- an optional per-consultant override.

This repo moves first; the dashboard and the app follow later from `docs/pricing-settings-contract.md`.

**Your decisions:**
- prices move to a JSON map on the consultant, with dual-write to `cost30/45/60`;
- the default set is [30, 60], and 45-minute single sessions need a per-consultant override.

## What exists today

- **Storage:**
  - `Consultant.cost30 / cost45 / cost60` (Float, not null), [prisma/models/consultant.prisma](prisma/models/consultant.prisma);
  - `Package.cost`, one price for `count` sessions, always 45 minutes;
  - `Discount.durations Int[] @default([30,45,60])`;
  - `Meeting.duration` (String) and `Payment.total` hold the price paid on each order, so existing orders never depend on the consultant's current prices.
- **Types:**
  - `Cost = Record<"30"|"45"|"60", number>` ([types/data.d.ts](types/data.d.ts)), used by about 10 booking components;
  - `Costs = Record<30|45|60, number>` in [data/event.ts](data/event.ts).
- **Reading prices:**
  - `getConsultantCost(cid)` ([data/consultant.ts:555](data/consultant.ts#L555)) is uncached;
  - `resolveConsultantPricing(cid)` ([data/event.ts](data/event.ts)) applies the campaign discount for each `rule.durations`.
- **Pricing and booking:** `quoteBooking` ([handlers/admin/order/booking-quote.ts](handlers/admin/order/booking-quote.ts)) does `pricing.cost[Number(duration) as 30|45|60]`. It is shared by Pay, the app's quote and the app's create routes.
- **Daftra:** `config.products: Record<30|45|60, number>` from `DAFTRA_PRODUCT_ID_30/45/60` ([lib/daftra/config.ts](lib/daftra/config.ts), [lib/daftra/invoice.ts:109](lib/daftra/invoice.ts#L109)). A duration with no product already fails cleanly ("no daftra product…").
- **Commission pattern** (what the durations will copy): `Consultant.commission Float?` holds the platform default when the consultant is created and a custom value when the dashboard sets one. `reserveConsultant` uses `commission ? commission : commissionRate` (falsy means the platform default from `getFinanceConfig`).
- **Settings:**
  - `Setting { category, subKey, value Json }`, unique on the pair;
  - read by `getExtractSettings` ([data/admin/settings/settings.ts](data/admin/settings/settings.ts)), which is uncached and swallows errors;
  - `getFinanceConfig` is not cached either.
- **Cache:**
  - `"use cache"` + `cacheTag` are used for `event-campaigns`, `consultants` (home cards, which show cost30), `center-consultants:{ceid}` and others;
  - the consultant page's `getCachedConsultant` has `cacheLife("hours")` and no tag;
  - the purge API is `POST /api/revalidate` with header `x-dashboard-secret` = `DASHBOARD_SECRET` and body `{ tag }`, which calls `revalidateTag(tag, "max")`. The dashboard calls it through `shopPost("api/revalidate", { tag })`.

### Hardcoded durations and minimums
- **This repo (to change):**
  - `ConsultantSchema` min 119/154/174 ([schemas/index.ts:38](schemas/index.ts#L38));
  - `MOBILE_MIN_COSTS` 120/155/175 ([schemas/mobile/owner-profile.ts:13](schemas/mobile/owner-profile.ts#L13));
  - `PRICE_FIELDS` ([components/legacy/consultants/owner/profile/pricing-section.tsx](components/legacy/consultants/owner/profile/pricing-section.tsx));
  - `BaseCostsForm` with a browser-only minimum of 100, and `updateConsultantBaseCosts` with no server check ([components/consultant/packages/packages.tsx](components/consultant/packages/packages.tsx), [data/packages.ts](data/packages.ts));
  - `reservationSchema` duration refine `["30","45","60"]` ([schemas/index.ts:270](schemas/index.ts#L270));
  - the website booking Select 30/60 ([components/clients/consultants/reservation/steps/details.tsx](components/clients/consultants/reservation/steps/details.tsx), [components/clients/forms/details.tsx](components/clients/forms/details.tsx));
  - `DURATIONS` 30/45/60 in the center booking panel ([components/clients/centers/booking/booking-panel.tsx](components/clients/centers/booking/booking-panel.tsx));
  - package `"45"` (packages.tsx, [app/api/mobile/reservations/route.ts](app/api/mobile/reservations/route.ts));
  - app zod `z.literal(30|45|60)` (quote and reservations routes);
  - `DURATIONS` in [data/mobile/owner-discounts.ts](data/mobile/owner-discounts.ts);
  - the reels and discover 3-price displays ([app/(pages)/(site)/(sub-pages)/reels/page.tsx](app/(pages)/(site)/(sub-pages)/reels/page.tsx), [components/clients/discover/discover.tsx](components/clients/discover/discover.tsx));
  - `INSTANT_DURATION = 30`, `PLEADING_DURATION` / `RECONCILIATION_DURATION = "60"`. These are fixed products and stay constants.
- **Dashboard (read only, listed for its own session):**
  - `schemas/admin/index.ts` cost30/45/60 with `min(0)` (no minimums);
  - `components/consultants/form.tsx` (three price fields, the ×1.15 preview, commission);
  - `components/discounts/form.tsx` `DURATIONS = [30,45,60]`;
  - `components/finance/requests/link-form.tsx` and `actions/finance/payment-link.ts` (`"30"|"45"|"60"`, cost30/45/60);
  - `components/meetings/form.tsx` duration union;
  - `components/orders/form.tsx`, `employee-form.tsx`;
  - `data/admin/owner.ts`, `data/admin/finance/bank-transfer.ts`;
  - `utils/excel/owners.ts`;
  - `components/discounts/consultant-picker.tsx` (cost30).
- **App (read only):**
  - `constants/owner-profile.ts` price fields 30/45/60;
  - `schemas/owner-profile.ts` cost30/45/60 with `meta.minCosts` (already comes from the server);
  - `types/api/owner.ts` `minCosts`;
  - `types/api/booking.ts` `30|45|60`;
  - `schemas/reservation.ts` duration `"30"|"60"`;
  - `steps/details.tsx`, `steps/duration-modal.tsx` 30/60;
  - `coupon-form.tsx` `30|60`;
  - `discover-card.tsx` `DURATIONS [30,45,60]`;
  - cards and instant use cost30.
- **Maximum price:** none exists anywhere today, so the catalog has an optional `max`, unset by default.

## Design

### Settings (category `"pricing"`; no rows are written by code, and a missing row means the defaults)
| subKey | shape | default |
|---|---|---|
| `durationCatalog` | `{ minutes: int, min: number, max?: number }[]` (unique minutes, 5–240, `max > min`) | `[{30,120},{45,155},{60,175}]` |
| `defaultDurations` | `int[]`, a non-empty subset of the catalog | `[30, 60]` |
| `maxPackageDiscountPercent` | int 0–100 (stored now, applied in the next step) | `40` |
| `daftraDefaultProductId` | positive int: the Daftra product for a duration whose catalog entry has none | none (account-specific; see step 6) |

Each catalog entry also gets an optional `daftraProductId` (positive int). See step 6.

Each key is parsed with zod on its own. If a key is invalid, that key alone falls back to its default and the reason is logged. The catalog must also contain `INSTANT_DURATION` (30) and `PACKAGE_SESSION_MINUTES` (45), so instant and packages can't break.

- **New** [constants/pricing.ts](constants/pricing.ts):
  - `DEFAULT_DURATION_CATALOG`, `DEFAULT_DURATIONS`, `DEFAULT_MAX_PACKAGE_DISCOUNT_PERCENT`;
  - `PACKAGE_SESSION_MINUTES = 45`;
  - `PRICING_SETTINGS_TAG = "pricing-settings"`;
  - `consultantPricingTag(cid) = "consultant:" + cid`.
- **New** [data/admin/settings/pricing.ts](data/admin/settings/pricing.ts) with `getPricingSettings()`:
  - an inner function with `"use cache"`, `cacheTag(PRICING_SETTINGS_TAG)` and `cacheLife("days")`. It queries `prisma.setting.findMany({ where: { category: "pricing" } })` directly and lets database errors throw, so a failure isn't cached (the same rule as `getArticleByAid`);
  - the exported wrapper catches errors and returns the typed defaults;
  - when the cache is warm it makes no query, so the consultant page gets no extra uncached read.
- **New** [utils/pricing.ts](utils/pricing.ts), pure and client-safe:
  - `effectiveDurations(settings, override)`: the override restricted to the catalog, else `defaultDurations`, sorted;
  - `minimumFor(settings, minutes)`;
  - `createCostsSchema(settings, durations)`: a zod object, one required `z.coerce.number().positive().safe().min(min, "يجب أن تكون التكلفة {min} على الأقل")` (plus `.max` when set) per effective duration, keyed by `"30"`, `"60"` and so on;
  - `readCosts(row)`: **while the transition lasts, the legacy columns win for 30/45/60** (the dashboard still writes only those). The `costs` JSON is the source only for durations without a legacy column. Tested: JSON 30=200 with column 250 gives 250;
  - `toLegacyColumns(costs)`: the `cost30/45/60` values for the dual-write.

### Storage (✋ schema)
```prisma
model Consultant {
  …
  costs     Json  @default("{}")   // { "<minutes>": price } — source of truth for prices
  durations Int[] @default([])     // per-consultant override; empty = platform default (like commission's falsy fallback)
}
```
- **Reading:** `readCosts` takes `cost30/45/60` from the columns (they win over the JSON during the transition), and other durations from `costs`. Existing consultants work without a data migration.
- **Optional backfill** (Ziad, not code): `UPDATE consultants SET costs = jsonb_build_object('30',cost30,'45',cost45,'60',cost60) WHERE costs = '{}'`.
- **Dual-write:**
  - every price save writes `costs`, and also `cost30/45/60` for the keys it holds;
  - a duration missing from the map leaves its column unchanged;
  - a new consultant who has no 45 price gets `cost45` = the 45-minute minimum, because the column is not null. It isn't bookable (not in their set) and isn't shown here.
- **Later:** the columns are dropped once the dashboard and the app read `costs`. That is a separate step.
- **Existing orders:** untouched. They keep their own `Meeting.duration` and `Payment.total`.

### Rules applied
- **Prices:** only the consultant's effective durations are priced. The forms show and validate only those, and the save actions re-check on the server with the consultant's override read from the database.
- **Booking:** `quoteBooking` refuses a duration outside the effective set (new failure step `duration`, "مدة الجلسة غير متاحة لهذا المستشار"). It's shared, so Pay, the app's quote and the app's create routes all enforce it.
- **Unchanged products:** packages stay at `PACKAGE_SESSION_MINUTES`, priced by the package. Instant stays at `INSTANT_DURATION`, priced from `readCosts`, so instant isn't broken by an override.
- **Campaign discounts:** applied to `rule.durations ∩ effective`.
- **Daftra:** the product comes from the pricing settings (the entry's `daftraProductId`, else `daftraDefaultProductId`), never from env vars. An invoice never fails because a duration has no product. See step 6.

### Cache tags (the dashboard purges through `POST /api/revalidate`)
- `pricing-settings`: after any `pricing/*` setting change.
- After a consultant's prices or durations change:
  - `consultant:{cid}`, added to the consultant page's `getCachedConsultant`;
  - `consultants` (home cards);
  - `center-consultants:{ceid}`, for a center consultant.

### New endpoint
`GET /api/mobile/pricing?cid=` (`requireMobileUser`) returns `{ catalog, defaultDurations, maxPackageDiscountPercent, packageMinutes, consultant: { cid, durations, costs } | null }`.
- With a `cid`: that consultant; 404 if missing.
- Without one, for an owner: their own.
- Otherwise: `null`.

## Steps (each one ships and tests on its own)

1. **Settings and pure helpers** (no behavior change):
   - add `constants/pricing.ts`, `data/admin/settings/pricing.ts`, `utils/pricing.ts`;
   - tests: defaults when rows are missing, an invalid key falls back alone, a database error isn't cached, effective sets, schema minimums.
2. **✋ Schema:** `Consultant.costs` and `Consultant.durations`. Run `prisma validate` and `generate`, then stop; Ziad runs `db push`.
   - In the same step, the settings parser learns the optional `daftraProductId` on catalog entries and the `daftraDefaultProductId` key (parsed only, unused until step 6).
   - **Tolerance:** catalog entries, and any pricing setting that is an object, ignore unknown fields (zod's default strip, no `.strict()`) while the known fields are still validated. A field the dashboard adds later can never reset the catalog to the defaults. Test: a catalog entry with an extra unknown field still parses with its real values (and the field is dropped).
3. **Read path:**
   - `getConsultantCost` → `{ costs, durations }`, reading the settings through the cached getter, with no extra query;
   - `resolveConsultantPricing` returns only effective durations and `durations: number[]`;
   - the `Cost` type becomes `Record<string, number>`;
   - the website booking Select and the center panel take `durations` as props from `reserve.tsx` and the center page;
   - the reservation-info route and owner-discounts use the effective durations;
   - the reels and discover displays show only effective durations (add `durations` to `data/reels.ts`).
4. **✋ Booking enforcement (payment).**
   - **BLOCKER:** this step does not ship until Ziad has set per-consultant overrides in the database for every consultant who sells 45 or any other non-default duration, center consultants included.
   - **Before coding it:** list every flow that goes through `quoteBooking`. Confirm that instant (30), pleading (60) and reconciliation (60) are exempt from the effective-durations check, or always pass it, with a test for each.
   - **Changes:**
   - `quoteBooking` duration check;
   - Pay and the app routes map `duration` → 400;
   - the app's zod `z.literal(30|45|60)` becomes a positive int;
   - the `reservationSchema` refine accepts any positive-int string (the quote decides);
   - tests: the Pay snapshot baseline is unchanged for valid durations, and an out-of-set duration is refused everywhere.
5. **Price saving:**
   - **Price fields** (website profile form, packages page; the app follows the same contract):
     - one field per effective duration, generated and sorted by minutes;
     - each labelled in Arabic with Arabic-Indic digits ("٣٠ دقيقة", from a new deterministic `durationLabel(minutes)` in `utils/pricing.ts`, so the server and the browser render the same text);
     - the minimum is always shown under the field ("الحد الأدنى ١٢٠ ر.س"), and the existing customer-price line (with tax) stays below it once a value is entered;
   - **The consultant can't add or remove durations:** no main-site save path writes `Consultant.durations`, any durations sent by a client are ignored, and the schema is built from the override read from the database. Only the admin dashboard sets the override;
   - `ConsultantSchema` costs → `createConsultantSchema(settings, durations)`;
   - [schemas/consultant/profile.ts](schemas/consultant/profile.ts) form schema and defaults use a `costs` map;
   - [app/(pages)/(consultants)/dashboard/page.tsx](app/(pages)/(consultants)/dashboard/page.tsx) passes settings and durations as props;
   - `PricingSection` builds its fields from props;
   - `saveConsultantProfile` validates and dual-writes;
   - `BaseCostsForm` plus `updateConsultantBaseCosts` get server validation and dual-write, which closes the 100 bypass. **The 45-minute price stays a required, editable field on the packages page whenever the consultant has packages enabled.** It is labelled as the package session price, even when 45 isn't in his single-session set;
   - **every main-site save path** (website profile form, packages page, mobile owner profile) calls `revalidateTag` for `consultant:{cid}`, `consultants`, and `center-consultants:{ceid}` when relevant, rather than relying on dashboard purges;
   - the mobile owner profile accepts `costs` or the legacy `cost30/45/60`, normalised and validated against the effective set (legacy fields outside it are ignored), and `meta.minCosts` now comes from settings plus a new `meta.pricing`;
   - tests for each save path.
6. **Daftra products from the pricing settings** (after price saving):
   - **Lookup:** new `daftraProductFor(minutes)` in `lib/daftra/products.ts` reads the cached `getPricingSettings()`. It returns the entry's `daftraProductId`, else `daftraDefaultProductId`. During the transition only, it falls back to `DAFTRA_PRODUCT_ID_<minutes>`, then `DAFTRA_PRODUCT_ID_60`, so invoices keep going out before the settings rows are written.
   - **Config:** `getDaftraConfig()` (`lib/daftra/config.ts`) stays synchronous for subdomain, key, wallet method, start date and client email. `products` and the three `DAFTRA_PRODUCT_ID_*` names leave its required list. The config is incomplete (`ok: false`, as today) only when no default product exists anywhere (neither the setting nor the transition env).
   - **Invoice:** `buildOrderInvoice(order, config, productId)` (`lib/daftra/invoice.ts`) takes the product its callers resolved by the first meeting's duration (send, retry, resolve). The "no daftra product for a … minute session" failure is removed.
   - **Initial values** (Ziad writes the settings rows; code never writes them): each catalog entry's `daftraProductId` = today's `DAFTRA_PRODUCT_ID_30/45/60`; `daftraDefaultProductId` = the 60 product. *Better fit:* a dedicated generic product in Daftra (e.g. "جلسة استشارية") as the default, so an unknown duration isn't invoiced as a 60-minute session; the 60 product is fine until one exists.
   - **Tests:** every duration with and without its own product, the default, the transition fallback, no product anywhere (config incomplete, nothing sent), and a 90-minute order invoiced with the default.
7. **Endpoint and tags:**
   - `GET /api/mobile/pricing`, whose catalog entries carry the `label`;
   - `cacheTag(consultantPricingTag(cid))` on `getCachedConsultant`;
   - tests.
8. **Docs:** finish `docs/pricing-settings-contract.md` (keys and shapes, defaults, the endpoint, tags and purge, the schema, the Daftra products) and progress entries.
9. **Remove the Daftra product env vars**, only after step 6 has shipped, the settings rows are written and invoices are verified:
   - delete the transition fallback from `lib/daftra/products.ts`;
   - Ziad removes `DAFTRA_PRODUCT_ID_30`, `DAFTRA_PRODUCT_ID_45`, `DAFTRA_PRODUCT_ID_60` from Vercel (Production and Preview) and from his local `.env`, which I don't read;
   - `scripts/daftra-fix-products.ts` (the one-off product fix) still reads them: delete the script or point it at the settings;
   - the dashboard doesn't read them.

## Notes
- **Daftra:** product IDs per duration move from env vars to the pricing settings in step 6. The env vars are removed in step 9. They are read in `lib/daftra/config.ts` and `scripts/daftra-fix-products.ts`, and set in Vercel and the local `.env`.
- **Price field labels:** Arabic-Indic digits come from a fixed digit map, not `toLocaleString`, so the server and the browser render the same text.

## Data checks (read-only; my database access was blocked earlier, so Ziad runs these)
```sql
-- prices below the minimums
select count(*) filter (where cost30 < 120) as below30, count(*) filter (where cost45 < 155) as below45,
       count(*) filter (where cost60 < 175) as below60,
       count(*) filter (where cost30 < 120 or cost45 < 155 or cost60 < 175) as any_below,
       count(*) filter (where (cost30 < 120 or cost60 < 175) and approved = 'APPROVED' and "statusA" = 'PUBLISHED') as published_below_default_set
from consultants;
-- single sessions booked at 45 (or anything but 30/60) in the last 6 months, by consultant
select o."consultantId", o."centerId" is not null as center, m.duration, count(*)
from orders o join meetings m on m."orderId" = o.oid join payments p on p."orderId" = o.oid
where o.session = 'ONCE' and p.payment = 'PAID' and m.duration not in ('30','60') and o.created_at > now() - interval '6 months'
group by 1,2,3 order by 4 desc;
```
- **Below the minimum:** nothing changes. Their stored prices still book, and Pay doesn't check minimums. Their next price save must meet the minimum, and the form explains why.
- **45-minute or other durations:** the dashboard gives them an override that includes the duration. Until then, 45 single sessions are refused for them; packages are unaffected.

## Verification
- After every step: `npx tsc --noEmit`, eslint on the changed files, the throwaway vitest suite, `npm run build`, the manifest check, and a progress entry.
- **Throwaway tests (beyond those listed in each step):**
  - the settings getter, including cache behaviour, a database failure and invalid rows;
  - `readCosts` fallback;
  - `quoteBooking` refusals;
  - every save path (website form, packages page, mobile profile) on the server;
  - the endpoint.
- **Manual (Ziad):**
  - consultant page with settings rows absent and present;
  - booking 30 and 60, and 45 for a consultant with the override;
  - price forms showing only effective durations;
  - a purge through `/api/revalidate` refreshing prices.
