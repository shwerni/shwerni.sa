# Pricing settings contract (session durations, minimum prices, Daftra products)

- **Owner:** the main site (this repo) is the source of truth. The dashboard and the mobile app follow this file.
- **Status:** design, updated 2026-11-23. Each section says whether it is **live** or **planned** (main-site step number). Treat planned parts as fixed contracts, but don't depend on them until the step ships.
- **Plan:** `docs/pricing-settings-plan.md`. Progress is in `docs/progress.md`.

## 1. Settings rows

Table `settings` (`Setting`: `category`, `subKey`, `value` Json, unique on the pair). Category: **`pricing`**. The main site never writes these rows; the dashboard does. A missing row means the default.

| subKey | value (Json) | default when missing or invalid | status |
|---|---|---|---|
| `durationCatalog` | array of catalog entries (below) | `[{"minutes":30,"min":120},{"minutes":45,"min":155},{"minutes":60,"min":175}]` | live (step 1) |
| `defaultDurations` | array of ints | `[30, 60]` | live (step 1) |
| `maxPackageDiscountPercent` | int | `40` | live (step 1), stored only; applied in a later step |
| `daftraDefaultProductId` | int | none (see section 6) | planned (parsed from step 2, used from step 6) |

### Catalog entry
```json
{ "minutes": 30, "min": 120, "max": 500, "daftraProductId": 1 }
```
| field | type | rule |
|---|---|---|
| `minutes` | int | 5–240, unique within the catalog |
| `min` | number | > 0; the lowest price (SAR, before tax) a consultant may set |
| `max` | number, optional | > `min`; the highest price. No maximum exists today |
| `daftraProductId` | int, optional | > 0; the Daftra product for this duration. Planned: step 2 parses it, step 6 uses it |

### Validation (main site, `parsePricingSettings` in `utils/pricing.ts`)
- **Each key on its own:** each key is parsed separately. A missing or invalid key falls back to its default alone, and the reason is logged as `[pricing-settings] …`. The other keys are still used.
- **Unknown fields are ignored** (from step 2): a catalog entry, or any pricing setting that is an object, keeps its known fields and drops the rest. Adding a field never resets a setting to its default; only an invalid known field does.
- **Catalog:** at least one entry, `minutes` unique, and it must contain **30** (instant sessions) and **45** (package sessions). Entries are sorted by `minutes`.
- **`defaultDurations`:** a non-empty set of unique ints, all present in the catalog in use. If any value isn't in the catalog, the default `[30, 60]` is used, limited to the catalog (and if nothing is left, every catalog duration).
- **`maxPackageDiscountPercent`:** an int from 0 to 100.
- **`daftraDefaultProductId`** (planned): a positive int. No code default exists (product IDs belong to the Daftra account).

### Writing rows from the dashboard
- Write the full `value` for a key (no partial merge).
- Validate with the same rules before saving, so a typo doesn't silently fall back on the site.
- Then purge `pricing-settings` (section 5).

## 2. Consultant fields

| field | status | meaning |
|---|---|---|
| `cost30`, `cost45`, `cost60` (Float, not null) | live, legacy | prices for 30 / 45 / 60 minutes |
| `costs` (Json, default `{}`) | planned (step 2 schema) | prices by duration: `{ "30": 150, "60": 250, "90": 400 }`; keys are minutes as strings, values SAR before tax |
| `durations` (Int[], default `[]`) | planned (step 2 schema) | the per-consultant override of single-session durations. **Empty = the platform default** (`defaultDurations`), the same "no value means the platform's" pattern as `commission` |

### Reading prices (transition rule, `readCosts`)
- **Columns win:** for 30, 45 and 60, the `cost30/45/60` columns win over `costs` (the dashboard still writes only the columns).
- **JSON for the rest:** `costs` is the source only for durations without a column (e.g. 90).
- **Ignored JSON:** a non-integer key, or a non-numeric or non-positive value.

### Writing prices
- **Main site (dual-write, from step 5):** writes `costs`, and also `cost30/45/60` for each of those keys present in the map. A duration missing from the map leaves its column unchanged.
- **New consultant without a 45 price:** gets `cost45` = the 45-minute catalog minimum, because the column is not null. That price isn't bookable as a single session (45 isn't in their set).
- **Dashboard, until its own migration:** keeps writing `cost30/45/60` (the columns win, so this stays correct).
- **Dashboard, when it moves to `costs`:** must write both `costs` and the columns, exactly like the main site.
- **Later:** the columns are dropped in a separate step once the dashboard and the app read `costs`.

### Effective durations (`effectiveDurations`)
`durations` restricted to the catalog's durations, without duplicates, sorted. If that leaves nothing (no override, or an override with nothing in the catalog), it is `defaultDurations`.

## 3. Rules every client follows

- **Price fields** (website dashboard, mobile app; main site from step 5):
  - one field per effective duration, sorted by minutes;
  - **label:** Arabic, with Arabic-Indic digits: `"٣٠ دقيقة"`, `"٦٠ دقيقة"` (digits `٠١٢٣٤٥٦٧٨٩`);
  - **under each field:** its minimum, `"الحد الأدنى ١٢٠ ر.س"`. Once a value is entered, the customer price with tax is also shown (`withTax`, 15%).
- **Package session price:** the 45-minute price field appears on the packages page whenever the consultant has packages enabled, labelled as the package session price, even when 45 isn't in his effective single-session set. Packages are always 45 minutes (`PACKAGE_SESSION_MINUTES`), priced by the package's own `cost`.
- **The consultant can't add or remove durations:**
  - only the admin dashboard edits `Consultant.durations`;
  - no consultant-facing form or route accepts durations;
  - the main site ignores any durations sent by a client and builds the price schema from the override in the database.
- **Price validation:** every price is required, ≥ its catalog `min`, ≤ its `max` when set.
  - Messages: `"يجب أن تكون التكلفة {min} على الأقل"`, `"يجب ألا تزيد التكلفة عن {max}"`.
  - The main site enforces this on the server in every save path (step 5), including the packages page, which today checks only in the browser.
- **Booking** (planned, step 4): only effective durations are bookable for single sessions.
  - Instant (30), package sessions (45), pleading (60) and reconciliation (60) are fixed products and aren't affected.
  - **Step 4 is blocked** until the overrides are set for every consultant who sells 45 or other non-default durations, center consultants included.
- **Existing orders:** never affected. Each order keeps its own `Meeting.duration` and `Payment.total`.

## 4. Getter (main site, live from step 1)

`getPricingSettings()` in `data/admin/settings/pricing.ts`:
- `"use cache"`, `cacheTag("pricing-settings")`, `cacheLife("days")`;
- one query (`settings` where `category = "pricing"`), parsed as in section 1;
- a database error is never cached: the getter answers the defaults and the next call queries again.

```ts
interface PricingSettings {
  catalog: { minutes: number; min: number; max?: number /* , daftraProductId?: number (step 2) */ }[];
  defaultDurations: number[];
  maxPackageDiscountPercent: number;
  // daftraDefaultProductId: number | null   (step 2)
}
```

## 5. Cache tags and purging

| tag | purge after | status |
|---|---|---|
| `pricing-settings` | any change to a `pricing/*` setting | live |
| `consultant:{cid}` | that consultant's prices or `durations` change | the tag name is live; it is attached to the consultant page in step 7 |
| `consultants` | any consultant's prices or `durations` change (home cards) | live |
| `center-consultants:{ceid}` | a center consultant's prices or `durations` change | live |

Purge request (dashboard → main site):
```http
POST {MAIN_SITE_URL}/api/revalidate
x-dashboard-secret: <DASHBOARD_SECRET>
content-type: application/json

{ "tag": "pricing-settings" }
```
- **Answers:** `200 { "ok": true, "tag": "…" }`; `401` for a missing or wrong secret; `400` when `tag` isn't a string.
- **One tag per request.** The dashboard's existing helper is `shopPost("api/revalidate", { tag })`.
- **Stale-while-revalidate:** the main site uses `revalidateTag(tag, "max")`, so the first request after a purge may still serve the old value while it refreshes.
- **Main-site saves:** these call `revalidateTag` for `consultant:{cid}`, `consultants` and `center-consultants:{ceid}` themselves (from step 5). The dashboard purges after its own saves.

## 6. Daftra products (planned, step 6; env vars removed in step 9)

- **Lookup:** the invoice product comes from the pricing settings by the order's first meeting duration:
  1. the catalog entry's `daftraProductId`;
  2. else `daftraDefaultProductId`;
  3. transition only, until step 9: `DAFTRA_PRODUCT_ID_<minutes>`, then `DAFTRA_PRODUCT_ID_60`.
- **No failure:** an invoice never fails because a duration has no product. The Daftra config counts as incomplete (nothing sent, as with any missing Daftra setting today) only when no default product exists anywhere.
- **Initial values** (written by Ziad, not by code):
  - each catalog entry's `daftraProductId` = today's `DAFTRA_PRODUCT_ID_30` / `_45` / `_60`;
  - `daftraDefaultProductId` = the 60 product;
  - recommended later: a dedicated generic product in Daftra (e.g. "جلسة استشارية"), so an unknown duration isn't invoiced as a 60-minute session.
- **Step 9 (after step 6 is verified):** remove the transition fallback, then remove `DAFTRA_PRODUCT_ID_30`, `DAFTRA_PRODUCT_ID_45`, `DAFTRA_PRODUCT_ID_60` from Vercel (Production and Preview) and the local `.env`.
  - Read today in `lib/daftra/config.ts` and `scripts/daftra-fix-products.ts` (a one-off script).
  - The dashboard doesn't read them.

## 7. Mobile endpoint (planned, step 7)

`GET /api/mobile/pricing?cid={cid}`, with `x-app-secret` and the session token like every `/api/mobile` route (`requireMobileUser`).
- `cid` given: that consultant's effective durations and prices (404 if the consultant doesn't exist).
- No `cid`, owner session: the owner's own consultant.
- No `cid`, other sessions: `consultant: null`.

```ts
interface PricingResponse {
  catalog: { minutes: number; min: number; max: number | null; label: string /* "٣٠ دقيقة" */ }[];
  defaultDurations: number[];
  maxPackageDiscountPercent: number;
  packageMinutes: number; // 45
  consultant: {
    cid: number;
    durations: number[];            // effective, sorted
    costs: Record<string, number>;  // readCosts, keys = minutes as strings
  } | null;
}
```
- **Errors:** `401` (no session), `400` (a `cid` that isn't a positive int), `404` (unknown `cid`), `500`.
- The Daftra product IDs are never sent to the app.
- The owner profile route (`/api/mobile/owner/profile`) keeps `meta.minCosts` (now from the settings) and adds `meta.pricing` with the same shape as this response's `catalog` + `consultant` (step 5).

## 8. Prisma schema changes (planned, step 2)

```prisma
model Consultant {
  // …existing fields, cost30 / cost45 / cost60 unchanged
  costs     Json  @default("{}")   // { "<minutes>": price }; the json is read for durations without a legacy column (section 2)
  durations Int[] @default([])     // per-consultant override; empty = platform default
}
```
- No other model changes. `Setting` already stores any Json.
- Applied with `prisma db push` by Ziad. The other codebases regenerate their clients from this schema.
- **Optional backfill** (Ziad, not code): `UPDATE consultants SET costs = jsonb_build_object('30',cost30,'45',cost45,'60',cost60) WHERE costs = '{}'`. It isn't required, because the columns win for those keys.
