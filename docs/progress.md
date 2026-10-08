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

## 2026-09-30 · Step 0 follow-up, item 3: one charge total for web and mobile

**Decision:** one shared function computes the charge from the stored total, and `Pay` charges that too. In rare coupon cases the charge drops by up to 1 SAR (e.g. a 205 SAR base with a 51% coupon: 116 → 115), so it matches what the order stores. The checkout screen (client hook) is unchanged and may show the old figure in those cases.

**Files changed**

- `utils/admin/payments.ts`: new `orderChargeTotal({ total, tax })` = `calculatePayment({ baseCost: total, tax }).totalWTax`. This is now the only source of the charged amount.
- `handlers/admin/order/payment.ts` `Pay`: charges `orderChargeTotal({ total: cost, tax: finance.tax })`, where `cost` is the stored rounded `Payment.total` (was `calculatePayment(...).totalWTax` over the unrounded price).
- `app/api/gatewaies/tabby/route.ts`: the expected amount is `orderChargeTotal(payment)`.
- `app/api/mobile/reservations/[oid]/gatewaies/tabby-payload/route.ts`: sends `orderChargeTotal(order.payment)` (was the pre-tax `payment.total`).
- `lib/api/gatewaies/tabby.ts` `tabbyPreScoring` (no callers): same change.
- `app/api/mobile/reservations/[oid]/confirm/route.ts`: `verifyMoyasarPayment(pid, orderChargeTotal(order.payment), oid)` (was the pre-tax total).
- `app/api/mobile/reservations/[oid]/result/route.ts`: compares `Math.round(orderChargeTotal(order.payment) × 100)` halalas (was the pre-tax total).

**Every place a total is computed (after this item)**

| Where | What | Formula |
| ----- | ---- | ------- |
| `handlers/admin/order/payment.ts` `Pay` | amount sent to Moyasar / Tabby (web) | `orderChargeTotal` |
| `lib/api/gatewaies/moyasar.ts` `createMoyasarCheckout` | halalas from `Pay`'s amount | `toFixed(2)` of that amount |
| `app/api/gatewaies/tabby/route.ts` | expected webhook amount | `orderChargeTotal` |
| `mobile/.../tabby-payload/route.ts` | amount sent to Tabby (mobile) | `orderChargeTotal` |
| `mobile/.../confirm/route.ts`, `mobile/.../result/route.ts` | expected Moyasar amount (mobile) | `orderChargeTotal` |
| `lib/api/gatewaies/tabby.ts` `tabbyPreScoring` (unused) | amount | `orderChargeTotal` |
| `hooks/site/usePaymentCalculation.ts` | checkout screen figure | `round(t × (1 + tax/100))` over the **unrounded** price (unchanged) |
| `utils/index.ts` `totalAfterTax` | order card, order info, refund dialog, currency labels, Tabby order history (`data/gatewaies/tabby.ts`), wallet refund credit (`data/wallet.ts`) | `round(cost + cost × tax/100)` over the stored total (unchanged) |
| `app/api/mobile/reservations/[oid]/confirm` and `result` responses | `amountSar` shown in the app | pre-tax `payment.total` (unchanged, display only) |

**Known difference (corrected in the tax cleanup below)**

The first version of this note was wrong: `150 × (1 + 15/100)` is exactly 172.5, so a 150 SAR session was 173 everywhere. The real difference: `calculatePayment` (checkout and charge) and `totalAfterTax` (cards, refunds) disagreed by 1 SAR at 400 whole-number prices up to 20,000 (first ones: 50, 90, 110, 170, 190, 210). Resolved by the tax cleanup.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Web booking without a coupon (e.g. 150 SAR): the Moyasar and Tabby checkout amount equals what it was before (173).
- Web booking with a coupon: the checkout amount equals `orderChargeTotal` of the stored total.
- Mobile Tabby payload amount is tax-inclusive, and the webhook then marks it PAID.
- Mobile Moyasar confirm and result mark a paid order PAID.

## 2026-09-30 · Step 0 follow-up, item 2: Moyasar webhook (approved proposal applied)

**Files changed**

- `app/api/gatewaies/moyasar/route.ts`:
  - Enveloped webhooks (`payment_refunded`, `balance_transferred`, others) require `body.secret_token` to equal `MOYASAR_WEBHOOK_SECRET` (`timingSafeEqual`, same length first). No fallback: if the env var is unset, every enveloped webhook gets 401 and nothing changes.
  - The raw invoice callback passes only `invoice_id` to the handler.
- `handlers/gatewaies/moyasar.ts` `CheckPaymentState`, in order:
  1. Look up the order by pid; unknown invoice: nothing to change.
  2. Order already PAID: nothing changes (idempotent).
  3. Re-fetch the full invoice with `moyasarInvoiceDetails`. Unreachable: no change, `telegramAdmin`.
  4. `status === "paid"`: PAID only when `amount === Math.round(orderChargeTotal(payment) × 100)`, `currency === "SAR"` and `invoice.id === payment.pid`. Otherwise HOLD plus `telegramAdmin`.
  5. `failed` / `voided` (`isMoyasarDefinitiveFailure`): HOLD. Anything else, e.g. `initiated`, changes nothing. **Behaviour change: before, every non-paid status set HOLD.**
- `utils/gatewaies/verify/verify.ts` `verifyMoyasarPayment` and `app/api/mobile/reservations/[oid]/result/route.ts`: also require `currency === "SAR"`. Amounts come from `orderChargeTotal` since item 3.

**Deploy requirement:** set `MOYASAR_WEBHOOK_SECRET` in Vercel to the secret configured for webhooks in the Moyasar dashboard. Until it's set, refund and settlement webhooks are rejected with 401.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview (Moyasar test mode)**

- A web card booking: the invoice callback marks the order PAID once. Resending the callback changes nothing.
- An abandoned or `initiated` invoice callback leaves the order NEW. A failed card sets HOLD.
- A forged callback for an unpaid order (a known `invoice_id`, never paid) doesn't mark it PAID.
- Refund webhook with the right `secret_token` is processed; with a wrong or missing one, 401 and no change.
- With `MOYASAR_WEBHOOK_SECRET` unset on the preview: enveloped webhooks get 401.
- Mobile Moyasar confirm and result still mark a paid order PAID.

## 2026-09-30 · Step 0 follow-up, item 4: payment cancel page (approved proposal applied)

**Files changed**

- `app/(pages)/(site)/(sub-pages)/payment/cancel/page.tsx`: sets REFUSED only when there is a session (`userServer()`), `order.author === user.id`, and the payment is `NEW`. Otherwise it renders the same page and changes nothing. Markup unchanged.

**Behaviour change (approved):** guests (author `"temp"`), other users' orders, paid orders and orders in any other state are no longer changed from this page. Stale NEW orders are still cleared by `cron/cancel-orders`. The `failed` page is unchanged (it still refuses non-paid orders by `zid`).

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- A logged-in user cancels their own Tabby / Moyasar checkout: the page shows as before and the order becomes REFUSED.
- The same cancel URL opened logged out, or as another user: same page, and the order stays NEW.
- The cancel URL for a PAID order: the order stays PAID.
- A guest checkout cancel: same page, order stays NEW until the cron clears it.

## 2026-09-30 · Cleanup item 1: one tax calculation

**What the checkout showed before, for a 150 SAR session:** 173. `usePaymentCalculation` computed `Math.round(150 × (1 + 15/100)) = Math.round(172.5) = 173`, and `Pay` charged 173. The "172" in the earlier note was my mistake; that note is corrected above.

**Why unify anyway:** the float formula (`total × (1 + tax/100)`, used by checkout, `calculatePayment` and `Pay`) and `totalAfterTax` (`cost + cost × tax/100`, used by cards and refunds) disagreed by 1 SAR at 400 whole-number prices up to 20,000. For example, 50 SAR showed and charged 57 while cards and refunds said 58. With a coupon, checkout also used the unrounded price (205 SAR at 51% showed 116 while the order stored and charged 115).

**Files changed**

- `utils/tax.ts` (new, pure): `TAX_PERCENT = 15` and `withTax(total) = Math.round(Math.round(total) × (100 + TAX_PERCENT) / 100)`. This is the only tax calculation.
- `utils/admin/payments.ts`: `calculatePayment().totalWTax` uses `withTax`; `orderChargeTotal` removed.
- `hooks/site/usePaymentCalculation.ts` (checkout): `totalWTax = withTax(finalTotal)` and `subTotal = withTax(baseCost)`, so the rounded total then integer tax is exactly what `Pay` charges.
- `handlers/admin/order/payment.ts` (`Pay`), `app/api/gatewaies/tabby/route.ts`, `handlers/gatewaies/moyasar.ts`, `lib/api/gatewaies/tabby.ts`, and the mobile `tabby-payload`, `confirm` and `result` routes: `withTax(stored total)`.
- `utils/index.ts` `totalAfterTax`: now a display wrapper around `withTax` (string or number, `tax = 0` means already final). It covers order cards, the refund dialog, order info and currency labels without editing the three UI files that have uncommitted edits (`currency-label.tsx`, `order-info.tsx`, legacy currency label).
- `data/wallet.ts` (wallet refund credit) and `data/gatewaies/tabby.ts` (Tabby order history): `withTax` directly.
- `components/legacy/consultants/owner/profile/pricing-section.tsx`: the consultant's "client pays … including tax" hint used unrounded `value × 1.15`, so 150 showed "172.50". It now uses `withTax` and shows "173.00".

**Behaviour changes**

- At the 400 affected prices, checkout and the charge go up by 1 SAR to match cards and refunds (50 → 58).
- With coupons, checkout now shows the rounded-price figure that is charged (205 SAR at 51% → 115).
- The tax rate is the constant `TAX_PERCENT = 15`. The `finance.tax` setting (`getFinanceConfig`, from the settings table) no longer affects any total. `Pay` still stores `finance.tax` in `payment.tax`. If that setting is ever not 15, stored and applied tax would differ.

**Verified**

- `npm run build`: passes.
- Worked numbers: 150 → checkout 173, charge 173, card and refund 173.00, Moyasar 17300 halalas. 205 at 51% → stored 100, checkout 115, charge 115, card 115.00. 50 → 58 everywhere.

**Needs manual testing on the preview**

- 150 SAR session: checkout shows 173; Moyasar and Tabby charge 173; order card, refund dialog and wallet refund credit show 173.
- 205 SAR session with a 51% coupon: checkout shows 115 and the charge is 115 on web; the mobile Tabby payload and mobile Moyasar check expect 115.
- 50 SAR price (if one exists): 58 on checkout, charge and cards.
- Consultant profile pricing hint: 150 shows "173.00".

# Cleanup phase

Branch `cleanup`, created from local `main` at `228c109` (the hotfix commits; `origin/main` is still `36c4842`).

## 2026-09-30 · Cleanup step 1a: unused files

**Tooling:** `knip.json` added so knip sees the Next.js entry points plus `proxy.ts`, `auth.ts`, `better-auth.config.ts`, `prisma.config.ts`, the Prisma seed and `scripts/`. `docs/`, `lib/generated/` and `backups/` are ignored. knip reported 67 unused files, 8 unused dependencies (7 plus 1 dev), 234 unused exports and 19 unused exported types.

**Who can call code in this repo from outside:** only `app/` pages and routes, and Server Actions (now only `actions/`). Other codebases can't import files from here. Knip already treats routes and pages as entry points, and it follows the two dynamic imports (`bot/button.tsx`, `notification-lazy.tsx`), which are relative. So an unused non-route file has no outside caller.

**Deleted (44 files):**
- `data/campaigns.ts`
- `hooks/fetch.ts`
- `hooks/localStorage.ts`
- `hooks/scroll.ts`
- `hooks/use-mobile.ts`
- `hooks/useOnlineConsultant.ts`
- `hooks/usIsOnline.ts`
- `components/shared/error-notfound.tsx`
- `components/shared/time-picker.tsx`
- `components/shared/video-player.tsx`
- `components/ui/collapsible.tsx`
- `lib/api/sms.ts`
- `lib/upload/actions.ts`
- `lib/upload/provider.ts`
- `lib/upload/server.ts`
- `components/clients/consultants/appointment.tsx`
- `components/clients/consultants/skeleton.tsx`
- `components/clients/forms/coupons.tsx`
- `components/clients/forms/terms.tsx`
- `components/clients/freesessions/skeleton.tsx`
- `components/clients/home/instant.tsx`
- `components/clients/home/test.tsx`
- `components/clients/shared/program-card.tsx`
- `components/clients/shared/whatsapp-btn.tsx`
- `lib/api/uploadthing/core.ts`
- `lib/api/uploadthing/route.ts`
- `lib/site/settings/index.ts`
- `components/clients/home/programs/carousel.tsx`
- `components/clients/home/programs/programs.tsx`
- `components/clients/programs/program/skeleton.tsx`
- `components/clients/sub-pages/event/header.tsx`
- `components/clients/sub-pages/event/no-event.tsx`
- `components/clients/sub-pages/scales/print-btn.tsx`
- `components/legacy/consultants/popup/canvas.tsx`
- `components/legacy/consultants/popup/intro.tsx`
- `components/legacy/layout/events/fireworks.tsx`
- `components/legacy/layout/links/index.tsx`
- `components/legacy/layout/navigation/links.tsx`
- `components/legacy/layout/theme/index.tsx`
- `lib/api/ai/bot/bot.ts`
- `lib/api/uploadthing/delete/route.ts`
- `components/clients/sub-pages/event/discounts/header.tsx`
- `components/clients/sub-pages/event/discounts/skeleton.tsx`
- `components/legacy/consultants/owner/previewProfile/index.tsx`

**Unused but kept:**

- Your uncommitted edits (untouched): `components/shared/date-picker-input.tsx`, `payment-badge.tsx`, `time-input.tsx`, `upload-btn.tsx`; `components/ui/hover-card.tsx`, `slider.tsx`, `tooltip.tsx`; `components/clients/consultants/old-filter.tsx`; `components/clients/home/coupons/carousel.tsx`; `components/clients/sub-pages/marriage-awareness/card.tsx`, `form.tsx`; `components/legacy/consultants/owner/profile/bank-account-form.tsx`.
- Phase 1 foundation, untracked and not wired up yet: `lib/safe-action.ts`, `lib/rate-limit.ts`, `utils/action-errors.ts`, `utils/bot-protection.ts`, `hooks/use-action.ts`.
- Same feature as files you're editing: `components/clients/home/coupons/coupons.tsx`, `components/clients/home/features/marriage-awareness.tsx`, `components/clients/sub-pages/marriage-awareness/payment.tsx`, `product.tsx`.
- Payment UI, unsure whether it's the pre-cutoff transition code: `components/clients/forms/method.tsx`, `components/legacy/layout/gatewaies/tabby.tsx`.

**Pre-cutoff payment transition code:** not found in this repo. Nothing in the payment, order or webhook code mentions a cutoff, transition or removal date; the only `preCutoffTime` is in `cron/reschedule`. All payment files are excluded from this cleanup until you point me to it.

**Found, not changed (`vercel.json` crons that don't match a route):**

- `/api/cron/debounce-cleanup`: no such route.
- `/api/cron/notifications/dispatch`: the route is `/api/cron/mobile/notifications/dispatch`.
- `/api/cron/room/call`: the route is `/api/cron/mobile/room/call`.

These three jobs likely never run.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Home page, consultants list and profile, programs, events and discounts, scales and print, free sessions: pages load with no missing components.
- Chat uploads and profile image uploads (the stray `lib/api/uploadthing` copies are gone; the real ones in `app/api/uploadthing` stay).

## 2026-09-30 · Cleanup step 1b: refund feature removed

**Files changed**

- Deleted `components/legacy/layout/orderCard/refundButton/index.tsx`: `RefundBtn` and its refund dialog.
- `components/legacy/layout/orderCard/index.tsx`: removed the `RefundBtn` import and its `!owner` branch. `PayBtn`'s `!owner` branch is untouched (it was not in scope; it also never renders, since the only `OrderCard` caller passes `owner={true}`).
- `actions/order.ts`: removed the `orderStatusRefund` guard.

**Kept:** `orderStatusRefund` in `data/order/reserveation.ts`. `updateOrderStatus` still calls it for `PaymentState.REFUND`, which is used by the Moyasar and Tabby refund webhooks (`handlers/gatewaies/moyasar-webhook.ts`, `handlers/gatewaies/tabby.ts`).

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Consultant dashboard orders list: cards render as before, with no refund button (there was none before either).

## 2026-09-30 · Cleanup step 1c: dead exports

Done with a TypeScript AST pass over knip's unused-export list:

- A declaration still used inside its own file only loses `export`.
- A declaration used nowhere is deleted, with its leading comments.
- Skipped: files with your uncommitted edits, payment files, shadcn `components/ui`, the Phase 1 foundation files, payment-sounding names, and any name still imported by a kept file (tsc compiles unused files too).

<details><summary>Deleted (122)</summary>

- `app/(pages)/(site)/(sub-pages)/scales/metadata.ts`: `buildResultMetadata`
- `components/legacy/layout/zStatus/index.tsx`: `BadgeStatus`
- `constants/data.ts`: `usageSteps`, `whyus`, `contactUsData`, `information`
- `constants/index.ts`: `iHours`
- `constants/menu.ts`: `subMenu`, `adminMenu`, `managerMenu`, `marketingMenu`, `servicesMenu`, `coordinatorMenu`, `collaboratorMenu`
- `constants/theme/event.ts`: `themeKeys`
- `data/admin/collaboration.ts`: `getCollaboratorById`
- `data/admin/settings/employee.ts`: `getEmployeesByRole`
- `data/admin/settings/finance.ts`: `getFinanceSettings`, `getCouponsState`
- `data/admin/settings/settings.ts`: `setSetting`, `setSettings`, `getAllSettings`, `getSettingValues`
- `data/article.ts`: `getAllPublishedArticles`, `getAllPublishedArticlesIds`, `getArticleTitleByBid`, `getArticleMetaData`
- `data/consultant.ts`: `getConsultantReserved`, `getAllOwnersConsultants`, `getAllOwnersPuslished`, `getAllOwnersPuslishedPreview`, `getOwnerByCids`, `ownerExistbyAuthor`, `getOwnersInfoCid`, `getOwnersInfoByAuthor`, `getOwnerCidNameByAuthor`, `getAvailableOwnersGrouped`, `getAvailableOwnersByTime`, `getDiscountedConsultants`
- `data/coupon.ts`: `getPublishedCoupons`, `getAvailableCoupons`
- `data/discounts.ts`: `getActiveDiscount`, `applyDiscount`
- `data/freesession.ts`: `getAllFreeSessions`, `freeSessionAttendance`
- `data/instant.ts`: `recordUniqueInstantVisitor`, `getTodayInstantStats`, `getInstantStatsRange`
- `data/meetings.ts`: `orderMeetingUrl`, `getMeetingsByCidAndRange`
- `data/preconsultation.ts`: `newPreConsultationSeassion`, `updatePreConsultationSeassion`
- `data/programs.ts`: `getAllPrograms`, `getProgramAvailableConsultants`, `getProgramConsultantsByPrid`
- `data/question.ts`: `getQuestionsInfo`, `getQuestionTitleByQid`
- `data/review.ts`: `reviewsExistByAuthor`, `reviewIsReservedByAuthor`, `getreviewsByAuthor`, `postreview`
- `data/rooms.ts`: `getRoom`, `getParticipants`
- `data/scales.ts`: `OrderScaleFullReport`
- `data/seo.ts`: `siteMapConsultants`, `siteMapArticles`, `siteMapPrograms`
- `data/statistics.ts`: `getHomeStatistics`
- `data/timings.ts`: `getTimingsByCid`, `getTimingsDayByCid`, `getTimingsReservation`
- `data/uploads.ts`: `getUploadedImages`
- `data/user.ts`: `getAllUsers`
- `data/whatsapp.ts`: `getWhatsappContact`, `getWhatsappChat`
- `lib/api/google.ts`: `endMeeting`, `adminCreateMeeting`
- `lib/api/pusher/pusher-client.ts`: `disconnectConsultantClient`
- `lib/api/telegram/telegram.ts`: `telegramCService`
- `lib/notifications/mobile/mobile-notify.ts`: `sendInstantNotification`, `scheduleNotification`
- `lib/notifications/site.ts`: `notificationNewOwner`
- `lib/upload/index.ts`: `UploadDropzone`
- `schemas/chat.ts`: `SendMessageInput`, `Participant`
- `schemas/index.ts`: `Reservation`, `InstantSchema`, `FreeSession`, `ConsultationAnswer`, `discountSchema`, `QuestionSchema`
- `utils/date.ts`: `dateToLabel`, `toNextHalfOrHour`, `getDateAhead`
- `utils/index.ts`: `findTime`, `filterTimesAfter`, `playRoomSound`, `averageRating`
- `utils/phone.ts`: `isValidGulfPhone`, `filterValidGulfPhones`, `shufflePhones`
- `utils/time/index.ts`: `isStillTime`, `DaysAhead`, `TodayOrTomorrow`, `DaysAheadEn`, `TargetDayDate`, `addMinutesToNow`, `availableSoonFilter`, `isMeetingPassed`, `isMeetingStill`, `attendanceTime`, `customITimes`, `checkDateToDays`, `dateToStringAr`, `dateToTime`, `dateToValidString`, `dateToDayEn`, `dateToWeekDay`, `dateToDayAr`, `datetodayNumber`, `isActiveWeekValid`, `isFirstWeekdayOfMonth`

</details>

<details><summary>No longer exported, still used in their own file (35)</summary>

- `actions/site.ts`: `checkIsAnyConsultantOnline`
- `components/legacy/layout/zStatus/index.tsx`: `AdStatus`
- `constants/saudi-banks.ts`: `UNKNOWN_SAUDI_BANK`
- `data/admin/settings/employee.ts`: `getEmployeeInfo`
- `data/admin/settings/settings.ts`: `getSettingsBySubKeysCategory`
- `data/event.ts`: `getActiveDiscountFor`, `Costs`, `PricingResult`, `ResolvedPrice`
- `data/meetings.ts`: `SessionFilter`
- `data/online.ts`: `broadcastConsultantBusy`
- `data/rooms.ts`: `createRoom`, `createParticipants`
- `data/verificationTokens.ts`: `getVerificationTokenByPhone`
- `hooks/store/order-notification.ts`: `STORAGE_KEY`
- `hooks/zustand/order-notification.ts`: `Palette`, `RawOrder`, `NotifEntry`
- `lib/api/ai/ai.ts`: `Ai`
- `lib/api/ai/bot/index.ts`: `oExtractJson`
- `lib/api/whatsapp/index.ts`: `WhatsappSendResult`
- `lib/notifications/mobile/send-campaign.ts`: `SendCampaignInput`
- `lib/notifications/mobile/send-notification.ts`: `SendNotificationInput`
- `lib/notifications/mobile/test-categories.ts`: `TestCategoryPreset`
- `schemas/chat.ts`: `sendMessageSchema`, `participantSchema`
- `utils/admin/encryption.ts`: `encryptToken`
- `utils/event.ts`: `round`
- `utils/phone.ts`: `normalizePhone`, `checkGulfPhone`, `PhoneCheck`
- `utils/time/index.ts`: `incrementD`, `meetingTime`, `dateToDbDay`
- `utils/user.ts`: `cooldown`

</details>

**Dead code left in files with your uncommitted edits (58), untouched:**

- `components/legacy/layout/section/index.tsx`: `ZSection`
- `components/legacy/layout/shadcnM/dialogWithoutX.tsx`: `DialogPortal`, `DialogOverlay`
- `components/legacy/layout/zDialog/index.tsx`: `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- `components/shared/categories-badge.tsx`: `Props`
- `components/shared/icon-label.tsx`: `Props`
- `components/shared/link-button.tsx`: `LinkButtonProps`
- `components/ui/badge.tsx`: `badgeVariants`
- `components/ui/calendar.tsx`: `CalendarDayButton`
- `components/ui/card.tsx`: `CardAction`
- `components/ui/carousel.tsx`: `CarouselPrevious`, `CarouselNext`
- `components/ui/command.tsx`: `CommandDialog`, `CommandShortcut`, `CommandSeparator`
- `components/ui/dialog.tsx`: `DialogOverlay`, `DialogPortal`
- `components/ui/dropdown-menu.tsx`: `DropdownMenuPortal`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`
- `components/ui/field.tsx`: `FieldLegend`
- `components/ui/form.tsx`: `useFormField`
- `components/ui/input-otp.tsx`: `InputOTPSeparator`
- `components/ui/pagination.tsx`: `PaginationLink`, `PaginationPrevious`, `PaginationNext`
- `components/ui/popover.tsx`: `PopoverAnchor`
- `components/ui/scroll-area.tsx`: `ScrollBar`
- `components/ui/select.tsx`: `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- `components/ui/sheet.tsx`: `SheetFooter`
- `components/ui/toast.tsx`: `ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`, `ToastDescription`, `ToastClose`, `ToastAction`
- `lib/api/gatewaies/iban.ts`: `normalizeIban`, `hasValidIbanChecksum`, `getBankCodeFromIban`, `IbanCheck`
- `schemas/consultant/profile.ts`: `isCertRequired`, `dateToYears`

**Dead code left in payment code and shadcn primitives (30), untouched:**

- `components/ui/use-toast.ts`: `reducer`, `useToast`
- `data/admin/settings/finance.ts`: `getPaymentMethods`
- `data/order/reserveation.ts`: `getReservationById`, `getReservationPidByOid`, `getAllOrders`, `getAllOrdersDesc`, `getAllOrdersByAuthor`, `getAllOwnersOrdersByAuthor`, `getAllOrdersByAuthorAndMonth`, `getAllOwnersOrdersByAuthorAndMonth`, `getPaidOwnersOrdersByAuthorAndRange`, `getPaidOwnersOrdersByCidAndRange`, `getReservationPaymentByOid`, `orderStatusPaid`, `orderStatusHold`, `orderStatusRefund`, `alreadyReservedTimes`, `updateOrderPaidByOid`, `getUnpaidOrder`, `cancelOrderByOid`
- `data/wallet.ts`: `payAllByWallet`, `requestUsingWallet`, `adjustWalletCredit`
- `handlers/gatewaies/tabby.ts`: `tabbyRefundWebhook`
- `lib/api/gatewaies/moyasar.ts`: `moyasarPaymentStatus`, `moyasarPaymentDetails`
- `lib/api/gatewaies/tabby.ts`: `tabbyPreScoring`
- `schemas/index.ts`: `PaymentSchema`
- `utils/tax.ts`: `TAX_PERCENT`

**Kept because a kept file still imports them:** `data/coupon.ts#getCouponsForHome`, `utils/index.ts#isEnglish`, `components/shared/unavailable-service.tsx#WeekdayAr`, `components/clients/terms.tsx#TermsContent`, `components/clients/terms.tsx#TermsDialog`, `actions/consultant.ts#saveBankAccount`, `components/legacy/layout/skeleton/spinners/index.tsx#SpinnerEn`

**Not handled by the pass (default exports / grouped exports):** `components/legacy/layout/titles/index.tsx#default`, `lib/upload/index.ts#uploadFiles`

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Every page listed in step 1a, plus login, register and OTP.
- Consultant dashboard: timings, coupons, programs, reviews, dues, profile.
- Booking: consultant, instant, program, discover.
- **Booking times and slots:** unused helpers were removed from `utils/time` and `utils/date`. Pick dates across today and tomorrow, late-night slots and month end.

## 2026-09-30 · Cleanup step 2 (part): totalAfterTax callers

**Files changed**

- `components/clients/sub-pages/event/discount-badge.tsx`, `components/legacy/layout/orderCard/index.tsx`: `withTax(x).toFixed(2)`, the same "173.00" text as before.

**Not done:** `totalAfterTax` can't be deleted yet. Its other four callers have your uncommitted edits:

- `components/clients/shared/currency-label.tsx` (`totalAfterTax(amount, tax ?? 0)`)
- `components/clients/shared/order-info.tsx` (`totalAfterTax(order.payment.total, 15)`)
- `components/legacy/consultants/owner/programs/index.tsx` (`totalAfterTax(price + price * 0.2, tax)`)
- `components/legacy/layout/currency/label/index.tsx`

The replacements to make once those are committed: currency labels use `tax ? withTax(amount) : Math.round(amount)`, then `.toFixed(2)`; the others use `withTax(x).toFixed(2)`. Then delete `totalAfterTax` from `utils/index.ts`.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Order card totals and the event discount badge show the same numbers as before (e.g. 150 → 173.00).

## 2026-09-30 · Cleanup step 2: duplicates in utils/ and lib/ (inventory and proposals, nothing migrated)

### Inventory: 151 exported functions

"Package" is the date library used inside the function. "Callers" counts files that import it.

<details><summary>Full table</summary>

| File | Name | What it does | Package | Callers |
| ---- | ---- | ------------ | ------- | ------: |
| `lib/api/ai/ai.ts` | `aiAcceptReview` | accpet new ratings | none | 1 |
| `lib/api/ai/ai.ts` | `aiAcceptOwners` | accpet new ratings | none | 1 |
| `lib/api/ai/ai.ts` | `aiConsultantSummary` | summarize consultant info | none | 1 |
| `lib/api/ai/bot/debounce.ts` | `enqueueMessage` | safety-net cleanup for rows stuck longer than expected | none | 1 |
| `lib/api/ai/bot/debounce.ts` | `findDueRows` | Find rows due for processing right now — used by the cron job | none | 1 |
| `lib/api/ai/bot/debounce.ts` | `claimDueRow` | Atomically claim a due row: locks it (FOR UPDATE SKIP LOCKED) so two overlapping cron runs can never both process the same phone, then deletes it and returns the queue data in one transaction. | none | 1 |
| `lib/api/ai/bot/debounce.ts` | `cleanStaleDebounceRows` | Safety-net cleanup for rows that never got claimed for some reason | none | 1 |
| `lib/api/ai/bot/index.ts` | `handleBotResponse` | ───────────────────────────────────────────── 📲 WHATSAPP BOT HANDLER ───────────────────────────────────────────── | none | 1 |
| `lib/api/ai/bot/index.ts` | `handleBotReply` | ───────────────────────────────────────────── 💬 WEBSITE CHAT BOT HANDLER ───────────────────────────────────────────── | none | 1 |
| `lib/api/ai/bot/setup.ts` | `AiBot` | (no comment) `AiBot(text: string)` | none | 1 |
| `lib/api/ai/chat-bot.ts` | `SendChatBot` | (no comment) `SendChatBot( message: string, from: string, user?: User, consultant?: Pick<Consultant, "name" \| "cid" \| "gende` | none | 1 |
| `lib/api/ai/chat-guard.ts` | `checkMessageWithAI` | (no comment) `checkMessageWithAI = async (message: string): Promise<boolean>` | none | 1 |
| `lib/api/gatewaies/iban.ts` | `normalizeIban` | (no comment) `normalizeIban(input: string): string` | none | 0 |
| `lib/api/gatewaies/iban.ts` | `hasValidIbanChecksum` | ISO 13616 mod-97 check; processed digit-by-digit to avoid BigInt | none | 0 |
| `lib/api/gatewaies/iban.ts` | `getBankCodeFromIban` | (no comment) `getBankCodeFromIban(iban: string): SaudiBankCode \| null` | none | 0 |
| `lib/api/gatewaies/iban.ts` | `checkSaudiIban` | (no comment) `checkSaudiIban(input: string): IbanCheck` | none | 5 |
| `lib/api/gatewaies/iban.ts` | `formatIban` | Display: "SA46 8000 0543 6080 1125 8781" | none | 2 |
| `lib/api/gatewaies/iban.ts` | `formatIbanInput` | For the input's onChange: keeps "SA" fixed, digits only after it, caps at 24, groups by 4 | none | 2 |
| `lib/api/gatewaies/moyasar.ts` | `createMoyasarCheckout` | create new checkout | none | 1 |
| `lib/api/gatewaies/moyasar.ts` | `moyasarPaymentStatus` | get updated payment | none | 0 |
| `lib/api/gatewaies/moyasar.ts` | `moyasarPaymentDetails` | full payload (status + amount + metadata) for mobile server-side verification | none | 0 |
| `lib/api/gatewaies/moyasar.ts` | `moyasarInvoiceDetails` | full invoice (with its `payments` array) — used to re-verify a payment_refunded webhook against the specific payment id before trusting anything it claims. explicit return type (rather than an inline `as Promise<...>` cast) avoids the "implicitly has type 'any' because it does not have a type annotation and is referenced in its own initializer" (TS7022) error at call sites | none | 2 |
| `lib/api/gatewaies/moyasar.ts` | `moyasarSettlementDetails` | re-fetch the settlement server-to-server — the balance_transferred webhook body doesn't include invoice_url, and we never trust webhook amounts without verifying. explicit return type here too, for the same TS7022 reason as moyasarInvoiceDetails | none | 1 |
| `lib/api/gatewaies/tabby.ts` | `tabbyBody` | create new checkout | none | 1 |
| `lib/api/gatewaies/tabby.ts` | `createTabbyCheckout` | (no comment) `createTabbyCheckout = async ( order: Reservation, total: number, )` | none | 1 |
| `lib/api/gatewaies/tabby.ts` | `capturePayment` | url | none | 1 |
| `lib/api/gatewaies/tabby.ts` | `tabbyPreScoring` | prescoring (is tabby payment available) | none | 0 |
| `lib/api/gatewaies/tabby.ts` | `tabbyPaymentDetails` | re-fetch the payment server-to-server — Tabby's own docs say webhooks are notification-only and to verify via GET /payments/{id} before trusting anything | none | 2 |
| `lib/api/google.ts` | `createGoogleMeeting` | (no comment) `createGoogleMeeting()` | none | 4 |
| `lib/api/google.ts` | `getYouTubeVideos` | (no comment) `getYouTubeVideos(count: number = 5): Promise<Video[]>` | Intl | 1 |
| `lib/api/pusher/pusher-client.ts` | `createPusherClient` | (no comment) `createPusherClient(userId: string): PusherClient` | none | 1 |
| `lib/api/realtime/mint-token.ts` | `mintRealtimeToken` | (no comment) `mintRealtimeToken(userId: string, role: "USER" \| "OWNER" \| "GUEST")` | none | 4 |
| `lib/api/recaptcha.ts` | `verifyRecaptcha` | (no comment) `verifyRecaptcha = async (token: string): Promise<boolean>` | none | 1 |
| `lib/api/room/dispatch.ts` | `dispatchIncomingCall` | looks up the callee's latest voip token and sends through whichever transport they're registered on — returns false if they have no token on file (never opened the app / never granted push) rather than throwing, since a caller not being reachable isn't itself an error | none | 3 |
| `lib/api/room/get-presence.ts` | `getPresence` | answers both questions the ring job needs from one row: is this user currently foregrounded at all, and are they specifically already on this meeting's own screen (in which case nothing should be sent) | none | 1 |
| `lib/api/room/ring-participant.ts` | `ringParticipant` | decides and dispatches whatever this one participant needs, given who they're meeting. forceRing skips the presence check entirely and always sends a real voip ring — used by the t+5min recall, never by the t+0 ring | none | 1 |
| `lib/api/routes/create-get-route.ts` | `createGetRoute` | wraps a data fetcher with app-secret auth, bigint-safe serialization, and error handling | none | 18 |
| `lib/api/routes/create-post-route.ts` | `createPostRoute` | wraps a data mutator with app-secret auth, bigint-safe serialization, and error handling | none | 2 |
| `lib/api/routes/route-factory.ts` | `createGetRoute` | wraps a data fetcher with app-secret auth, dynamic params, bigint-safe serialization, and error handling | none | 9 |
| `lib/api/routes/route-factory.ts` | `createPostRoute` | wraps a data mutator with app-secret auth, dynamic params, bigint-safe serialization, and error handling | none | 15 |
| `lib/api/routes/route-factory.ts` | `createPatchRoute` | wraps a data mutator with app-secret auth, dynamic params, bigint-safe serialization, and error handling | none | 1 |
| `lib/api/routes/route-factory.ts` | `createDeleteRoute` | wraps a data mutator with app-secret auth, dynamic params, bigint-safe serialization, and error handling | none | 1 |
| `lib/api/telegram/telegram.ts` | `newOrdertelegram` | infom me & inform manager 966554117879 or 201014203964 | none | 1 |
| `lib/api/telegram/telegram.ts` | `telegramRefund` | infom me & inform manager 966554117879 or 201014203964 | none | 1 |
| `lib/api/telegram/telegram.ts` | `telegram` | notification orders | none | 1 |
| `lib/api/telegram/telegram.ts` | `telegramAdmin` | zadmin notification | none | 7 |
| `lib/api/telegram/telegram.ts` | `telegramEmployees` | notify reviewer telegram | none | 1 |
| `lib/api/telegram/telegram.ts` | `telegramDocuments` | pdf documents notification | none | 1 |
| `lib/api/telegram/templates/index.ts` | `adminTelegramNewOrder` | templates | none | 1 |
| `lib/api/telegram/templates/index.ts` | `serviceTelegramNewOrder` | (no comment) `serviceTelegramNewOrder = (data: Reservation)` | none | 1 |
| `lib/api/telegram/templates/index.ts` | `managerTelegramNewOrder` | (no comment) `managerTelegramNewOrder = (data: Reservation)` | none | 1 |
| `lib/api/telegram/templates/owner.ts` | `sendReviewerNotification` | (no comment) `sendReviewerNotification = async (consultant: Consultant)` | none | 1 |
| `lib/api/whatsapp/index.ts` | `sendWhatsappTemplate` | Which Cloud API endpoint to hit depends on the WhatsApp template CATEGORY, not on how you feel like sending it: - MARKETING templates -> /marketing_messages  (marketing: true) - UTILITY / AUTHENTICATION / plain text       -> /messages (marketing: false) Sending a marketing-category template through /messages (or vice versa) is what gets flagged/throttled, so this flag should be driven by the template's actual approved category, not set ad hoc per call. | none | 2 |
| `lib/api/whatsapp/index.ts` | `sendWhatsappText` | send text message (always goes through /messages - text messages are session/utility-type, never marketing) | none | 3 |
| `lib/api/whatsapp/logic.ts` | `debouncedTextMessage` | (no comment) `debouncedTextMessage( from: string, fromId: string, fromName: string, text: string, )` | none | 1 |
| `lib/api/whatsapp/logic.ts` | `routeNonText` | (no comment) `routeNonText(from: string, msg: WebhookMessage)` | none | 1 |
| `lib/api/whatsapp/skip-bot.ts` | `shouldSkipBotReply` | (no comment) `shouldSkipBotReply(ctx: SkipContext): boolean` | none | 1 |
| `lib/api/whatsapp/special-replies.ts` | `handleSpecialReply` | Runs all special-reply rules in order. If one matches, its handler fires and this returns true — the caller must stop processing this message entirely (no enqueue, no debounce, no AI call). Returns false if nothing matched, meaning normal flow should continue. | none | 1 |
| `lib/auth/guards.ts` | `sessionUser` | hotfix guards for actions/: ids always come from the session, never from the caller the logged-in user, or null | none | 5 |
| `lib/auth/guards.ts` | `ownConsultantCid` | the logged-in consultant's own consultant id, or null for anyone else | none | 2 |
| `lib/auth/guards.ts` | `isConsultant` | true only for a logged-in consultant | none | 4 |
| `lib/auth/legacy-password-login.ts` | `legacyPasswordLogin` | one-time bridge for existing web accounts logging into mobile for the first time — verifies the legacy bcrypt password, then silently creates both a better auth session and the mobile credential row, no otp needed since the password itself already proves ownership | none | 1 |
| `lib/auth/require-mobile-user.ts` | `requireMobileUser` | resolves the signed-in mobile user from the request's session token throws a 401 HttpError when there is no valid session - every notification route uses this instead of trusting a client-supplied userId | none | 36 |
| `lib/auth/server.ts` | `userServer` | server components | none | 36 |
| `lib/auth/server.ts` | `roleServer` | server components | none | 3 |
| `lib/notifications/mobile/campaign-fanout.ts` | `fanOutCampaign` | turns one campaign into a Notification row per matching user and pushes to every registered device across that whole audience in one batch - used for both instant campaigns and the cron picking up a scheduled one @returns how many users the campaign actually reached | none | 2 |
| `lib/notifications/mobile/mobile-notify.ts` | `pushToUser` | pushes to every device registered for a user, right now | none | 1 |
| `lib/notifications/mobile/mobile-push.ts` | `sendPushNotifications` | sends push notifications through expo's push service in batches of 100, pruning any tokens expo reports as no longer registered @param messages notifications to send, each targeting one expo push token @returns tickets reporting per-message delivery acceptance from expo | none | 4 |
| `lib/notifications/mobile/notify/reservation.ts` | `mobileNotifyOrderConfirmed` | all four order-confirmation notifications: an instant + reminder pair for the client, and an instant + reminder pair for the consultant | none | 1 |
| `lib/notifications/mobile/send-campaign.ts` | `sendCampaign` | single entry point for sending a mass notification to an entire audience (clients, owners, or everyone) - use this from the admin dashboard instead of writing campaign rows directly | none | 1 |
| `lib/notifications/mobile/send-notification.ts` | `sendNotification` | single entry point for creating and sending a notification - use this everywhere instead of touching prisma or the push service directly | none | 4 |
| `lib/notifications/site.ts` | `notificationSecurityOtp` | otp sending | none | 3 |
| `lib/notifications/site.ts` | `notificationNewOrder` | new order notification | none | 1 |
| `lib/notifications/site.ts` | `notificationNewPreConsultation` | new pre-consultation session | none | 1 |
| `lib/notifications/site.ts` | `notificationNewFreeSession` | new free session notification | none | 1 |
| `lib/notifications/site.ts` | `notificationPickNewSession` | program next session selection notification | none | 1 |
| `lib/notifications/site.ts` | `notificationSessionConfirm` | new program session confirm notification | none | 1 |
| `lib/notifications/site.ts` | `notificationReviewReminder` | review reminder | none | 1 |
| `lib/notifications/site.ts` | `notificationScaleReminder` | scale reminder | none | 1 |
| `lib/notifications/site.ts` | `notificationCheckRescheduling` | scale reminder | none | 1 |
| `lib/notifications/site.ts` | `notificationConfirmRescheduling` | scale reminder | none | 1 |
| `lib/notifications/site.ts` | `notificationNewChatMessage` | notify user of chat message | none | 1 |
| `lib/rate-limit.ts` | `rateLimit` | true if the request is allowed; fails open on errors or timeouts | none | 1 |
| `lib/rate-limit.ts` | `getClientIp` | (no comment) `getClientIp(): Promise<string>` | none | 1 |
| `lib/safe-action.ts` | `ok` | (no comment) `ok = <T>(data: T)` | none | 0 |
| `lib/safe-action.ts` | `fail` | (no comment) `fail = <E extends string>(error: E)` | none | 0 |
| `lib/safe-action.ts` | `createAction` | (no comment) `createAction< S extends z.ZodType, const A extends AuthRule, T, E extends string = never, >( config: ActionCon` | none | 0 |
| `lib/site/time.ts` | `timeZone` | time zone modified | date-fns-tz | 36 |
| `utils/admin/dues.ts` | `calculateDues` | calculateDues - does NOT include tax (per request) | none | 3 |
| `utils/admin/encryption.ts` | `decryptToken` | decrypt token | none | 2 |
| `utils/admin/encryption.ts` | `zencryption` | zencryption (simple order id) | none | 7 |
| `utils/admin/encryption.ts` | `zdencryption` | dencryption (simple order id) | none | 7 |
| `utils/admin/encryption.ts` | `encryptionDigitsToUrl` | digits encryption | none | 4 |
| `utils/admin/encryption.ts` | `dencryptionDigitsToUrl` | digits dencryption | none | 3 |
| `utils/admin/payments.ts` | `calculatePayment` | calculate total | none | 6 |
| `utils/app.ts` | `requireAppSecret` | Drop-in guard to ensure the request is coming from your mobile app. Usage in Next.js route: const isApp = requireAppSecret(req); if (isApp instanceof Response) return isApp; // 401 Unauthorized | none | 3 |
| `utils/auth.ts` | `generateOtp` | generate random secure otp 5 digits | none | 1 |
| `utils/date.ts` | `getDayName` | Converts yyyy-MM-dd to Arabic day name @example "2026-01-30" → "الجمعة" | date-fns | 1 |
| `utils/date.ts` | `add25Minutes` | Adds 25 minutes to the provided date (or now) @returns { date: 'yyyy-MM-dd', time: 'HH:mm' } | date-fns | 7 |
| `utils/date.ts` | `addNMinutes` | Adds n minutes to the provided date (or now) @returns { date: 'yyyy-MM-dd', time: 'HH:mm' } | date-fns | 1 |
| `utils/date.ts` | `getDatesAhead` | Returns an array of yyyy-MM-dd dates for N days ahead @example getDatesAhead(3) → [today, +1, +2] | date-fns | 5 |
| `utils/date.ts` | `dateToWeekDay` | get weekday label as WeekDay type of prisma @returns WeekDay | none | 7 |
| `utils/date.ts` | `meetingLabel` | meeting label @param date Date object from form @param time string like "07:00" | date-fns | 5 |
| `utils/date.ts` | `meetingFullLabel` | meeting label @param date string "yyyy-mm-dd" @param time string like "07:00" | date-fns | 2 |
| `utils/date.ts` | `dateLabel` | @param date Date object from form @param time string like "07:00" | date-fns | 5 |
| `utils/date.ts` | `timeLabel` | @param time string like "07:00" or "14:00" @returns "07:00 صباحا" \| "02:00 مساءا" | date-fns | 7 |
| `utils/date.ts` | `dateToString` | convert a JavaScript Date object into an ISO-like date string (YYYY-MM-DD) @param date - JavaScript Date instance (must be valid) @returns string formatted as "YYYY-MM-DD" @example dateToString(new Date(2026, 1, 11)) // "2026-02-11" | none | 5 |
| `utils/date.ts` | `meetingTime` | Determine meeting status @param time current time (HH:mm) @param date current date (YYYY-MM-DD) @param mTime meeting time (HH:mm) @param mDate meeting date (YYYY-MM-DD) @param before minutes before meeting start (default 5) @param after minutes after meeting start (default 35) @returns true if running, false if passed, null if still upcoming | date-fns | 3 |
| `utils/date.ts` | `attendanceTime` | Check if a meeting is within attendance window (15 min before to 35 min after) @param time current time (HH:mm) @param date current date (YYYY-MM-DD) @param mTime meeting time (HH:mm) @param mDate meeting date (YYYY-MM-DD) @returns true if within attendance window, false otherwise | date-fns | 1 |
| `utils/event.ts` | `applyRule` | (no comment) `applyRule = ( value: number, rule:` | none | 1 |
| `utils/event.ts` | `getTheme` | (no comment) `getTheme = (key?: string \| null, overrides?: unknown): Theme` | none | 1 |
| `utils/gatewaies/verify/tabby.ts` | `verifyTabbyPayment` | re-verifies a tabby payment directly against tabby's api | none | 1 |
| `utils/gatewaies/verify/verify.ts` | `verifyMoyasarPayment` | re-verifies a moyasar payment directly against moyasar's api - never trusts the client-reported sdk result alone | none | 1 |
| `utils/gatewaies.ts` | `isMoyasarSettledPaid` | moyasar reports 8 possible statuses — this maps each to how the app should treat it, since "not paid" isn't the same as "failed" | none | 2 |
| `utils/gatewaies.ts` | `isMoyasarDefinitiveFailure` | (no comment) `isMoyasarDefinitiveFailure(status: Status)` | none | 3 |
| `utils/index.ts` | `randomId` | create random id | none | 1 |
| `utils/index.ts` | `isEnglish` | check langauge | none | 2 |
| `utils/index.ts` | `phoneNumber` | validate phone number | none | 11 |
| `utils/index.ts` | `findPayment` | payment statuses | none | 5 |
| `utils/index.ts` | `findPaymentMethod` | payment method | none | 1 |
| `utils/index.ts` | `findCategory` | category | none | 17 |
| `utils/index.ts` | `findUser` | user | none | 1 |
| `utils/index.ts` | `findReview` | category | none | 1 |
| `utils/index.ts` | `findCurrency` | currency | none | 2 |
| `utils/index.ts` | `findConsultantState` | consultant profile status state hidden, hold , published controled by admin | none | 2 |
| `utils/index.ts` | `findApprovalState` | consultant profile status state hidden, hold , published controled by admin | none | 2 |
| `utils/index.ts` | `genderLabel` | gender label | none | 4 |
| `utils/index.ts` | `consultantGenderLabel` | gender label | none | 2 |
| `utils/index.ts` | `totalAfterTax` | total after tax: display wrapper around the shared withTax, no tax math of its own. tax 0 means the amount is already final (currency labels), anything else applies TAX_PERCENT | none | 6 |
| `utils/index.ts` | `htmlToText` | remove html tags | none | 2 |
| `utils/index.ts` | `minutesToRead` | calculate how minutes to read | none | 3 |
| `utils/index.ts` | `orderInfoLabel` | new order info label | none | 4 |
| `utils/index.ts` | `meetingUrl` | meeting url | none | 2 |
| `utils/index.ts` | `findParticipant` | get participant by role | none | 2 |
| `utils/index.ts` | `paymentMethodLabel` | payment method label | none | 1 |
| `utils/index.ts` | `relationLabel` | relation labels | none | 1 |
| `utils/phone.ts` | `maskPhone` | keeps the first 3 and last 4 digits so a token holder can't read the full number | none | 1 |
| `utils/tax.ts` | `withTax` | the one tax calculation for the whole site: checkout, Pay, gateway payloads (web and mobile), webhook and mobile checks, order cards, refund dialog, wallet refunds and tabby order history. integer math, so 150 → 173 everywhere (float math gave 57 or 58 for 50) | none | 13 |
| `utils/time/index.ts` | `meetingDateTime` | ─── functions ─────────────────────────────────────────────────────────────── combines a meeting's separate date + time strings, interpreted as asia/riyadh local time, into a correct utc Date — mirrors the inverse of the existing timeZone() utility (toZonedTime) for consistency | date-fns-tz + date-fns | 1 |
| `utils/time/index.ts` | `meetingLabel` | meetings label | date-fns | 4 |
| `utils/time/index.ts` | `DaysAheadFromToday` | get N days ahead from today | date-fns | 1 |
| `utils/time/index.ts` | `aboveAndLowerTime` | above and lower the current time (offset) | date-fns | 1 |
| `utils/time/index.ts` | `timeToArabic` | time to arabic label | date-fns | 1 |
| `utils/time/index.ts` | `dateToString` | format date to string english | date-fns | 22 |
| `utils/time/index.ts` | `dateTimeToString` | format date time to string | date-fns | 4 |
| `utils/time/index.ts` | `dateToArString` | format date to string arabic | date-fns | 1 |
| `utils/time/index.ts` | `getWeekStartSaturday` | free session | date-fns-tz + date-fns | 2 |
| `utils/user.ts` | `cooldownDays` | days left before a sensitive field can be changed again @param changedAt last change date, null if never changed @returns whole days left (rounded up), 0 when a change is allowed | none | 4 |
| `utils/user.ts` | `cooldownThreshold` | oldest last-change date that still allows a new change | none | 1 |
| `utils/user.ts` | `cooldownMessage` | user facing message when a change is locked @param label field name in arabic @param days days left | none | 3 |
| `utils/utils.ts` | `cn` | (no comment) `cn(...inputs: ClassValue[])` | none | 119 |

</details>

### Date package

The codebase already uses only **date-fns 3.6.0** (with `date-fns-tz` 3.2.0 and `date-fns/locale`): 33 imports of `date-fns`, 2 of `date-fns-tz`, 13 of `date-fns/locale`. There's no dayjs or moment.

**Proposal:** keep date-fns plus date-fns-tz as the only date package. Put all date helpers in `utils/date.ts`, and move `timeZone()` there from `lib/site/time.ts` (it only uses date-fns-tz, so it's client-safe).

### Groups

**Same job, different names**

| Group | Candidates | Proposed canonical |
| ----- | ---------- | ------------------ |
| add minutes | `add25Minutes(date)`, `addNMinutes(date, 25)` (`utils/date.ts`) | `addNMinutes` in `utils/date.ts`; callers use `addNMinutes(d, 25)` (test: identical) |
| days ahead | `getDatesAhead(n, date)` (`utils/date.ts`, 5 callers), `DaysAheadFromToday(n)` (`utils/time`, 1 caller, also returns weekday and label) | `getDatesAhead` with a **required** date (every caller passes `timeZone().iso`-derived dates; the `new Date()` default is wrong on a UTC server between 00:00 and 02:59 Riyadh). `DaysAheadFromToday` keeps its extra fields and is built on it |
| time label | `timeLabel` (`utils/date.ts`), `timeToArabic` (`utils/time`), 4 local `timeLabel` copies that look up `timeOptions` (`reels/page.tsx`, `discover/card.tsx`, `discover/reels.tsx`, `discover/time.tsx`, all with your edits) | **question 2** |
| meeting label | `meetingFullLabel(date, time)` (`utils/date.ts`), `meetingLabel(time, date)` (`utils/time`): same sentence, different time format | **question 3** |
| route factories | `createGetRoute` / `createPostRoute` in `lib/api/routes/create-get-route.ts` and `create-post-route.ts`, plus `createGetRoute` / `createPostRoute` / `createPatchRoute` / `createDeleteRoute` in `route-factory.ts` | `route-factory.ts` (same behaviour plus params); delete the two single files |
| payment method label | `findPaymentMethod(method)`, `paymentMethodLabel(method)` (`utils/index.ts`) | payment code: listed only, not merged |
| id encoding | `zencryption` / `zdencryption`, `encryptionDigitsToUrl` / `dencryptionDigitsToUrl` (`utils/admin/encryption.ts`) | payment and order links: listed only, not merged |
| phone cleanup | `phoneNumber` (`utils/index.ts`, digits only), `normalizePhone` (`utils/phone.ts`, strips spaces, dashes, `+`, `00`) | different rules; keep both until you decide (not a like-for-like merge) |

**Same name, different behaviour**

| Name | Where | Difference |
| ---- | ----- | ---------- |
| `dateToString` | `utils/date.ts` (`toISOString().split("T")[0]`, a UTC date) and `utils/time` (`format(d, "yyyy-MM-dd")`, the runtime's local date) | **question 1** |
| `meetingLabel` | `utils/date.ts` `(date, time)` gives "السبت، 31 يناير 2026 · 11:30 مساءً"; `utils/time` `(time, date)` gives "الجلسة يوم … الساعة …" | different outputs and swapped arguments. Proposed: rename the `utils/date.ts` one to `meetingDateTimeLabel`, and merge the `utils/time` one per question 3 |
| `meetingTime` / `attendanceTime` | `utils/date.ts` (exported), `utils/time` (internal, unused) | identical window logic; the `utils/time` copy and its `parseDateTime` helper are dead code |
| `createGetRoute` / `createPostRoute` | see route factories | same behaviour |

### Date helper test (`docs/tests/compare-date-helpers.ts`)

Run as the server (`TZ=UTC`) and as a browser in Riyadh (UTC+3), on 23:30 / 00:00 / 01:30 / 02:59 Riyadh at a month end and a year end, and on calendar days built three ways (`new Date(y,m,d)`, `parseISO`, `new Date("yyyy-MM-dd")`). The UTC run found 19 differences, the Riyadh run 30.

| Pair | UTC server | Riyadh browser |
| ---- | ---------- | -------------- |
| `dateToString` date vs time | same everywhere | **differs**: `utils/date` returns the previous day for `parseISO` / `new Date(y,m,d)` days, and for real instants between 00:00 and 02:59 Riyadh |
| `getDatesAhead(n)` (default now) vs `DaysAheadFromToday(n)` | **differs** 00:00–02:59 Riyadh (starts a day early) | differs at midnight |
| `getDatesAhead(n, timeZone().iso)` vs `DaysAheadFromToday(n)` | same | same |
| `timeLabel` vs `timeToArabic` | **differs**: "صباحا" vs "صباحاً" | same difference |
| `timeToArabic` vs `timeOptions` lookup | same for listed slots; the lookup falls back to the raw "HH:mm" for times not in `timeOptions` | same |
| `meetingFullLabel` vs `meetingLabel` | **differs**: "الساعة 23:59" vs "الساعة 11:59 مساءً" | same difference |
| `dateToWeekDay` vs `format("EEEE")` rule | same | same |
| `add25Minutes` vs `addNMinutes(25)` | same | same |

**Stopped here as instructed. Questions:**

1. **`dateToString`:** which is correct, the UTC date (`utils/date`) or the local date (`utils/time`)? Recommendation: `utils/time` (`format`). The `utils/date` version shows the previous day in the browser, and its callers include the client booking flows `sub-pages/reschedule/reschedule.tsx` and `sub-pages/sessions/sessions.tsx` (they send `dateToString(date)`), plus question dates in `questions/card.tsx` and `question.tsx`. Server callers (`data/order/reserveation.ts`, the slot-conflict check) give the same answer either way on a UTC server. This may be a live off-by-one bug in rescheduling and session picks; unverified which `Date` the pickers pass.
2. **Time label:** "صباحاً" (`timeToArabic`) or "صباحا" (`timeLabel`)? Recommendation: "صباحاً". It matches "مساءً", which both already use.
3. **Meeting sentence:** raw 24-hour time (`meetingFullLabel`, "الساعة 23:59") or 12-hour Arabic (`meetingLabel`, "الساعة 11:59 مساءً")? Recommendation: 12-hour Arabic, which matches the rest of the site.

### jscpd (`npx jscpd app components lib utils data actions --min-lines 6`)

281 clones, 7601 duplicated lines of 61656 (12.3%). The largest:

| Lines | First | Second |
| ----: | ----- | ------ |
| 211 | `clients/chats/chat.tsx:110-320` | `clients/chats/list/chat.tsx:110-295` |
| 146 | `clients/consultants/reservation/forms/coupons.tsx:31-176` | `clients/instant/reservation/forms/coupons.tsx:31-176` |
| 146 | `clients/consultants/reservation/forms/coupons.tsx:31-176` | `clients/programs/reservation/forms/coupons.tsx:31-176` |
| 127 | `clients/consultants/navigation.tsx:1-127` | `clients/freesessions/navigation.tsx:1-127` |
| 120 | `clients/chats/chat.tsx:466-585` | `clients/chats/list/chat.tsx:450-569` |
| 106 | `clients/consultants/reservation/forms/method.tsx:2-107` | `clients/forms/method.tsx:2-107` |
| 106 | `clients/consultants/reservation/steps/payment.tsx:59-164` | `clients/forms/payment.tsx:49-153` |
| 105 | `clients/consultants/reservation/steps/payment.tsx:59-163` | `clients/sub-pages/marriage-awareness/payment.tsx:45-149` |
| 96 | `clients/freesessions/filter.tsx:58-153` | `clients/sub-pages/event/discounts/filter.tsx:58-153` |
| 93 | `(pages)/(site)/programs/[prid]/page.tsx:8-100` | `(pages)/(site)/programs/reserve/[prid]/page.tsx:8-100` |
| 85 | `clients/consultants/navigation.tsx:21-105` | `clients/programs/navigation.tsx:21-105` |
| 82 | `api/mobile/room/[mid]/ring/route.ts:2-83` | `api/mobile/room/ring/[mid]/route.ts:2-83` |
| 81 | `clients/consultants/reservation/forms/method.tsx:27-107` | `clients/instant/reservation/forms/method.tsx:25-105` |
| 81 | `clients/consultants/reservation/forms/method.tsx:27-107` | `clients/programs/reservation/forms/method.tsx:25-105` |
| 80 | `clients/consultants/navigation.tsx:48-127` | `clients/sub-pages/event/discounts/navigation.tsx:48-127` |
| 79 | `api/mobile/room/[mid]/guard/route.ts:2-80` | `api/mobile/room/guard/[mid]/route.ts:2-80` |
| 72 | `clients/consultants/reservation/search.tsx:1-72` | `clients/coupons/search.tsx:1-72` |
| 71 | `clients/consultants/reservation/steps/details.tsx:75-145` | `clients/forms/details.tsx:67-137` |
| 71 | `clients/forms/payment.tsx:146-216` | `clients/instant/reservation/steps/payment.tsx:138-208` |
| 68 | `clients/consultants/card.tsx:12-79` | `clients/sub-pages/event/discounts/card.tsx:12-79` |
| 67 | `clients/consultants/old-filter.tsx:301-367` | `clients/programs/filter.tsx:278-344` |
| 64 | `clients/consultants/reservation/steps/payment.tsx:165-228` | `clients/forms/payment.tsx:153-216` |
| 62 | `clients/consultants/reservation/steps/payment.tsx:167-228` | `clients/sub-pages/marriage-awareness/payment.tsx:147-208` |
| 58 | `clients/consultants/reservation/stepper.tsx:2-59` | `clients/freesessions/reservation/stepper.tsx:2-59` |
| 56 | `clients/chats/chat.tsx:399-454` | `clients/chats/list/chat.tsx:386-438` |

**Worth extracting (none done, needs your approval):**

1. Chat client: `clients/chats/chat.tsx` and `clients/chats/list/chat.tsx` are about 440 duplicated lines. Proposal: one chat component with a `variant` prop.
2. Reservation coupon forms: `consultants`, `instant` and `programs` `reservation/forms/coupons.tsx` are the same 146 lines three times. Proposal: one shared component.
3. Reservation payment and method steps across consultants, instant, programs, marriage awareness and `forms/`. Proposal: shared step components. **Touches booking and payment UI.**
4. List navigation (`consultants`, `freesessions`, `programs`, `event/discounts` `navigation.tsx`) and filters. Proposal: one pagination/navigation component.
5. Program page and reserve page (`programs/[prid]` and `programs/reserve/[prid]`), 93 lines. Proposal: a shared loader.
6. Mobile room routes `room/[mid]/ring` vs `room/ring/[mid]` and `room/[mid]/guard` vs `room/guard/[mid]`: exact duplicates at two URLs. Proposal: keep one path per endpoint, **after checking which paths the mobile app calls**.
7. `reels/actions.ts` vs `data/reels.ts` (45 lines), and the `login` vs `register` and `reset-password` vs `verify-otp` form handlers.

**Needs manual testing on the preview:** nothing yet; no behaviour changed in this entry.

## 2026-09-30 · Cleanup repair: committed tree didn't build

**What happened:** the step 1a–1c builds ran on the working tree, which included your uncommitted edits. Your edited versions of `components/consultant/instant/index.tsx`, `app/not-found.tsx` and `app/(pages)/(consultants)/dashboard/page.tsx` no longer import three files, so knip marked them unused and I deleted them. The committed versions still import them. When GitHub Desktop stashed your edits (`stash@{0}`, "On cleanup") and the tree became clean, `npm run build` failed. Steps 1a–1c were **not** verified on the committed tree as the log claimed.

**Restored from `228c109`** (still imported by committed code): `hooks/useOnlineConsultant.ts`, `components/shared/error-notfound.tsx`, `components/legacy/consultants/popup/intro.tsx`, `components/legacy/consultants/popup/canvas.tsx` (imported by `intro.tsx`). `lib/api/pusher/pusher-client.ts` goes back to its pre-1c version, since `disconnectConsultantClient` is used by the restored hook.

**Checked:** no other 1c removal is imported by the committed tree or by the stashed versions of your files, and every import in the tree resolves.

**From here on:** your edits are stashed, so builds run on the committed tree. These files become dead again once your edits are committed; list them for a later knip run.

**Verified**

- `npm run build` on the clean committed tree: passes.

**Needs manual testing on the preview**

- Consultant instant page (`components/consultant/instant`), the 404 page, and the consultant dashboard intro popup.

## 2026-10-01 · Cleanup step 2, decision 1: fix, instant bookings after midnight got yesterday's date

**Picker check (reschedule and session pick):** both pass a date from `components/clients/shared/pick-date-time.tsx`, which builds it as `new Date("yyyy-MM-dd")` (UTC midnight of the chosen day). Both old `dateToString` versions return the chosen day for that input in a Riyadh browser (test rows `new Date("yyyy-MM-dd")`: same). **No off-by-one there for users in Saudi time.** (A browser west of UTC would get the day before from the `format()` version.)

**The real bug:** instant booking.

- The instant form sends `date: iso` from `addNMinutes()`, the actual moment "now + a few minutes".
- `reserveInstant` (`data/online.ts`) stored `date: dateToString(data.date)` using `format()` on a UTC server, and used the same value in the slot-conflict check and in the "already booked" message.

**How it showed up for users:** an instant session booked between 00:00 and 02:59 Riyadh was saved with the **previous day's date** and the correct time. For example, booked 01:30 on 1 Feb, it was stored as 31 Jan 01:30, a full day in the past. So the session would appear as already passed:

- It sorts under past sessions.
- The room time checks treat it as over, so joining at the booked time is likely refused.
- Time-based reminders don't fire.
- Its slot conflict was checked against the wrong day.

Bookings from 03:00 to 23:59 were correct.

**Files changed**

- `utils/date.ts`: new `riyadhDateString(date)` = `formatInTimeZone(date, "Asia/Riyadh", "yyyy-MM-dd")`.
- `data/online.ts`: the three `dateToString(data.date)` calls in `reserveInstant` now use `riyadhDateString`.

**Checked on a UTC server:**

| Riyadh time | Before | After |
| ----------- | ------ | ----- |
| 00:05, 01:30, 02:59 on 1 Feb | 2026-01-31 | 2026-02-01 |
| 23:55 on 31 Jan, 03:00 on 1 Feb | correct | unchanged |
| 00:10 on 1 Jan 2027 | 2026-12-31 | 2027-01-01 |

**Caveat, users outside UTC+3:** the form's `iso` comes from `toZonedTime` in the browser. In a browser that isn't on UTC+3, that `Date` is shifted. For example, a browser on UTC now gets the next day for bookings between 21:00 and 23:59 Riyadh; before this fix it was correct. For Saudi (and KW/QA/BH) browsers the fix is exact. A fully zone-proof fix would have the form send the Riyadh `yyyy-MM-dd` string it already computes (`addNMinutes().date`) instead of the `Date`. That's a form contract change; not done.

**Verified**

- `npm run build` on the committed tree: passes.

**Needs manual testing on the preview**

- Book an instant session after midnight Riyadh (or temporarily on a staging DB): the stored meeting date is today, it shows as upcoming, and the room opens at the booked time.
- An instant booking in the evening is unchanged.

## 2026-10-01 · Cleanup step 2, decision 4: every date helper in utils/date.ts (move only)

**Files changed**

- `utils/date.ts`: now holds every date helper, using date-fns and date-fns-tz only, with no server imports.
  - Moved in: `timeZone` (from `lib/site/time.ts`); `meetingDateTime`, `DaysAheadFromToday`, `aboveAndLowerTime`, `timeToArabic`, `dateTimeToString`, `dateToArString`, `getWeekStartSaturday` (from `utils/time`).
  - New names: `calendarDayToString` (the old `utils/time` `dateToString`) and `meetingSentence(date, time)` (the old `utils/time` `meetingLabel(time, date)`).
  - `DaysAheadFromToday` is now built on `getDatesAhead` and `dateToWeekDay`; the comparison test showed identical output.
- `utils/time/index.ts` and `lib/site/time.ts`: re-exports only, with the old names, argument order and behaviour. They're kept because 7 to 9 of your stashed files import them. I checked every name imported from these paths, in committed files and in your stash, and all are covered.
- Dropped: the dead internal `meetingTime` and `parseDateTime` copies in `utils/time`, which weren't exported or used.

**Behaviour:** unchanged; this commit only moves code.

**Verified**

- `npm run build` on the committed tree: passes.

**Needs manual testing on the preview**

- Booking times and slots: date strip, time slots after 25 minutes, late night, month end.
- Consultant timings week and the free-session week start.

## 2026-10-01 · Cleanup step 2, decisions 2 and 3: time label and meeting sentence

**Files changed**

- `utils/date.ts`:
  - `timeLabel` is now `timeToArabic`, so "صباحاً" / "مساءً" everywhere (was "صباحا").
  - `meetingFullLabel(date, time)` is now `meetingSentence`, the 12-hour form: "الجلسة يوم … الموافق yyyy-MM-dd الساعة 02:00 مساءً" (was "الساعة 14:00").
  - Both old names stay as aliases, so their callers, including your stashed files, get the decided wording without edits.

**Where it shows**

- `timeLabel`: the booking payment steps (consultant, instant, program, marriage awareness, `forms/payment.tsx`) and the WhatsApp notification parameters in `lib/notifications/site.ts`. That's parameter text only; no template changes.
- `meetingFullLabel`: the meetings list (`components/clients/meetings/index.tsx`) and free-session meetings (`components/clients/freesessions/meetings.tsx`).

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Booking payment step: the time shows "…صباحاً" / "…مساءً".
- The meetings and free-session meetings lists show the 12-hour sentence.
- A WhatsApp booking notification shows "صباحاً".

## 2026-10-01 · Cleanup step 2, decision 1: fix, free sessions after midnight got yesterday's date

**How the booking flows send their date:**

| Flow | Date sent to the server | Result |
| ---- | ----------------------- | ------ |
| Consultant | day click → `new Date("yyyy-MM-dd")` (UTC midnight) | correct |
| Program | `new Date(Date.UTC(y, m, d))` | correct |
| Discover | `new Date("yyyy-MM-dd")` | correct |
| Reschedule, session pick | `PickDateTime`, `new Date("yyyy-MM-dd")` | correct |
| Instant | `addNMinutes().iso`, the actual moment | fixed in `140c6d1` |
| Free session | `timeZone().iso` from the browser, the actual moment | **bug, fixed here** |

**The bug:**

- `data/freesession.ts` stored `date: dateToString(data.date)` using `format()` on the UTC server. So a free session booked between 00:00 and 02:59 Riyadh was saved with the previous day's date.
- The slot-conflict check just above it uses Riyadh today (`dateToString(timeZone().iso)`), so the check and the stored date also disagreed in that window.

**How it showed up for users:** a free session booked right after midnight was saved a day early. It would show as already passed, with no reminder, and no working join window at the booked time. The consultant's slot for the real day stayed open for double booking.

**Files changed**

- `data/freesession.ts`: `date: riyadhDateString(data.date)`. The conflict check is unchanged; it was already Riyadh today.

**Build note:** clean-tree builds log "took more than 60 seconds, retrying" for the cron route handlers during static generation. They succeed on retry and end up dynamic (`ƒ`). This predates this change: the same messages appeared in the two builds before it.

**Verified**

- `npm run build`: passes.

**Needs manual testing on the preview**

- Book a free session after midnight Riyadh: the stored date is today and it shows as upcoming.
- A daytime free session is unchanged.

## 2026-10-01 · Cleanup step 2, decision 1: callers moved to the split date functions

**Rule applied to every `dateToString` caller outside your stashed files and the payment/order files:**

- Instants (`created_at`, `createdAt`, `due_at`, `new Date()`): `riyadhDateString`. These are articles (article, recommendation, card), questions (card, question), dues (dialog, list), the order card, `data/review.ts` log lines, and the Telegram order templates.
- Calendar days the user picked: `calendarDayToString`. These are `sub-pages/reschedule/reschedule.tsx` and `sub-pages/sessions/sessions.tsx`.
- `dateToString(timeZone().iso)` becomes `timeZone().date` (`data/freesession.ts`), the same value.
- `meetingLabel(time, date)` from `utils/time` becomes `meetingSentence(date, time)`, arguments swapped: `lib/notifications/site.ts`, `lib/api/telegram/templates/index.ts`, `lib/api/ai/bot/index.ts`, owner free-session list.
- Every other import from `@/lib/site/time` or `@/utils/time` in those 52 files now comes from `@/utils/date` (46 files changed; the rest were already on it).

**Behaviour changes (bug fixes):**

- Created and due dates rendered on the server (articles, dues, order card, Telegram templates) or with `toISOString` (questions) showed the **previous day** for anything created between 00:00 and 02:59 Riyadh. They now show the Riyadh day.
- Reschedule and session pick: identical for browsers on UTC+3. In a browser west of UTC, `calendarDayToString` gives the day before for the picker's UTC-midnight dates, where `toISOString` did not. A zone-proof picker would build local-midnight dates (`parseISO`), but `pick-date-time.tsx` is one of your stashed files.

**Not moved (still on the old paths or names, same behaviour):**

- Your stashed files.
- Payment and order files: `data/order/reserveation.ts`, `data/order/program.ts` (`dateToString(data.date)`, UTC-midnight dates, so correct), `data/wallet.ts`, `data/gatewaies/moyasar.ts`, `handlers/admin/order/payment.ts`, and the five booking payment step components. The intended function for each: server `data.date` → `riyadhDateString` (same result for UTC-midnight days); `new Date()` logs → `riyadhDateString`.

**Verified**

- `npm run build` on the committed tree: passes.
- No stashed (protected) file touched.

**Needs manual testing on the preview**

- Created dates on articles, questions, dues and order cards (check one created just after midnight Riyadh).
- Telegram new-order message: booking date and meeting sentence.
- WhatsApp booking, reminder and reschedule notifications: the meeting sentence is 12-hour.
- Reschedule and session pick: the chosen day is saved as picked.

## 2026-10-01 · Cleanup step 2, decision 5: the four identical merges

**Files changed**

- **Route factories:** `lib/api/routes/create-get-route.ts` and `create-post-route.ts` deleted. Their 20 importers (all under `app/api/mobile/`) now use `route-factory.ts`. The old `createGetRoute` answered unexpected errors with `{ error: "failed to fetch" }` while the route-factory default is `"failed to process request"`, so the 18 migrated `createGetRoute` calls pass `{ errorMessage: "failed to fetch" }` and the mobile app sees the same responses. `createPostRoute` had the same default in both. One importer is the stub `mobile/reservations/instant/route.ts` (POST commented out); only its import line changed.
- **add25Minutes:** `components/clients/discover/discover.tsx` uses `addNMinutes(initial, 25)`. `add25Minutes` stays in `utils/date.ts` as a deprecated one-line alias because 6 of your stashed files call it: reels page, consultant, program and free-session date-time steps, `pick-date-time.tsx`, and the marriage-awareness form.
- **getDatesAhead:** the `date` argument is now required. Every caller, in the tree and in your stash, already passes one, so no call site changed.
- **Dead `meetingTime` copy:** removed in the move commit (`1f96b15`).

**Verified**

- `npm run build`: passes (one run was cut off by my own `timeout` wrapper at page collection; rerun without it, exit 0).

**Needs manual testing on the preview**

- Mobile app: consultants, programs, scales, notifications (list, read, unread count, send), account profile and sessions, online list, realtime token. Normal responses are unchanged; forced errors still say "failed to fetch".
- Discover: date strip and "now + 25 minutes" first slot.

## 2026-10-01 · Cleanup step 2: date test, dependencies, later phase, room paths, status

**Date test (decision 4)**

`docs/tests/compare-date-helpers.ts` now checks the split functions:

- Instants: `riyadhDateString` gives the Riyadh day.
- Picked days, built three ways (`new Date("yyyy-MM-dd")`, `Date.UTC`, `parseISO`): `calendarDayToString` gives the picked day.
- Zoned "now": `timeZone().date`.
- Every old name equals its canonical function: `timeLabel` / `timeToArabic`, `meetingFullLabel` and `utils/time` `meetingLabel(t, d)` / `meetingSentence`, `add25Minutes` / `addNMinutes(25)`, `utils/time` `dateToString` / `calendarDayToString`, `lib/site/time` / `utils/date` `timeZone`, `DaysAheadFromToday` / `getDatesAhead`.

Result as the UTC server and as a Riyadh browser: **0 wrong, 0 differences**. The UTC run also shows why the split matters: for instants between 00:00 and 02:59 Riyadh, `calendarDayToString` and the legacy `dateToString` both give the previous day; only `riyadhDateString` is right.

**Dependencies (decision 6): not done, blocked**

`package.json` and `package-lock.json` have your uncommitted edits (the `botid` addition, now in `stash@{0}`). Removing `@tanstack/react-table` and `@radix-ui/react-collapsible` now would change the same files and could conflict when you restore the stash.

Options:

- (a) Commit your `botid` change, then I remove both in one commit.
- (b) I remove them now on this branch, and you resolve a small conflict when restoring the stash.

Neither package is imported anywhere; `components/ui/collapsible.tsx` was deleted in step 1a.

**Later phase: duplicate extraction (decision 7, nothing done)**

From jscpd: 281 clones, 12.3% of lines.

1. Chat client: `components/clients/chats/chat.tsx` vs `chats/list/chat.tsx`, about 440 lines. Proposal: one component with a `variant` prop.
2. Reservation coupon forms: `consultants`, `instant` and `programs` `reservation/forms/coupons.tsx`, the same 146 lines three times.
3. Reservation payment and method steps across consultant, instant, program, marriage awareness and `forms/` (booking and payment UI).
4. List navigation and filters: `consultants`, `freesessions`, `programs`, `event/discounts` `navigation.tsx` / `filter.tsx`.
5. `programs/[prid]` vs `programs/reserve/[prid]` pages, 93 lines.
6. `reels/actions.ts` vs `data/reels.ts` (45 lines); login vs register and reset-password vs verify-otp form handlers.
7. The mobile room duplicates below. Kept by decision.

**Mobile room paths (decision 8): both kept**

| Endpoint | Path A | Path B |
| -------- | ------ | ------ |
| guard (GET) | `/api/mobile/room/[mid]/guard` | `/api/mobile/room/guard/[mid]` |
| ring (POST) | `/api/mobile/room/[mid]/ring` | `/api/mobile/room/ring/[mid]` |

- Each pair is byte-identical, and all four files were added in the same commit (`26d1c26`, 2026-09-04, "apis mobile").
- Nothing in this repo says which app version calls which path: there's no app-version header, user-agent check or path reference outside the routes themselves.
- **Can't tell from here.** To find out, filter Vercel request logs by these four paths (and user-agent), or log an `x-app-version` header in the route factory.

**Other notes**

- `CLAUDE.md` isn't in the working tree any more. It was untracked, so GitHub Desktop moved it into `stash@{0}` together with my manifest-check fix. Restoring the stash brings both back.
- Commit `aec3a5b` was interrupted mid-command and recorded only the two deleted route-factory files. Amended to `a34b926` with the 23 files it was meant to contain (the exact state that built with exit 0), so no commit on this branch is broken.
- Still on the deprecated paths and names (same behaviour): your stashed files, and the payment and order files listed in the caller-migration entry. `utils/time/index.ts` and `lib/site/time.ts` can be deleted once those import `@/utils/date`; `totalAfterTax` once its four stashed callers use `withTax`.

# Release prep on main (after merging hotfix + cleanup + Ziad's edits)

**Pre-existing blocker on `main`:** `npm run build` fails type-checking in files added by `dd122be` ("after claudie code"):

- `lib/api/ai/article/articles.tsx:153`: `importArticle()` is `Promise<void>`, but the result is stored as `ImportResult`.
- `lib/api/ai/article/index.ts:4` and `specialties.ts:3`: `@google/genai` isn't in `package.json` or `node_modules`.

These are the only 3 `tsc` errors in the repo. Nothing imports these files yet, so they aren't bundled. Each commit below was verified by building with `lib/api/ai/article` temporarily added to `tsconfig` `exclude` (reverted before committing), plus `tsc` showing only those 3 errors.

## 2026-10-01 · Item 1: TAX_PERCENT is the only tax rate

**Files changed**

- `handlers/admin/order/payment.ts` (`Pay`): the four `finance.tax` uses are now `TAX_PERCENT`: the `calculatePayment` call and the `tax` passed to `reserveConsultant`, `reserveProgram` and `reserveInstant`. So `payment.tax` on new orders stores the rate actually applied. `finance.commission` is unchanged.

**Every place that still reads the tax setting (none affects a charge):**

| Where | What it does with it |
| ----- | -------------------- |
| `data/admin/settings/finance.ts` `getFinanceConfig()` | reads `finance.tax` from the settings table (default 15) and returns it in the config |
| `data/admin/settings/finance.ts` `getTaxCommission()` | reads `finance.tax` (`\|\| 15`) |
| `app/api/mobile/consultants/[cid]/reservation-info/route.ts` | returns the whole `finance` object, **including `tax`, to the mobile app**. If the app computes prices from it, a setting other than 15 would show a different price from what's charged. Unverified what the app does with it. |
| `components/clients/consultants/reservation/reserve.tsx`, `components/clients/programs/reservation/reserve.tsx`, `components/clients/instant/index.tsx`, `app/(pages)/(reels)/discover/page.tsx` | load `getFinanceConfig()` and pass `finance` down. The payment steps hand `finance.tax` to `usePaymentCalculation`, which ignores it (`withTax`). |
| `components/clients/consultants/reservation/steps/payment.tsx`, `components/clients/forms/payment.tsx`, `components/clients/instant/reservation/steps/payment.tsx`, `components/clients/programs/reservation/steps/payment.tsx`, `components/clients/sub-pages/marriage-awareness/payment.tsx` | `tax: finance.tax` into `usePaymentCalculation` (ignored) |
| `app/(pages)/(consultants)/dashboard/programs/page.tsx` | `tax={finance?.tax ?? 15}` from `getTaxCommission()` into `totalAfterTax`, which only checks for 0 |
| `data/reconciliation.ts` | `settings.tax` from `getTaxCommission()` only in the order's info log text; the stored `payment.tax` is a hard-coded `15` (= `TAX_PERCENT`) |
| `app/api/mobile/reservations/instant/route.ts` | `body.finance.tax`, in commented-out code |

**Verified**

- Build (with the WIP exclusion): passes.

**Needs manual testing on the preview**

- A new booking's `payment.tax` is 15 and the charge is unchanged (150 → 173).

## 2026-10-01 · Item 2: transition for orders charged by the old formulas (remove after 2026-10-09)

**Files changed**

- `utils/tax.ts`: `LEGACY_CHARGE_CUTOFF` (placeholder `2026-10-02T00:00:00+03:00`, **set it to the deploy time**) and `acceptedChargeAmounts(total, createdAt)`.
  - New orders accept `withTax(total)` only.
  - Orders created before the cutoff also accept every whole number `round(t × 1.15)` can give for `t` within ±0.5 of the stored total (the unrounded price wasn't stored), computed with the old float expression, plus the old `totalAfterTax(total)`.
- `data/order/reserveation.ts` `getReservationPaymentByPid`: also selects the order's `created_at`.
- Amount checks now use the accepted list:
  - `app/api/gatewaies/tabby/route.ts` (Tabby webhook)
  - `handlers/gatewaies/moyasar.ts` (Moyasar callback, in halalas; its alert now says "halalas", which it was)
  - `utils/gatewaies/verify/verify.ts` (`verifyMoyasarPayment` takes `expectedTotals: number[]`) via `mobile/reservations/[oid]/confirm`
  - `mobile/reservations/[oid]/result`
- Every transition line is marked `// remove after 2026-10-09`.

**Checked:**

| Case | Stored total | Old charge | Accepted before cutoff | Accepted after |
| ---- | ------------ | ---------- | ---------------------- | -------------- |
| 150 SAR | 150 | 173 | 172, 173 | 173 |
| 50 SAR (float case) | 50 | 57 | 57, 58 | 58 |
| 205 SAR at 51% | 100 | 116 | 114, 115, 116 | 115 |

**Cutoff direction:** a later value only lets pre-deploy orders match a slightly wider set. An earlier value can send payments for orders created just before the deploy to HOLD with a Telegram alert.

**Not covered (question):** before the hotfix, the mobile Tabby payload charged the **pre-tax** `payment.total`, and mobile Moyasar was checked against it. If any mobile payment from before the deploy is still open, it would go to HOLD. Add `total` itself to the pre-cutoff list if you want those to pass.

**Verified**

- Build (with the WIP exclusion): passes.

**Needs manual testing on the preview**

- An order created before the cutoff and paid after the deploy (Tabby sandbox or Moyasar test) becomes PAID with its old amount.
- A new order with a mismatching amount goes to HOLD with an alert.

## 2026-10-01 · Item 3: vercel.json crons

**Files changed**

- `vercel.json`:
  - `/api/cron/notifications/dispatch` → `/api/cron/mobile/notifications/dispatch` (`* * * * *`)
  - `/api/cron/room/call` → `/api/cron/mobile/room/call` (`*/5 * * * *`)
  - `/api/cron/debounce-cleanup` removed. There's no route for it, and its job (`cleanStaleDebounceRows()` in `lib/api/ai/bot/debounce.ts`) already runs every minute inside `/api/cron/wa-debounce-process`.
  - All 8 remaining paths resolve to a route.

**Live behaviour change:** the two corrected crons have **never run in production** (their paths didn't exist). After deploy, scheduled mobile push notifications start dispatching every minute, and session ring calls go out every 5 minutes. Anything queued in the past (unsent `Notification` rows, campaigns due) may go out on the first run.

**CRON_SECRET check, every cron route**

All 8 compare the `authorization` header to `` `Bearer ${process.env.CRON_SECRET}` `` and return 401 otherwise: `cancel-orders`, `mobile/notifications/dispatch` (GET and POST), `mobile/room/call` (GET and POST), `reschedule`, `shuffle/consultants`, `users/unverified`, `wa-debounce-process`, `whatsapp-campaigns`. **None missing.**

Weaknesses, not changed:

- If `CRON_SECRET` is ever unset, the expected value is `"Bearer undefined"`, and a request sending exactly that passes.
- The compare isn't constant-time.

A shared `isCronRequest()` that rejects when the secret is unset and uses `timingSafeEqual` would fix both.

**Verified**

- No source changed, so the build is the same as item 2's (passes).
- `vercel.json` parses and every path exists.

**Needs manual testing on the preview / after deploy**

- Vercel → Settings → Cron Jobs lists the 8 jobs with the corrected paths.
- Run `mobile/notifications/dispatch` and `mobile/room/call` once from the dashboard: 200, no unexpected flood of old notifications.

## 2026-10-01 · Item 4: clean build, manifest, merge regression check

**`npm run build` on the clean committed tree: FAILS** at type-check (compilation succeeds). All 3 `tsc` errors are in files added by `dd122be` ("after claudie code"), not by the hotfix or cleanup:

1. `lib/api/ai/article/articles.tsx:153`: `importArticle()` (`article.ts`) returns `Promise<void>`, but its result is stored as `ImportResult`.
2. `lib/api/ai/article/index.ts:4`, `lib/api/ai/article/specialties.ts:3`: `@google/genai` isn't in `package.json` or `node_modules`.

**A deploy of `main` fails until this is fixed.** Options:

- (a) Finish the feature: install `@google/genai` (a dependency change, needs your OK), have `importArticle` return its result, and move the three server files behind `actions/` with `server-only` (see below).
- (b) Move `lib/api/ai/article/` out of the deployed tree, or add it to `tsconfig` `exclude`, until it's ready.

Nothing imports these files today, so they aren't bundled.

**Manifest check (CLAUDE.md):** prints only `"data/event.ts"` (its `"use cache"` registration). No Server Action is exposed outside `actions/`.

**Did the merge bring back anything the hotfix removed?**

- **`"use server"` in `data/`, `handlers/`, `lib/`: yes, 3 new files.**
  - `lib/api/ai/article/article.ts`, `index.ts` and `specialties.ts` start with `"use server"`, and the client components `articles.tsx` / `spec.tsx` import them directly.
  - They're not exposed today (nothing renders those components). The moment a page does, `importArticle`, `bulkImportArticles`, `bulkAddArticleSpecialties` and the image generators become **public, unauthenticated endpoints** that write articles and call a paid AI API.
  - They need the hotfix pattern: `import "server-only"` plus guarded wrappers in `actions/` (admin only).
- Elsewhere outside `actions/`: only `app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx`, known; it exposes its own page component, which checks the session.
- **Imports of deleted files: none.** Every import in the tree resolves.
- **Hotfix guards: all present.** 17 checks: OTP masking and attempt limit, session-bound account edits, `getUserById` omits the password, `uploadthing/delete` secret, chat route participant check, chats list and pusher session, Tabby and Moyasar server-to-server checks, Moyasar webhook secret, cancel-page owner guard, home notification masking, chat upload participant check, both Riyadh-date fixes, chat sender guard.
- **Client imports of server folders:** `handlers/admin/recaptcha.ts` (client reCAPTCHA helper, expected until the reCAPTCHA phase) and `lib/api/gatewaies/iban.ts` (pure, no env or Prisma, safe in the browser; by the plan it belongs in `utils/`).

**Section 9 of `docs/security-refactor.md`:** not ticked. CLAUDE.md requires a passing build.

## 2026-10-01 · Removal 1: article AI feature deleted

**Files changed**

- Deleted `lib/api/ai/article/`: `article-image.txt`, `article.ts`, `articles.tsx`, `index.ts`, `spec.tsx`, `specialties.ts`. These held article import, bulk import, specialty bulk-add, and Gemini image generation and upload.
- No other file imported them: no route, page or component, and nothing in `package.json`. The only "article-image" hits elsewhere are image `alt` text.
- `@google/genai` was never in `package.json`, so there was nothing to remove.
- `GEMINI_APIKEY` was read only inside the deleted files; it can be removed from Vercel env if nothing else uses it.
- Home page files (`components/clients/home/index.tsx`, `categories.tsx`, `home-cards.tsx`, also from `dd122be`) never imported the feature. Left unchanged.

**Effect:** the three `"use server"` files in `lib/` and the three `tsc` errors are gone.

**Verified**

- `npm run build` on the clean tree, nothing excluded: **passes** (first time since the merge).

**Needs manual testing on the preview**

- Home page (cards, categories), articles list and article pages render as before.

## 2026-10-01 · Removal 2: cron routes reject when CRON_SECRET is unset

**Files changed**

- `lib/api/routes/cron-auth.ts` (new, server-only): `isCronRequest(req)`.
  - Returns false when `CRON_SECRET` is unset or empty, so `"Bearer undefined"` and `"Bearer "` never pass.
  - Otherwise compares the `authorization` header to `Bearer <secret>` with `timingSafeEqual` (same length first).
- All 8 cron routes use it; each keeps its existing 401 response:
  - `cancel-orders`, `mobile/notifications/dispatch`, `mobile/room/call`, `reschedule`, `shuffle/consultants`, `users/unverified`: their `isAuthorized` now calls `isCronRequest`.
  - `wa-debounce-process`, `whatsapp-campaigns`: their inline check is replaced, and the unused `authHeader` local is removed.
- No cron route reads `CRON_SECRET` directly any more.

**Verified**

- `npm run build` on the clean tree: passes.

**Needs manual testing on the preview**

- Each cron with the right `Authorization: Bearer <CRON_SECRET>` returns 200.
- No header, a wrong secret, or `Bearer undefined` returns 401.
- With `CRON_SECRET` unset on a preview, every cron returns 401.

## 2026-10-01 · Removal 3: mobile reservation-info returns TAX_PERCENT

**Files changed**

- `app/api/mobile/consultants/[cid]/reservation-info/route.ts`: the response's `finance` object is now `{ ...finance, tax: TAX_PERCENT }`. The app always gets the rate that's charged (15), whatever the `finance.tax` setting says. Other `finance` fields (commission, payments, `couponEnabled`) and the response shape are unchanged.

**Verified**

- `npm run build` on the clean tree: passes.

**Needs manual testing on the preview**

- Mobile app: the reservation screen for a consultant shows tax 15 and the same total the payment charges (150 → 173).

## 2026-10-01 · Removal 4: postinstall regenerates the Prisma client

**Files changed**

- `package.json`: `"postinstall": "prisma generate"`. Vercel runs it after `npm install` on every deploy, so the git-ignored `lib/generated/prisma` client is always built from the current schema, including `VerificationToken.attempts`. `package-lock.json` is unchanged.

**Verified**

- `npm run postinstall` locally: "Generated Prisma Client (7.9.1)", and the generated `VerificationToken` model has `attempts`.
- The clean build follows in the final entry below.

**Note:** `prisma.config.ts` reads `DIRECT_URL` through `env()`. If that variable isn't available during Vercel's install step, generate could fail. Unverified; check the first deploy log.

## 2026-10-01 · Removal: final verification on main

**Verified** (tree clean at `1674cf2`, `.next` deleted first, tsconfig `exclude` is only `["node_modules", "docs"]`)

- `npm run build`: exit 0. Compiled, TypeScript passed, 139/139 static pages. This is the first clean build of main since the cleanup merge (`9e7fb28`).
- `npx tsc --noEmit`: 0 errors.
- Manifest check (`grep -oE '"(data|handlers|lib)/[^"]*"' .next/server/server-reference-manifest.json | sort -u`): prints only `"data/event.ts"` (its "use cache" registration).
- No `"use server"` in `lib/`, `data/` or `handlers/`. The only one outside `actions/` is `app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx`, a known item.

**Cutoff not applied: `LEGACY_CHARGE_CUTOFF` is still `2026-10-02T00:00:00+03:00`**

- The requested value was `2026-10-01T12:00:00+03:00`. The integer tax (`228c109`) isn't live yet. origin/main was pushed at 15:48 and 15:51, but that tree still has `lib/api/ai/article`, which fails the build, so production still charges by the old formulas until the next deploy.
- With a 12:00 cutoff, orders created between 12:00 and the deploy are charged the old amount but only accept `withTax`. That is 25 of 96 prices from 50 to 1000 (50 → 57 old vs 58 new; 90 → 103 vs 104), so those payments would go to hold.
- Set the cutoff to the deploy time or later. Later only widens what pre-deploy orders may match.

## 2026-10-01 · BotID coverage, log mode

Protection is chosen by risk: public or guest-callable actions that cost money, send messages, or can be guessed. `BOTID_MODE` is `"log"`, so nothing is blocked yet.

**Commits**

| Commit | Item | Files |
|---|---|---|
| `e3d76ec` | Setup | `next.config.ts` (wrapped with `withBotId`), `instrumentation-client.ts` (new), `lib/bot-protection.ts` (new), `utils/bot-protection.ts`, `routes.ts` |
| `02e31e9` | reCAPTCHA stopgap | `lib/api/recaptcha.ts` |
| `d28bb04` | Auth | `actions/auth.ts`, `auth.config.ts` |
| `dfacb60` | Booking | `actions/booking.ts`, `actions/site.ts` |
| `447efce` | Content | `actions/site.ts` |
| `124972f` | AI | `actions/ai.ts`, `lib/api/ai/chat-bot.ts` |

**Setup (`e3d76ec`)**

- `lib/bot-protection.ts` (`server-only`): `checkHuman(action)` runs `checkBotId()` and logs every call as `[botid] action=<name> mode=log isBot=<…> verified=<…> bypassed=<…> name=<…>`.
  - `BOTID_MODE = "log"` is a constant in this file, so it can't be flipped by an env change. In log mode `checkHuman` always returns `true`.
  - Fails open: if BotID throws, it logs `[botid] check failed` and `[botid] action=<name> … error=fail-open`, and the request goes through.
  - One verdict per request. The login action and NextAuth's `authorize` run in the same request, so the second check reuses the first instead of making a second Deep Analysis call. The key is the request's `headers()` object, which Next keeps for the whole request.
- `utils/bot-protection.ts`: the placeholder paths are gone. The single entry is `"/*"`, and `instrumentation-client.ts` reads it as `{ path: "/*", method: "POST" }`.
  - `"/*"` compiles to `^/.*$`, so it also matches `/`.
  - The BotID client only adds its headers to same-origin requests (checked in `botid/client/core`), so uploadthing uploads and backend calls are unaffected.
- `routes.ts`: BotID's challenge prefix `/149e9513-01fa-4fb0-aad4-566afd725d1b` is now public.
  - Why: `proxy.ts` runs before `next.config` rewrites, and it sends logged-out visitors on non-public paths to `/login`.
  - The challenge script (`…/c.js`) was already skipped by the matcher's `.js` rule, but the other Kasada endpoints under that prefix weren't. Without this change, every guest would fail the challenge.
  - No existing route's access changes.

**Protected: 12 actions plus NextAuth (log names as they appear in the logs)**

- Auth: `login`, `register`, `forgetpassowrd`, `phoneToken`, `unauthorizedPhoneChangeByToken`, `nextauth-credentials`.
- Booking: `Pay`, `confirmFreeSession`, `confirmReconciliation`, `applyCoupon`.
- Content: `acceptNewreview`, `addArticleComment`.
- AI: `SendChatBot`.

Each wrapper calls `await checkHuman("<name>")` as its first line. Signatures and return shapes are unchanged. `saveConsultant` is not protected, by decision.

**NextAuth credentials**

- `authorize` in `auth.config.ts` calls `checkHuman("nextauth-credentials")` first. Nothing else in the session config changed.
- There is one `signIn("credentials")` call: `handlers/auth/login.ts:61`. It is reached only through the `login` action in `actions/auth.ts`, called from `components/auth/login-form.tsx` on `/login`, which is a browser page matched by `"/*"`.
- Nothing calls `signIn` from `next-auth/react`, and no mobile route calls NextAuth's `signIn`.
- A direct POST to `/api/auth/callback/credentials` gets its own check, against that request's headers.

**reCAPTCHA stopgap (`02e31e9`)**

- All eight forms already create their token at submit, not at page load:
  - `login-form` and `resgister-form` (`onSubmit`).
  - The chat bot (`handleSend`).
  - The consultant, instant and free-session reservation forms, discover, and the marriage-awareness form (`onSubmit` → `runRecaptcha`).
  - No form code changed.
- `verifyRecaptcha` now logs `[recaptcha] failed success=… score=… action=… hostname=… error-codes=…` when verification fails, and `[recaptcha] verify request failed` when the request itself fails. The token is never logged.
- The threshold (`score > 0.2`) and enforcement are unchanged.
- Note: the reCAPTCHA check is still enforced only in the browser. `verifyRecaptcha` is a separate action, and no protected action checks the token on the server, so a script that calls `login` or `Pay` directly skips it. The `checkHuman` calls are server-side, so they do see those requests.

**Chat bot cap (`124972f`)**

- The daily cap of 15 is keyed on `user:<id>` for logged-in users and `ip:<ip>` for guests, using `getClientIp()` (IPv6 grouped by /64).
- Before, the key was `from`, the caller-supplied localStorage id, so a guest could reset it by clearing storage.
- `lib/api/ai/chat-bot.ts` now takes `limitKey` as a required first argument, so the caller's `from` can't fall back in. `from` still names the chat transcript.
- The WhatsApp bot's cap (keyed on the sender's phone) is unchanged.

**Enforce mode later: the existing error each action should return when `checkHuman` returns false**

| Action | Return | What the user sees today for that result |
|---|---|---|
| `login` | `{ state: false, message: "حدث حطأ ما" }` | error toast |
| `register` | `{ state: false, message: "حدث حطأ ما" }` | error toast |
| `forgetpassowrd` | `{ state: false, message: "حدث خطأ ما برجاء اعادة المحاولة" }` | error toast |
| `phoneToken` | `return;` (it only ever redirects, and its callers ignore the result) | button stops loading, nothing sent |
| `unauthorizedPhoneChangeByToken` | `{ state: false, message: "حدث حطأ ما" }` | settings toast |
| `nextauth-credentials` | `return null` | `CredentialsSignin`, so `login` shows "اسم المستخدم او كلمة المرور غير متطابقين" |
| `Pay` | `{ state: false, message: "تعذّر إتمام العملية، برجاء المحاولة لاحقاً" }` (Pay's finance-failure message) | form toast |
| `confirmFreeSession` | `return;` (the handler's own failure path) | no redirect, form stays |
| `confirmReconciliation` | `{ state: false, message: "حدث حطأ ما برجاء المحاولة مرة اخري" }` | "حدث خطأ ما" toast |
| `applyCoupon` | `{ state: false, message: "عذراً، الكود الذي أدخلته غير صحيح." }` | invalid-code toast; doesn't tell a guesser why |
| `acceptNewreview` | `null` | "حدث خطأ ما" toast |
| `addArticleComment` | `{ success: false }` | "حدث خطأ ما، حاول مرة أخرى" toast |
| `SendChatBot` | `"حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى."` | the same text the widget shows when it catches an error |

**Verified**

- Each of the six commits: `npm run build` on a clean tree with `.next` deleted and `exclude` only `["node_modules", "docs"]`. Exit 0 each time, 139/139 pages.
- After each commit, the manifest check prints only `"data/event.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- `npx tsc --noEmit`: 0 errors.
- `.next/routes-manifest.json` contains BotID's challenge rewrites.
- Exactly 13 `checkHuman("…")` calls: the 12 actions plus `nextauth-credentials`.

**Needs testing on a preview** (BotID always returns `bypassed=true` under `next dev`, so local tests prove nothing)

Submit each form once as a guest unless noted. In the Vercel logs, confirm `[botid] action=<name> mode=log isBot=false`.

| # | Page | Do | Log name |
|---|---|---|---|
| 1 | `/login` | log in with a verified account | `login`, then `nextauth-credentials` (same verdict) |
| 2 | `/login` | log in with an unverified account (sends an OTP) | `login` only |
| 3 | `/register` | register a new number | `register` |
| 4 | `/forget-password` | request a reset | `forgetpassowrd` |
| 5 | `/account` while logged in with an unverified phone | press the "verify" button | `phoneToken` |
| 6 | `/dashboard/profile` (consultant) | change the phone number | `unauthorizedPhoneChangeByToken` |
| 7 | `/consultants/[cid]` | apply a coupon | `applyCoupon` |
| 8 | `/consultants/[cid]` | book and reach the payment page (don't pay) | `Pay` |
| 9 | `/freesessions/consultants/[cid]` | book a free session | `confirmFreeSession` |
| 10 | `/reconciliation` | submit a request | `confirmReconciliation` |
| 11 | `/consultants/[cid]` | post a review | `acceptNewreview` |
| 12 | `/articles/[aid]` | post a comment | `addArticleComment` |
| 13 | any site page | send a chat-bot message | `SendChatBot` |

- Also confirm no `[botid] … error=fail-open` lines, and that the BotID challenge requests (`/149e9513-…`) return 200 for a logged-out visitor, not a 307 to `/login`.
- The chat bot: as a guest, send 16 messages and get the limit reply. A new tab with cleared storage on the same network must still be at the limit.
- reCAPTCHA: a failed check should show a `[recaptcha] failed …` line.
- Tests 8 and 9 create real orders. Use a test consultant: the pending `Pay` order expires through `cancel-orders`, and the free session books a slot and a Meet link.

**Open questions and notes**

- Deep Analysis is a Vercel dashboard setting (Firewall → Bot Management). Until it's on, `checkBotId` runs the basic check.
- With `"/*"`, every same-origin POST waits for BotID's challenge token before it's sent. That adds a little latency to every Server Action, uploadthing POST and pusher auth call. If that shows up, narrow the list to the 13 pages above.
- The chat cap per IP: guests behind one carrier NAT IPv4 address share the 15 messages a day.
- None of the 54 actions use `lib/rate-limit.ts`. In log mode, OTP, coupon and chat-bot abuse stay as open as before.
- Section 9 marks `bot` in `createAction` as done (`[x]`), but `lib/safe-action.ts` has no `bot` option. It's left untouched, by decision.

## 2026-10-01 · BotID follow-ups

**1. BotID path prefix in `routes.ts`**

- `botid` 1.5.11 doesn't export its path prefix. Its type definitions export only `withBotId`, `initBotId`, `validateProtectedRoutes`, `BotIdClient` and `checkBotId`. The prefix is an internal constant in `node_modules/botid/dist/next/config/index.mjs` and the client bundles.
- So `routes.ts` keeps the string `/149e9513-01fa-4fb0-aad4-566afd725d1b`, with a comment saying where it comes from and how to check it.
- **Re-check on every `botid` upgrade.** Run `grep -oE '"/[0-9a-f-]{36}/[0-9a-f-]{36}[^"]*"' node_modules/botid/dist/next/config/index.mjs`. The first segment it prints must equal the entry in `routes.ts`. If it changed, update `routes.ts`; otherwise `proxy.ts` sends guests' BotID challenge requests to `/login` and every guest is classified as a bot.

**2. Chat bot cap: guests 50 a day, logged-in users 15**

- `data/admin/bot.ts`: `BOT_DAILY_LIMIT = 15` and `GUEST_BOT_DAILY_LIMIT = 50` replace the old local `limit = 15`. `checkBotLimit(key, limit = BOT_DAILY_LIMIT)`.
- `actions/ai.ts` picks the cap from the session: `{ key: "user:<id>", limit: 15 }` for logged-in users, `{ key: "ip:<ip>", limit: 50 }` for guests. `lib/api/ai/chat-bot.ts` takes that cap as its first argument.
- The WhatsApp bot (`lib/api/whatsapp/logic.ts`) still calls `checkBotLimit(from)`, so it stays at 15 per sender phone.
- This replaces the chat-bot test in the BotID coverage entry. As a guest, message 51 gets the limit reply (it was 16), and a new tab with cleared storage on the same network is still at the limit. A logged-in user gets the limit reply on message 16.
- Counters are per day, and the key format didn't change, so guests already counted today keep their count.

**3. Section 9 correction**

- `docs/security-refactor.md`: "Add `bot` to `createAction`; `instrumentation-client.ts`; `utils/bot-protection.ts`" is unticked, with a note.
- Why: `createAction` never got the `bot` option, and nothing uses `createAction` yet. The two files exist since `e3d76ec`, and BotID runs through `checkHuman` called directly in each action.
- `docs/refactor-playbook.md` has the same checklist line, still ticked. It was left unchanged because only the security-refactor doc was in scope.

**Verified**

- Each commit: `npm run build` on a clean tree with `.next` deleted and nothing excluded beyond `["node_modules", "docs"]` passes (139/139), the manifest check prints only `"data/event.ts"`, and there is no `"use server"` in `lib/`, `data/` or `handlers/`.
- `npx tsc --noEmit --incremental false`: 0 errors. A plain incremental `tsc` once reported two errors in `components/legacy/consultants/owner/profile/form.tsx` from a stale `tsconfig.tsbuildinfo`; the full run and the build's type check are clean.

## 2026-10-01 · Playbook checklist matches section 9

- `docs/refactor-playbook.md`: the `createAction` `bot` line is unticked with the same note as `docs/security-refactor.md`. The option was never added; actions call `checkHuman` directly.

## 2026-10-01 · Build fails if the BotID prefix changes

- `next.config.ts`: `checkBotIdPrefix()` reads the UUID-shaped entry from `DynamicpublicRoutes` in `routes.ts` and searches every `.js`/`.mjs` file under `node_modules/botid/dist` for it. If the entry is missing or not found, it throws: "the prefix changed, routes.ts must be updated", plus the grep that finds the new prefix.
- It runs only in the `next build` phase (`PHASE_PRODUCTION_BUILD`); dev and start load the config too. The config is exported as a function wrapped by `withBotId`, which supports that.
- Why it lives in `next.config.ts`, not a script or `prebuild`: `/scripts` is gitignored, so a script there would never reach Vercel. A `prebuild` hook only runs through `npm run build`, while Vercel's build command can be overridden in the dashboard. `next.config.ts` loads on every `next build`, whatever the command.
- `routes.ts`: the comment points at the check.

**Verified**

- With the prefix changed by one character, `next build` stopped right after loading the config with `Build error occurred` and the message above. Restored afterwards.
- With the real prefix, `npm run build` on a clean tree passes, and the manifest check prints only `"data/event.ts"`.

## 2026-10-02 · Performance: home page on mobile (items 1–7)

No UI, UX or logic change intended. Items 8–11 (pixels, reCAPTCHA scoping, YouTube Suspense, cache headers) were skipped by decision.

| Commit | Item | Files |
|---|---|---|
| `5a63f35` | 1. `randomId` moved to server-only `utils/random.ts` | `utils/index.ts`, `utils/random.ts` (new), `data/rooms.ts` |
| `a1b5b8d` | 2. Hero as one art-directed `<picture>`; raw hero PNG preloads removed | `app/layout.tsx`, `components/clients/home/hero.tsx` |
| `e971b39` | 3. Below-the-fold home images lazy | `components/clients/shared/card.tsx` (optional `priority`, default `true`), `components/clients/home/categories.tsx`, `components/clients/home/home-cards.tsx`, `components/clients/home/join.tsx` |
| `6b4ccc1` | 4. YouTube thumbnails lazy | `components/clients/home/youtube/videos.tsx` |
| `7ce0af6` | 5. YouTube list cached with `"use cache"` (`cacheLife("hours")`) | `lib/api/google.ts`, `CLAUDE.md` (expected manifest output) |
| `c55d100` | 6. pusher-js loaded after mount | `hooks/useOnlineConsultants.ts` |
| `7aad20e` | 7. `DivMotion` in CSS + IntersectionObserver | `components/shared/div-motion.tsx` |

**Notes per item**

- 1: `utils/index.ts` is imported by about 26 client components. Its `crypto` import made the bundler ship browser polyfills for `crypto`, `stream` and `buffer`. `randomId` is used only by `data/rooms.ts`.
- 2: Each screen size now downloads one optimized image (desktop from 640 px up, mobile below, the same breakpoint as Tailwind `sm`), eager with `fetchpriority=high`. `<picture class="contents">` keeps the old layout. There is no `<link rel=preload>` any more; the image is discovered with the streamed hero, as before.
- 3: The six cards are inside `hidden md:block`, so phones no longer fetch them at all. No `sizes` was added: the card images are at most 518 px wide and Next never enlarges, so it would save nothing.
- 5: Before, every home render waited on a live YouTube API call outside any Suspense boundary. A failed call throws inside the cache, so an empty list is never cached; the caller still gets `[]`. The manifest check now prints `"data/event.ts"` and `"lib/api/google.ts"`, both `$$RSC_SERVER_CACHE_0` cache registrations, not Server Actions. CLAUDE.md is updated.
- 6: The subscription already started after mount. A `cancelled` flag skips it if the component unmounts while pusher loads. Also used by the instant booking step.
- 7: Same variants and values, 2.5 s default duration, `cubic-bezier(0.22, 1, 0.36, 1)`, delay, `-100px` margin, runs once. The server renders the same start styles motion did; checked by rendering the old motion version with `react-dom/server`: `opacity:0;transform:translateY(30px)`, `opacity:0;filter:blur(8px)`, `opacity:0;transform:scale(0.96)`. motion is still used by the reservation coupon and gift steps.

**JS loaded up front** (first-load chunks from `.next/diagnostics/route-bundle-stats.json`, `noModule` polyfills excluded; gzip level 9)

| Page | Before (`e3fe84c`) | After (`7aad20e`) |
|---|---|---|
| `/` | 1,565 KB raw / 477 KB gz, 24 scripts | 941 KB raw / 287 KB gz, 22 scripts |
| `/login` | 1,810 KB / 504 KB | 1,383 KB / 377 KB |
| `/consultants/[cid]` | 2,150 KB / 617 KB | 1,705 KB / 483 KB |

Home by step (raw / gz): item 1 → 1,138 / 350, items 2–5 → unchanged (images and server), item 6 → 1,080 / 332, item 7 → 941 / 287.

**Image bytes on first load on mobile** (412 px at 1.75×, each image encoded the way Next's optimizer does: AVIF at quality 55, effort 3, no enlargement)

| Image | Before | After |
|---|---|---|
| raw `hero-mobile.png` preload | 319 KB, eager | not fetched |
| hero mobile (optimized, w=750) | 4 KB, eager | 4 KB, eager |
| hero desktop (hidden on phones) | 5 KB, eager | not fetched |
| hero logo icon SVG (not optimizable) | 50 KB, eager | 50 KB, eager |
| header logo (w=384) | 13 KB, eager | 13 KB, eager |
| category cards ×3 unique (desktop-only) | 18 KB, eager | not fetched |
| join banner (bottom) | 9 KB, eager | on scroll |
| YouTube thumbnails ×11 (external) | eager | on scroll |
| **Total at load** | **418 KB + 11 thumbnails** | **67 KB** |

Consultant photos are unchanged and not counted.

**Verified**

- After each commit: `npm run build` on a clean tree with `.next` deleted passes (139/139).
- After each commit, the manifest check prints `"data/event.ts"`, plus `"lib/api/google.ts"` from item 5.
- No `"use server"` in `lib/`, `data/` or `handlers/`. `tsc --noEmit --incremental false`: 0 errors.

**Open notes**

- The 50 KB hero logo icon SVG (`/svg/shwerni-logo-icon.svg`, shown at 25 px) is now three quarters of the image bytes on a phone. A smaller file would help. Not changed.
- PageSpeed should be re-run on the preview; the numbers above are build-output measurements.

## 2026-10-02 · reCAPTCHA removed, BotID in block mode

**Not built.** `package.json` and `package-lock.json` have uncommitted stash-pop conflict markers in the working tree (Ziad's changes; `package.txt` is staged). Both `npm run build` and `next build` fail to parse `package.json`, and those files weren't touched. By decision, the code was committed after `tsc --noEmit --incremental false` only (0 errors). The build, the manifest check and the dependency removal wait until `package.json` is valid again.

**0. Coverage check: nothing missing, so no fix commit.**

- The 12 actions and `nextauth-credentials` call `checkHuman`, and every page that calls them is covered by the single `"/*"` POST entry.
- All 8 forms that had reCAPTCHA lead to an action with `checkHuman`: login, register, chat bot, the consultant, instant and free-session reservation forms, discover, and marriage awareness.

**1. reCAPTCHA removed (`939330e`)**

- Root layout: the `GoogleReCaptchaProvider` wrapper, which loaded the script on every page. `components/wrappers/recaptcha.tsx` is deleted.
- Token generation and the client-side verify step in all 8 forms.
- `verifyRecaptcha`: the public action in `actions/ai.ts`, `lib/api/recaptcha.ts`, and the client helper `handlers/admin/recaptcha.ts` (`runRecaptcha`) are deleted.
- `app/globals.css`: the `.grecaptcha-badge` rule.
- There were no `captchaToken` fields in schemas or action inputs, and there is no CSP.
- Still to do once `package.json` is valid: `npm uninstall react-google-recaptcha-v3`. Nothing imports it any more.

**2. Block mode (`debfe54`)**

- `BOTID_MODE = "block"`. When `checkHuman` returns false, each action returns the failure from the enforce-mode table above, and `authorize` returns `null`.
- Fail-open on BotID errors and the log line on every call are unchanged.
- Note: four `Pay` callers ignore its result (discover, instant, marriage awareness, programs), so a blocked user there sees no message. That is the same as any other `Pay` failure on those forms today.

**3. `recaptcha__en.js`**

- No code loads it any more. The provider was the only loader; the remaining `<Script>`s are Tabby and the Meta, Snap and Twitter pixels.
- If a preview still loads it (the "duplicate"), it comes from outside the repo, most likely a tag in the GTM container `GTM-5TGBGMNN`.

**4. Env vars to remove from Vercel:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY`. These are the only ones the code read.

**Needs testing on a preview**, once a build passes. Submit each once as a real user. Expect `[botid] action=<name> mode=block isBot=false` in the logs and the form to succeed.

| # | Page | Do | Log name |
|---|---|---|---|
| 1 | `/login` | log in with a verified account (NextAuth) | `login` then `nextauth-credentials` |
| 2 | `/register` | register | `register` |
| 3 | `/forget-password` | request a reset | `forgetpassowrd` |
| 4 | `/account` (unverified phone) | press verify | `phoneToken` |
| 5 | `/dashboard/profile` | change phone | `unauthorizedPhoneChangeByToken` |
| 6 | `/consultants/[cid]` | book up to payment | `Pay` |
| 7 | `/consultants/[cid]` | apply a coupon | `applyCoupon` |
| 8 | `/consultants/[cid]` | post a review | `acceptNewreview` |
| 9 | `/freesessions/consultants/[cid]` | book a free session | `confirmFreeSession` |
| 10 | `/reconciliation` | submit | `confirmReconciliation` |
| 11 | `/articles/[aid]` | comment | `addArticleComment` |
| 12 | any site page | send a chat message | `SendChatBot` |

Also check `/discover`, `/instant` and `/marriage-awareness`, which all go through `Pay`. Confirm that no page requests `recaptcha` (network tab), and that there are no `error=fail-open` lines.

## 2026-10-02 · reCAPTCHA removal finished: dependency, Pay toasts, build

Ziad discarded the local `package.json` changes, so the tree is clean and builds again.

| Commit | Item |
|---|---|
| `9d1fdf3` | `npm uninstall react-google-recaptcha-v3`. That also removes `hoist-non-react-statics`, which only the reCAPTCHA package used. The lockfile also gains `hasInstallScript: true` for the existing `postinstall`. |
| `a8c9604` | Discover, instant, marriage awareness and programs now show a `Pay` failure the same way the consultant booking form does. It's the same block: `toast.error` with `result.message`, or its generic fallback. Before, these forms ignored the result, so any failure, a BotID block included, showed nothing. On success `Pay` still redirects; Next rejects the action promise with the redirect, so the toast never runs on success. |

**Verified**

- `npm run build` on a clean tree with `.next` deleted passes (139/139) after `9d1fdf3` and again after `a8c9604`. These are the first builds that include `939330e` (reCAPTCHA removed) and `debfe54` (block mode).
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, both `"use cache"` registrations.
- No `"use server"` in `lib/`, `data/` or `handlers/`. `tsc --noEmit --incremental false`: 0 errors.
- No client chunk, prerendered page or server file in `.next` contains "recaptcha".
- Home JS up front: 935 KB raw / 285 KB gzipped. `/login`: 1,376 / 374.
- Section 9 of both refactor docs: reCAPTCHA removal ticked, and the switch to block ticked (log week skipped by decision).

**Still to do outside the repo**

- Remove `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` from Vercel.
- If a preview still loads `recaptcha__en.js`, it comes from the GTM container (`GTM-5TGBGMNN`).

**Needs testing on a preview**

- The 13-row table in the previous entry.
- Book once each on `/discover`, `/instant`, `/marriage-awareness` and `/programs/reserve/[prid]`; each should redirect to payment.

## 2026-10-02 · AI discoverability: llms.txt and well-known 404s

**Before.** Nothing in `public/` or `app/` served `/llms.txt` or anything under `/.well-known/`. Those paths aren't in the proxy matcher's excluded file types and weren't public routes, so `proxy.ts` sent logged-out visitors (crawlers, Lighthouse) a 307 to `/login`, which answered 200 HTML.

| Commit | Change |
|---|---|
| `509d775` | `public/llms.txt` in the llmstxt.org format: H1, a one-paragraph English and Arabic summary, then H2 link lists. It covers consultants, discover, instant, programs, free sessions, articles and Q&A, scales and marriage awareness, how booking works, terms and privacy, and contact. Only public pages, with absolute `https://www.shwerni.sa` URLs. `/llms.txt` is added to `publicRoutes` in `routes.ts`. |
| `7ed6dd1` | `/.well-known` is a public prefix in `DynamicpublicRoutes`. Nothing exists under it, so every path answers Next's not-found page with status 404. There is no ai-catalog: Shwerni offers no agent tools or APIs. |

**Verified**

- `npm run build` on a clean tree with `.next` deleted passes (139/139). The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- `next start` locally, as a logged-out visitor:
  - `/llms.txt` → 200 `text/plain`.
  - These all return 404 `text/html`: `/.well-known/ai-catalog.json`, `ard.json`, `security.txt`, `assetlinks.json`, `apple-app-site-association` and `openid-configuration`.
  - `/robots.txt` and `/sitemap.xml` → 200.

**Open notes, not changed**

- Any other unknown path (for example `/some-random-page`) still sends logged-out visitors a 307 to `/login` instead of a 404.
- `app/sitemap.ts` still lists `/available`, `/contact` and `/consultant`, which redirect or don't exist.
- No `apple-app-site-association` or Apple Pay merchant file exists. They're only needed if the mobile app's universal links or Apple Pay domain verification depend on this domain.

## 2026-10-02 · Round 1: 404s, sitemap, Snap, home shell, carousels, rating CSS

| Commit | Item |
|---|---|
| `c3074d4` | 1. `proxy.ts` redirects logged-out visitors to `/login` only on private paths; unknown URLs reach Next's 404 |
| `0b0163b` | 2. Sitemap lists only URLs that answer 200 |
| `c0f6937` | 3. Snap pixel no longer sends the `'_INSERT_USER_EMAIL_'` placeholder |
| `114570f`, `ed99c97` | 4. Home static parts in the prerendered shell; the session, campaign card, join and chat button stream in their own Suspense boundaries |
| `bb839e8` | 5. Home carousels autoplay only while on screen |
| `40df78d`, `14f60b2` | 6. Star-rating CSS loads with the main stylesheet |

**1. Protected paths**

- Before: every path that was neither in `publicRoutes`, `DynamicpublicRoutes` nor `authRoutes` was private. Logged-out visitors on any unknown URL got a 307 to `/login`.
- After: `protectedPrefixes` in `routes.ts` lists `/account`, `/favorite`, `/orders`, `/logout`, `/reconciliation`, `/dashboard` and `/api`. A path matches when it equals a prefix or continues it with `/`. `/api` keeps every non-public API route behind a session, as before.
- Checked by script: none of the app's 64 existing pages changes its logged-out behaviour. The 24 previously private pages are all covered by those prefixes.
- `next start`, logged out:
  - `/some-random-page` and `/consultants/not-a-number/x` → 404.
  - `/dashboard`, `/dashboard/orders`, `/account`, `/orders`, `/reconciliation`, `/logout` and `/api/unknown` → 307 to `/login`.
  - `/login`, `/terms` and `/llms.txt` → 200.

**2. Sitemap**

- Removed `/available` (redirects to `/discover`), `/contact` (404) and `/consultant` (redirects).
- Consultant entries used `/consultant/:cid`, which redirects. They now use the canonical `/consultants/:cid` instead of being dropped.
- They also list only approved consultants (`approved: APPROVED`, in `data/seo.ts`), the same rule the consultant page applies; the others are 404s.
- Checked with `next start`: all 593 entries answer 200 (home, articles, programs, 266 articles, 317 consultants, 7 programs).

**4. Home shell**

- Before: the site layout awaited the session at the top, so the whole site sat behind the root `loading.tsx` boundary. The prerendered shell for `/` was 12 KB: just the spinner.
- After, the layout passes `userServer()` unawaited. The header reads it with `use()` inside its own Suspense boundary; the fallback is the header without the account menu.
- `HomeCampaign` (the categories campaign card, dated per request) and `Join` (logged-out only) have their own boundaries.
- The chat button reads the current time while rendering (its greeting timestamp), which prerendering treats as request-time data. That was what still kept the site behind the root boundary, found by a test build. It now streams in its own boundary.
- Result: the prerendered shell for `/` is about 190 KB with the header and the hero. The root boundary is revealed by an inline `$RC` right after the hero's segment, with no server work in between.

**How "nothing user-specific is cached or prerendered" was verified**

- Every `"use cache"` function (17) takes no arguments or only public ids (`cid`, `aid`, `prid`, placement, count). Next forbids `cookies()`/`headers()` inside `"use cache"`, so none can read the session.
- A scan of all 893 prerendered files under `.next/server/app` (HTML, flight data, segments, metadata) and of `.next/cache` found no session-shaped data: `email`, `phone`, `role`, `emailVerified`/`phoneVerified`, session `expires`, `"user":{`, and the account menu's texts. A positive control string was matched.
- The only session read on the home route is `userServer()` in the site layout. It is consumed only inside the header's Suspense boundary (`HeaderSheetWithUser`) and inside `Join`'s boundary, so it renders only in the per-request dynamic part.
- A request with an invalid session cookie produced `JWTSessionError` in the server log during that request, so the session is read per request, not at build time.

**Response headers for `/`** (local `next start`, logged out; the same with a session cookie)

| | Before | After |
|---|---|---|
| `Cache-Control` | `private, no-cache, no-store, max-age=0, must-revalidate` | unchanged |
| `x-nextjs-prerender` / `x-nextjs-postponed` | `1` / `1` | unchanged |
| prerender mode | `PARTIALLY_STATIC`, revalidate 3600, expire 86400 | unchanged |
| prerendered shell | 12 KB (spinner only) | ~190 KB (header and hero) |

On Vercel the shell is served from the edge cache and the dynamic part streams per request with the private header. The prerender manifest bypasses the shell for `Chrome-Lighthouse` and crawler user agents. Those get a full dynamic render, where the hero now also streams early instead of after the root boundary.

**5–6**

- Carousels: autoplay starts paused (`playOnInit: false`). The new hook `useAutoplayWhileVisible` plays it while embla's root node is in the viewport and stops it when it leaves. Delay, loop, RTL and the no-stop-on-hover/touch behaviour are unchanged.
- Rating CSS: it was imported by three components, so it became a separate 5 KB stylesheet that the root boundary waited for (`$RR`). `40df78d` moved the import to the root layout, but Turbopack still emitted a separate file. `14f60b2` uses `@import` in `globals.css`, so the rules are now inside the main stylesheet: `/`, `/consultants` and `/articles` all load one 174 KB main CSS file that contains `rr--`. Every reveal on `/` is a plain `$RC` with no CSS wait.

**Verified after each commit**

- `npm run build` on a clean tree with `.next` deleted passes (139/139).
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- No `"use server"` in `lib/`, `data/` or `handlers/`.
- `tsc --noEmit --incremental false`: 0 errors.

**Visible changes to check**

- The account menu (logged in) appears a moment after the rest of the header.
- The chat button appears once the dynamic part arrives.
- A campaign card, when one is active, appears a moment later above the categories.
- The join banner (logged out) streams in at the bottom.
- The carousels start moving when scrolled into view, from their first slide.

## 2026-10-02 · Phase complete

The Server Actions security refactor phase is complete. The remaining work is in the "Later" list in section 9 of `docs/security-refactor.md` and `docs/refactor-playbook.md`.

**What the phase delivered**

- **Audit:** `docs/reference/server-surface.md` and `docs/reference/project-map.md`.
- **Hotfix tiers 1–5:**
  - the account takeover chain and account edits
  - `server-only` for server-only callers
  - `actions/` wrappers with the same signatures and return shapes
  - the open routes (meeting chats, uploadthing delete, pusher auth)
  - Tabby verification and the cancel page
- **Follow-ups:**
  - OTP attempt limit
  - Moyasar verification
  - chat uploads
  - `getPaidPast3Days` masking
  - the cancel page guard
  - one integer tax calculation (`withTax`), with a payment transition until 2026-10-09
- **Cleanup:**
  - dead code removed
  - date helpers in `utils/date.ts`
  - merged route factories
  - the article AI feature removed
  - crons share `isCronRequest` and reject an unset `CRON_SECRET`
- **Bot protection:**
  - Google reCAPTCHA removed
  - Vercel BotID in block mode on 12 public actions and NextAuth `authorize`
  - each blocked action returns its existing failure result
  - BotID errors fail open
  - the chat-bot cap is keyed on the session or the IP
- **Performance (home, mobile):**
  - up-front JS from 1,565 KB / 477 KB gzipped to about 935 KB / 286 KB
  - first-load image bytes on mobile from 418 KB to 67 KB
  - the home page's static parts (header and hero) in the prerendered shell
  - carousels autoplay only while visible
  - the rating CSS inside the main stylesheet
- **Discoverability and routing:**
  - `llms.txt`
  - `/.well-known/*` and unknown URLs answer 404
  - the sitemap lists only URLs that answer 200

**State at the end of the phase** (`main`, after `2e8a33b`)

- `npm run build` on a clean tree with `.next` deleted passes (139/139).
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, both `"use cache"` registrations.
- No `"use server"` in `lib/`, `data/` or `handlers/`. The only `"use server"` outside `actions/` is `app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx`, a known item.
- No prerendered or cached output contains session data (scan of 893 prerendered files and `.next/cache`).
- `CLAUDE.md` has a "Rules for new code" section for work after this phase.

**Outside the repo**

- Vercel env:
  - remove `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` and `GEMINI_APIKEY`
  - make sure `MOYASAR_WEBHOOK_SECRET` and `CRON_SECRET` are set
- Vercel dashboard: confirm BotID Deep Analysis is on.
- On 2026-10-09 or later: remove the payment transition code (first "Later" item).
- Preview checks before each push: the test lists in the entries above. Check especially the logged-in header with two accounts, unknown URL → 404, the BotID logs (`isBot=false` for real users), and the payment redirects.

## 2026-10-02 · React #418 on the home page (`6f90c56`)

**Cause:** the statistics counter (`components/clients/home/statistics/counter.tsx`) formatted its number with `toLocaleString(undefined, …)`, so it used the runtime's default locale.
- The server (Node, Vercel included) uses `en-US`: `0`, `0.0`.
- An Arabic-locale browser uses Arabic-Indic digits: `٠`, `٠٫٠`.
- The hydration text differed for every Arabic-locale visitor.

This was not caused by round 1: the server rendered `en-US` digits before too. Round 1 only made the counter part of the prerendered shell.

**Fix:** the first render uses `en-US` on both sides. The visitor's locale applies right after hydration through `useSyncExternalStore` (server snapshot `false`, client snapshot `true`). The digits users end up seeing are unchanged.

**Verified**

- Reproduced with a local production build and headless Chrome driven over the DevTools protocol:
  - With `Emulation.setLocaleOverride('ar-SA')`, `/` threw `Minified React error #418 (args[]=text)` from `3uqvlhpmcva8t.js`.
  - With `en-US`, no error.
- After the fix, `ar-SA` (twice) and `en-US` show no React errors. The counters read `٠+ ٠+ ٠٫٠/5` in Arabic and `0+ 0+ 0.0/5` in English after hydration, the same as before.
- No React errors in `ar-SA` on `/consultants`, `/consultants/513`, `/articles`, `/programs`, `/freesessions`, `/discover`, `/instant` and `/scales`. Two 504s were the local image optimizer fetching remote uploadthing images.
- `npm run build` on a clean tree with `.next` deleted passes. The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.

**Note:** `components/ui/calendar.tsx` (booking date picker) also formats with the browser's default locale. It isn't on the home page, and no error showed on the booking pages tested.

## 2026-10-02 · SEO: metadata and JSON-LD for the six main pages

| Commit | Change |
|---|---|
| `b56f27a` | `schema-dts` dev dependency (types only, `import type`) |
| `462557e` | Organization and WebSite JSON-LD once in the `(site)` layout; the old root-layout JSON-LD removed; real `public/apple-touch-icon.png` |
| `eb4cffc` | No site-wide canonical in `defaultMetaApi`; `/` owns its canonical; `WebPage` JSON-LD on home |
| `f97c04c` | `/consultants` |
| `c345554` | `/programs` |
| `f688d61` | `/articles` |
| `382165b` | `/contact-us` |
| `fee3476` | `/terms` |

**What changed**

- `components/seo/json-ld.tsx`: a server helper that renders `<script type="application/ld+json">` with `JSON.stringify(data).replace(/</g, "\\u003c")`, typed with `schema-dts`.
  - `site-json-ld.tsx`: Organization and WebSite.
  - `collection-json-ld.tsx`: CollectionPage, plus an ItemList when items are given.
  - `page-json-ld.tsx`: WebPage or ContactPage.
- Organization:
  - `www` URL; logo `layout/logo.png` (750×225); image `meta/shwerni.jpeg`.
  - `sameAs` is built from the footer's `socialMedia` list, without WhatsApp and with tracking parameters stripped: X `@shwernisa`, Instagram `shwernisa`, TikTok `@shwerni`, Snapchat. The YouTube channel is only linked from the home video section, so it's not included.
  - Address: Riyadh, SA. Contact: `+966554117879` and `support@shwerni.com` (all shown in the footer and on `/contact-us`).
  - `knowsAbout`: the four categories offered (psychological, family and marital, legal, personal) plus two English terms.
- WebSite: `inLanguage: "ar-SA"`, publisher is the Organization. No SearchAction.
- The root layout's old JSON-LD is removed. It was on every page including login and dashboard, used the non-`www` domain, marked every page as the home `WebPage`, pointed its logo at a missing file, and had a `?q=` SearchAction that the filter doesn't read.
- `defaultMetaApi` no longer sets `alternates` (canonical, hreflang) or `openGraph.url`. Before, every page without its own metadata declared the home page as its canonical. The default image is declared at its real 1080×1350.
- Per page:
  - Titles without the "شاورني -" prefix; the template adds "| شاورني" once.
  - Each page has its own canonical and `og:url`. OG and Twitter extend the defaults.
  - Image sizes are real: `consultants.jpeg` 1080×1350, `programs.png` 1080×1080.
  - Wording fixes: "مدونة المستشارين", "الشروط والأحكام", and Arabic descriptions for articles and terms instead of the English stubs.
  - `/contact-us` had no metadata at all. It now has a title (the footer label) and a description of what the page shows.
- List pages:
  - The canonical is the bare path for every search, filter, order and page combination.
  - The ItemList is rendered only for the default list (page 1, no search, default order and filters), from the items actually rendered: position, name, URL. No prices and no ratings.
- `/consultants` no longer overrides `icons`, so it gets the Apple touch icon.
- `public/apple-touch-icon.png`: 180×180, the brand mark (`layout/logo-sm.png`) on white. `icons.apple` already pointed to this path, but the file didn't exist.

**Verified**

- After each commit: `npm run build` on a clean tree with `.next` deleted passes, the manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- `next start`, all six pages: title, description, canonical, OG, Twitter and Apple icon are as listed above, and the JSON-LD parses.
- The ItemList on `/consultants` has 9 items, `/programs` 7 and `/articles` 9. It's absent on `/consultants?search=x` and `?page=2`.
- Pages outside the scope no longer declare the home page as their canonical.

**Found, not changed (out of scope)**

- `/scales` declares its canonical as `https://www.shwerni.sa/مقاييس`, a path that doesn't exist (`scales/metadata.ts`).
- Detail and other pages still override `icons` with the favicon only, so they have no Apple icon: consultant, article and program details, event, instant, free sessions, meetings.

## 2026-10-03 · SEO for detail pages; accessible names for icon-only controls

**Push state found at the start:** the SEO round (`b56f27a` … `ef43563`, including `eb4cffc`, which removes the home canonical from `defaultMetaApi`) was committed locally but not pushed. `origin/main` was at `dd78f5f`. That is why production `/consultants/148` still declared the home page as its canonical.

| Commit | Change |
|---|---|
| `22c21ab` | `/consultants/[cid]`: metadata, `Person` + `BreadcrumbList`; `components/seo/breadcrumbs.ts` |
| `95675c3` | `/articles/[aid]`: metadata, `Article` + `BreadcrumbList` |
| `97eaa6d` | `/programs/[prid]`: metadata, `Service` + `BreadcrumbList` |
| `1fbf498` | Header menu button: `aria-label="القائمة"` |
| `d82006a` | Arabic `aria-label`s on the other 21 icon-only controls |

**Detail pages**

- `generateMetadata` extends `defaultMetaApi` and uses only data each page already loads.
  - **Consultant:** name and specialty (the category label the profile shows, e.g. "استشاري نفسي"). The fixed "دعم نفسي" in the description was wrong for legal or personal consultants; the specialty replaces it.
  - **Article:** title, plus the existing 160-character excerpt as the description.
  - **Program:** "برنامج <name>", plus the program description.
- Titles carry the brand once, through the template.
- The canonical and `og:url` are always the clean `/consultants/<cid>`, `/articles/<aid>` or `/programs/<prid>`. Query params never reach them.
- The program `og:url` was `https://www.shwerni.sa//program/<prid>` (double slash, wrong path).
- Made-up 1200×630 image sizes and `icons` overrides are removed from these pages.
- Pages that render the 404 component get no metadata at all:
  - consultants not approved, published and active
  - missing articles
  - programs that are missing or not published
- JSON-LD through the escaped helper:
  - **Person:** name, `jobTitle` = specialty, image, url, `worksFor` the organization. The old inline `Person.offers` (not a Person property) is gone. No `AggregateRating`.
  - **Article:** headline, description, image, `datePublished`. The author is the consultant, or the organization when there is none; the publisher is the organization.
  - **Service** for programs: a consultation program with consultants, sessions and a price fits Service; Course would claim course info the page doesn't have. Category as shown, provider the organization, area SA. No `offers`, because the page shows its own tax calculation.
  - **BreadcrumbList:** الرئيسية › (المستشارون | مدونة المستشارين | برامجنا الاستشارية) › name.

**Accessibility**

- An AST scan of every `.tsx` found buttons and links with no `aria-label`, `aria-labelledby` or `title`, and only an icon inside. Text, sr-only text and image `alt` count as names.
- 22 found:
  - the header menu button
  - 6 × pagination previous and next
  - the chat-bot send button
  - the attachment remove button
  - 2 × the meeting-chat "more" button
  - 2 × discover back
  - Tabby installments info
  - the date-picker trigger
  - the upload clear button
- All now have Arabic labels. The rescan reports 0. Nothing visible changed.

**Verified**

- After each commit: `npm run build` on a clean tree with `.next` deleted passes, the manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- `next start`:
  - **`/consultants/148`:** "المستشارة منى رغفاوي — استشاري نفسي | شاورني", canonical `/consultants/148` (the same with `?collaboration=abc`), Person + breadcrumb.
  - **`/articles/314`:** canonical `/articles/314` (the same with `?ref=x`), Article + breadcrumb.
  - **`/programs/11`:** "برنامج الذكاء المالي في ميزانية الأسرة | شاورني", canonical `/programs/11`, Service + breadcrumb.
  - **`/consultants/999999` and `/programs/999999`:** site defaults only, no canonical, no entity JSON-LD.

**Found, not changed**

- Soft 404s: missing or hidden consultants, articles and programs answer **200** with the 404 component, not a 404 status.
- `getArticleByAid` doesn't filter by status, so unpublished articles are readable (and indexable) by id.
- The `/scales` canonical and the remaining `icons` overrides are still open (in Later).

## 2026-10-03 · Published-only articles; notFound() on detail pages

| Commit | Change |
|---|---|
| `e14ae24` | Only published articles are readable |
| `bd67bc8` | Hidden or missing consultants, articles and programs call `notFound()`; `app/(pages)/(site)/not-found.tsx` |

**1. Articles**

- `getArticleByAid` (used only by the public article page) now requires `status: PUBLISHED` (`findFirst`), so an unpublished id reads as missing.
- `getSimilarArticles` (the 3 "similar articles" on every article page) had no status filter and could link to unpublished articles. It now filters like the list.
- Already filtered: the list (`getArticles`) and the sitemap (`siteMapDynamic`). `llms.txt` is static and links only to `/articles`.
- Production check (read-only GETs): every article id not in the sitemap answers "المقال غير موجود", so no unpublished article exists right now. The leak was latent.

**2. notFound()**

- `/consultants/[cid]`: `notFound()` when the consultant isn't approved, published and active.
- `/articles/[aid]`: `notFound()` when the article is missing or unpublished.
- `/programs/[prid]`: the page checks the cached program before rendering and calls `notFound()` when it's missing or unpublished. The `Program` component keeps its own check as a fallback.
- `app/(pages)/(site)/not-found.tsx` renders the same `Error404` content inside the site header and footer. `app/not-found.tsx` sits above the site layout and would drop them.

**Status codes measured with `next start`**

| URL | Before (`e14ae24`) | After (`bd67bc8`) |
|---|---|---|
| `/consultants/148` (visible) | 200, `index, follow` | 200, `index, follow` |
| `/consultants/999999`, `/consultants/abc` | 200, `index, follow` | **200, `noindex`** (plus the default `index, follow`) |
| `/articles/314` (published) | 200 | 200 |
| `/articles/313`, `/articles/999999` | 200, `index, follow` | **200, `noindex`** |
| `/programs/11` (published) | 200 | 200 |
| `/programs/999999` | 200, `index, follow` | **200, `noindex`** |
| `/no-such-page` | 404, `noindex` | 404, `noindex` |

The same results with a Googlebot and a Chrome-Lighthouse user agent.

**Why they stay 200**

- The response streams. The site layout's prerendered shell, the root `app/loading.tsx` boundary and the header's Suspense boundary are flushed, with the status line, before the page component runs. So when `notFound()` is thrown, the status is already 200.
- Next.js handles this by streaming the not-found UI and injecting `<meta name="robots" content="noindex">`.
- The page also keeps the default `index, follow` from `defaultMetaApi`. Google applies the most restrictive directive, so `noindex` wins. These URLs aren't in the sitemap either.

**Options for a real 404 (not applied)**

- Decide in `proxy.ts`, before rendering, with a cached existence lookup per detail URL. That adds a lookup to every detail request.
- Remove the root `loading.tsx` boundary, so nothing streams before the page. That changes the navigation spinner site-wide.

**Smaller option**

- Drop `index: true, follow: true` from `defaultMetaApi.robots` (they're the default anyway, and `googleBot`'s preview settings can stay), so a 404 carries only `noindex`.

**Verified**

- After each commit: `npm run build` on a clean tree with `.next` deleted passes, the manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- The not-found pages render inside the site header (checked in the HTML).

## 2026-10-04 · Role escalation at sign-up (web and mobile)

Found during the Centers audit (`docs/centers/AUDIT.md` §7).

**Holes**

1. Web: the public `register` Server Action passed `role` from the client straight to `createUser`. Anyone could sign up as `ADMIN` (or any role), verify their own phone and log in with it.
2. Mobile (Better Auth 1.6.23): `role` is an `additionalFields` entry with `input: true`. The create hook allow-listed USER/OWNER, but nothing guarded `/api/mobile/auth/update-user`. Any signed-in app user could send `{ "role": "ADMIN" }` and change their role on the shared `users` row, which the web login then reads.

**Fixes**

| File | Change |
|---|---|
| `actions/auth.ts` | `register` rejects any role outside the allowlist `[USER, OWNER]`, returning the existing failure result |
| `lib/auth/mobile-auth.ts` | `databaseHooks.user.update.before` throws `BAD_REQUEST` ("role is not allowed to be set") when an update contains `role`. This is the same error `input: false` gives on update. |
| `actions/site.ts` | `applyCoupon` return type pinned to the data function's. Type-only: the bot early return from `dfacb60` had widened it, and 9 `tsc` errors in the three coupon forms followed. `next build` didn't flag them. |

**Why not `input: false` on mobile `role`**

- Mobile sign-up (`/phone-number/verify` with `signUpOnVerification`) reads `role` from the request body, and the create hook keeps USER or OWNER.
- With `input: false`, Better Auth would replace it with the default, `USER`, so consultants could no longer sign up from the app.
- The update hook closes the hole and keeps sign-up as it was.

**Other places checked**

None of these take a role from input:

- Every other `user.create`/`update`/`updateMany` sets explicit fields only:
  - `handlers/auth/verify.ts`, `handlers/auth/userInfo.ts`, `handlers/auth/reset.ts`
  - `app/api/mobile/auth/set-password`, `app/api/mobile/account/profile/{name,phone,password}`
  - the phone and password hooks in `mobile-auth.ts`
- NextAuth has only the Credentials provider, so there's no OAuth path. Its `jwt` callback reads `role` from the database.
- `legacy-password-login` creates a `MobileAccount` only.

No code in this repo changes `User.role` after creation now. Admin role changes happen in the admin dashboard repo.

**Verified**

- `npx tsc --noEmit` passes (it had 9 errors before the `actions/site.ts` fix).
- `npm run build` on a clean tree passes.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.

**Open**

- Check production for accounts that already abused this. The query is in the commit report: users whose role isn't USER or OWNER.
- A mobile user could also have switched USER ↔ OWNER through `update-user` before this fix. That's lower impact, since the dashboard still needs a consultant row and admin approval.
- If the app itself calls `updateUser({ role })` (for example, "become a consultant" after sign-up), that call now fails. Not seen in this repo; the app repo should be checked.

## 2026-10-04 · Centers phase 1: schema

The changes from `docs/centers/centers.prisma` are applied to `prisma/models/*.prisma`.

**Schema**

| File | Change |
|---|---|
| `prisma/models/roles.prisma` | `Center` stub extended in place. New enums `CenterMemberRole` and `CenterBankState`. New models `CenterMember`, `CenterWorkHour`, `CenterClosure` and `CenterBankAccount`. |
| `prisma/models/user.prisma` | `UserRole` gains `CENTER`. `User.centerMember` added. |
| `prisma/models/consultant.prisma` | `Consultant.userId` becomes nullable; `centerId`/`center` added, with an index on `(centerId, status, statusA, approved, sort_key)`. `ConsultantTiming.userId` becomes nullable. |
| `prisma/models/reservation.prisma` | `Order.centerId` added (index on `centerId, created_at`). `Meeting.mode` added. |
| `prisma/models/payment.prisma` | `Payment.platformShare` and `centerShare` added. `Coupon.centerId` and `Discount.centerId` added. |
| `prisma/models/finance.prisma` | `FinanceCategory` gains `CENTER_PAYOUT`. `FinanceEntry.centerId` added. |

The relations from `Consultant`, `Coupon`, `Discount`, `Order` and `FinanceEntry` to `Center` use `onDelete: Restrict`: centers are never deleted, only hidden. The center-owned models keep `Cascade`.

`prisma validate` and `prisma generate` pass. Nothing was pushed to the database.

**Type fixes from the nullable `userId`**

Existing consultants all have a user, so current behavior is unchanged.

| File:line | Fix |
|---|---|
| `types/admin.d.ts:107`, `:175` | `Reservation.consultant.userId` and `MeetingWithOrder…consultant.userId` become `string \| null` (type only) |
| `components/clients/sub-pages/marriage-awareness/card.tsx:18` | the local `OnlineConsultant.userId` becomes `string \| null` (type only) |
| `app/api/cron/mobile/room/call/route.ts:64`, `:121` | skips a meeting whose consultant has no user (nobody to ring) |
| `app/api/mobile/room/[mid]/ring/route.ts:70`, `app/api/mobile/room/ring/[mid]/route.ts:70` | returns `{ rung: false }` when the side to ring has no user |
| `data/online.ts:155`, `:177` | passes `{ ...consultant, userId }` to `trigger`; the row was found by that `userId`, so the value is the same |
| `data/online.ts:290` | `broadcastConsultantBusy` runs only when the consultant has a user |
| `actions/consultant.ts:61` | `saveConsultant`'s return type pinned to the handler's; inference lost narrowing after the `Consultant` type changed (same fix as `applyCoupon` in `cca7dd0`) |
| `components/clients/home/coupons/carousel.tsx:54` | the static placeholder coupon gets `centerId: null` (new `Coupon` field) |

**Verified**

- `npx tsc --noEmit` passes.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- **`npm run build` fails at prerender** until the schema is pushed. The home page's campaign query (`prisma.eventCampaign.findFirst`, which includes `discount`) selects `discounts.centerId`, which doesn't exist in the live database yet (P2022). Compilation and the TypeScript step pass.
- An offline diff of the HEAD schema against the new schema (`migrate diff --from-schema … --to-schema prisma --script`) shows additive statements only.

**Order of operations (blocking)**

1. Ziad runs the read-only `prisma migrate diff --from-config-datasource --to-schema prisma --script` and checks it.
2. Ziad runs `prisma db push`.
3. Only then rebuild and push this commit. Deploying it before step 2 breaks every query that selects the new columns.

## 2026-10-04 · Centers phase 2: leak protection (main site)

Plan: `docs/centers/CENTERS_SPEC.md` §6, approved with three decisions:

1. Only direct consultant reads move to `prismaAll`.
2. Mobile `reservation-info` stays discovery.
3. `getConsultant` gets only the discovery filter.

**Clients** (`lib/database/db.ts`)

- The default export `prisma` is now the safe client: a `$extends` query extension injects `centerId: null` into every consultant `findMany`/`findFirst*`/`findUnique*`/`count`/`aggregate`/`groupBy`, unless `where.centerId` is set (`undefined` counts as not set).
- `prismaAll` is the plain client.
- All 13 `$transaction` calls compile unchanged; an interactive `tx` keeps the extension.

**`prismaAll`, for direct consultant reads that center orders reach**

- `getConsultantCost` → `resolveConsultantPricing` → `Pay`
- `reserveConsultant`'s consultant lookup
- `getOwnerByCid` (reschedule and package-session pages)
- the new `getConsultantInfoForBooking` (reserve component)

The rest of the paid path (`updateOrderStatus`, `onPaymentSuccess`, wallet, rooms, sessions, reschedule, notifications, Telegram, WhatsApp, webhooks, refunds, crons) reads the consultant only nested under `order`/`meeting`, which the extension doesn't touch.

**Discovery filters**

- Raw SQL `"centerId" IS NULL` in:
  - `getConsultants` (count and items), `getConsultant`, `getPuslishedConsultantsForHome`
  - `getArticles` (`NOT EXISTS` in the count and items), `getRecommendedConsultants`
  - `getCouponsForHome` (consultant and coupon)
  - `getDiscountConsultants` (count and items)
  - `getFavorites`, `getFavoriteConsultants`
  - `getFreeSessionConsultants` (count and items)
  - the four online lists
  - `getProgram`
  - reels `getConsultantsAvailableAt`
  - `getReviewsForHome`
- Prisma filters:
  - `getArticleByAid`, `getArticleComments`, `getQuestionByQid`, `getConsultantsPackages`
  - `getCoupons` (coupon `centerId: null` plus consultant)
  - reels timings (both copies)
  - `getPaidPast3Days` (order `centerId: null`)
  - `getConsultantReviews`, `getConsultantPaginatedReviews`

Platform behavior is unchanged: every existing consultant, coupon and order has `centerId = null`.

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes; all 139 pages pre-render against live data with the new filters.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- Every raw query that mentions `consultants` has the filter, except `recordInstantSnapshot` (doesn't read the table) and `reshuffleConsultants` (a write).
- `prismaAll` is used only at the four sites above.

**Open**

- `getConsultant` has no center version yet; it comes with the center pages, filtered by `centerId`.
- The mobile `consultants/[cid]/times` route still returns slot times for any cid (booking data, no profile fields).

## 2026-10-04 · Centers phase 3: pricing, coupons and money (main site)

Plan: `docs/centers/CENTERS_SPEC.md` §3, §7, §8. Ziad's read-only check found no `CENTER`-type coupons and no `used_coupons` rows of that type.

**Changes**

| File | Change |
|---|---|
| `data/event.ts` `getActiveDiscountFor` | the `DiscountConsultant` link counts only if the consultant and the discount are both platform, or the discount's center contains this consultant (§8). One query, no extra lookup. `resolveConsultantPricing` itself is unchanged. |
| `data/coupon.ts` `applyCoupon` | `coupon.centerId` must equal the consultant's `centerId` (null matches null). A `CENTER` coupon with a `consultantId` applies only to that consultant. Reuses the existing "another consultant" message. |
| `data/order/reserveation.ts` `reserveConsultant` | `Order.centerId` comes from the consultant. A center order's `Payment.commission` is `100 − Center.platformRate`. |
| `utils/order-split.ts` (new, pure) | `computeOrderSplit`, `paidSplit` (center orders only, once only) and `shareAfterRefunds` (refunds are VAT-inclusive SAR; `Payment.tax` is a percent) |
| `data/order/reserveation.ts` `orderStatusPaid` and `data/wallet.ts` `payAllByWallet` | both PAID paths add `platformShare`/`centerShare` to the PAID write for center orders (§7.1). The wallet path reads `centerId` and the payment snapshot first. |
| `data/dues.ts` | `getAllDuesOwner` and `getDuesOwnenByMonth` filter `centerId: null`. That covers the dues page, the month filter and the bot's `BotConsultantDues`. |
| `data/center/dues.ts` (new, server-only, no caller yet) | `getCenterDues(centerId)`: earned (Σ `centerShare` less proportional refunds, at read time), paid (Σ `CENTER_PAYOUT`), balance, the order rows and a by-consultant grouping. Throws on a non-finite `centerId`. |

**No change for platform rows** (reviewed in the diff):

- Discounts: every current link satisfies the first `OR` branch.
- Coupons: null equals null; no `CENTER` coupons exist.
- Orders: `center` is null, so the commission is computed as before and `centerId` is written as null, the default.
- Both PAID writes: `paidSplit(null, …)` returns `{}`.
- Dues: every existing order has `centerId = null`.
- The only additions are reads: one consultant lookup in `applyCoupon`, and one order lookup on the wallet-only PAID path.

**Tests**

- The repo has no test setup, so none was added.
- The util was checked with a throwaway `node --test` script that isn't committed. It covers:
  - the split examples, plus a sweep showing the two shares always sum exactly
  - partial, zero and over-full refunds, including the rounded full refund 58 → 50
  - `paidSplit` for platform, already-written and new center orders

  All pass.
- Spec §7.1 wants identical unit tests in the dashboard repo, and a runner is still to be chosen there.

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes; all 139 pages pre-render.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.

**Open**

- Refunds recorded from the admin dashboard (bank transfer, wallet, cash) must also be VAT-inclusive SAR. This repo writes only Moyasar refunds, which are.
- The bank-transfer PAID path lives in the admin dashboard and needs the same `paidSplit` logic.

## 2026-10-04 · Centers: public pages (main site)

**Design:** a fresh UI (`components/clients/centers/*`) that reuses no platform card, profile or reserve UI. Booking goes through the platform's server pipeline only:

- `getConsultantInfoForBooking`, `resolveConsultantPricing`, `getUnavailableWeekdays`, `getFinanceConfig`
- the `getConsultantAvailableTimes`, `applyCoupon` and `Pay` actions

No pricing or payment logic is duplicated. The display total uses the existing `calculatePayment`, and `Pay` recomputes it on the server.

**Routes** (already public in `routes.ts`)

| Route | What it shows |
|---|---|
| `/centers` | published centers by `sort_key`; nuqs city filter (`lib/nuqs/centers.ts`); cards with logo, name, city/district, description, consultant count |
| `/centers/[slug]` | the theme as CSS variables on a wrapper (`utils/center-theme.ts`: event presets, known keys only, hex colors only); cover, logo, about, address + Google Maps link, work hours with split shifts, amenities, gender preference; grid of published+approved consultants |
| `/centers/[slug]/consultants/[cid]` | profile (rating + count, no review list) and the booking panel, ONLINE only. The panel holds a `mode`, so ONSITE can be added next. Not-found unless the consultant belongs to the center and is published+approved |

**Data** (`data/center/*`, server-only, `prismaAll`, explicit `centerId`)

- `getPublishedCenters`, `getPublishedCenterBySlug`, `getCenterBySlugAnyStatus` (admin preview), `getSitemapCenters`
- `getCenterConsultants`, and `getCenterConsultant`: the center version of `getConsultant` with `centerId = ceid`, public columns only
- Both consultant functions reject a non-finite center id.

**Caching:** the `"use cache"` wrappers are in `app/(pages)/(site)/centers/[slug]/center.ts`, so `data/` registers nothing new. Tags: `centers`, `center:{ceid}` (a slug miss is tagged `centers`), `center-consultants:{ceid}`. Pricing and slots are uncached.

**Hidden centers:** not-found for the public. A logged-in ADMIN gets a preview with a "hidden" bar and `noindex`. The session is read only when the published lookup misses.

**Launch flag:** `CENTERS_ENABLED = false` (`constants/centers.ts`) gates the المراكز menu link and the sitemap entries (`/centers`, centers, center consultants).

**After payment**

- Audited: success and paid pages, client order pages, WhatsApp, Telegram and push notifications have no consultant-profile link.
- The expired-chat "تحدث مع المستشار" link (client chat and its dashboard copy) now uses `consultantPath(cid, centerSlug)` (`utils/consultant-path.ts`). It's a center route for center orders and the same `/consultants/{cid}` for platform orders.

**Seed:** `scripts/seed-test-center.ts`

- It isn't committed, because `/scripts` is gitignored, and it hasn't been run.
- Usage: `npx tsx scripts/seed-test-center.ts 9665XXXXXXXX`.
- The phone is required and goes to both consultants and the center.
- It creates a HIDDEN `test-center`, Sunday–Thursday work hours, and two approved, published, user-less consultants with ONLINE hourly slots. It's idempotent.

**Spec:** §9 and §10 now say: fresh design, same server pipeline, ONLINE first, client-only booking, admin preview, launch flag. §9 also documents the ONSITE WhatsApp templates (variables, the maps button, the non-empty / no-newline rules, and that `order_new_owner` stays for ONLINE).

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes, with the three routes as partial prerender.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- A `next start` guest check, before the seed: `/centers` shows the empty state; an unknown or hidden center and its consultant page render not-found with `noindex`; `/consultants/148` is unchanged.

## 2026-10-04 · Centers: public pages redesign (UI/UX only)

The visual reference was `docs/centers/ui-reference.png` (not committed): neutral shadcn surfaces, slim cards with one hairline border, small lucide icons (`strokeWidth` 1.75) in soft rounded-xl squares, and the center's theme as an accent only.

**Routing**

- `/centers` (the directory) stays in the site layout.
- `/centers/[slug]/**` moved with `git mv` to a new route group, `app/(pages)/(center)/`, with its own `layout.tsx`. That layout resolves the center (same `resolveCenter`, `notFound()` when it returns null) and renders the theme shell, a slim sticky topbar, the page, and a quiet footer.
  - **Topbar:** logo or monogram + name, anchors to عن المركز / المستشارون / الموقع, an accent احجز button and a 2px accent line.
  - **Footer:** the Shwerni logo, "مدعوم من شاورني" and a link to shwerni.sa.
- `(center)/not-found.tsx` shows the site's 404 content with the quiet footer.
- `viewport-fit=cover` is set on center pages only, so `env(safe-area-inset-bottom)` works.
- The admin preview bar and `noindex` behave as before.

**Palettes** (`constants/theme/center.ts`)

- emerald, teal, sky, indigo, violet, rose, amber, slate. Each has `accent`, `accentForeground`, `accentText`, `tint` and `soft`, all AA.
- `midnight` (the column default) → indigo.
- `utils/center-theme.ts` maps them to `--center-*` variables and keeps the hex-only override validation.
- The site has no dark mode (`<html class="light">`, no `.dark` styles), so the palettes are light-only.

**Pages**

- **Center home:**
  - a hero (cover or a soft accent gradient, logo or monogram, name, gender badge, city, two-line description)
  - quick-info stat tiles (city, working days, consultant count), streamed
  - about, with the policy as a quiet note
  - the consultant grid, streamed with skeleton cards
  - location (Google Maps button), hours (today highlighted after mount, Riyadh time), amenities (icon chips)
  - Hours and amenities are hidden when empty.
- **Consultant page:**
  - a profile header (photo, name, title, rating + count, category, years), then about, experience and education
  - the booking panel as a stepped flow (المدة → اليوم → الوقت → بياناتك → الدفع). Same state, same `getConsultantAvailableTimes` / `applyCoupon` / `Pay` calls and the same payload.
  - Details-step checks use the existing `schemas.name` / `schemas.phone`.
  - The panel is sticky on desktop. On mobile, a fixed bottom summary + CTA bar pads for `env(safe-area-inset-bottom)`, and the shell adds matching bottom space via `has-[#booking-bar]`, so the footer is never covered.
- **Directory:** a slim neutral card (logo or monogram, name, city, consultant count, hover lift), shadcn button chips for the city filter, and an empty state.
- **Skeletons:** a `loading.tsx` for the directory, the center home and the consultant page, plus per-section `Suspense` fallbacks.

**Unchanged:** `data/center/*`, the cache wrappers and tags (`center.ts` moved byte-for-byte), `Pay`, pricing, coupons and the booking payload. `center-header.tsx` and `center-info.tsx` were replaced and removed.

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes; the two route groups share `/centers` without conflict.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- A `next start` guest check against the seeded, published `test-center`:
  - `/centers` is in the site layout and lists it.
  - `/centers/test-center` has no site navbar, has the center footer, `viewport-fit=cover` and every section (about, consultants, location, hours, amenities, "الأحد – الخميس").
  - A consultant page renders the booking panel and the mobile bar.
  - `cid 1` and `/centers/nope` return not-found with `noindex` inside the center chrome.
  - `/consultants/148` is unchanged.

## 2026-10-04 · Centers: public pages UI/UX fixes

The problems were confirmed from `docs/centers/current-home.png`, and the target style from `docs/centers/ui-reference.png` (neither committed):

- an empty gradient box with no cover
- the monogram clipped under the cover
- the description shown twice
- boxed stat tiles
- consultants pushed below the fold

**Themes** (`constants/theme/center.ts`, `utils/center-theme.ts`)

- Eight multi-color themes with Arabic names: ليلي `night`, زمردي `emerald`, محيطي `ocean`, ملكي `royal`, بنفسجي `lavender`, وردي `rose`, صحراوي `desert`, زيتوني `olive`.
- Each has `primary` / `primaryForeground` (CTA, active states), `secondary` / `secondarySoft` (chips, badges, icon squares; a different hue or a neutral) and `accent` (a faint wash).
- AA was computed for every pair: on-primary 5.0–17.9; secondary on soft 4.8–7.0; secondary on white 4.9–7.6.
- Legacy keys are mapped (`midnight` → `night`, …). Overrides are still hex-only.
- CSS variables: `--center-primary`, `--center-primary-foreground`, `--center-secondary`, `--center-secondary-soft`, `--center-accent`.

**Center home: new order**

1. **Hero:**
   - The logo (relative z-10, above the cover, never clipped), name, gender badge, city/district and one description line.
   - Inline quick-info chips (working days, consultant count, streamed).
   - "احجز موعد" (primary → `#consultants`) and "الموقع" (→ `#location`).
   - With no cover it's a compact hero on the faint accent wash, with no empty gradient box.
2. **Consultants** ("اختر مستشارك"): borderless cards on `bg-muted/50`, an accent wash on hover.
3. **Compact info:** about (the full description, once) with the policy as a quiet inline note; then location, hours (today on the accent wash) and amenities (secondary chips). There are no card boxes; one hairline separates the info area.

**Booking panel**

- The phone field is the shared `components/shared/phone-input.tsx`. It holds E.164; the same `phoneNumber()` → `9665…` runs at submit, so the payload is unchanged.
- The details step follows `steps/details.tsx`: `Field` / `FieldLabel` / `FieldError`, red `*`, inline errors, and the WhatsApp note.
- Day buttons follow `shared/days-buttons.tsx` in the center's colors, since that component hard-codes the platform blue.
- Server calls and the payload are unchanged.

**Unchanged:** `data/`, `actions/`, `handlers/`, `center.ts`, pricing and payment.

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- A `next start` check of the seeded `test-center`:
  - the HTML order is hero → `#consultants` → `#about` → `#location`
  - the old gradient box is gone, and the compact hero is used
  - the description renders in exactly two visible paragraphs (the one-line preview and the full about text)
  - the consultant page renders the booking panel and the mobile bar

## 2026-10-05 · LCP: /articles/[aid] renders the cached article without per-user or per-view work

Search Console flags slow LCP (2.3–4.0s per URL) on article pages. The home fixes are from 2026-10-02 (`a1b5b8d`, `e971b39`, `114570f`, …). Articles never had LCP work.

**Before**

- `page.tsx` called `connection()`, so the whole page rendered per request.
- No article markup (the title, the cover and its preload) was sent until this serial chain finished:
  1. `userServer()`
  2. the cached article
  3. `await incrementArticleRead()`, a database write on every view
  4. `getArticleLikes()`, two queries

**Changes**

| File | Change |
|---|---|
| `app/(pages)/(site)/(sub-pages)/articles/[aid]/page.tsx` | no `connection()`, session, read write or likes query; `generateStaticParams` prerenders every published article; `notFound()` unchanged |
| `components/clients/articles/article/viewer.tsx` (new) | `ArticleLike` (session + likes), `ArticleLikeFallback` (the same 24px button, not clickable, so no layout shift), `ArticleCommentForm` (session), `ArticleReadTracker`. The tracker does `connection()` then `after()` → `incrementArticleRead`, catches and logs errors, and never runs during the build prerender. |
| `components/clients/articles/article/article.tsx` | no per-user props; the like button, comment form and read tracker each sit in their own `<Suspense>`; the cover image keeps `priority` + `sizes` and gets `fetchPriority="high"` |
| `data/article.ts` | `getPublishedArticleAids()` |

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes: `◐ /articles/[aid]` with revalidate 1d, expire 1w, and 278 article paths prerendered (420 static pages, up from 142).
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`, and there's no `"use server"` in `lib/`, `data/` or `handlers/`.
- In `.next/server/app/articles/64.html`, the title and cover are in the static HTML. The cover has a `<head>` preload and `fetchpriority="high"`.
- I didn't load article pages with `next start`, because each view writes the read count to the production database.

**Open**

- The article content still sits inside two Suspense boundaries in the static HTML, revealed by inline scripts in the same document:
  - the root `app/loading.tsx` (a site-wide spinner, which wraps every page including home)
  - `articles/[aid]/loading.tsx`
- Removing the root `loading.tsx` would put content truly in place on every page. It's a site-wide UX change, so it's left for a separate decision, the same option as the soft-404 note.
- Articles published after a build render on their first request (the skeleton, then the content) until the next build.

## 2026-10-06 · Sitemap index with one sitemap per page type

Goal: Search Console reports indexing per page type (about 609 URLs, so the split is for reporting, not size).

**Structure** (route handlers, which give readable URLs; `generateSitemaps` makes no index, and nested `sitemap.ts` files would give `/sitemaps/<type>/sitemap.xml`)

| URL | Source | Content |
|---|---|---|
| `/sitemap.xml` | `app/sitemap.xml/route.ts` | sitemapindex of the per-type sitemaps (`centers` only when `CENTERS_ENABLED`) |
| `/sitemaps/static.xml` | `app/sitemaps/static.xml/route.ts` | `/`, `/consultants`, `/articles`, `/programs`, `/coupons`, `/contact-us`, `/terms`: indexable, own canonical, no lastmod |
| `/sitemaps/consultants.xml` | `…/consultants.xml/route.ts` | active, published, approved platform consultants (the safe client excludes center consultants). No lastmod: `updated_at` also moves on presence updates |
| `/sitemaps/articles.xml` | `…/articles.xml/route.ts` | published articles; lastmod = `created_at` (the table has no `updated_at`; no schema change, Ziad's decision) |
| `/sitemaps/programs.xml` | `…/programs.xml/route.ts` | published programs; lastmod = `updated_at` |
| `/sitemaps/centers.xml` | `…/centers.xml/route.ts` | `/centers`, published centers and their public consultants (`updated_at`). It returns 404 until launch |

- **Shared:** `app/sitemaps/_lib/sitemap.ts` (types, the XML writer with escaping, the URL helpers built on `mainRoute`).
- **Data:** `data/seo.ts` `siteMapDynamic` is replaced by `siteMapConsultants` / `siteMapArticles` / `siteMapPrograms`, one query per sitemap.
- **Revalidation:** each data sitemap uses `"use cache"` + `cacheLife("weeks")`, the old `revalidate = 604800`. Segment `revalidate` doesn't apply to route handlers under Cache Components; the old `/sitemap.xml` was in fact dynamic (`ƒ`), with `new Date()` on every URL. All sitemap routes now build as `○` (data ones: 1w revalidate / 30d expire).
- **Removed:** `priority` and `changeFrequency`, and the old `app/sitemap.ts` with its commented-out version.
- **`proxy.ts`:** the matcher also skips `sitemaps/`. The regex was tested: `/sitemap.xml`, `/sitemaps/*.xml` and `/robots.txt` skip the proxy, and pages still run it.
- **`robots.ts`:** already points to `https://www.shwerni.sa/sitemap.xml` (unchanged).

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- `next start`:
  - the index lists 4 sitemaps
  - URL counts: static 7, consultants 317, articles 278, programs 7
  - centers.xml returns 404
  - all 331 static, consultant and program URLs answer 200 with no `noindex` (articles weren't loaded, because each view writes a read count to production)
  - every `<loc>` is absolute `https://www.shwerni.sa/…`, with no trailing slash except home, which matches its canonical
- One build showed transient first-attempt "took more than 60 seconds" retries, on unchanged routes too. The next clean build had none.

## 2026-10-07 · Center dashboard, part A (auth, overview, orders, profile, theme)

Spec: `CENTERS_SPEC.md` §11, §13, §16, §19. Decisions: order detail shows the client name only (like the consultant dashboard; the phone is revisited in the onsite phase); orders filter by session date; mobile nav is a bottom bar (نظرة عامة، الطلبات، الملف) plus "المزيد" (a sheet with المظهر).

**Auth**

| File | Change |
|---|---|
| `data/user.ts` `getUserLogin` | the web login allows `USER`, `OWNER` and `CENTER`. The management login now excludes `CENTER` too (before, `notIn [USER, OWNER]` would have let a center account in) |
| `handlers/auth/login.ts` | CENTER → `/center` |
| `routes.ts` | `/center` added to `protectedPrefixes` (matched as `/center` or `/center/…`, never `/centers`) |
| `components/clients/header/submenu.tsx` | CENTER menu entry "لوحة المركز" → `/center` |
| `components/legacy/layout/zErrors/auth/role.tsx` | a CENTER message ("بالمراكز") |
| `data/center/require-center.ts` (new) | `requireCenter()` per §11.1 (session → role CENTER → CenterMember → finite centerId; throws `CenterAccessError`), plus `getCenterMembership` |

- Sign-up is unchanged: `register` allows USER/OWNER only; mobile has a create allowlist and an update hook blocking role changes.
- Nothing in the app creates a `CenterMember`.
- Existing areas already reject CENTER: the `(user)` layout requires USER, and `/dashboard` requires OWNER.
- There's no plain `startsWith("/center")` anywhere.

**Dashboard** (`app/(pages)/(center-dashboard)/center/…`, its own layout with no Shwerni navbar, `noindex`)

- **Data:** `data/center/dashboard.ts`. Every query is scoped by the `centerId` from `requireCenter()`; client ids (`cid`, `oid`) only narrow an already-scoped query.
  - `getCenterOverview`: upcoming PAID sessions (Riyadh date), and pending approvals (consultants + bank accounts)
  - `getCenterOrders`: search by order number or name; filters for consultant, session date range and payment state; 10 per page
  - `getCenterOrder`: `{ oid, centerId }`
  - `getCenterConsultantOptions`, `getCenterSettings`, `updateCenterProfile`, `updateCenterTheme`
- **Actions:** `actions/center/settings.ts` is the first use of `createAction`, with `auth: [CENTER]`.
  - Each handler calls `requireCenter()` first and returns `forbidden` without a membership.
  - `saveCenterProfile` (`schemas/center.ts`): no slug, status, platformRate, sort_key, ceid or legal numbers; logo and cover must be uploadthing URLs.
  - `saveCenterTheme`: one of the 8 themes plus hex-only overrides. AA is checked server-side (`utils/contrast.ts`), with new error codes `contrast_primary` and `contrast_secondary`.
  - Saves call `updateTag("center:{ceid}")`; profile saves also call `updateTag("centers")`.
- **Pages:**
  - overview: this month's earned (from `getCenterDues`), balance, pending approvals, today's and upcoming bookings
  - orders: nuqs filters, pagination, read-only detail
  - profile: react-hook-form, the existing `UploadField` for logo and cover, inside `UploadThingWrapper`
  - theme: theme cards with Arabic names, a live preview and overrides
  - Each page calls `requireCenter()` itself. `loading.tsx` uses a skeleton.
- **Nav** (`components/center-dashboard/nav.tsx`): a desktop sidebar with everything, and the mobile bottom bar + "المزيد" sheet, above the safe area.

**Fixes**

- `resolveCenter` (public center pages): a hidden center previews for an ADMIN (any center) or a CENTER member of **that** center only (same bar and `noindex`).
- `reserveConsultant`: booking a consultant whose center isn't PUBLISHED returns the existing "not available" result before any order is created. No preview exception.

**Seed** (`scripts/seed-test-center.ts`, gitignored, not run)

- Usage: `<notifyPhone> <loginPhone> <password>`.
- It creates or refreshes a CENTER user (bcryptjs cost 10, like register; `phoneVerified` set) and a `CenterMember` OWNER for test-center.
- It aborts if the login phone belongs to a non-CENTER user.

**Verified**

- `npx tsc --noEmit` passes.
- `npm run build` on a clean `.next` passes, with no timeouts. Routes `/center`, `/center/orders`, `/center/orders/[oid]`, `/center/profile` and `/center/theme` are all ◐; `/centers…` is unchanged.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"` (plus the new `actions/center/settings.ts`, as expected).
- `next start`, logged out: `/center…` returns 307 to `/login`; `/centers` and `/centers/test-center` return 200.
- The logged-in dashboard needs the seeded CENTER account; not checked yet.

## 2026-10-07 · Public /packages page (consultant packages with search, filters and a view toggle)

**Route:** `app/(pages)/(site)/(sub-pages)/packages/page.tsx`, a sub-page in the coupons layout. It's added to `publicRoutes` and to `sitemaps/static.xml`, but not to the header nav. The canonical is fixed to `/packages` for every param combination.

**URL state** (`lib/nuqs/packages.ts`, one params object shared by the server cache and the client):

- Params: `view` (`packages` | `consultants`), `search`, `category[]`, `gender[]`, `sessions[]`, `sort`, `page`.
- Empty lists mean "all".
- Enum parsers drop unknown values before the SQL.
- Every change resets `page`.

**Data** (`data/packages.ts`, `server-only`, no `"use server"`):

- `getPublicPackages` (one row per package) and `getPublicPackageConsultants` (one row per consultant, `json_agg` of the matching packages). Both use raw SQL.
- They share one `FROM`/`WHERE`: `p."isActive"`, consultant `status`, `PUBLISHED`, `APPROVED`, and `"centerId" IS NULL`. That last one is by hand, because the safe client doesn't cover raw SQL.
- Page size 12, with the page number clamped.

**Pricing:**

- Cards show the flat `package.cost` (`CurrencyLabel tax={15}`).
- Savings come from `utils/packages.ts`, the same math as the booking `Packages` component: against `cost30 × count`, the undiscounted 30-minute price.
- No discount or coupon code is involved, and nothing calls `resolveConsultantPricing`.
- Booking stays on `/consultants/{cid}`.

**Arabic search** (`utils/arabic.ts`):

- `normalizeArabic`: strips harakat and tatweel; maps أ/إ/آ/ٱ → ا, ة → ه, ى → ي; lowercases; collapses spaces.
- `escapeLike`
- The SQL applies the same folds to `consultants.name` (`regexp_replace` + `translate`, no extension).

**Other:** `constants/packages.ts` holds the session counts `[3, 4, 5, 6, 8, 10]`; the consultant dashboard page now imports them instead of its local copy (same values). Components are in `components/clients/packages/`: filters, package-card, consultant-packages-card, empty, navigation.

**Verified**

- `npx tsc --noEmit` passes. `npm run build` on a clean `.next` passes; `/packages` is ◐.
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- `next start`:
  - **Totals:** 239 packages / 110 consultants. Sessions, category, gender and their combinations narrow correctly; both sorts reorder.
  - **Edge params:** `page=999` clamps to 20/20, and invalid `category`/`sort`/`view` fall back to the defaults.
  - **Search:** نورة = نوره (3), امينة = أمينه, ال سعد = آل سعد, مُصْعَب = مصعب, extra spaces match, `%`/`_` match literally, تجريبي (center consultants) → 0 and the empty state.
  - **Sitemap and meta:** static.xml lists `/packages`, and the canonical and title are correct.

**Open questions**

- In the default "recommended" package view, one consultant's 2 or 3 packages sit next to each other (sorted by `sort_key`, then count). The consultant view avoids this. Should the default view interleave them instead?
- The savings line compares 45-minute package sessions with the 30-minute price. It's kept on purpose so both pages match.

## 2026-10-08 · SEO cleanup (collaboration urls, real 404s, scales canonical, links)

**Changes**

- `proxy.ts`:
  - **`collaboration` cleanup:** an empty, `undefined` or `null` `collaboration` param gets a 301 to the same url without it; other params are kept.
  - **Real 404s:** a missing or hidden `/articles/<id>`, `/consultants/<id>`, `/programs/<id>` or `/scales/<slug>` is rewritten to an unmatched path, so it answers a real 404 (`app/not-found.tsx`). Before, the page's `notFound()` ran after the prerendered shell had streamed, which only adds `noindex` to a 200.
    - The checks are in `data/seo.ts` (`publicDetailExists`) and mirror each page's `notFound()` rule.
    - They're cached per instance: found for 5 minutes, missing for 1 minute.
    - A database error lets the request through to the page.
- `data/seo.ts`: the articles sitemap uses the page's rule (it excludes articles by center consultants).
- Scales metadata: the canonical and `og:url` pointed to `/مقاييس` and `/مقاييس/<slug>`, which don't exist (404). They now point to `/scales` and `/scales/<slug>`.
- Links to `https://www.shwerni.sa/consultants/…`: the question page (`/consultant/` → `/consultants/`), the AI bot's profile link, the consultant QR card, the bot prompt (8 non-www links → www), and the default program image url.

**Not changed (no code builds them now)**

- `?collaboration=undefined` came from the old `/consultant/[cid]` page's `permanentRedirect(\`/consultants/${cid}?collaboration=${collaboration}\`)`, removed in `c4b4953`. The dashboard builds the param only when a collaboration exists.

**Verified**

- `npx tsc --noEmit` passes. `npm run build` on a clean `.next` passes (with phase 1 merged).
- The manifest check prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- `next start`:
  - **`collaboration`:** `=undefined`, `=` and `=null&x=1` give a 301 (keeping `x`); `=abc` gives 200.
  - **Real 404s:** missing article, consultant, program and scale, plus `/articles/abc` and `/articles/%E0`, all give 404. The existing ones give 200.
  - **Canonicals:** `/scales` and `/scales/gad-7` are clean.
- Sitemaps: 612 urls (static 8, consultants 319, articles 278, programs 7). All are www, with no query and no `/consultant/`, and all answer 200, indexable, with canonical equal to the url. The only flag is the home page (`/` versus a canonical without the slash, which is the same url).

**Open questions**

- Scales (`/scales` and 12 scale pages) are indexable but not in any sitemap.
- `robots.txt` doesn't block the private routes (`/dashboard`, `/center`, `/account`, `/orders`, `/favorite`, `/meetings`, `/chats`, `/reschedule`, `/payment`, auth pages). Four of its rules (`/zadmin`, `/employees`, `/brief`, `/collaborator`) match no route here.

## 2026-10-08 · SEO review follow-up, and the phase 1 verification

**SEO changes (on top of 6cfa41a)**

- **Proxy existence check removed** (`publicDetailExists` and the proxy 404 rewrite). `proxy.ts` keeps only the `collaboration` 301.
- **Real 404s from the pages: not possible under partial prerendering.** Tried and reverted.
  - For `notFound()` to set the status, nothing may stream first. That means no `<Suspense>`/`loading.tsx` above the page's check, and `generateStaticParams` so Next 16 accepts reading params outside a boundary.
  - Known ids then prerender fine. But Next 16.2.9 renders an unknown id at request time as a one-off static page, and any request-time api in the tree (the site layout's session read, the like button, the comment form) throws `DYNAMIC_SERVER_USAGE`, then `Invalid revalidate configuration provided: 0 < 1`.
  - Every unknown id answered **500**, content published after a deploy included. Missing pages keep 200 + `noindex`, now inside the site layout.
- **Scales sitemap:** `/sitemaps/scales.xml` lists `/scales` and the 12 active scales (`siteMapScales`, the page's `isActive` rule).
- **Apex redirects** (`next.config.ts`):
  - **Rules:** `shwerni.sa/consultant/<cid>` → `https://www.shwerni.sa/consultants/<cid>` in one hop, and other apex paths → www.
  - **Inactive for now:** vercel redirects the apex domain at the edge (308 to www, never reaching the app), so the rules apply only once the apex is served by this project in the vercel domain settings.

**Phase 1 verification** (main = phase 1 + hotfix + seo; clean `npm run build` passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`)

- `/`: the hero is in the initial shell (byte 15,369, before the first hidden segment at 67,968), with no full-screen spinner.
- **Duplicate ids:** none on 25 pages (`/`, `/articles/96`, `/articles/85`, `/consultants/131`, `/scales/gad-7`, and one page per new `loading.tsx`). Not checked: `/center`, `/dashboard`, `/account` and `/reconciliation/<id>`, which redirect to `/login` without a session.
- **Hydration, CPU, memory:** `/` and `/articles/96`, 12 loads each: 0 react #519, idle script 0.02-0.11s per 8s. 60s holds: heap flat (about 18-20 MB).
  - One load each logged a failed resource (a 500 and a 400). It didn't repeat in 16 more loads; the server log shows one outbound fetch timeout.
- **Sitemaps:** 625 urls (static 8, consultants 319, articles 278, programs 7, scales 13), all final, indexable, canonical = url.
- **Mobile lighthouse, median of 3:**

  | page | build | score | LCP | TBT |
  |---|---|---|---|---|
  | `/` | production | 36 | 18.8s | 1168ms |
  | `/` | local | 57 | 5.0s | 1181ms |
  | `/articles/96` | production | 43 | 6.1s | 2194ms |
  | `/articles/96` | local | 58 | 4.7s | 1171ms |

  Production already runs phase 1 (the merge is on origin/main).

**Open questions**

- **Lighthouse first paint on production `/` is about 2.5s** (FCP = LCP) against about 0.34s locally with the same code. It's lab-only: real chrome cold loads paint production at 0.5-0.7s, the same with the lighthouse user agent.
  - Blocking third parties gives 63-66 and TBT 216-599ms, but one of two runs still held first paint until 2.6s.
- **PageSpeed drop** (90/70 → 70/39) not reproduced. Production mobile was 33-37 in my lighthouse before and after phase 1; PageSpeed varies about ±10 with third-party timing.

## 2026-10-08 · Performance phase 2 (third parties, css fade, inlineCss)

Code committed by Ziad as `2605dd6` (pushed). This entry records the verification.

**Changes**

- `next.config.ts`:
  - the unused bare-domain host rules are removed
  - `experimental.inlineCss` on, the critters option off
- **Pixels:** Meta, Snap and Twitter in the root layout use `lazyOnload`.
- **GTM:** `<GoogleTagManager>` (which also preloaded `gtm.js`) is replaced by:
  - an inline `<head>` script (`components/legacy/layout/scripts/ads/gtm.ts`, `GTM_QUEUE`)
  - a `lazyOnload` loader
- **What the queue script does:** every conversion in the container fires on gtm's own click listeners (whatsapp link, link on `/success`, `SPay-btn`), which a lazy gtm doesn't have yet. So the script:
  - starts the dataLayer
  - records clicks made before gtm is ready as `gtm.click` / `gtm.linkClick` (`gtm.triggers: ""`), and loads gtm at once on the first one
  - holds a link that leaves the page until gtm has fired the click's tags (`eventCallback`) and the ads destination is loaded; navigates at once if `gtm.js` fails (an ad blocker), never past 4s
  - counts gtm as ready only after its own `eventCallback` for the first event: `google_tag_manager` exists a moment before gtm's click listeners are on
- **Categories (desktop grid):** a css `animate-fade-in-up` (0.6s, `prefers-reduced-motion` off) replaces `DivMotion`. The grid is `hidden md:block`, so mobile is unaffected.

**Verified** (clean build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`)

- **Conversions** (tracking requests failed in the test, so nothing reached the ad accounts):

  | case | early, gtm normal | early, gtm.js +800ms | late |
  |---|---|---|---|
  | whatsapp link | ads `HWNb…`, tiktok, GA4 `Whatsapp` | same | same as production |
  | link on `/success` | ads `-bNU…`, tiktok `Lead` (+ Snap `SIGN_UP`) | same | same as production |
  | `SPay-btn` | ads `9K0p…` | same | same as production |

  - With `gtm.js` blocked, an early click navigates after about 0.2s.
  - **Production before this change:** an early whatsapp click and an early success-page link lost their conversions (the page left before the tags were sent).
  - **Meta `Lead`:** fires nowhere, production included (pre-existing; check the tag in GTM preview).
- **Hydration:** `/` and `/articles/96`, 12 loads each: 0 react #519, idle script 0.02-0.13s per 8s, no console errors.
- **Duplicate ids:** none on `/`, `/articles/96`, `/articles/85`, `/consultants/131`, `/scales/gad-7`.
- **HTML size with inlineCss** (the 188 KB stylesheet is inlined, and next also embeds it in the rsc payload):

  | page | raw | brotli |
  |---|---|---|
  | `/` | 334 → 895 KB | 24.5 → 54.2 KB |
  | `/articles/96` | 334 → 903 KB | 25.3 → 54.9 KB |

- **Mobile lighthouse, median of 3, local** (the A/B is the same build with only `inlineCss` off):

  | page | build | score | LCP | TBT |
  |---|---|---|---|---|
  | `/` | phase 2 | 53 | 5.6s | 1389ms |
  | `/` | phase 2, inlineCss off | 53 | 5.0s | 1495ms |
  | `/articles/96` | phase 2 | 53 | 5.4s | 1490ms |
  | `/articles/96` | phase 2, inlineCss off | 55 | 5.0s | 1488ms |

  Production `/` 43 (LCP 6.6s), `/articles/96` 50 (LCP 4.9s).
- **Lighthouse first-paint hold on production:** still there with third parties deferred.
  - It's a Lighthouse-only stall: the trace has no frames between about 0.33s and 2.58s.
  - Not caused by BotID (blocked: still 2.6s) or by third-party scripts.
  - A fresh real chrome with lighthouse's viewport and user agent paints production at about 0.66s (0.69s with js off).

**Open questions**

- inlineCss: revert? (+30 KB brotli per page, no lighthouse gain, slightly worse LCP)
- Meta `Lead` never fires.
- Lighthouse/PageSpeed hold on production: unexplained; real-user data (vercel speed insights / CrUX) is the better measure.

## 2026-10-08 · Performance phase 3 (css, props, list pages, icons, speed insights)

**Changes**

- **`inlineCss` reverted;** `critters` and `@next/third-parties` uninstalled; `@vercel/speed-insights` installed and `<SpeedInsights />` added to the root layout.
- **Css audit (read-only, no change):**
  - the main stylesheet is 180 KB raw / 22.7 KB brotli, almost all tailwind utilities
  - library css: `@smastrom/react-rating` 5 KB, keyframes under 1 KB
  - scanning `docs/` adds 36 bytes
  - only the dashboards and legacy components use about 7.7 KB
  - unused shadcn files (never imported): `slider` (1.2 KB of css), `hover-card`, `tooltip`
- **Home props:** the consultants carousel gets only the card's fields (`HomeConsultantCard`; the query keeps every field for the mobile api; `cost30` stays as the "starting from" price), and reviews get name, comment, rate and date (`ReviewCardData`).
- **List pages** (consultants, packages, programs, event, questions, scales, instant):
  - **Removed:** the route `loading.tsx`.
  - **Static header** in the prerendered shell.
  - **Results:** the search params are read in a results component inside `<Suspense>`, the `/articles` pattern.
  - **Url-reading client parts** (nuqs filters, search, the questions list) render at request time through `components/shared/request-time.tsx`, so the server renders them, not only the browser after hydration.
  - **Cached queries:** scales list (`"scales"` tag) and questions (`"questions"` tag).
  - **Instant:** the title is static and the form streams in.
- **Detail pages** (`consultants/[cid]`, `programs/[prid]`, `programs/reserve`, `scales/[slug]`, `scales/orders`, `scales/results`, `questions/[qid]`): `loading.tsx` uses `components/shared/page-skeleton.tsx` (a light skeleton below the header) instead of the full-screen spinner.
- **Icons above the fold** (hero arrow, categories, article header) are plain server svgs (`components/shared/server-icon.tsx`, lucide's own icon data and class helpers). The markup is byte-identical to lucide-react's.

**Verified** (clean build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`)

- All list and detail routes are partial prerenders.
- **Server-rendered** in the html: filter labels, 9 consultant cards, 10 question links, 12 package cards, 12 scale links.
- **Duplicate ids:** none on 14 changed pages.
- **Hydration:** 0 react #519 and flat idle cpu on `/` and `/articles/96` (12 loads each) and the 7 list pages (3 each).
  - The only console error is the speed insights script 404 on local `next start`: it exists only on vercel, and production serves it.
- **Conversions:** whatsapp, `/success` link and `SPay-btn`, early, late and with a slow gtm, all fire (ads, tiktok, GA4).
- **Payload on `/`:** consultants 8.0 → 6.4 KB, reviews 4.0 → 1.2 KB, html 305 KB (898 KB with inlineCss).
- **Mobile lighthouse, median of 3** (local tbt is noisy: the server shares the cpu):

  | page | production (phase 2) | local (phase 3) |
  |---|---|---|
  | `/` | 41, LCP 6.5s | 51, LCP 5.3s |
  | `/articles/96` | 56, LCP 4.8s | 54, LCP 4.9s |
  | `/consultants` | 57, LCP 5.8s | 56, LCP 4.9s |

- **Lighthouse first-paint hold** on production (about 2.5s observed) is unchanged.

**Open questions**

- Delete the unused shadcn files (`slider`, `hover-card`, `tooltip`)?
- The dashboard should call `/api/revalidate` with the `scales` / `questions` tags when it edits them (cached for hours until then).

## 2026-10-08 · Article FAQ section (schema, display, FAQPage json-ld, dates)

**Schema** (`prisma/models/article.prisma`, applied by Ziad with `db push`)

- New model `ArticleFaq` (`article_faqs`): `id`, `question`, `answer`, `order`, timestamps, and `articleAid` → `Article.aid` (cascade delete).
- New column `Article.updated_at DateTime?`. It's written explicitly by whoever edits the content, not `@updatedAt`: the dashboard edits with raw sql (prisma never sees it), and the view counter would move it on every page view.

**Code**

- `data/article.ts`: `getArticleByAid` also returns the faqs (question, answer, ordered by `order` then `created_at`). `[]` when none.
- **Article page:**
  - `getProcessedArticle` is tagged `articles` and `article:<aid>` (days lifetime as the fallback). Until now nothing could invalidate a cached article.
  - **Description:** the first 160 characters, cut at a word boundary.
  - **Dates:** `dateModified` and og `article:modified_time` are `updated_at ?? created_at`.
- **`components/clients/articles/article/faq.tsx`:**
  - a server component directly after the body: `h2` "الأسئلة الشائعة", one native `<details>` per question (`h3` in the `summary`), all closed, no client js
  - part of the cached article content (no streamed boundary of its own); renders nothing without faqs
- **Json-ld, one `@graph`:**
  - Article (adds `dateModified`; the author `url` is the consultant page the article links to; `mainEntityOfPage` is `{@id: url}` with a faq)
  - FAQPage (`@id` and `url` = the article url; `mainEntity` = the same questions and answers the section shows), only when the article has faqs
  - BreadcrumbList
- **Sitemap:** the articles `lastmod` is `updated_at ?? created_at`, and `articles.xml` is tagged `articles`.

**Verified** (clean build passes; manifest only `"data/event.ts"` and `"lib/api/google.ts"`)

- **`/articles/80`, 2 faqs:**
  - the section shows both questions, closed, with the heading
  - the graph is Article + FAQPage + BreadcrumbList, and the FAQPage matches the visible faq exactly
- **`/articles/96` and `/articles/85`, no faqs, `updated_at` null:**
  - no section; the graph is Article + BreadcrumbList
  - `dateModified` and og modified time equal the publish date
  - the description is cut at a word boundary
- **Author:** `/articles/125` has a Person `url` of `/consultants/153`, the same link the page shows.
- **Sitemap:** 278 urls (same as production); `/articles/80` lastmod is its created_at (updated_at null).
- **Duplicate ids:** none on 4 articles.
- **Hydration:** 0 react #519 and flat idle cpu over 6 loads each of `/articles/80` and `/articles/96`.

**Dashboard (not done, out of scope for now)**

- copy the schema change into its prisma schema and run `prisma generate` (never `db push` from there)
- add `"updated_at" = now()` to its raw `UPDATE "articles"`
- in the faq editor, save the faqs and bump `articles.updated_at` in one transaction
- after an edit, call `purgeClient("article:<aid>")` and `purgeClient("articles")`
