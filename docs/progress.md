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
