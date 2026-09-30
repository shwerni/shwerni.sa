# Progress log

## 2026-09-30 · Step 0 hotfix, tier 1: account takeover chain and account edits

**Files changed**

- `tsconfig.json`: `"docs"` added to `exclude`. The build failed type-checking `docs/reference/example/visibility-switch.tsx`, which imports `@/actions/consultant` (not created yet).
- `handlers/auth/verify.ts`:
  - `checkToken(token)` returns only `{ phone: maskPhone(tokenExist.phone) }`. It no longer returns the OTP or the name (neither page displays the name).
  - `verifyToken(token, otp)` now takes the token instead of the phone, reads the phone from the token record, and checks `expire`.
- `handlers/auth/reset.ts`: `verifyReset(data, token)` gets the same change: phone from the token record, `expire` checked.
- `data/verificationTokens.ts`: token expiry is 10 minutes (was 1 hour).
- `app/(pages)/(auth)/verify-otp/page.tsx`, `app/(pages)/(auth)/reset-password/page.tsx`: pass `phone` (masked) and `token`. The OTP is no longer in the page payload.
- `components/auth/verify-otp.tsx`, `components/auth/reset-password-form.tsx`: props are `{ phone, token }`, and the verify call sends `token`. Markup unchanged.
- `utils/phone.ts`: new `maskPhone` (first 3 and last 4 digits).
- `handlers/auth/userInfo.ts`: `userInfoChange`, `userPasswrodChange` and `unauthorizedPhoneChangeByToken` take the account from `userServer()` and ignore the id / old-phone argument. Signatures are unchanged. No session returns the existing messages.

**Verified**

- `npm run build`: passes.
- Manifest: 304 functions still exposed, as expected until tier 4.
- The manifest check in CLAUDE.md prints nothing even when `data/` files are exposed: `(^|/)` never matches a path that starts right after a quote. A working check is `grep -oE '"(data|handlers|lib)/[^"]*"' .next/server/server-reference-manifest.json | sort -u`, which prints 55 files after this tier.

**Needs manual testing in the browser**

- Register, then OTP verify, then redirect to `/login`.
- Forget password, then reset with OTP, then `/login`.
- `/verify-otp` and `/reset-password` show the masked phone. The WhatsApp help link on `/verify-otp` also carries the masked phone.
- Dashboard profile: change name/email, change password, change phone. Each should work while logged in.

**Open questions for review**

- The OTP is 5 digits and there is no attempt limit; this is still brute-forceable until rate limiting exists.
- Existing bug, left as is: `userInfoChange` calls `getUserByEmail(id)` with the user id instead of the email.

## 2026-09-30 · Step 0 hotfix, tier 2: server-only for files with no client callers

**Files changed**

- `"use server"` swapped for `import "server-only"` (directive only) in 35 files:
  - `data/`: `admin/collaboration`, `admin/settings/employee`, `admin/settings/settings`, `blocked`, `campaigns`, `gatewaies/moyasar`, `gatewaies/tabby`, `gatewaies/webhook`, `instant`, `meetings`, `order/program`, `preconsultation`, `question`, `reconciliation`, `rooms`, `seo`, `shuffle`, `statistics`, `user`, `wallet`, `whatsapp`
  - `lib/`: `api/ai/bot/setup`, `api/ai/chat-guard`, `api/gatewaies/moyasar`, `api/gatewaies/tabby`, `api/google`, `api/sms`, `api/telegram/telegram`, `api/telegram/templates/owner`, `api/uploadthing/delete/route`, `api/whatsapp/index`, `notifications/site`, `upload/actions`
  - `handlers/`: `gatewaies/moyasar`, `gatewaies/tabby` (payment files; directive change approved)
- `"use server"` removed from 4 pages (`dashboard/freesession`, `dashboard/timings`, `programs/[prid]`, `programs/reserve/[prid]`) and 4 routes (`uploadthing/delete`, `gatewaies/moyasar`, `mobile/reservations/[oid]/gatewaies/tabby-payload`, `mobile/reservations/[oid]/status`; payment routes approved as directive-only).
- `data/user.ts`: `getUserById` uses `omit: { password: true }`. `dashboard/profile/page.tsx` passed the full row, hash included, to the client `UserSettings`.
- `components/legacy/layout/settings/index.tsx`: prop type narrowed to `Omit<User, "password">` (type only).

**Not done, and why**

- `app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx` still starts with `"use server"`. It has uncommitted changes that aren't part of this hotfix, so it was left out of this commit. It only exposes its own page component, which checks `userServer()`.
- `npm i server-only` not run. The bundled Next docs say it's optional because Next handles the import itself, and `package.json` has an unrelated uncommitted change.

**Verified**

- `npm run build`: passes. No client module imports a flipped file.
- Manifest: 206 functions from 50 files (was 304 / 73).

**Needs manual testing in the browser**

- Dashboard profile page loads and saves as before.
- Login, register, booking with Moyasar and Tabby, cron endpoints, WhatsApp webhook: everything that uses the flipped `data/` and `lib/` files from server code.

## 2026-09-30 · Step 0 hotfix, tier 3: guarded wrappers for the mixed files

**Files changed**

- New `actions/` files. Each export keeps the original's exact parameter list (`Parameters<typeof …>`) and return shape; no `createAction` yet:
  - `actions/auth.ts`: login, register, forgetpassowrd, verifyReset, verifyToken, phoneToken, userInfoChange, userPasswrodChange, unauthorizedPhoneChangeByToken. All pass through; the handlers already check the token or session (tier 1).
  - `actions/booking.ts`: `Pay`, `confirmFreeSession`, `confirmReconciliation`. Public. The booking's user comes from the session; guests keep the placeholder their form sends (`"temp"`, or `""` on discover).
  - `actions/consultant.ts`: `getConsultantAvailableTimes` (public). The rest are consultant-only, with the consultant id from `getOwnerbyAuthor(session.id)` and any `cid` / `author` / `userId` / `phone` argument ignored: `confirmOathAcceptance`, `getDuesOwnenByMonth`, `saveConsultant`, `ownerVisibility`, `saveBankAccount` (already checked the session), `updateConsultantBaseCosts`, `upsertConsultantPackage`, `updateConsultantSpecialties`, `updateTimings`, `getTimings`, `saveUploadedImage`, `saveUploadedFile`, `toggleFreesessionState`, `toggleDiscountState`.
  - `actions/site.ts`:
    - Logged-in users only: `toggleArticleLike`, `toggleFavorite`.
    - Public, with the author from the session: `addArticleComment`, `applyCoupon` (guest `"temp"`), `acceptNewreview` (guest `"guest"`).
    - Consultant-only: `createConsultantsCoupon`, `deleteConsultantsCoupon` (the code must belong to the caller), `EnrollOnProgram`, `toggleProgramState`, `createNewProgram`, `getReviewsForConsultant`.
    - Public: `checkIsAnyConsultantOnline`, `getOnlineConsultantsList`, the discover reads, and the guest-link functions below.
    - Chat pass-throughs, hardened in tier 5.
  - `actions/ai.ts`: `aiConsultantSummary` (consultant-only), `SendChatBot` (the user comes from the session, not the caller), `verifyRecaptcha`.
  - `actions/reels.ts`: wraps `app/(pages)/(site)/(sub-pages)/reels/actions.ts`.
- `lib/auth/guards.ts` (new, server-only): `sessionUser`, `ownConsultantCid`, `isConsultant`.
- `"use server"` swapped for `import "server-only"` in 34 files. 20 in `data/`: `admin/tools/oath`, `article`, `chats`, `consultant`, `coupon`, `discounts`, `dues`, `favorites`, `freesession`, `online`, `packages`, `programs`, `reels`, `reschedule`, `review`, `scales`, `sessions`, `specialties`, `timings`, `uploads`. The rest: `handlers/admin/freesession`, `handlers/admin/order/payment` (approved, directive only), `handlers/auth/*` (5), `handlers/clients/order`, `handlers/conusltant/owner/profile`, `handlers/conusltant/owner/bank-account`, `lib/api/ai/ai`, `lib/api/ai/chat-bot`, `lib/api/recaptcha`, `app/(pages)/(site)/(sub-pages)/reels/actions.ts`.
- `reserveConsultant` / `reserveInstant` / `reserveProgram` are no longer reachable from the browser. `Pay` is the only entry point and still computes totals on the server. Moving that pricing to `services/pricing.ts` is phase 3.
- 55 client files: import path changes only. `reels/page.tsx` also got its type import split into `import type { ReelConsultant } from "./actions"`.
- `data/review.ts` `getReviewsForConsultant`: only `PUBLISHED` reviews and only `id, name, comment, rate, status, created_at` (decision: keep all consultants' reviews, approved only). `dashboard/reviews/page.tsx`: state type narrowed to those fields.
- 19 files had uncommitted edits unrelated to the hotfix. For those, the commit contains only HEAD plus the import or directive change; the other edits stay in the working tree.

**Guest links (public by decision; flow not changed)**

| Link | What it contains | Token? | Server function |
| ---- | ---------------- | ------ | --------------- |
| `/reschedule/[mid]?limit=…&reason=…` | `mid` = meeting id (`nanoid(10)`, random); `limit` = `zencryption` of a number | none | `meetingDone(mid)`, `rescheduleMeeting(mid, date, time, reason)` |
| `/sessions/[id]?session=…` | `id` = `zencryption(oid)`: a digit substitution of the sequential order id, whose map ships to the browser | none | `selectSession(oid, time, date, session, duration)` |
| `/scales/orders/[zid]` | `zid` = `zencryption(oid)` (same as above) | none | `submitScaleResult({ orderId, scaleId, score, responses })` |
| `/reconciliation` | no id, it is a form | none | `confirmReconciliation(...)`: author now from the session |
| consultant page review form | `cid`, `owner` | none | `acceptNewreview(...)`: author now from the session (`"guest"` when logged out) |
| article comment form | `aid` | none | `addArticleComment(...)`: author now from the session |

None of these links carries a token, so there is nothing to match against a record. Relying on an id alone:

- `selectSession` and `submitScaleResult`: the order id is sequential, and `zencryption` is reversible from the client bundle.
- `meetingDone` and `rescheduleMeeting`: `mid` is random (`nanoid(10)`) but it is still the only key.

**Verified**

- `npm run build`: passes.
- Manifest: 96 functions from 23 files (was 206 / 50). Outside `actions/`, what remains:
  - 15 `"use cache"` registrations
  - `dashboard/programs/[prid]` page: left in tier 2, it has unrelated uncommitted edits
  - `data/order/reserveation.ts`: tier 4

**Needs manual testing in the browser**

- Dashboard as a consultant: profile save, visibility toggle, bank account, uploads, packages, specialties, timings, coupons (create/delete), discounts, free-session toggle, programs (enroll, toggle, new), dues, reviews page (now only approved reviews), oath, AI summary.
- Site as a guest and as a user: booking (consultant, instant, program, marriage awareness, discover), coupon apply, free session, reconciliation, favorites, article like/comment, review form, reschedule, sessions pick, scales submit, chat bot, online indicators.
- Auth: login, register, forgot password, OTP pages.

## 2026-09-30 · Step 0 hotfix, tier 4: refunds and order data

**Files changed**

- `actions/order.ts` (new):
  - `orderStatusRefund(_pid)` always returns `false`, so the order-card refund button shows its existing `"حدث خطأ ما"`. Refunds are handled only in the dashboard codebase.
  - `getPaidOwnersOrdersByAuthorAndMonth`: consultant-only, author from the session.
  - `getPaidPast3Days`: public.
- `data/order/reserveation.ts`: `import "server-only"`. `orderStatusRefund`, `updateOrderStatus`, `orderStatusPaid`, `reserveConsultant`, the order reads and the cancel functions are no longer callable from the browser.
- Import path only: `components/legacy/layout/orderCard/refundButton/index.tsx`, `components/legacy/consultants/owner/orders/index.tsx`, `components/clients/home/notification/notification.tsx`.
- `components/clients/home/test.tsx` (imports `orderStatusPaid`) left as is: nothing imports it, so it isn't bundled.

**The refund button**

- Who sees it: nobody today. `RefundBtn` renders only when `!owner` (`orderCard/index.tsx:182`). `OrderCard`'s only use is the consultant dashboard's orders list with `owner={true}` (`owner/orders/index.tsx:177`).
- What it was meant to do: let a client cancel a PAID booking at least 6 hours before the session, with the money refunded to their wallet (dialog: "سيتم إلغاء الحجز و سيتم استرداد المبلغ الي المحفظة"). Last touched in commit `9d8f38c` (folder move). Not removed.

**Verified**

- `npm run build`: passes.
- Manifest: 70 functions from 23 files. Outside `actions/`, only the 15 `"use cache"` registrations and the skipped `dashboard/programs/[prid]` page remain. The corrected check (`grep -oE '"(data|handlers|lib)/[^"]*"'`) prints only `data/event.ts`, which is its `"use cache"` registration.

**Needs manual testing in the browser**

- Consultant dashboard orders list by month.
- Home page recent-orders notification.
- Moyasar and Tabby payment callbacks, cron cancel-orders, payment cancel/failed pages (they call `updateOrderStatus` from server code).

## 2026-09-30 · Step 0 hotfix, tier 5: open routes

**Files changed**

- `app/api/meetings/[mid]/chat/route.ts`: requires `?participant=` to be a participant token of that meeting, the same rule as the `/chats/[mid]` page. Otherwise it returns 404 `"Meeting not found"`. The response no longer includes any participant's `participant` token.
- `app/api/meetings/chats/route.ts`: author and role come from `userServer()`; the `?author=` / `?role=` query is ignored. No session returns 401. `otherParticipantId` is returned as `null` (the list never used it, and it is the other party's token).
- `app/api/pusher/auth/route.ts`: the user comes from `userServer()`; the `userId` form field is ignored.
- `app/api/uploadthing/delete/route.ts`: requires `x-dashboard-secret` to equal `DASHBOARD_SECRET` (`timingSafeEqual`; an unset secret never matches). Nothing in this codebase calls the route; `lib/upload/actions.ts` `deleteImageAdmin` has no callers.
- `app/api/uploadthing/core.ts`: `chatAttachment` stays open to guests. It already allowed only image (8 MB) and PDF (16 MB); `maxFileCount: 1` added to both. The chat input also accepts `.doc/.xls/.txt`, which the router already rejected before this change.
- `data/chats.ts`: new `getMeetingAccess(mid)` (participant tokens with roles, plus the consultant's userId).
- `actions/site.ts`:
  - `createMeetingMessage` drops the caller's `sender`, so the role always comes from the participant record.
  - `toggleUserBlock(mid, shouldBlock, participantId?)` requires the meeting's consultant: either a session as that consultant, or the consultant's participant token. Otherwise it returns `{ error: "Meeting not found" }`. The optional third argument is the only signature change in the hotfix.
- `components/clients/chats/chat.tsx`, `components/clients/chats/list/chat.tsx`: the SWR URL carries `?participant=`, and `toggleUserBlock` gets `participantId`. No markup changes.

**Verified**

- `npm run build`: passes.
- Manifest: 70 functions. Outside `actions/`: the 15 `"use cache"` registrations and the skipped `dashboard/programs/[prid]` page.

**Needs manual testing in the browser**

- Guest and consultant chat via `/chats/[mid]?participant=…`: messages load, send, attachments upload, block and unblock (consultant).
- Dashboard chats list and `/dashboard/chats/[mid]`.
- Consultant online presence (pusher auth) while logged in.
- If the dashboard codebase calls `/api/uploadthing/delete`, it must now send `x-dashboard-secret`.

## Payments: proposal only (not applied)

**Tabby webhook** (`app/api/gatewaies/tabby/route.ts`, `handlers/gatewaies/tabby.ts`, `lib/api/gatewaies/tabby.ts`):

1. The route ignores the body's `status` and `amount` and calls `tabbyPaymentDetails(payment.id)` server-to-server.
2. If Tabby reports the payment `AUTHORIZED` and its amount equals the order's `payment.total` (tax included), call `tabbyPayment(pid, verifiedAmount)`.
3. `capturePayment` returns `true` only when `response.ok`, and `false` on non-2xx or on a throw.
4. `tabbyPayment` sets PAID only when the capture returns `true`. Otherwise it sets HOLD and calls `telegramAdmin` with the pid.
5. Any other verified status sets HOLD, as today but only after verification. An unverifiable payment changes nothing and alerts `telegramAdmin`.

**Payment cancel page** (`app/(pages)/(site)/(sub-pages)/payment/cancel/page.tsx`):

1. Set REFUSED only when there is a session, `order.author === user.id`, and `order.payment.payment === PaymentState.NEW`. The enum has no PENDING; NEW is the unpaid state.
2. Otherwise render the same page without changing any status.
3. Effect to confirm: guests (author `"temp"`) and paid orders are no longer changed from this page. Stale NEW orders are still cleared by `cron/cancel-orders`.

## Step 0 status

Tiers 1–5 are committed. The item "Hotfix Critical and High functions from section 1 and deploy" in section 9 is not ticked:

- Deploying is outside what I'm allowed to do.
- Two things are still open: the skipped `dashboard/programs/[prid]` page (exposes only its own page component) and the payments proposal above.
- The manifest check in CLAUDE.md needs the corrected pattern noted in tier 1.

## 2026-09-30 · Step 0 follow-up, item 1: OTP attempt limit (stopped: migration owned elsewhere)

**Finding:** this repo does not own the Prisma migrations. `prisma.config.ts` points at `prisma/migrations`, but that folder doesn't exist and there is no migration history; schema changes here are committed without migrations. No code was changed. Adding the field here before the column exists would make every `verificationToken` query fail.

**Apply in the codebase that owns the migrations.** Schema change, in `model VerificationToken`:

```prisma
model VerificationToken {
  id       String   @id @default(cuid())
  phone    String
  token    String   @unique
  otp      String
  expire   DateTime
  attempts Int      @default(0)

  @@unique([phone, token])
  @@map("verification_tokens")
}
```

SQL:

```sql
ALTER TABLE "verification_tokens" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
```

**Once the column exists**, copy the same field into `prisma/models/user.prisma` here and implement:

- One atomic read-and-count per verify, only for a token that exists and hasn't expired:
  `UPDATE "verification_tokens" SET "attempts" = "attempts" + 1 WHERE "token" = $1 AND "expire" > now() RETURNING "id", "phone", "otp", "attempts";`
- Compare with `crypto.timingSafeEqual` (equal-length buffers).
- Wrong OTP with `attempts >= 5`: delete the token and return the existing `"انتهت صلاحية كود التحقق"`.
- Correct OTP: delete the token (already done today).
- Same in `verifyToken` (`handlers/auth/verify.ts`) and `verifyReset` (`handlers/auth/reset.ts`).

## 2026-09-30 · Step 0 follow-up, item 2: Tabby webhook (approved proposal applied)

**Files changed**

- `app/api/gatewaies/tabby/route.ts`:
  - Reads only `id` from the body, then looks up the order by that pid.
  - Idempotent: an order already PAID returns 200 `{ success: true }` and nothing changes, and nothing is captured.
  - Otherwise it re-fetches the payment with `tabbyPaymentDetails(pid)`; the body's `status` and `amount` are ignored.
  - Verified `authorized` with amount = `Math.round(total × (1 + tax / 100))` (the formula `Pay` charges) and currency `SAR`: `tabbyPayment`.
  - Verified `authorized` with a different amount: HOLD plus `telegramAdmin`.
  - Verified `closed`: no change, as before (it is also what Tabby sends after our capture).
  - Any other verified status: HOLD.
  - Unverifiable: no change, `telegramAdmin`.
- `lib/api/gatewaies/tabby.ts`: `capturePayment` returns `true` only when `response.ok`, `false` on non-2xx or a throw.
- `handlers/gatewaies/tabby.ts`: `tabbyPayment` sets PAID only after a successful capture. A failed capture sets HOLD and calls `telegramAdmin`, unless a parallel webhook already paid the order, in which case it never downgrades.

**How this never captures twice**

- The PAID guard runs before any capture.
- A capture happens only when Tabby's own status is `authorized`; after a full capture it becomes `closed`.
- A second concurrent capture is rejected by Tabby, and the re-check keeps the order PAID.

**Open question**

- The mobile route `mobile/reservations/[oid]/gatewaies/tabby-payload` sends the pre-tax `payment.total` to Tabby, while web sends the tax-inclusive total. A mobile Tabby payment would now go to HOLD plus a Telegram alert instead of PAID. The mobile booking POST routes are stubs today; this needs fixing before mobile Tabby goes live.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview (Tabby sandbox)**

- A web Tabby booking completes and the order becomes PAID once.
- Resending the same webhook leaves it PAID, with no second capture in the Tabby dashboard.
- A forged webhook body (`{"id":"<pid>","status":"authorized"}` for an unpaid sandbox order that Tabby hasn't authorized) does not mark it PAID.
- A rejected or expired Tabby payment sets the order to HOLD.
- Sandbox with a capture failure: order HOLD and a Telegram alert.

## 2026-09-30 · Step 0 follow-up, item 3: Moyasar webhook (findings, proposal only, not applied)

**How paid is decided today**

| Path | secret_token | Server-to-server fetch | Status | Amount (halalas) | Currency | Idempotent |
| ---- | ------------ | ---------------------- | ------ | ---------------- | -------- | ---------- |
| Invoice callback `POST /api/gatewaies/moyasar` (raw `{ payments: [...] }`), via `handlers/gatewaies/moyasar.ts` `CheckPaymentState` | not checked (the raw callback has none) | yes, `moyasarPaymentStatus(invoice_id)` reads only `status` | `paid` → PAID; **anything else, including `initiated`, → HOLD** | not compared | not compared | yes, skips when already PAID and Moyasar says paid |
| Enveloped webhooks on the same route (`payment_refunded`, `balance_transferred`) | **not checked** | yes, `moyasarInvoiceDetails` / `moyasarSettlementDetails` | from Moyasar's record | refunds from Moyasar's record | — | depends on `recordRefund` (unverified) |
| Mobile `POST /api/mobile/reservations/[oid]/confirm`, via `utils/gatewaies/verify/verify.ts` `verifyMoyasarPayment` | n/a (user session + ownership) | yes, `/v1/payments/{id}` | `paid` / `captured` | compared to `Math.round(order.payment.total × 100)`, **the pre-tax total** | not compared | only re-verifies orders still NEW |

Verification is partial:

- No amount or currency check on the web path.
- A forged callback with a known `invoice_id` can move an unpaid order to HOLD.
- The enveloped webhooks don't check `secret_token`.
- The mobile check compares against the pre-tax total while web charges the tax-inclusive total (unverified which the mobile SDK charges).

**Proposal**

Files: `app/api/gatewaies/moyasar/route.ts`, `handlers/gatewaies/moyasar.ts`, `lib/api/gatewaies/moyasar.ts`, `utils/gatewaies/verify/verify.ts`.

1. Enveloped webhooks: compare `body.secret_token` with a new env var `MOYASAR_WEBHOOK_SECRET` (the value set in the Moyasar dashboard) using `timingSafeEqual`, same length first. Mismatch returns 401 and changes nothing.
2. Invoice callback:
   - Ignore everything in the body except `invoice_id`, and look up the order by pid.
   - An order already PAID returns 200 and changes nothing.
   - Re-fetch with `moyasarInvoiceDetails(invoice_id)`: the full invoice, not just its status.
3. Mark PAID only when all of these hold:
   - `status === "paid"`
   - `currency === "SAR"`
   - `amount === Math.round(order.payment.total × (1 + order.payment.tax / 100)) × 100`, which is the halalas `createMoyasarCheckout` sends
   - the invoice id equals the order's `payment.pid`
4. Verified paid with a mismatching amount or currency: HOLD plus `telegramAdmin`.
5. Only definitive failures (`failed`, `voided`, via `isMoyasarDefinitiveFailure`) set HOLD. `initiated` and other in-progress statuses change nothing. This is a behaviour change from today, where they go to HOLD.
6. Unverifiable (Moyasar unreachable or non-2xx): no change, `telegramAdmin`.
7. `verifyMoyasarPayment`: also require `currency === "SAR"`. Confirm which total the mobile SDK charges: if tax-inclusive, the mobile confirm route should pass the tax-inclusive total.

**Needs from you:** approval, and the `MOYASAR_WEBHOOK_SECRET` value set in Vercel (name only here).

## 2026-09-30 · Step 0 follow-up, item 4: chat uploads require a participant token

**Files changed**

- `app/api/uploadthing/core.ts`: `chatAttachment` takes `.input({ mid, participant })`. Its middleware requires `participant` to be a participant token of that meeting (`getMeetingAccess`, the same rule as the tier 5 chat route). Otherwise it throws `UploadThingError("Unauthorized")`. Still no login required, and the limits are unchanged: image 8 MB, PDF 16 MB, 1 file.
- `components/clients/chats/chat.tsx`, `components/clients/chats/list/chat.tsx`: `startUpload([attachment], { mid, participant: participantId })`. A rejected upload shows the existing `"فشل رفع الملف، يرجى المحاولة مرة أخرى."`.

**Verified**

- `npm run build`: passes. The client helper `lib/upload/index.ts` imports the router only as a type.

**Needs manual testing on the preview**

- Guest chat link (`/chats/[mid]?participant=…`): attach an image and a PDF; both upload and send.
- Consultant chat from `/dashboard/chats/[mid]`: attachment uploads.
- The same page with a wrong `participant` value: the page 404s, and a direct UploadThing request with a wrong token is rejected.

## 2026-09-30 · Step 0 follow-up, item 5: getPaidPast3Days

**Before:** every home page visitor received, for up to 30 paid orders from the last 3 days, the real order `id`, the client's full `name`, and the consultant's `name` and `category`. The banner masked the name only in the browser.

**Files changed**

- `data/order/reserveation.ts`: selects `id`, `name`, `consultant.name`, and returns:
  - `id`: an opaque key, the first 16 characters of the sha256 of the order id. It's stable, so the "seen" tracking keeps working, but it isn't the order id.
  - `name`: already masked on the server with the banner's own rule (first and last letter, `*` between). The banner masks it again, and that gives the same text.
  - `consultant.name`
  - `category` is no longer returned: it was copied into the store but never rendered.
- `hooks/zustand/order-notification.ts`: `category` made optional in `RawOrder` / `NotifEntry` (type only).

**Fields that remain in the browser:** opaque key, masked client name, consultant name. No phones, emails or ids, and no full client names.

**Side effect:** "seen" ids stored before this change are the old raw order ids, so a returning visitor may see recent notifications once more.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- The home page banner shows the same masked name and consultant as before, and doesn't repeat an order within a session.
- In the network response of the server action, there's no full client name and no order id.

## 2026-09-30 · Step 0 follow-up, item 1 (resumed): OTP attempt limit

The `attempts` column was added to `verification_tokens` by the migration-owning codebase.

**Files changed**

- `prisma/models/user.prisma`: `attempts Int @default(0)` on `VerificationToken`. `npx prisma generate` run locally; the generated client is git-ignored.
- `data/verificationTokens.ts` (now `import "server-only"`):
  - `consumeVerificationAttempt(token)`: one atomic `UPDATE "verification_tokens" SET "attempts" = "attempts" + 1 WHERE "token" = $1 AND "expire" > $now RETURNING "id", "phone", "otp", "attempts"`, so only a live, unexpired token is counted and read. The time is a JS `Date` parameter, so it's correct for `timestamp` and `timestamptz`.
  - `otpMatches`: `crypto.timingSafeEqual`, and different lengths never match.
  - `deleteVerificationToken` and `MAX_OTP_ATTEMPTS = 5`.
- `handlers/auth/verify.ts` `verifyToken` and `handlers/auth/reset.ts` `verifyReset`, same logic:
  - Missing token: `"لا يوجد كود تفعيل لهذا الحساب"`. Expired token: `"انتهت صلاحية كود التحقق"`. Both messages unchanged.
  - Wrong OTP: `"رمز التحقق خطأ"`. On the 5th wrong attempt, the token is deleted and `"انتهت صلاحية كود التحقق"` is returned, so a new code is needed.
  - Correct OTP (including on the 5th attempt): the token is deleted first, then the account is updated.

**Deploy note:** `package.json` has no `prisma generate` step (`"build": "next build"`), and `lib/generated/prisma` is git-ignored. Check that the Vercel build regenerates the client; unverified how it does today. The attempt query is raw SQL, so it doesn't depend on the generated types.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Verify OTP: a correct code works once; the same link again says there's no code.
- Verify OTP: 4 wrong codes show "رمز التحقق خطأ", the 5th shows the expired message, and then even the correct code fails until a new one is requested.
- Reset password: the same two checks.
- Wait more than 10 minutes: the expired message.
