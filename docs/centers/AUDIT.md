# Centers: read-only audit of the main site

Date: 2026-10-04. Repo: `shwerni.sa` (main site), branch `main` at `132839c`.
Scope: `docs/centers/CENTERS_SPEC.md` items 1–10. No code was changed in this phase.
Ziad's answers to the questions at the end are in `CENTERS_SPEC.md` §19. Where they differ from this audit (notably §9: this repo owns the schema, applied with `prisma db push`), §19 wins.

Legend used below:

- **DISC**: discovery read (spec §6.2). It must not return center consultants.
- **TRANS**: transactional read. It must see both kinds of consultant, so it moves to `prismaAll`.
- **SELF**: an owner reading their own consultant row by session `userId` (or phone). Center consultants have no `userId` in v1, so the safe and unfiltered clients return the same thing. These count as TRANS, and nothing breaks if they stay on the safe client.
- **WRITE**: `create`/`update`/`$executeRaw`. The spec's extension only filters reads, so these are listed for completeness.
- **covered**: the read starts at `consultant`, so the extension filters it automatically.
- **by hand**: a nested include/select, relation filter or raw SQL that the extension does **not** cover (§6.3).
- ⚠️: a flag; see the notes under the table.

---

## 1. Every Prisma query that reads Consultant

**Method.** A TypeScript-AST scan of `app, components, data, handlers, lib, actions, hooks, utils` found every call on a Prisma client. It matched calls where the model is `consultant`, or where the args contain a `consultant` / `consultants` / `Consultant` / `ProgramConsultant` / `DiscountConsultant` key at any depth (include, select or where). It also matched every `$queryRaw` / `$executeRaw` / `*Unsafe` call and `Prisma.sql` fragment whose text mentions `consultants`. A plain grep cross-check found nothing extra except commented-out code in `data/online.ts:302,311,325`.

**Totals.** 111 hits in 45 files:

- 27 direct reads
- 8 direct writes
- 51 nested
- 20 raw
- 5 raw fragments

No code reaches Consultant through `article`/`question`/... relations named anything other than `consultant`. `User.Consultant`, `Program.ProgramConsultant` and `Discount.DiscountConsultant` have no query sites. `select.DiscountConsultant` exists, but only *from* consultant.

### 1.1 Direct `consultant.*` (extension applies automatically)

| # | file:line | function | op | class | note |
|---|---|---|---|---|---|
| 1 | `app/(pages)/(site)/(sub-pages)/reels/actions.ts:103` | getConsultantsAvailableAt | findMany | DISC, covered | ⚠️ A |
| 2 | `app/api/pusher/auth/route.ts:20` | POST | findUnique by userId | SELF | presence channel auth |
| 3 | `data/admin/tools/oath.ts:9` | getAuthStateById | findUnique | SELF | |
| 4 | `data/admin/tools/oath.ts:31` | confirmOathAcceptance | findUnique | SELF | |
| 5 | `data/article.ts:304` | addArticleComment | findUnique by userId | SELF | |
| 6 | `data/bot.ts:23` | BotGetConsultant | findUnique by userId | SELF | AI bot |
| 7 | `data/bot.ts:42` | BotGetConsultantData | findUnique by userId | SELF | AI bot |
| 8 | `data/consultant.ts:292` | getConsultantInfo | findFirst (+ select.DiscountConsultant) | **DUAL** | ⚠️ B |
| 9 | `data/consultant.ts:322` | getConsultantStates | findFirst | DISC | ⚠️ C (free-sessions consultant page gate) |
| 10 | `data/consultant.ts:525` | getConsultantCost | findUnique | **TRANS** | ⚠️ D (pricing source) |
| 11 | `data/consultant.ts:600` | getOwnerByCid | findFirst (+ include.DiscountConsultant) | TRANS | reschedule + sessions pages |
| 12 | `data/consultant.ts:618` | getOwnerbyAuthor | findUnique by userId | SELF | |
| 13 | `data/consultant.ts:632` | getOwnerCidByAuthor | findFirst | SELF | |
| 14 | `data/consultant.ts:648` | getOwnerForDues | findFirst | SELF | |
| 15 | `data/freesession.ts:129` | reserveFreeSession | findUnique by cid | TRANS | ⚠️ C |
| 16 | `data/online.ts:119` | handlePresenceWebhook | findUnique by userId | SELF | |
| 17 | `data/online.ts:158` | broadcastConsultantBusy | findUnique by userId | SELF | |
| 18 | `data/online.ts:212` | reserveInstant | findFirst by cid | TRANS | ⚠️ C |
| 19 | `data/order/reserveation.ts:76` | reserveConsultant | findFirst by cid | **TRANS** | ⚠️ D (booking) |
| 20 | `data/order/reserveation.ts:453` | getAllOwnersOrdersByAuthor | findFirst | SELF | |
| 21 | `data/order/reserveation.ts:483` | getAllPaidOwnersOrdersByAuthor | findFirst | SELF | |
| 22 | `data/order/reserveation.ts:580` | getAllOwnersOrdersByAuthorAndMonth | findFirst | SELF | |
| 23 | `data/order/reserveation.ts:620` | getPaidOwnersOrdersByAuthorAndMonth | findFirst | SELF | |
| 24 | `data/order/reserveation.ts:681` | getPaidOwnersOrdersByAuthorAndRange | findFirst | SELF | |
| 25 | `data/seo.ts:32` | siteMapDynamic | findMany | DISC, covered | sitemap |
| 26 | `data/specialties.ts:10` | getConsultantSpecialties | findUnique | SELF | owner dashboard |
| 27 | `handlers/conusltant/owner/bank-account.ts:30` | saveBankAccount | findUnique | SELF | |

Writes (the extension doesn't touch them):

- `data/online.ts:111` handlePresenceWebhook, `:341` setConsultantOnline and `:350` setConsultantOffline (update by userId)
- `data/packages.ts:25` updateConsultantBaseCosts (update)
- `handlers/auth/verify.ts:100` verifyToken (update by userId)
- `handlers/conusltant/owner/profile.ts:78` newOwner (create in tx), `:141` sdata (update in tx), `:207` ownerVisibility (update)

### 1.2 Nested include/select/where from other models (by hand)

| # | file:line | function | path | class | note |
|---|---|---|---|---|---|
| 28 | `app/(pages)/(consultants)/dashboard/chats/[mid]/page.tsx:21` | MeetingChatPage | meeting.include.orders.include.consultant | TRANS | |
| 29 | `app/(pages)/(site)/(sub-pages)/reels/actions.ts:53` | getAvailableTimesForDate | consultantTiming.where.consultant | DISC, by hand | ⚠️ A |
| 30 | `app/api/mobile/reservations/[oid]/confirm/route.ts:49` | POST | order.include.consultant | TRANS | |
| 31 | `app/api/mobile/reservations/[oid]/gatewaies/tabby-payload/route.ts:21` | POST | order.include.consultant | TRANS | |
| 32 | `app/api/mobile/reservations/[oid]/result/route.ts:36` | GET | order.include.consultant | TRANS | |
| 33–40 | `app/api/mobile/room/guard/[mid]:26`, `ring/[mid]:28`, `route.ts:33`, `[mid]/end:23`, `[mid]/guard:26`, `[mid]/ring:28`, `[mid]/route.ts:30` (GET), `:103` (POST) | GET/POST | meeting.select.orders.select.consultant | TRANS | rooms |
| 41 | `data/article.ts:198` | getArticleByAid | article.include.consultant | DISC, by hand | low risk: center consultants can't log in to write |
| 42 | `data/article.ts:333` | getArticleComments | articleComment.include.consultant | DISC, by hand | same |
| 43 | `data/bot.ts:64` | BotConsultantOrder | order.where.consultant.phone | SELF (by phone) | ⚠️ E |
| 44 | `data/bot.ts:108` | BotClientOrder | order.select.consultant | TRANS | client's own order |
| 45 | `data/chats.ts:39` | createMeetingMessage | meeting.select.orders.select.consultant | TRANS | |
| 46 | `data/chats.ts:153` | getChatMeeting | meeting.include.orders.include.consultant | TRANS | |
| 47 | `data/chats.ts:186` | getMeetingData | same | TRANS | |
| 48 | `data/chats.ts:285` | getChatList | where.orders.consultant + include | TRANS/SELF | owner's own chats |
| 49 | `data/chats.ts:388` | getMeetingAccess | meeting.select.orders.select.consultant | TRANS | |
| 50 | `data/consultant.ts:662` | getBankAccountByAuthor | bankAccount.where.consultant | SELF | |
| 51 | `data/coupon.ts:263` | getCoupons | coupon.include.consultant | DISC, by hand | `/coupons` list; ⚠️ F |
| 52 | `data/dues.ts:15` | getAllDuesOwner | order.include.consultant | SELF | |
| 53 | `data/dues.ts:62` | getDuesOwnenByMonth | order.include.consultant | SELF | |
| 54 | `data/freesession.ts:54` | getFreeSessionByFid | freeSession.include.consultant | TRANS | |
| 55 | `data/gatewaies/tabby.ts:32` | getTabbyOrderHistory | order.select.consultant | TRANS | |
| 56 | `data/meetings.ts:48` | getMeeting | meeting.include.orders.include.consultant | TRANS | |
| 57 | `data/meetings.ts:206` | getMeetings | same | TRANS | |
| 58 | `data/online.ts:229` | reserveInstant | order.create include.consultant | TRANS | |
| 59 | `data/order/program.ts:46` | reserveProgram | order.create include.consultant | TRANS | |
| 60 | `data/order/reserveation.ts:113` | reserveConsultant | order.create include.consultant | TRANS | |
| 61 | `data/order/reserveation.ts:293` | getReservationByOid | order.include.consultant | TRANS | |
| 62 | `data/order/reserveation.ts:328` | getReservationByPid | same | TRANS | |
| 63 | `data/order/reserveation.ts:421` | getAllOrdersByAuthor | same | TRANS | client's orders |
| 64 | `data/order/reserveation.ts:492` | getAllPaidOwnersOrdersByAuthor | same | SELF | |
| 65 | `data/order/reserveation.ts:545` | getAllOrdersByAuthorAndMonth | same | TRANS | |
| 66 | `data/order/reserveation.ts:636` | getPaidOwnersOrdersByAuthorAndMonth | same | SELF | |
| 67 | `data/order/reserveation.ts:854` | orderStatusPaid | same | TRANS | paid pipeline |
| 68 | `data/order/reserveation.ts:974` | orderStatusRefund | same | TRANS | |
| 69 | `data/order/reserveation.ts:1164` | getPaidPast3Days | order.select.consultant | ⚠️ G | home "recent bookings" ticker |
| 70 | `data/programs.ts:242` | checkProgramNextSession | order.include.consultant | TRANS | |
| 71 | `data/question.ts:23` | getQuestionByQid | question.include.consultant | DISC, by hand | low risk (needs login to answer) |
| 72 | `data/reels.ts:44` | getAvailableTimesForDate | consultantTiming.where.consultant | DISC, by hand | add `centerId: null` |
| 73 | `data/reschedule.ts:64` | rescheduleMeeting | meeting.include.orders.include.consultant | TRANS | |
| 74 | `data/reschedule.ts:110` | checkReschedule | meeting.update include… | TRANS | |
| 75 | `data/scales.ts:255` | submitScaleResult | order.select.consultant | TRANS | |
| 76 | `data/sessions.ts:24` | selectSession | order.include.consultant | TRANS | |
| 77 | `data/user.ts:118` | getUserOrders | order.include.consultant | TRANS | |
| 78 | `data/wallet.ts:163` | payAllByWallet | order.update include.consultant | TRANS | |

### 1.3 Raw SQL touching `consultants` (by hand)

None of these is covered by the extension. Every DISC row needs `AND c."centerId" IS NULL` (or the equivalent).

| # | file:line | function | class | note |
|---|---|---|---|---|
| 79 | `data/article.ts:101` | getArticles | DISC | joins the author consultant |
| 80 | `data/article.ts:165` | getRecommendedConsultants | DISC | article sidebar |
| 81 | `data/consultant.ts:140`, `:165` (fragments) | getConsultants | DISC | the main listing, categories and search |
| 82 | `data/consultant.ts:241` | getConsultant | **DUAL** | ⚠️ B |
| 83 | `data/consultant.ts:548` | getPuslishedConsultantsForHome | DISC | home |
| 84 | `data/coupon.ts:209` | getCouponsForHome | DISC | ⚠️ F |
| 85 | `data/discounts.ts:124`, `:145` | getDiscountConsultants | DISC | event page; joins `discount_consultants` |
| 86 | `data/favorites.ts:9` | getFavorites | DISC | `/favorite` |
| 87 | `data/favorites.ts:73` | getFavoriteConsultants | DISC | mobile favorites |
| 88 | `data/freesession.ts:262` + fragment `:263`, `:287` + fragment `:288` | getFreeSessionConsultants | DISC | |
| 89 | `data/online.ts:54` (`$queryRawUnsafe`) | checkIsAnyConsultantOnline | DISC | ⚠️ H |
| 90 | `data/online.ts:66` (`$queryRawUnsafe`) | getOnlineConsultantsList | DISC | ⚠️ H |
| 91 | `data/online.ts:80` (`$queryRawUnsafe`) | getAvailableCount | DISC | ⚠️ H |
| 92 | `data/online.ts:365` | getConsultantsOnline | DISC | `app/api/online`, `app/api/mobile/online` |
| 93 | `data/programs.ts:167` (+ fragment) | getProgram | DISC | program's consultants |
| 94 | `data/reels.ts:73` | getConsultantsAvailableAt | DISC | reels / discover |
| 95 | `data/review.ts:25` | getReviewsForHome | DISC | home reviews |
| 96 | `data/shuffle.ts:6` (`$executeRaw`) | reshuffleConsultants | WRITE | rewrites `sort_key` for every consultant; harmless, but it reshuffles center grids too |
| — | `data/instant.ts:26` (`$executeRaw`) | recordInstantSnapshot | n/a | false positive: writes the `instants` table; "consultants" only appears in column names |

These don't contain the word `consultants`, so the scan skipped them, but they belong here:

- `data/consultant.ts:431` getConsultantAvailableTimes
- `data/consultant.ts:504` getUnavailableWeekdays

Both are raw SQL on `consultant_timings`, used in booking. They're TRANS; no centre filter.

### 1.4 Flags

- **A.** `app/(pages)/(site)/(sub-pages)/reels/actions.ts` is a `server-only` data file inside `app/`. Only its *type* (`ReelConsultant`) is imported, by `reels/page.tsx`; the runtime code lives in `data/reels.ts`. Its functions look dead. If they're kept, they need the same fix as `data/reels.ts`.
- **B. Dual-use helpers.**
  - `getConsultantInfo` serves the platform profile `/consultants/[cid]` (DISC, cached `"use cache"` + `cacheLife("hours")`). It also serves booking: `components/clients/consultants/reservation/reserve.tsx`, `components/clients/freesessions/reservation/reserve.tsx` and `app/api/mobile/consultants/[cid]/reservation-info`.
  - `getConsultant` (raw) serves the profile component, `marriage-awareness`, `questions/[qid]` and `app/api/mobile/consultants/consultant`.
  - Each needs either a client parameter or a split into a discovery version and a transactional version. If `getConsultantInfo` stays on the safe client, the reserve page for a center consultant renders as "not found".
- **C. Free sessions and instant.**
  - Center consultants are excluded from both listings (discovery).
  - Their booking paths (`reserveFreeSession`, `reserveInstant`, and `getConsultantStates` on `freesessions/(layout)/consultants/[cid]`) are TRANS per spec.
  - Whether center consultants may take free or instant sessions at all is not in the spec (see the questions).
- **D. Must move to `prismaAll`, or center booking fails loudly.**
  - `getConsultantCost` feeds `resolveConsultantPricing`, which feeds `Pay`. On the safe client it returns null, and `Pay` answers `step: "pricing"`.
  - `reserveConsultant`'s `findFirst` returns null, so no order is created.
- **E.** `BotConsultantOrder` finds orders by the consultant's phone, for the WhatsApp/AI bot. If a center enters a phone number on its consultant, that person can read that consultant's orders over WhatsApp. That's a login-less consultant access path, which the spec rules out for v1.
- **F.** `getCouponsForHome` and `getCoupons` list public coupons with their consultant. They must exclude center consultants **and** coupons with `centerId` set, or `type = CENTER`.
- **G.** `getPaidPast3Days` drives the home "someone just booked X" notification (`components/clients/home/notification/notification.tsx`) and `actions/order.ts`. It's an order query, but its output is public and shows consultant names. Treat it as DISC: filter `order.centerId: null` once that column exists.
- **H.** The online/instant lists are raw SQL against `consultants` joined to Redis presence. Presence comes from Pusher and the `presence-consultants` channel. Only logged-in owners join it, and center consultants can't log in, so in practice they never appear. Still add the filter, because the spec asks for safety by default.

---

## 2. The exported Prisma client

- **File:** `lib/database/db.ts`. It's the only `new PrismaClient` in the repo (Prisma 7 with `@prisma/adapter-pg`, generated client in `lib/generated/prisma`).
- **Name:** default export `prisma`, imported as `import prisma from "@/lib/database/db"`.
- **Import sites:** 97 files and 101 import statements.

| Folder | Files |
|---|---|
| `app/` | 37 (35 under `app/api`) |
| `data/` | 44 |
| `handlers/` | 6 |
| `lib/` | 10 |

- **Transactions:** 13 `$transaction` calls, 10 of them interactive (`$transaction(async (tx) => …)`).
  - The spec says to check these on the extended client: `tx` inherits `$extends` query extensions, so filters also apply inside them.
  - `handlers/conusltant/owner/profile.ts` creates and updates consultants inside one.

---

## 3. ONSITE today, end to end

**Short version: ONSITE exists in the schema but is unused end to end. Nothing records the mode.**

| Step | Today |
|---|---|
| Schema | `enum TimingType { ONLINE ONSITE }`. `ConsultantTiming.type TimingType @default(ONLINE)`, `@@unique([consultantId, day, time])`, so a slot at a given time is one type only. |
| Saving timings | `data/timings.ts` `updateTimings(userId, consultantId, day, times, type: TimingType = "ONLINE")` deletes and recreates that day's slots **of that type**. The web owner dashboard handler `handlers/conusltant/owner/timings.ts:15` calls it **without** `type`, so every slot saved from the web is ONLINE. `actions/consultant.ts:113` forwards a type if given. |
| Reading timings | `getTimings` ignores `type`. Availability (`data/consultant.ts:431` `getConsultantAvailableTimes`, raw SQL on `consultant_timings`) returns times only, never the type. It excludes slots taken by NEW/PROCESSING/PAID meetings and free sessions. `getUnavailableWeekdays` (`:504`) also ignores type. |
| Choosing mode | Nowhere. The booking form, `ReservationFormType`, `Pay` and `reserveConsultant` carry no mode. |
| Stored | **Not stored.** No mode on `Order`, `Meeting` or `Room`. Per spec §5, there is no existing field to reuse, so `Meeting.mode` is genuinely new. |

### Rooms: there is no 100ms in this repo

- **Web: Google Meet.**
  - `data/rooms.ts` `createNewMeeting(meeting)` → `createGoogleMeeting()` (`lib/api/google.ts:26`) → `prisma.room.create({ url })`.
  - It **also creates the two `Participant` rows (USER and OWNER tokens) inside `createRoom`**.
- **Who calls it:**
  - `onPaymentSuccess` (`handlers/admin/order/payment.ts:54`), for `order.meeting[0]` only, at PAID.
  - `data/sessions.ts:58` `selectSession`, when a package client picks a later session.
- **Other Google Meet links:** `data/freesession.ts:161` (free sessions) and `lib/api/whatsapp/special-replies.ts:24` (an ad-hoc admin WhatsApp command).
- **Mobile: LiveKit.**
  - Rooms are created on demand at join time (`prisma.room.upsert` plus `AccessToken`) in `app/api/mobile/room/route.ts:69` and `app/api/mobile/room/[mid]/route.ts:136`.
  - The guard, ring and end routes are under `app/api/mobile/room/*`, and attendance runs through `app/api/livekit/webhook`.

⚠️ **Participants are created by the room code.** If ONSITE simply skips `createNewMeeting`, there are no `Participant` rows. Then every `/meetings/[mid]?participant=…` link built from participants gets `participant=undefined`: the success page, the WhatsApp `meeting-url` reply, and the Telegram templates. So the ONSITE skip must still create the participants and skip only the Google Meet/room part.

### Places that assume a meeting link or room exists

| Where | What it assumes |
|---|---|
| `handlers/admin/order/payment.ts:54` `onPaymentSuccess` | Always creates a room (Google Meet) for `meeting[0]` |
| `data/sessions.ts:58` `selectSession` | Creates a room for the picked package session |
| `components/clients/meetings/index.tsx:53,173` | The join button: `meeting.rooms?.url` or a fallback to `/rooms/{mid}?participant=…` |
| `components/legacy/layout/orderCard/index.tsx:72` | The order card link via `meetingUrl()` (`utils/index.ts:160`) |
| `app/(pages)/(site)/(sub-pages)/payment/success/page.tsx:66,119` | Confirmation shows the `/meetings/{mid}?participant=` link (participant lookup) |
| `app/(pages)/(site)/(sub-pages)/payment/paid/page.tsx:51,100` | Confirmation shows `/meetings/{zid}?participant=client&session=1` |
| `components/clients/sub-pages/sessions/sessions.tsx:70` | Package session pick redirects to the meeting URL |
| `lib/notifications/site.ts` `notificationNewOrder` (lines 85–200), `notificationSessionConfirm` (307, 325) | WhatsApp **Meta templates** with a `meeting-url:{mid}` quick-reply button |
| `lib/api/whatsapp/logic.ts:84` + `data/meetings.ts:72` `getMeetingUrl` | The `meeting-url` button reply sends "تفضل رابط الجلسة … احرص على الدخول في الوقت المحدد" plus the link |
| `lib/notifications/mobile/notify/reservation.ts` | Confirmation and a reminder 5 min before ("جلستك … تبدأ خلال 5 دقائق") for client and consultant; the push opens the session |
| `lib/api/telegram/templates/index.ts:120,125` | Admin Telegram message with meeting links for both sides |
| `app/api/cron/mobile/room/call/route.ts` | **Rings** participants (LiveKit) at start time and marks `ringedAt`; must skip ONSITE |
| `app/api/cron/reschedule/route.ts` | After the meeting ends, sends `notificationCheckRescheduling` ("did it happen? / reschedule") with `meeting-done` / `rescheduling` buttons; applies to ONSITE too, but the wording should be checked |
| `app/api/mobile/room/*`, `app/api/livekit/webhook` | Join, guard, ring, end and attendance for mobile; ONSITE should refuse to join |

Not found in this repo: any **web/WhatsApp pre-session reminder** cron. Mobile reminders are scheduled `Notification` rows sent by `cron/mobile/notifications/dispatch`. If WhatsApp reminders exist, they live in another codebase (the NestJS server?).

---

## 4. Where a payment becomes PAID, and what `Payment.commission` means

### The paid pipeline

- `data/order/reserveation.ts:781` `updateOrderStatus(pid: string, status: PaymentState)` dispatches by status:
  - PAID → `orderStatusPaid`
  - REFUND → `orderStatusRefund`
  - HOLD → `orderStatusHold`
  - anything else → a plain payment state update
- `orderStatusPaid` (`:~835`):
  1. Loads the order (payment, meeting.participants, program, guest, consultant).
  2. If it isn't already PAID, calls `onPaymentSuccess(order)`: room, then mobile or web notifications, then Telegram.
  3. Handles `payPartiallyByWallet` (HOLD on failure).
  4. Sets `payment.payment = PAID`.

  **This is the single place to call `computeOrderSplit`.**
- **Callers:**
  - Moyasar: `handlers/gatewaies/moyasar.ts:66`; `handlers/gatewaies/moyasar-webhook.ts:156` (REFUND, only when the invoice is fully refunded)
  - Tabby: `handlers/gatewaies/tabby.ts:37` and `app/api/gatewaies/tabby/route.ts`
  - the mobile confirm route `app/api/mobile/reservations/[oid]/confirm/route.ts:100`
  - the payment cancel and failed pages (REFUSED)
- ⚠️ **A second PAID path:** wallet-only payments skip `updateOrderStatus`.
  - `data/wallet.ts` `payAllByWallet` sets `payment: PAID` itself (`:170`) and calls `onPaymentSuccess` (`:186`).
  - So `updateOrderStatus` is *not* the single place a payment becomes PAID. `computeOrderSplit` must run in both places, or the wallet path has to be routed through `updateOrderStatus` first.
- **Not covered here:** bank transfer approval happens in the admin dashboard repo, as the spec says.

### `Payment.commission`

- **Type:** `Int` in `prisma/models/payment.prisma`. The spec writes `platformRate`, a `Float`.
- **Written at order creation, not at PAID:**
  - `reserveConsultant` (`data/order/reserveation.ts:~92,135`): `consultant.commission ?? commissionRate`, where `commissionRate = finance.commission` (`data/admin/settings/finance.ts`, defaults `{ tax: 15, commission: 60 }`).
  - `reserveInstant` (`data/online.ts`) uses the same pattern.
  - `reserveProgram` (`data/order/program.ts:67`) uses `PROGRAM_COMMISSION`.
  - `data/reconciliation.ts:64` uses `settings.commission` or 60.
  - `Consultant.commission` itself is seeded from the finance setting when an owner first saves their profile (`handlers/conusltant/owner/profile.ts`).
- **Meaning today: the consultant's percentage**, not the platform's.
  - `utils/admin/dues.ts` `calculateDues({ total, commission /* consultant % */, coupon })` computes `platformPct = 100 - commission`.
  - The dues UI labels it as the consultant's rate.
  - Two comments in `handlers/admin/order/payment.ts:121` and `reserveation.ts:43` call it the "platform commission", which contradicts this.
- **`Payment.total`** = pre-VAT and post-discount (coupon or event), rounded (`calculatePayment` → `cost`). VAT is `TAX_PERCENT` in `Payment.tax`; the card is charged `withTax(cost)`. So the spec's split base ("after discount, before VAT") is exactly `Payment.total`.

---

## 5. `resolveConsultantPricing` and `applyCoupon`

### `data/event.ts:20`

```ts
export const resolveConsultantPricing = async (cid: number): Promise<{
  cost: Record<30|45|60, number>; original: Record<30|45|60, number>;
  discount: { did: number; label: string; durations: number[] } | null;
} | null>
```

- **Base price:** `getConsultantCost(cid)` (`data/consultant.ts:525`, direct `consultant.findUnique`, so it's filtered by the extension; ⚠️ flag D).
- **Rule:** the private `getActiveDiscountFor(cid)`, which matches **only through `DiscountConsultant` rows**:
  - `prisma.discountConsultant.findFirst({ where: { consultantId: cid, status: true, discount: { status: true, startDate ≤ now, endDate ≥ now } }, orderBy: { discountId: "desc" } })`, so the newest discount wins.
- **Applying it:** `applyRule` (`utils/event.ts`) handles PERCENT, FIXED and OVERRIDE. It's applied to each duration in `rule.durations` only.
- **`allCategories` and `categories` are never read anywhere in this repo.** Category matching must happen elsewhere: presumably the admin dashboard expands a category discount into `DiscountConsultant` rows. That's an assumption, not verified.
- **`Discount.overrides` (Json) is never read.** `applyRule` accepts `overrides` and ignores it; `getTheme(key, overrides)` is for campaign themes, not prices.
- **Callers:**
  - `components/clients/consultants/reservation/reserve.tsx:37` (display)
  - `handlers/admin/order/payment.ts:158` (consultant booking: charged price; coupons are blocked when the chosen duration is discounted)
  - `handlers/admin/order/payment.ts:183` (instant; **no coupon** on instant even though `components/clients/instant/reservation/forms/coupons.tsx` exists)
- Packages skip it (`package.cost` flat, no event discount, no coupon). Programs use `program.price`.

### `data/coupon.ts:22`

```ts
export const applyCoupon = async (user: string, code: string, cid: number) =>
  { state: false; message } | { state: true; discount: number; code: string; message }
```

- **Client wrapper:** `actions/site.ts:79` (`checkHuman("applyCoupon")` first). It's called by the consultant, instant and program coupon forms. `Pay` calls the data function directly.
- **Lookup:** `coupon.findUnique({ where: { status: PUBLISHED, code } })`.
- **Consultant match:** blocked only when `coupon.type === CONSULTANT && coupon.consultantId !== cid`.
  - GENERAL, PLATFORM and **CENTER** coupons currently apply to **every** consultant.
  - A CENTER coupon would work on platform consultants today.
- **Other checks:**
  - guests (`"temp"`) can't use limited coupons
  - `starts_at` / `expires_at` (Riyadh time)
  - per-user usage count from `coupon.users` against `limits`
- **Returns** a **percentage** `discount`. `calculatePayment` applies it as a percent of the base.
- `saveACoupon` (`:85`) records `UsedCoupon { type, discount }`, which the dues split reads later.

---

## 6. Dues eligibility today

- **Source:** `data/dues.ts`.
  - `getAllDuesOwner(cid)`: `order.findMany({ where: { consultantId: cid, payment: { payment: PaymentState.PAID } }, include: { payment: { include: usedCoupon }, meeting, consultant }, orderBy newest })`.
  - `getDuesOwnenByMonth("MM-yyyy", cid)`: the same filter plus `due_at ≥ startOfMonth` and `due_at < endOfMonth`.
- **The exact rule:** an order counts as due **iff `payment.payment === PAID`**.
  - There's no condition on meeting `done`. The UI only *displays* `meeting[0].done`.
  - There's no condition on the date passing, and none on the order type (consultant, instant and program orders all count if they carry the `consultantId`).
- **Month grouping** uses `Order.due_at`, which is `@default(now())`, so it's the creation time. Nothing in this repo updates it.
- **Refunds:**
  - A **full** refund flips the state to `REFUND`, so the order drops out of dues entirely.
  - A **partial** Moyasar refund only inserts a `Refund` row (`data/gatewaies/webhook.ts:127`). The state stays PAID, so **today's dues ignore partial refunds**.
- **Split:**
  - Computed in the browser by `calculateDues({ total: payment.total, commission: payment.commission, coupon: usedCoupon })` (`components/legacy/consultants/owner/dues/index.tsx:218,291`, `duesDialog.tsx`).
  - Coupon type changes the split: GENERAL reduces both sides, PLATFORM only the platform, CONSULTANT only the consultant.
  - **CENTER is documented as "undefined behaviour, treat as no coupon"**.
  - ⚠️ `payment.total` is already coupon-discounted (§4), yet `calculateDues` subtracts the coupon again from it. Either older orders stored the pre-coupon total, or today's dues double-count the coupon. Not verified against data.
- **Used by:**
  - `app/(pages)/(consultants)/dashboard/dues/page.tsx` (`defaultCommission = settings.commission`)
  - `actions/consultant.ts` (month filter)
  - `data/bot.ts`

---

## 7. Auth

- **Web login:** NextAuth v5, JWT sessions.
  - `auth.config.ts` has the Credentials provider: phone + password, zod-validated, `getUserByPhone`, `bcrypt.compare`.
  - `auth.ts` callbacks:
    - `signIn` refuses users without `phoneVerified`
    - `jwt` / `session` copy `id`, `phone`, `role` into the session
  - `handlers/auth/login.ts` calls `signIn("credentials")`. Unverified phones are sent to `/verify-otp`.
  - `redirectTo`: ADMIN → `/zadmin`, OWNER → `/dashboard`, otherwise `/`. **CENTER needs a branch here.**
- **Mobile:** Better Auth (`app/api/mobile/**`, `requireMobileUser`). Separate; untouched.
- **Registration:**
  - `components/auth/resgister-form.tsx` → `actions/auth.ts:34` `register` (public, `checkHuman`) → `handlers/auth/register.ts` → `data/user.ts:88` `createUser(role, …)`.
  - The form offers USER ("زائر") or OWNER ("استشاري").
  - The OTP (`handlers/auth/verify.ts`) sets `phoneVerified`. For OWNER it also copies the phone onto the consultant row.
- **How OWNER accounts are created:**
  1. Self sign-up with role OWNER.
  2. On the first profile save in `/dashboard`, `handlers/conusltant/owner/profile.ts` `newOwner` creates the `Consultant` (+ `BankAccount`) in a transaction. It sets `statusA: HOLD` and `commission` = the finance default.
  3. Admin approval happens in the admin dashboard.
- **Session helpers:** `lib/auth/server.ts`, `userServer()` (session user) and `roleServer()` (role). **There is no `userRole()`**; spec and plan text meaning it map to `roleServer()`.
- **Proxy:** `proxy.ts` (Next 16, there is no `middleware.ts`) plus the `routes.ts` lists: `publicRoutes`, `DynamicpublicRoutes`, `protectedPrefixes`, `authRoutes`, `apiAuthPrefix`. A center dashboard prefix must be added to `protectedPrefixes`. The spec's 301 subdomain redirect goes in `proxy.ts`.
- ⚠️ **Security finding (exists today, not a Centers change):** the public `register` Server Action takes `role: UserRole` straight from the client, and no allow-list is applied in the action, the handler or `createUser`.
  - Anyone can call it with `role: "ADMIN"` (or `CENTER` once it exists), verify their own phone by OTP, and log in with that role.
  - On this site, ADMIN gates `app/api/mobile/notifications/campaigns` and the `/zadmin` redirect. The shared database means other codebases may trust it too.
  - This contradicts spec §16.4. The fix is an allow-list `[USER, OWNER]` in the action. It isn't applied here because this phase is read-only; it should be the first fix.

---

## 8. Caching approach (campaigns)

- **Mechanism:** Next 16 Cache Components. Cached functions use `"use cache"` + `cacheLife(...)`; tagged ones add `cacheTag(...)`.
- **Campaigns:** `data/event.ts:42` `getCampaignFor(placement)` uses `"use cache"`, `cacheTag("event-campaigns")` and `cacheLife("hours")`.
  - `getActiveCampaignFor` wraps it and applies the start and end dates **outside** the cache, after `await connection()`.
- **Purge from the admin dashboard:**
  - Endpoint: `app/api/revalidate/route.ts`, `POST` with header `x-dashboard-secret` = `DASHBOARD_SECRET` and body `{ tag }`.
  - It calls `revalidateTag(tag, "max")`, which is stale-while-revalidate. Any string tag is accepted, so the center tags will work through it unchanged.
- **The only `cacheTag` in the repo is `event-campaigns`.**
  - Other cached functions are untagged and expire by `cacheLife` only: consultants list `weeks`, `/consultants/[cid]` `hours`, articles `weeks`/`days`, programs `weeks`, dashboard discounts and programs.
  - `app/sitemap.ts` uses `export const revalidate = 604800`.
- **Nothing in this repo revalidates a tag from a Server Action today.**
  - The spec's "center dashboard saves revalidate their tags directly" will be the first such use.
  - In Next 16, `updateTag(tag)` inside a Server Action gives read-your-own-writes; `revalidateTag(tag, "max")` gives SWR.

---

## 9. Who owns Prisma migrations

- **Not this repo.**
  - There is no `prisma/migrations` folder.
  - `prisma.config.ts` *declares* `migrations.path: "prisma/migrations"` (datasource `DIRECT_URL`), but the folder doesn't exist.
- The schema is split: `prisma/schema.prisma` + `prisma/models/*.prisma` + `prisma/seed/`.
- `postinstall` runs `prisma generate` only.
- Per spec §5, this repo copies the updated schema and runs `prisma generate`.
- Which of the other two codebases owns migrations (admin dashboard or mobile/NestJS) can't be seen from here.

---

## 10. Spec vs. real code: conflicts

1. **`Center` already exists in the schema.**
   - `prisma/models/roles.prisma` has `enum CenterState { PUBLISHED HOLD HIDDEN }` and a stub `model Center { id String @id @default(cuid()) @@map("centers") }`.
   - The spec's `Center` reuses `CenterState` and the `centers` table name, keeps `id String` and adds `ceid Int @unique`. So it's an *alter* of an existing (possibly empty) table, not a create.
   - Whether `centers` exists in the database and has rows is unknown from here.
2. **`CouponType.CENTER` already exists.** `applyCoupon` lets it apply to every consultant, and `calculateDues` calls it "undefined behaviour, treat as no coupon".
3. **`Payment.commission` means the consultant's % today, and it is an `Int`.**
   - The spec (§7.1, `centers.prisma`) calls it "the existing platform-% snapshot field" and writes the `Float` `platformRate` into it.
   - Writing 20 (platform %) there would make the existing dues code read it as "consultant gets 20%".
   - It is also written **at order creation**, while the spec snapshots it **at PAID**.
4. **There is no 100ms.** Rooms are Google Meet (web, created at PAID in `onPaymentSuccess` and in `selectSession`) and LiveKit (mobile, created at join). "Must not create a 100ms room" means: skip `createGoogleMeeting`/`room.create` and refuse LiveKit joins for ONSITE.
5. **Participants are created inside the room code** (§3). Skipping the room naïvely breaks every meeting link.
6. **ONSITE is unused end to end, and the mode is stored nowhere.**
   - `@@unique([consultantId, day, time])` means a slot is either ONLINE or ONSITE, never both.
   - The web owner dashboard can't save ONSITE at all.
   - Availability (`getConsultantAvailableTimes`) doesn't return the type, so the booking UI can't badge slots without changing that query's output.
7. **Discount matching.**
   - The spec says the `centerId` rule must hold for "`allCategories` and `categories` matching … `overrides`". This repo never reads `allCategories`, `categories` or `overrides`; matching is only through `DiscountConsultant` rows.
   - So on the main site the rule is one check: `discount.centerId === consultant.centerId` inside `getActiveDiscountFor`. Category expansion must be fixed wherever it happens, presumably in the admin dashboard.
8. **`userRole()` doesn't exist.** It's `roleServer()` (and `userServer()`), in `lib/auth/server.ts`.
9. **There's no `middleware.ts`.** It's `proxy.ts`.
10. **Required user ids.** `Consultant.userId String @unique` and `ConsultantTiming.userId String` are both required today.
    - Code assumes they're present: `verifyToken`, the presence/Pusher code, `updateTimings(userId, …)` and the owner helpers all key on `userId`.
    - Center consultants with `userId = null` won't reach these paths, but types will widen to `string | null` and need handling.
11. **Most discovery reads are raw SQL** (§1.3, about 20 sites). The "safe by default" goal of §6.1 doesn't hold for them: any new raw query that forgets `centerId IS NULL` leaks.
12. **Dual-use helpers** (`getConsultantInfo`, `getConsultant`) can't be classified as one client. The spec's "existing name becomes safe, fails loudly" will break center booking pages until they're split.
13. **Platform profile 404 is really "200 + noindex".** In Next 16 with PPR, `notFound()` after streaming starts returns HTTP 200 with a `noindex` meta (measured; see `docs/progress.md` 2026-10-03). The spec's checklist item "platform consultant profile (404)" will read as 200.
14. **Dues "mirror exactly" vs. partial refunds.** Today's rule (PAID only) ignores partial refunds; the spec (§3.4, §7.2) wants them subtracted proportionally from `Refund` rows. The two can coexist (same eligibility, minus refunds), but that isn't "mirroring exactly".
15. **The CENTER role can be self-registered today** (§7 security finding). This violates spec §16.4 before Centers even ships.
16. **"The single place a payment becomes PAID" isn't single.** Wallet-only payments set PAID in `data/wallet.ts:170` without `updateOrderStatus` (§4).
17. **Login redirect** has branches for ADMIN and OWNER only. `signIn` requires `phoneVerified`, so admin-created CENTER users must be created already verified, or they'll be pushed into OTP on first login.

---

## Questions for Ziad

1. **`Payment.commission`.** Today it's the *consultant's* % (Int), written at order creation. For center orders, should it hold the **platform** rate as the spec says (and make the dues code branch on `order.centerId`)? Or should it keep its current meaning and get a new `platformRate Float?` snapshot field? It's also an Int while `platformRate` is a Float.
2. **The existing `Center` stub and `CenterState`.** Do the `centers` table and any rows exist in production? Should the migration alter the stub in place?
3. **Migrations.** Which repo owns them: the admin dashboard or the mobile/NestJS repo? `prisma/migrations` isn't here.
4. **The register role.** Can I fix the self-registration privilege escalation (allow-list USER/OWNER in `actions/auth.ts`) as a separate security phase before Centers? It changes no UI.
5. **Free sessions, instant sessions, programs and the WhatsApp bot.** Can center consultants take part in any of them in v1? If not, their booking paths can stay on the safe client, and that's simpler and safer.
6. **Discount categories.** Is category → `DiscountConsultant` expansion done in the admin dashboard? If so, the category part of the §8 rule belongs there, not here.
7. **ONSITE timings.** Do any ONSITE rows exist today (from mobile or the admin dashboard)? And is "one type per slot" (the current unique key) acceptable for centers?
8. **WhatsApp templates.** ONSITE confirmations need new Meta-approved templates (address, map link, policy, no `meeting-url` button). Who creates and approves them, and with which names?
9. **Reminders.** Web and WhatsApp pre-session reminders aren't sent from this repo. Where do they live, so ONSITE can be handled there?
10. **Dues and coupons.** `calculateDues` subtracts the coupon from `payment.total`, which already has the coupon applied. Is that intended (older data stored pre-coupon totals), or a double count to fix separately?
