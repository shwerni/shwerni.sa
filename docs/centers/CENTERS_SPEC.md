# Centers (المراكز) — Feature Spec

> Put this file and `centers.prisma` in `docs/centers/` in **both** the main site repo and the admin dashboard repo.
> Claude Code: read this whole file before every phase. If the code you find contradicts something here, stop and ask Ziad. Do not guess.
> The main-site audit is in `docs/centers/AUDIT.md`. Ziad's answers to it are recorded in §19 and folded into the sections below.

---

## 1. Summary

A **center** is a physical place with several consultants. Clients can book its consultants **online** (same as today) or **onsite** (at the center).

Center consultants must **never** appear among platform consultants. They appear only under a new **المراكز** section. That section lists centers, and each center page lists its own consultants, with the same booking experience as the rest of the platform.

Centers manage everything through a **center dashboard** on the main site: orders, profile and theme, work hours, consultants, coupons and discounts, dues, and bank account. Ziad creates every center account manually from the admin dashboard. There is no self sign-up.

---

## 2. Locked decisions

### Data and routing

| Topic | Decision |
|---|---|
| Tenancy | One shared database. Centers are rows with a relation (`centerId`). No per-center database, schema or tenant. |
| Public URL | `/centers/[slug]` is the real, indexed URL. A consultant inside a center lives at `/centers/[slug]/consultants/[cid]`. |
| Subdomains | `{slug}.shwerni.sa` is a **301 redirect** to `https://shwerni.sa/centers/{slug}`. It is not a rewrite. Checkout and login always stay on the main domain. |
| Consultant model | The same `Consultant` model with a nullable `centerId`. A consultant belongs to the platform (`centerId = null`) or to exactly one center. |
| Consultant accounts | The center creates and manages its consultant profiles. `Consultant.userId` becomes nullable, and center consultants have no user and no login in v1. |

### Money

| Topic | Decision |
|---|---|
| Split | **Two-way.** The platform takes `Center.platformRate` (a whole number, default 20%). The center receives the rest and pays its consultants itself. The platform never tracks or pays individual center consultants. |
| Split snapshot | The rate is snapshotted on `Payment.commission` as the **center's** % (`100 − platformRate`), keeping the field's existing meaning, "the provider's %". The amounts (`platformShare`, `centerShare`) are written **once**, when the payment becomes PAID. Neither is ever recomputed from current center settings (§7.1). |
| Bank accounts | Only the center has a bank account (`CenterBankAccount`, SA IBAN only). Center consultants have no `BankAccount` rows. |

### Access and approval

| Topic | Decision |
|---|---|
| Center auth | New `UserRole.CENTER` plus a `CenterMember` row. Created by admin only. No sign-up or registration path may ever assign `CENTER`. |
| Center dashboard location | Main site (same auth as the owner dashboard), under its own route group. |
| Admin tools | The admin dashboard creates centers and accounts, approves consultants and bank changes, records payouts, and edits `platformRate`. |
| Consultant approval | Consultants created by a center start as `approved: PENDING` and `statusA: HIDDEN`. They are not public until an admin approves them. |
| Bank changes | A new IBAN is `PENDING` until an admin approves it. The previously APPROVED account stays in use until then. |

---

## 3. Defaults chosen (implement these unless Ziad says otherwise)

1. **Split base** is the amount actually paid **after discount, before VAT**. Gateway fees are the platform's cost and are not deducted from the center's share.
2. **Center-created discounts and coupons** reduce the base, so the platform's 20% shrinks proportionally. There is no minimum floor.
3. **Platform discounts and campaigns never apply to center consultants.** Center discounts and coupons never apply to platform consultants.
4. **Refunds**, whether partial or full and through any channel (including wallet), reduce `platformShare` and `centerShare` by the same proportion: `refunded / paidBeforeVat`, using the pre-VAT portion of the refund.
5. **Collaborator commission** (`Order.collaboratorId`) on a center order comes out of the **platform share**. The center's share is never reduced by it.
6. **Center closures** (`CenterClosure`) block **ONSITE** bookings on that date. Online bookings are not affected.
7. **ONSITE timings** must fall inside the center's work hours for that weekday. This is validated server-side when timings are saved and again at booking time.
8. **Dues eligibility** for centers uses the same rule the platform uses today for consultant dues. The audit found that rule in `data/dues.ts` (`getAllDuesOwner`, `getDuesOwnenByMonth`):
   - An order counts **iff `payment.payment === PAID`**. There's no condition on meeting `done`, on the date, or on the order type.
   - A full refund flips the state to `REFUND`, so the order drops out.
   - Monthly views group by `Order.due_at`, which is set at creation.

   Mirror that eligibility exactly, then subtract partial refunds as §3.4 says. Today's consultant dues ignore partial refunds; that difference is intended for centers only.
9. **Consultant dues exclude center orders.** Every consultant dues query and report, on the main site and in the admin dashboard, filters `centerId: null`. Center orders are paid to the center (§7.3), never to a consultant.

---

## 4. Out of scope for v1

These are excluded **on purpose**. Do not build them, and make sure center consultants are excluded from each:

- Packages (`Package`) for center consultants
- Programs (`ProgramConsultant`)
- Instant sessions (`OrderType.INSTANT` / online presence)
- Free sessions (`FreeSession`)
- The WhatsApp/AI bot's consultant order lookup (`BotConsultantOrder` in `data/bot.ts`, which finds orders by the consultant's phone)
- Articles, questions and article comments authored by center consultants
- Event campaigns and placements (`EventCampaign`) for centers
- Centers UI inside the Expo mobile app. **However, leak protection in `app/api/mobile/*` is in scope** (see §6).
- Subdomain rewrite (only the redirect is in scope), and custom domains
- Center self sign-up, and consultant login for center consultants
- **Existing consultants with `type: Center`.** These are today's workaround: one owner account representing a whole center. Leave them untouched. They stay platform consultants. Ziad will migrate them by hand later.

The booking and lookup paths for programs, instant sessions, free sessions and the bot (`reserveProgram`, `reserveInstant`, `reserveFreeSession`, `BotConsultantOrder`) **stay on the safe client and fail closed** for center consultants. Do not move them to `prismaAll`.

---

## 5. Data model

The exact changes are in `centers.prisma`. These are the rules around them.

### Schema and migrations

- **Ownership:** the schema is owned by the **main site repo** (`prisma/schema.prisma` + `prisma/models/*.prisma`). It is applied with **`prisma db push`**; there are no migrations and no `prisma/migrations` folder. The other repos copy the updated schema and run `prisma generate`. If the mobile repo uses `scripts/generate-enums.js`, re-run it there too, because `UserRole` gains `CENTER`.
- **Who pushes:** Ziad runs `prisma db push` against the shared database. Claude Code never runs it (`CLAUDE.md`: nothing is applied to the remote database). Claude Code edits the schema files, runs `prisma validate` and `prisma generate`, then stops and asks.
- **Additive only.** Phase 1 adds models, nullable columns, enum values and indexes, and relaxes `NOT NULL` on `Consultant.userId` and `ConsultantTiming.userId`. Nothing is dropped or renamed. If `db push` reports possible data loss, stop.
- **`Center` already exists as a stub** in `prisma/models/roles.prisma` (`id String @id @default(cuid())`, `@@map("centers")`), next to the existing `enum CenterState`. The database has no `centers` rows, or no table yet. Phase 1 extends that stub in place, or creates the table, into the full model in `centers.prisma`. Don't declare a second `Center` or `CenterState`.
- **Centers are never deleted, only hidden** (`status: HIDDEN`). The database enforces it with `onDelete: Restrict` on `Consultant.center`, `Coupon.center`, `Discount.center`, `Order.center` and `FinanceEntry.center`. A delete would otherwise null `centerId` and turn the center's consultants, coupons and discounts into platform ones. The center's own rows (`CenterMember`, `CenterWorkHour`, `CenterClosure`, `CenterBankAccount`) keep `onDelete: Cascade`.
- **Naming:** use the existing field naming in this schema, including `created_at` (not `createdAt`) on models that use it, `author` (not `userId`) on Order, and `payment.payment` for the state. Match each model's existing style.
- **Relations** point to numeric public ids (`Center.ceid`, `Consultant.cid`, `Order.oid`), the same as the rest of the schema.

### How the new fields are set

- `Order.centerId` is set **server-side** from `consultant.centerId` when the order is created. It is never taken from client input.
- `Meeting.mode` (`TimingType`) is copied from the booked timing's `type` at creation. It is a genuinely new field: the audit found the mode stored nowhere today (not on `Order`, `Meeting` or `Room`).
- **ONSITE is not implemented yet**, even though `ConsultantTiming.type` exists:
  - The web timing editor never passes a type (`handlers/conusltant/owner/timings.ts:15`), so every saved slot is ONLINE. All existing timings in the database are ONLINE.
  - `getTimings` and the availability query (`getConsultantAvailableTimes`, raw SQL in `data/consultant.ts:431`) don't return `type`.
  - The booking form, `Pay` and `reserveConsultant` carry no mode.

  The timing editor and the availability query must add `type`, and booking carries it through to `Meeting.mode`.
- **One type per slot.** Keep the current `@@unique([consultantId, day, time])` on `ConsultantTiming`. A consultant can't be online and on site at the same time.

### Slugs

- Slugs must match `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$`.
- Admin enters them manually; center names are Arabic, so never auto-transliterate.
- Reserved slugs that must be rejected: `www, api, app, admin, dashboard, mail, smtp, support, help, static, assets, cdn, centers, center, auth, login, status, blog, dev, staging, test`. Also reject any subdomain already used by an existing deployment.

---

## 6. Leak protection (the most important part)

**Goal:** a center consultant can never appear in any platform list, page, search, sitemap, API or mobile endpoint, by default. That includes anything written in the future.

### 6.1 Two Prisma clients (main site)

- **The existing exported client** becomes the **safe** client. On the main site that is the default export `prisma` of `lib/database/db.ts`, imported by 97 files. It is extended so that every **read** on `consultant` gets `centerId: null` injected, unless the query explicitly sets `centerId`.
- **A new export, `prismaAll`**, is the plain, unfiltered client. It's a named export from the same file.

Why the existing name becomes the safe one: all existing code is protected without edits. If a transactional flow breaks because it now can't see a center consultant, it fails loudly (404 or error). A missed discovery query would otherwise leak silently.

```ts
const CONSULTANT_READS = new Set([
  "findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow",
  "count", "aggregate", "groupBy",
]);

// inside $extends({ query: { consultant: { async $allOperations({ operation, args, query }) { ... } } } })
if (CONSULTANT_READS.has(operation)) {
  const a = args as { where?: Prisma.ConsultantWhereInput };
  // `undefined` counts as "not set": Prisma silently drops undefined filters, which would leak every center
  if (a.where?.centerId === undefined) a.where = { ...a.where, centerId: null };
}
return query(args);
```

- Prisma 5+ accepts non-unique fields inside `findUnique`. So `/consultants/[cid]` for a center consultant returns null and 404s with no extra code.
- Check that interactive transactions (`$transaction(async (tx) => ...)`) on the extended client still compile and behave correctly.

### 6.2 Which client to use where

**Discovery code uses the safe client.** This covers:

- the home page and `data/consultant` listings
- category pages and search
- the consultant profile at the platform route
- favorites
- reviews pages
- the sitemap and OG images
- every `app/api/mobile/*` listing or profile route

**Transactional code uses `prismaAll`**, because it must work for both kinds of consultant. This covers:

- the booking and reserve flow
- `resolveConsultantPricing`, `applyCoupon` and `Pay`
- `updateOrderStatus` (the paid pipeline)
- the Moyasar and Tabby webhooks and confirm routes
- meetings, rooms, participants and reschedules
- order pages for client and owner
- notifications and reminders
- refunds
- all center dashboard code
- center public pages, which pass `centerId` explicitly anyway

**Exceptions:** the programs, instant, free-session and bot paths stay on the safe client (§4).

**Specific functions the audit found (`AUDIT.md` §1):**

- **Must use `prismaAll`**, or center booking fails:
  - `getConsultantCost` (`data/consultant.ts:525`, the base price inside `resolveConsultantPricing`)
  - the consultant lookup in `reserveConsultant` (`data/order/reserveation.ts:76`)
- **Dual-use helpers must be split** into a discovery version (safe client) and a transactional version (`prismaAll`). Each one serves both a platform profile and booking:
  - `getConsultantInfo` (`data/consultant.ts:292`) serves the platform profile `/consultants/[cid]` (discovery) and the reserve components plus `app/api/mobile/consultants/[cid]/reservation-info` (booking).
  - `getConsultant` (`data/consultant.ts:241`, raw SQL) serves the profile component, `marriage-awareness`, `questions/[qid]` and `app/api/mobile/consultants/consultant`.

  Split each one by caller. Don't add a client parameter that callers could get wrong.

### 6.3 What the extension does NOT cover (audit by hand)

The extension only filters queries that **start at** `consultant`. The following must be fixed manually:

- **Nested includes/selects** that reach a consultant from another model:
  - `article.consultant`
  - `question.consultant`
  - `articleComment.consultant`
  - `favorite.consultant`
  - `review.consultant`
  - `discountConsultant.consultant`
  - `programConsultant.consultant`
  - `order.consultant` (fine; orders are transactional)
- **Relation filters** on other models, e.g. `where: { consultant: { ... } }`. Add `centerId: null` inside them in discovery code.
- **Raw SQL** (`$queryRaw`, `$executeRaw`) that touches `consultants`.
  - Most main-site discovery reads are raw SQL, and the extension never sees them. Every discovery raw query adds `AND c."centerId" IS NULL` (using the query's alias). This includes `Prisma.sql` fragments.
  - The full list is in `AUDIT.md` §1.3: `getConsultants`, `getPuslishedConsultantsForHome`, `getArticles`, `getRecommendedConsultants`, `getCouponsForHome`, `getDiscountConsultants`, `getFavorites`, `getFavoriteConsultants`, `getFreeSessionConsultants`, the online lists in `data/online.ts`, `getProgram`, `data/reels.ts`, and `getReviewsForHome`.
  - Any new discovery raw query must carry the same filter.
- **Public order-derived lists.** `getPaidPast3Days` (the home "recent bookings" notification) starts at `order`, but its output is public. It filters `centerId: null` like discovery code.
- **Public coupon lists.** `getCouponsForHome` and `getCoupons` exclude center consultants and coupons with `centerId` set.
- **Redis presence/online lists.** They resolve ids through Prisma, so they're covered only if they use the safe client. Verify. On the main site, the lists are raw SQL (`data/online.ts`), so they need the filter above.

### 6.4 Admin dashboard

The admin dashboard uses the unfiltered client. It must show center consultants with a **center badge** and a **center filter**.

**Every picker that attaches consultants to platform features** must exclude center consultants:

- discount consultants
- campaigns
- programs

### 6.5 NestJS realtime server

Audit any consultant reads there. Apply the same rule if any of them are discovery reads.

---

## 7. Money

### 7.1 Split at payment time

Write a pure util, `computeOrderSplit({ paidBeforeVat, platformRate })`, that returns `{ platformShare, centerShare }`.

- `paidBeforeVat` is `Payment.total`. That is already pre-VAT and after any discount or coupon; VAT is stored separately in `Payment.tax`.
- Round to 2 decimals.
- `centerShare = paidBeforeVat - platformShare`, so the two always sum exactly.

**`Payment.commission` keeps its current meaning: the provider's %** (an `Int`).

- Today it is the consultant's %, and `utils/admin/dues.ts` reads it as such (`platformPct = 100 - commission`).
- For center orders, it stores the **center's** %: `100 − Center.platformRate` (for example 80). That's why `platformRate` must be a whole number.
- It is written where it is written today: at order creation, in `reserveConsultant` instead of the consultant's own rate. That makes it the rate snapshot for the order.
- Do **not** add `Payment.platformRate`.

**At PAID**, for center orders:

- call `computeOrderSplit({ paidBeforeVat: Payment.total, platformRate: 100 − Payment.commission })`
- write `Payment.platformShare` and `Payment.centerShare` (both `Float?`) once

The split uses the order's own snapshot, never the center's current `platformRate`.

**There are two places a payment becomes PAID on the main site.** The split runs in both:

1. `updateOrderStatus` → `orderStatusPaid` (`data/order/reserveation.ts`), used by Moyasar, Tabby and the mobile confirm route.
2. `payAllByWallet` (`data/wallet.ts:170`), for wallet-only payments. It sets PAID itself and calls `onPaymentSuccess` without going through `updateOrderStatus`.

For platform orders, `centerShare` stays null, and `platformShare` may stay null or be filled. Report which you chose.

Bank transfer approval happens in the **admin dashboard** and creates orders there. The same util must exist in the dashboard repo with identical logic, and both copies need the same unit tests.

### 7.2 Refunds

Whenever a `Refund` is recorded for a center order, the center's dues view reflects the proportional reduction (§3.4).

- **Preferred:** compute it at read time from `Refund` rows.
- **Not allowed:** mutating the snapshot.

### 7.3 Center dues

- **Earned** = Σ `centerShare` of eligible center orders (§3.8) − proportional refunds.
- **Paid** = Σ `FinanceEntry` with `category: CENTER_PAYOUT` and `centerId`.
- **Balance** = Earned − Paid.

The center dashboard shows:

- the totals
- an order list with each order's share
- a **grouping by consultant**. This is reporting only, so the center can work out what it owes each consultant itself.

The center **cannot** see `platformShare` rates of other centers or any platform data.

**Consultant dues exclude center orders** (§3.9). On the main site that means `getAllDuesOwner` and `getDuesOwnenByMonth` (`data/dues.ts`). The same applies to the admin dashboard's consultant dues and finance reports. Center dues never use `calculateDues`. They read the `centerShare` snapshot.

The coupon double subtraction in today's consultant dues (`AUDIT.md` §6: `calculateDues` subtracts the coupon from a `Payment.total` that already has it applied) is a **separate fix outside Centers**. Don't touch it here.

### 7.4 Payouts

In the admin dashboard, recording a payout creates a `FinanceEntry` with:

- type EXPENSE
- category `CENTER_PAYOUT`
- `centerId`
- proof upload, following the same pattern as existing entries

It must also write a `FinanceLog` entry. Payouts go only to the center's **APPROVED** bank account.

---

## 8. Pricing, coupons, discounts

`resolveConsultantPricing` stays the **single source of truth** for both displayed and charged prices. Add one scoping rule:

> A `Discount` or `Coupon` applies to a consultant only if `discount.centerId === consultant.centerId` (`null` matches `null`).

### Discounts

This rule must hold for:

- `allCategories` and `categories` matching
- `DiscountConsultant` rows
- `durations`
- `overrides`

**Where each part lives:**

- **Admin dashboard:** this is where category discounts are expanded into `DiscountConsultant` rows (`allCategories` / `categories`). The `centerId` rule is applied there, so a platform category discount never creates rows for center consultants, and vice versa.
- **Main site:** matching happens only through `DiscountConsultant` rows (`getActiveDiscountFor` in `data/event.ts`). `allCategories`, `categories` and `overrides` aren't read here. Add a **guard** in `getActiveDiscountFor`: the matched `discount.centerId` must equal the consultant's `centerId` (`null` matches `null`). A stray row then can't apply.

### Coupons

The rule must also hold inside `applyCoupon`. Center coupons use `type: CENTER` plus `centerId`. They can optionally narrow to one of the center's consultants through the existing `consultantId`.

**Existing bug, fixed in the Pricing phase:** today `applyCoupon` (`data/coupon.ts:34`) only checks `consultantId` for `type: CONSULTANT`. So GENERAL, PLATFORM and **CENTER** coupons apply to every consultant. After the fix:

- a `CENTER` coupon applies only when `coupon.centerId === consultant.centerId` (and its `consultantId`, if set, matches)
- non-center coupons (`centerId: null`) never apply to center consultants

### Existing behavior that still applies

- Coupons stay blocked on already-discounted durations.
- `Pay` still accepts only intent data from the client and recomputes everything server-side.

### What the center can create

Centers can create `Discount` and `Coupon` rows for their own center only. `centerId` always comes from the session (§11.1), and any `consultantId` must belong to that center. Verify this server-side.

---

## 9. Booking and onsite

The center booking UI is a **fresh design** (§10). It goes through the **same server pipeline** as the platform: `getConsultantInfoForBooking`, `resolveConsultantPricing`, `getUnavailableWeekdays` and the `getConsultantAvailableTimes`, `applyCoupon` and `Pay` actions. No pricing, coupon or payment logic is duplicated.

- **Online first:** the public-pages phase books ONLINE only. ONSITE is the next phase. The booking panel holds a session `mode`, so ONSITE adds a mode choice and mode-filtered slots without restructuring.
- **Client-only booking:** no gift/beneficiary booking, packages, collaboration links or scales on center pages.

**Timings and availability**

- Every timing is ONLINE or ONSITE. The UI shows a clear badge (أونلاين / حضوري) on each slot.
- Already-booked slots stay hidden, as today.
- The timing editor and the availability query must add `type` (§5). Neither handles it today.

**After payment**

- The confirmation is visible only after payment succeeds, as today.
- For ONSITE meetings, the confirmation, WhatsApp/push notifications and reminders show:
  - the center name
  - the written address
  - a Google Maps link built from `lat`/`lng`
  - the center's arrival/cancellation `policy`

**Rooms. There is no 100ms.** Rooms today are:

- **Web: Google Meet, created at PAID.**
  - `onPaymentSuccess` (`handlers/admin/order/payment.ts`) calls `createNewMeeting` (`data/rooms.ts`) for the first meeting.
  - `selectSession` (`data/sessions.ts`) calls it for later package sessions.
  - Each call creates a Google Meet link, a `Room` row, **and the two `Participant` rows** (USER and OWNER tokens).
- **Mobile: LiveKit, created on join** (`app/api/mobile/room/route.ts`, `app/api/mobile/room/[mid]/route.ts`).

**ONSITE meetings get no room, but still get participants.**

- Skip the Google Meet link and `Room` creation when `mode` is ONSITE, but **still create the participants**. Every `/meetings/[mid]?participant=…` link, the success page, the WhatsApp reply and the Telegram message depend on them.
- Refuse LiveKit join and ring for ONSITE meetings.
- Handle ONSITE in each place that assumes a link exists (`AUDIT.md` §3):
  - the join button (`components/clients/meetings/index.tsx`)
  - the order card (`meetingUrl()`)
  - the payment success and paid pages
  - the package session picker
  - the WhatsApp `meeting-url` reply (`lib/api/whatsapp/logic.ts`, `getMeetingUrl`)
  - the Telegram templates
  - the ring cron (`app/api/cron/mobile/room/call`)
  - the mobile room routes
  - the reschedule cron wording

**WhatsApp templates for ONSITE.** These are new Meta templates. Ziad names them and submits them to Meta:

- **`order_onsite_client`** goes to the client. It has **no** `meeting-url` button.
  - Body variables:
    1. client name
    2. order number
    3. consultant
    4. center name
    5. address
    6. total
    7. duration
    8. session date/time
    9. arrival policy
  - A dynamic URL button: `https://www.google.com/maps?q={{1}}`, where `{{1}}` is `"lat,lng"`.
- **`order_new_center`** goes to the center's `whatsapp` number. It's sent for **every** center order, online and onsite.
  - Body variables:
    1. center name
    2. client name
    3. consultant
    4. order number
    5. session type (حضورية / عن بُعد)
    6. duration
    7. session date/time

**Template variable rules:**

- A variable can never be empty. A center with no policy sends "لا توجد تعليمات إضافية".
- A variable can never contain a line break. Newlines in the address or policy are replaced with "، ".

The existing templates with the `meeting-url` button (`lib/notifications/site.ts`) stay for ONLINE meetings. Center consultants keep receiving `order_new_owner` for ONLINE sessions, since it carries the `meeting-url` button. What they receive for ONSITE sessions is decided in the ONSITE phase.

**Reminders.** The only pre-session reminder is the mobile push 5 minutes before (`lib/notifications/mobile/notify/reservation.ts`, sent by `cron/mobile/notifications/dispatch`). There is no web or WhatsApp pre-session reminder. For ONSITE meetings, extend that push with the center address.

**Rescheduling** keeps the meeting's mode. An ONSITE reschedule must also respect work hours and closures.

---

## 10. Public pages (main site)

**Design:** every center page is a **fresh design** (`components/clients/centers/*`). They don't reuse the platform consultant card, profile or reserve UI. Booking still uses the platform's server pipeline (§9).

**Navigation:** add a **المراكز** entry to the main navigation and menu. It sits behind `CENTERS_ENABLED` (`constants/centers.ts`) and is turned on at launch. The same flag adds the published centers and their consultant pages to the sitemap.

**`/centers`**

- Lists centers with `status: PUBLISHED`, sorted by `sort_key`.
- Filter by city (nuqs).
- Each card shows logo, name, city/district, a short description, and the number of published consultants.

**`/centers/[slug]`**

- Header with cover, logo and name, styled with the center's theme (§13).
- About section.
- Location: written address plus a map link (and an embedded map if one is already used elsewhere on the site).
- Work hours and amenities.
- Gender preference badge.
- Grid of the center's published and approved consultants (its own card design), with links to `/centers/[slug]/consultants/[cid]`.

**`/centers/[slug]/consultants/[cid]`**

- A new profile layout (rating and review count only; the review list comes later) and a new booking panel, with the center's theme.
- Must 404 if the consultant does not belong to that center, or is not published and approved.

**Every link or share URL** that points at a center consultant uses the center route, never the platform `/consultants/[cid]` route.

**Unpublished centers:** if `status` is not PUBLISHED, return 404 for the center page and everything under it. The exception is a logged-in ADMIN, who sees a preview (with a "hidden" bar and `noindex`) before launch.

**Rendering:** pages are statically rendered and cached as described in §15. Slot availability stays dynamic, as today.

---

## 11. Center dashboard (main site)

### 11.1 Access

Write `requireCenter()` in the server-only data layer. It:

- reads the session user (`userServer()` from `lib/auth/server.ts`; the role helper there is `roleServer()`)
- checks `role === CENTER`
- loads the `CenterMember`
- returns `{ userId, centerId /* ceid */, memberRole }`

It **throws** if any of these is missing. It also asserts that `centerId` is a finite number before returning, so an undefined value can never reach a Prisma filter.

Every center data function and action calls `requireCenter()` and uses **only** its `centerId`. Never take `centerId`, `ceid` or a slug from client input for scoping.

**Any id a center sends** must be verified to belong to its center before it is read or written. This includes a consultant `cid`, an order `oid`, a coupon id and a discount id.

**Folder conventions:**

- `data/center/*` (server-only Prisma)
- `actions/center/*` (client-called)
- `utils/*` (pure helpers)

### 11.2 Pages

Use one route group (for example `app/(center)/center/...`), with a layout that applies the center's theme.

**Overview**

- Today's and upcoming bookings.
- This month's earned amount and current balance.
- Pending approvals: its own consultants and its bank account.

**Orders**

- Paginated and searchable (nuqs), filterable by consultant, mode, date and payment state.
- Order detail is read-only, showing the client name and phone the same way the owner dashboard shows them.

**Consultants**

- List, create and edit.
- New consultants are `PENDING` / `HIDDEN` until an admin approves them.
- For edits after approval, reuse the existing behavior for OWNER consultant edits exactly. That includes `pendingImage` for image changes.
- The center can hide or unhide an approved consultant through `status`, but **cannot** set `approved`.

**Consultant timings**

- Weekly slots per consultant, each ONLINE or ONSITE.
- ONSITE slots are validated against work hours (§3.7).

**Profile**

- Every editable `Center` field except `slug`, `status`, `platformRate`, `sort_key`, the legal numbers and `ceid`. Those are admin-only.

**Theme**

- Pick a preset plus overrides, with a live preview (§13).

**Work hours and closures**

- Weekly hours, with split shifts allowed.
- Closure dates with a reason.

**Coupons and discounts**

- Create, edit and pause, scoped to the center (§8).

**Dues**

- As described in §7.3.

**Bank account**

- View the approved account.
- Submit a new IBAN: SA IBAN only, validated with a checksum. It becomes a `PENDING` request.

**Bilingual UI:** use the existing bilingual dictionary system if it applies on the main site. Otherwise Arabic only, RTL.

---

## 12. Admin dashboard

**Centers list and detail**

- Create and edit all `Center` fields, including slug (validated, reserved list), status, `platformRate` and `sort_key`.

**Create center account**

- Creates a `User` with role `CENTER` (phone plus initial password, using the **same credential mechanism** existing web logins use) and a `CenterMember` with role OWNER.
- Check how OWNER accounts are created today and mirror it.

**Approvals**

- Center consultants: extend the existing consultant approval UI with a center filter and badge. Approving sets `approved: APPROVED` and lets the center publish.
- Center bank accounts: on approve, the new row becomes APPROVED and the previous APPROVED row becomes REJECTED (superseded). Record reviewer snapshots.

**Center dues and payouts**

- Per-center balance (same math as §7.3).
- Record a payout (§7.4).

**Pickers**

- Exclude center consultants from platform feature pickers (§6.4).

**Cache**

- Admin edits to a center must invalidate the main site's center pages. Use the same approach already used for campaigns.

---

## 13. Theme

- The page stays **neutral** (the site's `background` / `muted` / `foreground` tokens). Color is used sparingly; there are never full-page color floods.
- `themeKey` is one of eight curated multi-color themes in `constants/theme/center.ts`. Each has an Arabic display name.

  | key | name | primary | secondary on secondarySoft | accent |
  |---|---|---|---|---|
  | `night` | ليلي | `#0f172a` | `#475569` on `#f1f5f9` | `#eff6ff` |
  | `emerald` | زمردي | `#047857` | `#57534e` on `#f5f5f4` | `#ecfdf5` |
  | `ocean` | محيطي | `#0369a1` | `#0f766e` on `#f0fdfa` | `#f0f9ff` |
  | `royal` | ملكي | `#4338ca` | `#a16207` on `#fefce8` | `#eef2ff` |
  | `lavender` | بنفسجي | `#6d28d9` | `#be185d` on `#fdf2f8` | `#f5f3ff` |
  | `rose` | وردي | `#be123c` | `#57534e` on `#f5f5f4` | `#fff1f2` |
  | `desert` | صحراوي | `#b45309` | `#0f766e` on `#f0fdfa` | `#fffbeb` |
  | `olive` | زيتوني | `#3f6212` | `#92400e` on `#fffbeb` | `#f7fee7` |

  - The text on primary is white for every theme.
  - Legacy keys map as follows: `midnight` (the column default) and `slate` → `night`; `indigo` → `royal`; `violet` → `lavender`; `sky` and `teal` → `ocean`; `amber` → `desert`.
  - Unknown keys fall back to `night`.
  - The event presets (`constants/theme/event.ts`) are separate and unchanged.
- Each theme has five colors:
  - `primary`: CTA buttons, active states
  - `primaryForeground`: text on primary, AA ≥ 4.5:1
  - `secondary`: icons and text of chips, badges and icon squares; a different but harmonious hue, or a neutral; AA ≥ 4.5:1 on `secondarySoft` and on white
  - `secondarySoft`: background of those chips and icon squares
  - `accent`: a faint wash (compact hero, today's row, hover)
- `themeVars` are overrides of exactly those five keys, validated by a strict zod schema with that **fixed set of keys**.
- **Values must be hex colors only.** Never accept raw CSS strings. `utils/center-theme.ts` also drops anything else at render time.
- **Contrast check server-side** when saving overrides: `primary` vs `primaryForeground`, and `secondary` vs `secondarySoft` and vs white, must meet WCAG AA (4.5:1). Reject with a clear Arabic message otherwise.
- **Apply** in the center layouts (public and dashboard) as CSS custom properties on a wrapper element: `--center-primary`, `--center-primary-foreground`, `--center-secondary`, `--center-secondary-soft`, `--center-accent`. Only center pages change.
- The site has no dark mode, so the palettes are light-only.
- **Logo and cover** go through the existing image upload flow.

---

## 14. Subdomain redirect (main site)

**Manual step for Ziad, not code:** add the `*.shwerni.sa` wildcard domain to the main site's Vercel project. Before going live, confirm that existing subdomains on other Vercel projects (for example the dashboard) still resolve to their own projects.

**In the existing `proxy.ts`** (Next 16; there is no `middleware.ts`):

1. If the host matches `^([a-z0-9-]+)\.shwerni\.sa$`, and the subdomain is not `www` and not reserved, issue a **301** to `https://shwerni.sa/centers/{subdomain}`.
2. No database lookup in the proxy. An unknown slug simply 404s on the center page.
3. Do not change cookie domains, auth, or payment callback URLs.

---

## 15. Caching

Center public data uses the repo's existing caching approach, with these tags:

| Tag | Covers |
|---|---|
| `centers` | The listing |
| `center:{ceid}` | Profile, hours and theme |
| `center-consultants:{ceid}` | The consultant grid |

- Center dashboard saves revalidate their tags directly (same deployment).
- Admin dashboard edits use the campaign approach (§12).
- Slot availability and pricing are never cached beyond what exists today.

**Indexes** come from `centers.prisma`. The `Consultant(centerId, status, statusA, approved, sort_key)` index serves both the center grid and the platform listing (`centerId IS NULL`).

---

## 16. Security rules (non-negotiable)

1. `centerId` comes from `requireCenter()` only.
2. Validate session-derived ids before any query. Prisma drops `undefined` filters, which would leak every row.
3. Prices, discounts, coupons and splits are always computed server-side.
4. No sign-up or registration path can create a `CENTER` user or a `CenterMember`.
5. Bank account changes require admin approval.
6. Theme input is validated values only.
7. A center can never read another center's data or any platform consultant's data.

---

## 17. Conventions

- Follow `CLAUDE.md` if it exists. Then match the surrounding code exactly: names, props, exports, file layout.
- **Complete, production-ready code only.** No TODOs, placeholders, stub functions or missing exports.
- Kebab-case filenames, named exports, grouped imports, and `cn()` for conditional classes.
- `data/` is `import "server-only"`. Client-called code goes in `actions/`. Never add `"use server"` to `data/`.
- Change shared helpers minimally. If a change to a shared helper is larger than a scoped addition, describe it and ask first.
- Skeleton-per-section loading, RTL-safe spacing, Arabic copy.
- Remove debug `console.log`s.
- `Pay` and webhook failures keep the existing `{ state, step, message }` shape.

---

## 18. Acceptance checklist

Use a seeded test center containing one consultant with ONLINE and ONSITE timings.

**Leak checks**

- [ ] The center consultant is absent from: home, category pages, search, favorites lists, sitemap, every `app/api/mobile/*` listing, admin platform pickers, and online/instant lists.
- [ ] The platform route `/consultants/[cid]` for a center consultant shows the same not-found result as a deleted consultant, with no consultant data in the HTML.
- [ ] A platform discount on the consultant's category does not change the center consultant's price.
- [ ] A platform coupon is rejected on the center consultant. A center coupon is rejected on platform consultants and on another center's consultants.

**Booking checks**

- [ ] An ONSITE booking:
  - no Google Meet link or `Room` is created, but both participants exist
  - the confirmation shows the address and map link
  - `order_onsite_client` and `order_new_center` are sent
  - the mobile push reminder contains the address
  - LiveKit join and ring are refused
- [ ] An ONLINE booking at a center behaves exactly like a platform booking.
- [ ] An ONSITE slot outside work hours is rejected on save. ONSITE booking on a closure date is rejected.

**Money checks**

- [ ] On PAID, the `Payment` row of a center order has:
  - `commission = 100 − platformRate`
  - `platformShare + centerShare = Payment.total`

  This holds for both PAID paths: gateway and wallet-only.
- [ ] Center orders don't appear in any consultant dues view or report.
- [ ] A partial refund reduces the center's dues proportionally.
- [ ] A payout reduces the balance and writes a `FinanceLog`.

**Access checks**

- [ ] Center A cannot access center B's orders, consultants, coupons or dues by changing ids in requests.
- [ ] The center cannot set `approved`, `platformRate`, `slug` or `status` on its own center.

**Routing checks**

- [ ] `slug.shwerni.sa` returns a 301 to `/centers/slug`. Reserved subdomains are unaffected.

**Build checks**

- [ ] Typecheck and build pass in every touched repo.

---

## 19. Audit decisions (2026-10-04)

Ziad's answers to the questions in `docs/centers/AUDIT.md`. They override anything above that disagrees.

| # | Topic | Decision | Where it applies |
|---|---|---|---|
| 1 | `Payment.commission` | Keeps its meaning, the provider's %. Center orders store `100 − Center.platformRate` (e.g. 80), so `platformRate` is a whole number. `platformShare` and `centerShare` (`Float?`) are written at PAID. No `Payment.platformRate`. Consultant dues, here and in the admin dashboard, exclude orders with `centerId` set. | §2, §3.9, §7.1, §7.3 |
| 2 | `Center` table | The stub exists in the schema. The database has no rows, or no table yet. Phase 1 alters or creates it, additive only. | §5 |
| 3 | Schema ownership | This repo owns the schema. It is applied with `prisma db push` (by Ziad). No migrations. | §5 |
| 4 | Sign-up role escalation | Fixed in `cca7dd0`. The abuse check came back clean. | §16.4 |
| 5 | Free sessions, instant, programs, WhatsApp bot | Excluded for center consultants in v1. These paths stay on the safe client and fail closed. | §4, §6.2 |
| 6 | Category discounts | The `centerId` rule is applied in the admin dashboard, where category discounts become `DiscountConsultant` rows. A guard is added in `getActiveDiscountFor` here. | §8 |
| 7 | ONSITE timings | One type per slot; keep the current unique key. All existing timings are ONLINE. | §5, §9 |
| 8 | WhatsApp templates | New `order_onsite_client` (client) and `order_new_center` (center's WhatsApp). Ziad submits them to Meta. | §9 |
| 9 | Reminders | Only the mobile push exists. Extend it with the address for ONSITE. | §9 |
| 10 | Dues coupon double subtraction | A separate fix outside Centers. | §7.3 |

**Corrections from the audit:**

- There is no 100ms. Rooms are Google Meet on the web (created at PAID) and LiveKit on mobile (created on join). ONSITE skips the room but still creates participants (§9).
- There are two PAID paths (`updateOrderStatus` and `data/wallet.ts:170`), and the split runs in both (§7.1).
- ONSITE is not implemented yet. The timing editor and the availability query must add `type` (§5).
- CENTER-type coupons currently apply to all consultants. That bug is fixed in the Pricing phase (§8).
- `getConsultantInfo` and `getConsultant` must be split. `getConsultantCost` and `reserveConsultant` use `prismaAll` (§6.2).
- Discovery raw SQL needs `"centerId" IS NULL` (§6.3).
- The session helpers are `userServer()` and `roleServer()`. There is no `userRole()` (§11.1).
- The proxy file is `proxy.ts`. There is no `middleware.ts` (§14).
