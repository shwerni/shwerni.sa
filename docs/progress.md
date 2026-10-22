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

## 2026-10-09 · مرافعة phase 1 (schema)

The plan is `C:\Users\ABO ELMAGD\.claude\plans\tender-sprouting-hare.md` (rev 2 plus additions, approved). Applied by Ziad with `db push`.

**Schema**

- **`prisma/models/pleading.prisma` (new):** enum `PleadingState` (DRAFT, REQUESTED, QUOTED, PAID, DECLINED, EXPIRED, CANCELED) and model `Pleading` (`pleadings`).
  - **Fields:** `plid`, `state`, `name`, `phone`, `author` (null for a guest), `clientToken` (unique, the client's link identity), `price` (pre-vat whole sar).
  - **Timestamps:** `requestedAt` (unquoted cases expire 7 days after it), `quotedAt`, `expiresAt` (quote + 7 days), plus `created_at`/`updated_at`.
  - **Relations:** `consultantId` → Consultant, `orderId` (unique, nullable) → the current checkout Order, and `messages`.
  - **Indexes:** `[consultantId, state]`, `[state, requestedAt]`, `[state, expiresAt]`.
- **`chat.prisma`:** `OrderMessage.orderId` and `meetingId` are now nullable, and there's a new `pleadingId` → Pleading (cascade) with index `[pleadingId, createdAt]`. A case message has `pleadingId` set, and `orderId` and `meetingId` stay null until payment links it to the session's meeting.
- **`consultant.prisma`:** `Consultant.pleadingEnabled Boolean @default(false)` (opt-in, only for LAW) and the `pleadings` relation.
- **`reservation.prisma`:** `Order.pleading Pleading?`.

**Code**

- None. `tsc --noEmit` gave 0 errors after the nullable change.
- I checked every `orderMessage` reader by hand:
  - `data/chats.ts` filters by `meetingId` or goes through the meeting relation.
  - `data/order/reserveation.ts:528/673` read an order's first message through the order relation.
  - No raw sql touches `order_messages`. Existing chats are unchanged, and unlinked case messages can't show up anywhere.
- **Correction to the first plan:** the NestJS server has no database access (its `chat-message` is an in-memory socket relay), and the mobile app doesn't read `order_messages`.

**Verified**

- `prisma validate`, `prisma generate`, `tsc --noEmit`, and a clean `npm run build` after the db push.
- The manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

**Open questions / follow-ups**

- **Dashboard repo:**
  - copy the schema changes into its prisma schema and run `prisma generate` (never `db push` from there)
  - add the setting `finance/pleadingCommission` (the consultant's share, default 80, so the platform takes 20%) next to commission in `admin/settings/index.tsx`
- **Insecure link encryption:** `utils/admin/encryption.ts` has a hardcoded AES key in client-safe utils. Logged only; not touched.
- **No AI guard on reservation notes:** `reserveConsultant` and `reserveInstant` save the booking notes as the first chat message without `checkMessageWithAI`. Logged only; not changed (business logic).
- **WhatsApp templates:** the 4 UTILITY templates (`pleading_new_request`, `pleading_request_received`, `pleading_quoted`, `pleading_chat_notify`) were handed to Ziad for Meta approval before phase 6.

## 2026-10-09 · مرافعة phase 2 (data, actions, API)

**New files**

- **`lib/pleading-token.ts`:** `newClientToken()` (32 random bytes, base64url).
- **`utils/pleading.ts`** (client-safe):
  - the constants (60 min, 7 days, 5 files, price 100–100000)
  - `pleadingStateLabels`, `pleadingErrors` (the arabic text for the new error codes)
  - `isQuoteOpen`, `isPleadingChatOpen`, `pleadingQuoteMessage`
  - the zod schemas, including the checkout schema for phase 5 (it has no price, coupon or discount fields)
- **`data/pleading.ts`** (server-only):
  - **Access:** `getPleadingAccess` (token → USER, owner session → OWNER), `getClientPleading`, `getPleadingForConsultant`, `listConsultantPleadings`, `getPleadingThread`, `getPleadingConsultant`, `getPleadingCheckout`.
  - **Expiry:** `expireDuePleadings`.
  - **The request:** `createPleadingDraft`, `finalizePleadingDraft`.
  - **Chat:** `sendPleadingMessage`.
  - **Decisions:** `quotePleading`, `declinePleading`, `cancelPleading`.
  - **Payment:** `linkPaidPleading`, not called yet.
- **`actions/pleading.ts`:**
  - **Public, with `checkHuman`:** `requestPleading`, `finalizePleadingRequest`, `sendPleadingClientMessage`, `cancelPleading`.
  - **OWNER:** `sendPleadingOwnerMessage`, `quotePleading`, `declinePleading`, `togglePleading`.
- **`app/api/pleadings/[plid]/chat/route.ts`:** GET for polling the case chat.

**Changed files**

- **`data/consultant.ts`:** `getPleadingConsultants()` (the public rule + LAW + `pleadingEnabled`, card data in sort_key order) and `setPleadingEnabled(cid, enabled)` (LAW only).
- **Commission:** `getPleadingCommission()` in `data/admin/settings/finance.ts` reads `finance/pleadingCommission`, the consultant's share; `constants/admin.ts` adds `defaultPleadingCommission = 80`. Nothing reads it yet (phase 5).
- **`lib/notifications/site.ts`:** the 4 template functions (they always send; see phase 6).
- **`app/api/uploadthing/core.ts`:** the `pleadingAttachment` endpoint.
  - Limits: image 8MB, pdf 16MB, 1 file per upload.
  - Access: the token or the owner session.
  - States: open cases, or the client's own DRAFT.
  - Rate limit: 20 per case per hour.
- **`routes.ts`:** `/api/pleadings` in the dynamic public routes, next to `/api/meetings`. Without it, the proxy redirected every call, the guest's included, to /login (307).

**Rules**

- **Expiry:**
  - `expireDuePleadings` persists QUOTED → EXPIRED once `expiresAt` passes, and REQUESTED → EXPIRED 7 days after `requestedAt`. It sends no notification.
  - It runs before every access and before the consultant's list, so a case nobody opened still lists as EXPIRED.
  - A closed case refuses messages and uploads.
- **Sender role** comes from the access path only. The consultant's access is `consultant.userId = session user` inside the query, and a DRAFT is never visible to the consultant.
- **AI guard (`checkMessageWithAI`):**
  - It runs on the brief, every chat message and the quote's reply text.
  - The quote's price line ("عرض السعر: X ريال (قبل الضريبة)") is written by the server and isn't guarded, so the price digits can't trip the phone-number check.
- **The client token:**
  - It's never selected into a returned object and never sent to the consultant.
  - It isn't in a rate-limit key (keys are stored and logged).
  - Errors are logged as a function name plus a prisma code or error name only.
  - The route takes it in the `x-pleading-token` header, so it stays out of request urls and logs.
  - "Not found", "not yours", a malformed token and a token for another case all return the same 404.
- **A running checkout** (linked order NEW and under 20 minutes) blocks re-quote, decline and cancel. A paid one blocks them too.
- **Unchanged:** `createMeetingMessage` and every function in `data/chats.ts`. Nothing in `handlers/` or the payment code is touched.

**Verified**

- `tsc --noEmit`: 0 errors. eslint: no new warnings (3 old ones in files I only appended to).
- A clean `npm run build`. The manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`. The pleading actions aren't in it yet because no client component imports them; that starts in phase 3.
- **Local production smoke test against the database** (read-only, no rows created):
  - `/api/pleadings/1/chat` returns 404 with no auth, a bad plid, a malformed token, or an unknown valid-shape token.
  - `/api/meetings` behaves as before.
  - `pleadingAttachment` with an unknown token returns Unauthorized.
  - No column errors appeared, and the token is absent from the server log.
- Not exercised yet: the full request → quote → chat flow. It needs the phase 3–4 UI and test rows.

**Open questions**

- Should a decline post a message in the chat or notify the client? For now: neither, and the chat just turns read-only.
- The client can cancel from REQUESTED or QUOTED (the plan only named QUOTED).
- Only NEW orders under 20 minutes count as a running checkout, per the rule. A PROCESSING or HOLD payment (tabby) doesn't block yet.
- The page url `/pleading/q/<token>` still carries the token in Vercel's request logs, like `?participant=` does today. That's inherent to link-based identity.

## 2026-10-09 · مرافعة phase 3 (consultant dashboard) + two fixes

**Fix 1: payment in progress**

- `getPleadingCheckout` returns "running" for a linked order whose payment is PROCESSING or HOLD (tabby), as well as for a NEW order under 20 minutes. Re-quote, decline and cancel are refused while it lasts.
- **`linkPaidPleading` (still not called):** when a payment lands on a DECLINED or CANCELED case, it isn't linked.
  - It's logged with `oid` and `plid` only.
  - `telegramAdmin` gets an alert for a manual refund.
  - It returns null without throwing.

**Fix 2: decline notifies the client**

- `declinePleading(by, reason?)`: the reason is up to 500 characters and goes through `checkMessageWithAI`.
- In one transaction with the state change, it posts the OWNER message "اعتذر المستشار عن قبول طلب المرافعة.", followed by the reason when there is one.
- It always sends `notificationPleadingChatMessage` to the client, outside the first-of-the-day rule.

**Phase 3**

- **Menu:**
  - The `Link` type has `law?: boolean`, and `cdashboard` has "المرافعات" → `/pleadings` with the `Scale` icon.
  - The dashboard menu (`Zmenu`) shows it only when its server `Header` finds the consultant is LAW.
  - The site header dropdown (`UserNav`) hides law-only items, because the session has no category. LAW consultants reach the page from the dashboard menu.
- **`/dashboard/pleadings`** (LAW only, otherwise 404):
  - It's a server-rendered list grouped as بانتظار ردك / بانتظار دفع العميل / مدفوعة / مغلقة.
  - Each row has the case number, client name (never the phone), state, last message, and the count of client messages. That count works like the chat list's: there's no read tracking.
  - Expired cases are persisted by `listConsultantPleadings` before reading.
- **`/dashboard/pleadings/[plid]`** (LAW only; another consultant's case is a 404):
  - **`CaseChat`** (`components/clients/pleading/case-chat.tsx`, OWNER): built from `MessageBubble`, `AttachmentPreview`, `ScrollArea` and `ConsultantImage`, with the classes of the dashboard `ChatClient`. When the case is closed, the composer is replaced by a read-only note.
  - **`CasePanel`** (`components/consultant/pleadings/`):
    - details: the price before VAT and the client's total from `withTax`, plus the quote expiry in Riyadh time
    - `QuoteForm`: the reply and an integer price, the same zod schema shown inline, and a live VAT total; a re-quote while QUOTED starts from the current price
    - `DeclineDialog`: an optional reason with a 500-character counter, behind a confirm dialog
    - while a checkout runs, an amber note replaces the actions
  - **Shared poll:** the chat and the panel use one SWR poll (`usePleadingCase`), and the route now returns `checkout`. A client cancel, an expiry or a payment in progress shows up within 7 seconds.
- **`/dashboard/profile`:** a "طلبات المرافعة" switch below the existing settings, only for LAW, wired to `togglePleading` with an optimistic toggle that reverts on error. No other change to existing screens.
- **Shared:** `PleadingStateBadge`, plus `pleadingClosedNotes` and `pleadingCheckoutNote` in `utils/pleading.ts`.

**Verified**

- `tsc --noEmit`: 0 errors. eslint: 0 new warnings (the old unused imports in `constants/menu.ts` remain).
- A clean `npm run build`. The manifest shows only `"data/event.ts"` and `"lib/api/google.ts"` for data/handlers/lib, and `actions/pleading.ts` now appears as an `actions/` file.
- With no session, `/dashboard/pleadings`, `/dashboard/pleadings/1` and `/dashboard/profile` redirect to `/login`, and `/api/pleadings/1/chat` returns 404.

**Not verified: hydration on the new pages.** It needs a logged-in LAW consultant and a test case. There's no test account, and creating pleading rows writes to the shared database, so I asked first.
- **How the components avoid mismatches:**
  - The chat and the panel render only after the client fetch (a loader during SSR).
  - The dates on the case page are formatted on the server in Riyadh time.
  - The list is a server component.

**Open questions**

- A test LAW consultant login, and approval to create one test case in the shared database (deleted afterwards), to run the hydration and end-to-end checks.
- The site header dropdown doesn't show "المرافعات" (no category in the session). Adding the category to the session token would change the auth config, so I didn't.

## 2026-10-09 · مرافعة phase 4 (public page, request form, client case page) + word files

**Addition: Word files in the case chat**

- `pleadingAttachment` accepts `.docx` (the full Word MIME type) up to 16MB, alongside images (8MB) and pdf (16MB). Uploadthing checks the declared type against the route on the server.
- The action's `pleadingFileSchema` also checks the type on the server: an image, pdf or the Word type, and a Word file must be named `.docx`.
- The chat's file picker and the request form use one list, `PLEADING_FILE_ACCEPT`. A `.docx` that the browser reports with no type is sent with the Word type.

**Phase 4**

- **`/pleading`** (`app/(pages)/(site)/(sub-pages)/pleading/page.tsx`):
  - an explainer (what مرافعة is, the 4 steps, the 60 minute session, chat only inside شاورني)
  - the cards from `getPleadingConsultants()`, cached with tag `pleading-consultants` (`cacheLife("hours")`, invalidated by `togglePleading`'s `updateTag`)
  - an empty state, the metadata (canonical, og, twitter), and a CollectionPage json-ld
  - the icons are plain server svgs (`serverIcon`)
- **`components/clients/pleading/card.tsx`:** `PleadingConsultantCard`, the home card body (ConsultantImage, StarBadge, CategoryBadge, experience, reviews, specialties) with "احجز جلسة" → `/consultants/<cid>` and "اطلب مرافعة" → `/pleading/request/<cid>`. It shows no price, because the price is set per case.
- **`/pleading/request/[cid]`:**
  - **Eligibility:** `getPleadingConsultant` (public + LAW + opted in), cached under the same tag. Anything else hits `notFound()`.
  - **The form** (`request-form.tsx`): name, phone (the shared `PhoneInput`, digits only; the schema also strips non-digits on the server), brief, and up to 5 files with client-side type and size checks.
  - **Submit:** `requestPleading`, then one upload per file, then `finalizePleadingRequest`, then `router.replace("/pleading/q/<token>")`.
    - If an upload fails, the draft is kept: a retry only uploads what's left, and the text fields lock.
  - **Errors:** each action error code gets its Arabic message (the AI guard, the rate limit, and the rest).
  - **Note:** the WhatsApp private link must not be shared.
  - **Metadata:** `noindex, follow`.
- **`/pleading/q/[token]`:**
  - The token shape is checked and `getClientPleading` runs; a bad shape or no case hits `notFound()`.
  - **`CaseChat`** (USER, with the token).
  - **`ClientPanel`:**
    - the consultant, and the state
    - "waiting for the consultant" while REQUESTED
    - the quote card: the reply, the price before VAT, the VAT total, 60 minutes, and the expiry
    - a disabled "حجز الموعد والدفع" while the quote is open (wired in phase 5)
    - the checkout note, the cancel dialog, the closed note, and the private-link note
  - **Finding the reply:** `quotePleading` now stamps the quote message's `createdAt` with `quotedAt`, so the card finds that exact message and strips the server's price line (`pleadingQuoteReply`).
  - **Metadata:** `noindex, nofollow` and `referrer: no-referrer`. It isn't in any sitemap.
  - **The token** is given only to the chat and the panel, which poll and act with it.
- **Both dynamic pages** have `loading.tsx` (PageSkeleton), like `/consultants/[cid]`.
- **`routes.ts`:** `/pleading` in the dynamic public routes, so guests can reach all 3 pages. **`/sitemaps/static.xml`:** adds `pleading`.

**Verified**

- `tsc --noEmit` 0 errors. eslint shows 0 problems on the new and changed files.
- A clean `npm run build`. The manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.
- **`next start` plus headless chrome** (mobile and desktop) on `/pleading`, `/pleading/request/1`, `/pleading/request/abc`, `/pleading/q/<random token>` and `/pleading/q/abc`:
  - 0 hydration errors and no duplicate ids.
  - The only failed resource is `/_vercel/speed-insights/script.js` (404, Vercel only).
  - `/pleading` is `index, follow` with the empty state (nobody has opted in yet).
  - The request and case urls with bad ids render the not-found page: request is `noindex, follow`; case is `noindex, nofollow` with `no-referrer`.
  - The static sitemap lists `/pleading`, and the random token is absent from the server log.
- **Not run here:** the full flow with real data. It's in your manual test, and I created no test rows.

**Open questions / notes**

- **The status code:** "404" for an ineligible consultant or an unknown token is `notFound()`, the site's not-found page with noindex on a 200. A real 404 status isn't possible under partial prerendering in this app (see the 2026-10-08 SEO follow-up).
- **GTM loads on every page,** including `/pleading/q/<token>`. If its tags send the page url, the token reaches Google, which is the same exposure as `/chats/<mid>?participant=` today. Suggestion: an exception for `/pleading/q/` in the GTM container (no code change).

## 2026-10-12 · مرافعة fixes after the manual test (opt-in place, card, tracking privacy)

**1. The opt-in switch moved to `/dashboard`**

- `/dashboard/profile` is back to its version from before phase 3, byte for byte (only the user's basic info).
- **The new place:**
  - "طلبات المرافعة" is in the consultant's main form (`CoProfileForm` → `ProfileStatus`), directly under the "حالة الإعلان" visibility card, with the same card look: a border, a title and description, and a label + `Switch`.
  - Like the visibility switch, it saves at once. The form's sections save only with the submit button through `saveConsultant`, which I didn't change.
- Still LAW only, still `togglePleading` (which revalidates `pleading-consultants`). It resyncs after a profile save.
- The dashboard list's empty state now points to "صفحة ملفك الشخصي".

**2. A slimmer pleading card** (`components/clients/pleading/card.tsx` only; the other consultant cards are untouched)

- **Layout:** horizontal, with a 48px photo beside the name and rating, the title, and the category badge and years.
  - The two actions are full-width `sm` buttons in one row.
  - The specialties and reviews rows are gone.
- **The result:** the card is 143px tall (it was about 260px), and the grid gap is 3.
- **Checked** with headless chrome at 380px and 1280px, with the real single card and with 7 cloned cards with long arabic names and titles (dom only): names and titles truncate, there's no horizontal overflow, and the page width equals the viewport.

**3. No tracking on `/pleading/q/*`**

- **`constants/tracking.ts`:** `NO_TRACKING_PATH` (`/^\/pleading\/q\//`) and `TRACKING_OFF`, the same check as a js expression.
- **Each script checks the path itself when it runs.** The root layout stays static and unchanged for every other page.
  - **The gtm `<head>` queue** (`GTM_QUEUE`) returns at once: no `dataLayer`, no `__loadGtm`, so `GTM_LOAD` does nothing. Everything the container loads (ga4, google ads, clarity, tiktok) never starts.
  - **The meta, snap and twitter pixels** each wrap their inline code in `if (!(TRACKING_OFF))`.
  - **Speed Insights:** `components/shared/speed-insights.tsx` renders vercel's `SpeedInsights` only when the loaded url isn't a no-tracking page (`useSyncExternalStore`, nothing on the server, as before). Its `beforeSend` also drops events from those urls.
- **The redirect:** the request form goes to the case page with a full load (`window.location.replace`), not a client navigation, so trackers already running on the form never see the case url.
- **Verified** (`next start` + headless chrome, 9s after load, every request to a tracking host plus the globals):
  - `/`, `/pleading` and `/pleading/request/1`: gtm, ga4, ads, clarity, tiktok, meta, snap, twitter and speed insights all load, with all globals present.
  - `/pleading/q/<token>`: 0 tracking requests and no `dataLayer`, `fbq`, `twq`, `snaptr` or speed insights script.
  - The hydration check on `/`, `/pleading` and `/pleading/q/<token>`: 0 errors and no duplicate ids.
- `tsc` and eslint are clean, the build is clean, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

**Follow-up (not changed): `/chats/[mid]?participant=<token>` has the same exposure.**
- The participant token in its url is a credential, and gtm, the pixels and clarity all load there today, with clarity recording the session chat.
- The same guard would cover it by adding `/^\/chats\//` (and `/dashboard/chats`) to `NO_TRACKING_PATH`, once it's decided.

## 2026-10-12 · مرافعة phase 5 (client checkout and payment)

**Payment code** (approved by Ziad; shown as a diff first, applied after approval)

- **`handlers/admin/order/payment.ts`, the new `PayPleading(data)` next to `Pay`.**
  - **Why separate:** `Pay`'s input and the booking action (`actions/booking.ts`) are unchanged, so the public booking action can never take a pleading payload.
  - **The steps:**
    0. Check the input with the zod schema.
    1. Load the case by its token, with expiry applied.
    2. The quote must be open and the consultant still eligible (public, LAW, opted in).
    3. `CheckIsBlocked` on the case's phone.
    4. Check the case's checkout: refuse if paid or running.
    5. Load the finance config and `getPleadingCommission()`.
    6. `calculatePayment({ baseCost: pleading.price, discountPercent: 0 })` and `withTax`. `applyCoupon` and `resolveConsultantPricing` are never called.
    7. Build the `ReservationFormType` on the server from the case (name, phone, cid, duration "60", author or "temp"), then `reserveConsultant(…, commissionOverride)`, which re-validates it and checks the slot.
    8. Compare-and-set on `orderId` (`linkPleadingCheckout`): of two racing checkouts only one reaches the gateway, and the loser's NEW order is left to the cancel-orders cron.
    9. The same Moyasar / Tabby handoff as `Pay`.
- **`data/order/reserveation.ts`:** `reserveConsultant` gets an optional last `commissionOverride`, which wins over the center, consultant and default rates. Existing callers pass nothing.
- **`onPaymentSuccess`:** after `createNewMeeting`, `await linkPaidPleading(order.oid, order.meeting[0].mid)`. It never throws, so the notifications and telegram after it run as before.
- **No change needed:**
  - `notificationNewOrder` already notifies both sides; a pleading order takes the ordinary branch (`order_new_owner` and `order_new_client`).
  - The Moyasar and Tabby webhooks verify the gateway's own amount against `withTax(payment.total)` of the stored order, and a pleading order stores `Payment.total` like a booking.

**Decisions applied with the patch**

- **HOLD:** `getPleadingCheckout` treats HOLD as "running" only for the same 20 minutes as NEW (from the order's `created_at`, the NEW check's timestamp). HOLD is also where a declined card or a failed capture ends up.
  - After 20 minutes, a HOLD order no longer blocks a new checkout, a re-quote, a decline or a cancel.
  - PROCESSING still blocks.
- **`linkPaidPleading` is idempotent:**
  - A case already PAID returns at once, with no writes.
  - The PAID update matches QUOTED or EXPIRED only, so a concurrent second call moves nothing.
  - The closed-case telegram alert fires once per order: a marker is pushed into `Order.info` by the same statement that checks for it.
- **The guest `user`:** `"temp"`, the value the booking action gives every guest booking (`user?.id ?? "temp"`). A case created by a signed-in client uses its `author`.

**Client side**

- **`actions/pleading.ts`, the new `checkoutPleading`:**
  - public, with `checkHuman`, rate-limited per ip 10 per 10 minutes, and the input `{token, date, time, method, acceptTerms}` only
  - it maps `PayPleading`'s failure steps to codes: not_found, quote_closed, unavailable, blocked, already_paid, checkout_in_progress, slot_taken (conflict), invalid_input, otherwise payment_failed
  - the Arabic messages are in `pleadingErrors`
- **`components/clients/pleading/checkout.tsx`:** a dialog with the booking flow's own `StepDateTime`, `MethodForm` and `TermsForm`, unchanged.
  - The form uses the booking form's type with `cost = {price}` and duration "60", so no generic prop was needed.
  - It shows a summary (the date, 60 minutes, the price before VAT and the total with VAT), and the pay button shows the total.
- **`ClientPanel`:**
  - "حجز الموعد والدفع" opens the checkout while the quote is open and no payment is running.
  - **The paid view:** the order number, the date and time, and "محادثة الجلسة" → `/chats/<mid>?participant=<USER token>`, from `getPaidPleadingSession` on the server. It refreshes itself if the case is paid while the page is open.
- **`/pleading/q/[token]`:** loads the consultant's unavailable weekdays, the finance config, and the paid session.
- **Conversion:** both gateways return to `/payment/success` (no case token), where the existing conversion fires as for every booking (a gtm click trigger in the container).
  - For a pleading order, that page also pushes `order_type: "pleading"` to the data layer (`isPleadingOrder`), so the container can tell the two apart.
  - Other orders get nothing new.
- **`data/pleading.ts`:** `getPleadingForCheckout`, `linkPleadingCheckout`, `getPaidPleadingSession`, `isPleadingOrder`.

**Verified**

- `tsc --noEmit` 0 errors. eslint shows only the old `refund` unused-argument warning in `payment.ts`.
- A clean `npm run build`. The manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.
- Before approval, with the patch applied temporarily: the hydration check on `/pleading`, `/pleading/q/<random token>` and `/payment/success` showed 0 errors and no duplicate ids.
- **Not run here:** a real Moyasar or Tabby test payment. It's in Ziad's manual test.

**Open questions / follow-ups**

- **A HOLD order resolved to PAID later by an admin,** after the client has started a newer checkout: `linkPaidPleading` finds no case for that order (the case points to the newer one), so the case isn't linked. That's rare and needs an admin anyway.
- **The GTM container:** add `order_type` as a data layer variable to the purchase conversion if marketing wants to split them.

## 2026-10-12 · fixes: the false toast on payment, the "الترافع" home tile, the reconciliation report

**1. "محاولات كثيرة" toast on a successful payment redirect**

- **The cause:** Next 16.2.9 rejects a server action's promise when the action calls `redirect()`, then hard-navigates to an external url (`server-action-reducer.js`).
  - `PayPleading` ends in `redirect(<moyasar url>)`, so `useAction`'s `catch` showed `networkError` ("محاولات كثيرة أو مشكلة في الاتصال…") while the browser went to Moyasar anyway.
  - It wasn't the rate limiter.
- **The fix (`hooks/use-action.ts`):** the `catch` ignores next's redirect error (`digest` starting with `NEXT_REDIRECT`, no `next/dist` import), and the loading toast stays until the page leaves. Every `useAction` caller benefits; today only `checkoutPleading` redirects.
- **The normal booking** (`reservation/form.tsx`) awaits `Pay` directly. On a successful redirect it logs an uncaught `NEXT_REDIRECT` in the console, but shows no toast and navigates fine. Not changed.

**2. Home services:** "الترافع" → `/pleading` with the lucide `Scale` icon, first in `components/clients/home/services.tsx`. There are now 4 visible tiles.

**3. Reconciliation (report only, nothing changed): the booking can't complete**

- **Submitting does nothing.**
  - `ReconciliationSchema` (in the page) requires `cost` and `finance`, which the form never sets and doesn't render.
  - `zodResolver` always fails on them with no visible message, so `onSubmit` never runs.
- **There's no page to pay on.**
  - `confirmReconciliation` redirects to `/pay/<zid>`, and no `/pay/[id]` page exists, so it's a 404.
  - The NEW order is cancelled by the cron after 20 minutes. No gateway checkout is ever created.
- **Related:**
  - `reserveReconciliation` creates no meeting: a paid order would skip `onPaymentSuccess` (no room or notifications), and `/payment/success` would throw at `order.meeting[0].id`.
  - Hardcoded `consultantId: 213` while the info log says `cid = 77`, plus a fixed total of 700, commission 60 and tax 15.
  - The phone isn't normalized.
  - `/reconciliation/[id]` isn't linked anywhere and decodes with `decryptToken` + `zdencryption`, while the handler encodes with `zencryption`.
- The service is hidden on the home grid (`status: false`).

**Verified**

- `tsc --noEmit` 0 errors, eslint clean on both files, a clean `npm run build`, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.
- **Headless chrome on `/`** at 380px and 1280px: the tiles are الترافع → /pleading, كوبونات الخصم, برامجنا and المقاييس, with 0 hydration errors.
- **Manual (Ziad):** pay on a quoted test case should show the loading toast only, then Moyasar.

## 2026-10-12 · use-action redirect check, and the reconciliation follow-up

**`hooks/use-action.ts`:** the redirect check is now Next's own `isRedirectError` (`next/dist/client/components/redirect-error`), replacing my hand-written digest test.
- `next/navigation` only exports `unstable_rethrow`, which on the client would rethrow the redirect into an error boundary while the browser is navigating.
- Only a redirect error returns quietly (the loading toast stays). Every other thrown error still shows `networkError`, and every `{ ok: false }` result still shows its own message, as before.

**FOLLOW-UP: reconciliation (بيننا) can't be booked. Keep it hidden until it's fixed** (`status: false` in `components/clients/home/services.tsx`; don't link `/reconciliation` anywhere). Not fixed by decision (Ziad, 2026-10-12).

1. **The form's schema fields.** `ReconciliationSchema` in `app/(pages)/(site)/(sub-pages)/reconciliation/page.tsx` requires `cost: {30, 60}` and `finance: {tax, commission, payments, couponEnabled}`.
   - The form never sets them (not in `defaultValues`) and has no field or `<FormMessage>` for them.
   - So `zodResolver` always fails, `onSubmit` never runs, and "احجز جلسة المصالحة" silently does nothing.
2. **The missing `/pay` page.** `confirmReconciliation` (`handlers/clients/order.ts:82`) redirects to `/pay/<zid>`, and no `/pay/[id]` page exists, so the client gets a 404.
   - No Moyasar or Tabby checkout is ever created, and the NEW order is cancelled by the cancel-orders cron after 20 minutes.
   - `components/legacy/layout/orderCard/payButton` links to the same missing page.
3. **No meeting.** `reserveReconciliation` (`data/reconciliation.ts`) creates the order without a meeting. If one were paid:
   - `onPaymentSuccess` returns early at `!order.meeting?.[0]`: no room, no WhatsApp confirmations, no telegram.
   - `/payment/success` throws at `order.meeting[0].id`.
4. **Consultant 213 vs 77.** The order is created with `consultantId: 213`, but its `info` log entry is built with `cid = 77`.
5. **Hardcoded 700 / 60 / 15.** `total: 700`, `commission: 60` and `tax: 15` are fixed in `reserveReconciliation` (only the info label reads `getTaxCommission()`), instead of a server-resolved price, the finance commission and `TAX_PERCENT`.
6. **The phone format.** Both phones (the client and the other party) are saved as typed from `PhoneInput` (with "+"), while bookings strip non-digits with `phoneNumber()`. The schema only checks `min(8)`.
7. **The unlinked and broken `/reconciliation/[id]`.**
   - Nothing links to it.
   - It decodes the id with `decryptToken` then `zdencryption`, while the handler encodes with `zencryption` only, so a real order would 404.
   - It also shows a paid order's details to anyone holding the id.

**Verified:** `tsc --noEmit` 0 errors, eslint clean, a clean `npm run build`, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-12 · مرافعة phase 6 (notifications)

**The flag is gone:** the env check, its "whatsapp off" log branch, and its mentions in this log. Pleading notifications always send. A test-phones list was never added.

**Reusing existing templates was checked, and none fit.**
- `lib/notifications/site.ts` sends:
  - new_confirm, security_otp (url = the otp)
  - program_owner_new, program_session_confirm
  - scale_reminder (url = scale id)
  - order_new_instant_owner and _client
  - order_new_owner, order_new_client
  - order_new_gift and _confirm
  - preconsultation_new
  - freesession_new_owner and _client (url = session zid)
  - program_session_select (url = `<czid>?session=n`)
  - review_reminder (flow)
  - scale_result (url = scale id)
  - check_session, rescheduling_confirmed (quick replies)
  - session_chat_notify (url = `<mid>?participant=…`)
- The dashboard repo sends owner_new_approved (url = cid).
- **No url button has a site-root base.** Each existing suffix is a path-specific id (`/chats/`, `/scales/orders/`, `/scales/results/` and so on), so none can carry `pleading/q/<token>` or `dashboard/pleadings/<plid>`, and their bodies are about other services.
- So the 4 pleading templates stay new: pleading_new_request, pleading_request_received, pleading_quoted, pleading_chat_notify (UTILITY, ar, url base `https://www.shwerni.sa/{{1}}`).

**Wiring** (already at each call site in `data/pleading.ts`; checked):

| Trigger | Template | Recipient | URL suffix |
|---|---|---|---|
| `finalizePleadingRequest` | pleading_new_request | consultant | `dashboard/pleadings/<plid>` |
| `finalizePleadingRequest` | pleading_request_received | client | `pleading/q/<token>` |
| `quotePleading` (quote and every re-quote) | pleading_quoted | client | `pleading/q/<token>` |
| A case chat message (first of the day per sender) | pleading_chat_notify | the other side | `pleading/q/<token>` or `dashboard/pleadings/<plid>` |
| `declinePleading` (always) | pleading_chat_notify | client | `pleading/q/<token>` |

The quoted amount is `withTax(price)`, and the expiry is the Riyadh date.

**Payment confirmation:** the existing `notificationNewOrder` (from `onPaymentSuccess`) sends order_new_owner and order_new_client to both sides. Its quick replies use `meeting-url:<mid>`, never the case token. No new template.

**Failures** (`sendPleadingTemplate` in `lib/notifications/site.ts`):
- The phone goes through `phoneNumber()` (digits only), the same normalization booking phones get.
- `sendWhatsappTemplate` returns `{ ok: false }` instead of throwing, so both cases are caught. The log is `[pleading] whatsapp failed template=… plid=… to=•••1234 code=…`: never whatsapp's error message or the params, since the token is in the url.
- `notifyPleadingChat` and `notifyPleadingQuoted` (their db lookup and send) can't throw into the action either: the message or quote is already saved.
- `onPaymentSuccess` is unchanged: `linkPaidPleading` never throws, and `notificationNewOrder` is already wrapped.

**Verified:** `tsc --noEmit` 0 errors, eslint clean, a clean `npm run build`, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

**Before going live:** the 4 templates must be approved in Meta (names exactly as above). Until then, each send logs `whatsapp failed … code=<meta error code>` and the case goes on as normal.

## 2026-10-12 · reconciliation rebuild, phase R1 (settings, data, schema)

**Decisions (Ziad):**

| # | Decision |
|---|---|
| D1 | Consultant cid 77, from settings (`finance/reconciliationCid`); the old 213 goes away with the old path in R2 |
| D2 | Date and time chosen at booking (the normal path); changes go through the existing reschedule flow |
| D3 | 60 minutes |
| D4 | 700 SAR before VAT (805 with VAT), consultant share 60 |
| D5 | No coupons or discounts: no coupons form, and the server forces `discountPercent = 0` |
| D6 | No message to the other party in v1 |
| D7 | The session chat's first message has the description plus the other party's name, relation (Arabic) and gender, never their phone |
| D8 | Moyasar and Tabby, as for bookings |
| D9 | The description is optional, up to 500 characters |

**Added (no caller yet, the build stays green):**

- **`constants/admin.ts`:** `defaultReconciliation = { price: 700, commission: 60 }`. There's no default consultant.
- **`data/admin/settings/finance.ts`:** `getReconciliationConfig()` reads `finance/reconciliationCid`, `reconciliationPrice` and `reconciliationCommission`.
  - An invalid or missing price or commission falls back to the defaults.
  - A missing or invalid cid gives `cid: null`, meaning unavailable (never a hardcoded consultant).
- **`utils/reconciliation.ts`** (client-safe):
  - `RECONCILIATION_DURATION = "60"` and `RECONCILIATION_DESCRIPTION_MAX = 500`.
  - `reconciliationErrors`: unavailable, blocked, slot_taken, payment_failed.
  - **`reconciliationCheckoutSchema`:**
    - fields: date, time, name (`schemas.name`, the same rule `reserveConsultant` re-checks), phone and otherPhone (digits only, then `schemas.phone`), an optional description of 500 max, otherName, relation, gender, method, acceptTerms
    - no price, coupon, discount, consultant or duration fields
  - `reconciliationFirstMessage()` (D7): "طلب جلسة صلح", the other party's name, `relationLabel`, `genderLabel`, then "تفاصيل الخلاف" when given. No phone.
- **`data/reconciliation.ts`:**
  - **`attachReconciliation(order, input)`:** one transaction creates the `Reconciliation` row (with the other party's phone, for the admin team) and the session chat's first USER message (`reconciliationFirstMessage`). Booking notes can't carry it: `reservationSchema` caps them at 200 characters.
  - **`isReconciliationOrder(oid)`:** the marker for admin, finance and the success page.
- The old `reserveReconciliation` and `getReconciliation` are untouched; the old path is removed in R2.

**Verified:** `tsc --noEmit` 0 errors, eslint clean (only the old `getSettingsByCategory` unused import in `finance.ts`), a clean `npm run build`, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

**Follow-up (not changed): Google Meet rooms are open.** `createGoogleMeeting()` (`lib/api/google.ts`) creates spaces with `accessType: "OPEN"`, so anyone with the meeting link can join. That affects every session, not only reconciliation; review it later (e.g. `TRUSTED` or `RESTRICTED`, and how guests would then be admitted).

**Dashboard repo follow-up:** add `reconciliationCid`, `reconciliationPrice` and `reconciliationCommission` to the finance settings form, next to `commission`.

## 2026-10-12 · reconciliation rebuild, phase R2 (payment, booking form, old path removed)

**Checked before applying the approved diff**

1. **The price.** `reserveConsultant` writes `Payment.total` from its `total` argument (`cost` = `calculatePayment({ baseCost: 700, discountPercent: 0 }).total` = 700) and `Payment.tax` from its `tax` argument (`TAX_PERCENT`).
   - It reads neither `formdata.cost` nor `consultant.cost60`.
   - The charge is `withTax(700)` = 805.
2. **`order: "reconciliation"`.** `data.order` is only read inside `Pay`'s own branches, which `PayReconciliation` never enters.
   - `reserveConsultant` neither reads nor stores it (`reservationSchema.order` is any string).
   - `onPaymentSuccess`, the webhooks, the success page and the notifications don't read it.
3. **The slot.** Normal `Pay` doesn't validate it: `reserveConsultant` only runs `checkMeetingTimeConflict` (PAID orders and free sessions at ±30 minutes). See the follow-up below.

**Payment code** (`handlers/admin/order/payment.ts`, approved):

- **`PayReconciliation(data, author)`** as shown in the diff, plus two additions:
  - **4b, the slot check.** The day must be in `getDatesAhead(7, add25Minutes().iso)`, the date step's own window, and the time must be in `getConsultantAvailableTimes(cid, day, weekday, today ? lead time : undefined)`, the same query the date step shows (no second copy of its rules).
    - That covers: a future date, the weekday and time in consultant 77's `ConsultantTiming`, an unavailable day (no timings means no times), and slots taken by PAID, NEW or PROCESSING orders or free sessions.
    - `day` uses `utils/date`'s `dateToString`, the same string `reserveConsultant` stores on the meeting.
    - The weekday is computed from `${day}T12:00:00Z`, so it doesn't depend on the server's time zone.
  - **The terms:** `acceptTerms: input.acceptTerms` instead of `true`.
- **No change to** `Pay`, `PayPleading`, `reserveConsultant` (the phase 5 `commissionOverride` is reused with the configured 60), `onPaymentSuccess` or the webhooks.

**The rest of R2**

- **`actions/reconciliation.ts`, `checkoutReconciliation`:**
  - public, with `checkHuman`, rate-limited per ip 10 per 10 minutes and per phone 5 per hour
  - the author comes from the session
  - it maps the failure steps to codes: invalid_input, unavailable, blocked, slot_taken (conflict and slot_unavailable), otherwise payment_failed
- **`components/clients/reconciliation/booking-form.tsx`:** a 3-step `Stepper`.
  1. The booking flow's `StepDateTime`, unchanged on a `ReservationFormType` form (duration 60, cost = the configured price).
  2. Both parties: the page's existing fields and markup, moved; zod from `reconciliationCheckoutSchema.pick`.
  3. A summary (the date, 60 minutes, 700 and 805), `MethodForm` unchanged (no coupons form), and the existing "بيننا" terms checkbox and dialog.
  - **Submit:** `useAction(checkoutReconciliation)`, which sends only the client's choices.
- **`reconciliation/page.tsx`** is now a server component.
  - The hero and its copy are unchanged, and it now has metadata.
  - The booking section sits in `<Suspense>` with `connection()`: it reads `getReconciliationConfig()`, the consultant (`getConsultantInfoForBooking`), `getUnavailableWeekdays` and `getFinanceConfig()` per request.
  - With no consultant configured, it shows "خدمة جلسات الصلح غير متاحة حالياً".
- **Removed:**
  - `confirmReconciliation` (the `actions/booking.ts` wrapper and the `handlers/clients/order.ts` handler)
  - `reserveReconciliation` and `getReconciliation` (`data/reconciliation.ts`)
  - `app/(pages)/(site)/(sub-pages)/reconciliation/[id]/page.tsx`
  - So no hardcoded 213, 77, 700, 60 or 15 is left in the reconciliation code.
- **The home tile stays hidden.** The `status: true` change in `services.tsx` is Ziad's uncommitted edit, not part of this commit.

**Verified**

- `tsc --noEmit` 0 errors (after the build regenerated `.next/types` without the deleted page).
- eslint shows only the old `refund` warning in `payment.ts`.
- A clean `npm run build`. The manifest shows only `"data/event.ts"` and `"lib/api/google.ts"` for data/handlers/lib, and `actions/reconciliation.ts` is an action.
- **Not checked in the browser:** `/reconciliation` is a login-protected prefix (`routes.ts`, since c3074d4), so without a session it redirects to `/login`. The form is in Ziad's manual test.

**Follow-ups (not changed)**

- **Normal `Pay` doesn't check that the slot is real:** a past date, or a time outside the consultant's `ConsultantTiming`, passes as long as no PAID order or free session is at ±30 minutes. The same 4b check could be added to `Pay` later.
- **`/reconciliation` requires login** (a protected prefix). Keep it, or make the page public (the action already accepts guests as "temp")?
- **`components/legacy/layout/orderCard/payButton`** still links to the missing `/pay/<zid>`.
- **The dashboard repo:**
  - its order table says "سيتم تحديد موعد الجلسة مع الطرف الاخر" for reconciliation orders, which now have a date and time
  - plus the 3 settings fields (from R1)

## 2026-10-13 · Daftra invoices and refund receipts

**Schema** (`prisma/models/daftra.prisma`; validate and generate done; **`db push` by Ziad before `DAFTRA_ENABLED=true`**)

- **`DaftraClient`** (`daftra_clients`): one per customer, keyed by the order's phone (digits only), with `daftraClientId` null while the create call runs.
- **`DaftraInvoice`** (`daftra_invoices`) with `DaftraDocType` (INVOICE, REFUND) and `DaftraSyncState` (PENDING, SENT, FAILED, REVIEW).
  - `dedupeKey` is `invoice:{oid}` or `refund:{refund.id}`: exactly one invoice per order and one receipt per Refund row.
- **Back-relations:** `Order.daftraInvoices` and `Refund.daftraInvoice`. No new column on an existing table, so the deploy is safe before the db push as long as `DAFTRA_ENABLED` isn't "true" (the handlers stop before any query).

**Code**

- **`lib/daftra/config.ts`:** the env check. Anything but `DAFTRA_ENABLED="true"` means "disabled". When enabled, every var is required (the product ids as numbers), otherwise it's a config error and nothing is sent.
- **`lib/daftra/client.ts`:** `daftraRequest` (the `apikey` header, json, 20s timeout).
  - **Success:** 2xx with `result: "successful"` and a numeric id (string ids are parsed).
  - **Failed:** 4xx with a json body (message + `validation_errors`).
  - **Unknown:** timeout, network error, 5xx, a 4xx without a body, or an unreadable 2xx.
- **`lib/daftra/format.ts`:**
  - `round2`, `vatInside`, `riyadhDay`
  - `phoneKey` (`phoneNumber()` digits, a leading "00" dropped) and `internationalPhone` ("+" + digits)
  - the method codes: visaMoyasar → manual_payment_19, tabby → tabby, transaction → bank, wallet → `DAFTRA_METHOD_WALLET`
  - `splitRefund` (proportional, the last line takes the rounding remainder)
- **`lib/daftra/customer.ts`, `getOrCreateDaftraClient`:**
  - an existing client is reused, and its name is never updated
  - the row is claimed before `POST /clients.json`; a lost claim gives "client_not_ready"
  - a failed or unknown create deletes the claim (retriable)
  - the email is sent only for a real user account
- **`data/daftra.ts`:** every query (CLAUDE.md: queries live in `data/`).
  - **Loading:** the invoice order (payment, coupon, meetings by session, consultant, center, program, package, pleading, reconciliation, the author's email) and the refund (with the request's reason).
  - **Customer claims:** claim and release the `DaftraClient` row.
  - **Document claims (`claimDaftraDocument`):**
    - no row → create PENDING; a unique conflict → already_claimed
    - SENT → already_sent; PENDING → already_claimed; REVIEW → stop unless force
    - FAILED (or REVIEW with force) → a conditional update on the read state, attempts + 1
  - **Outcomes:** `finishDaftraDocument` (SENT, FAILED or REVIEW).
  - **The refund guard sum:** `sumOtherActiveRefunds`.
- **`lib/daftra/invoice.ts`, `sendOrderInvoice(oid, { source, force })`:** eligible only when the payment is PAID (or REFUND, from the refund path only).
  - **One line:** product by the first meeting's duration, `item` "جلسة N دقيقة", the description as specified, `unit_price = withTax(payment.total)` (the webhooks' own formula).
  - **Tax:** `amount - amount / 1.15`.
  - **The date:** `created_at` in Riyadh.
  - **Payment lines:**
    - method wallet → one wallet line
    - otherwise the method's line for `total - Payment.wallet` (with `pid`), plus a wallet line when `Payment.wallet > 0`
    - the lines must add up to `unit_price`, or FAILED with the reason
  - **The notes:** the arabic facts, one per line; coupons only here, never as a Daftra discount.
  - **An unexpected error after the claim:** REVIEW (never FAILED: Daftra may have the invoice).
  - **`buildInvoiceBody`** is exported for tests.
- **`lib/daftra/refund.ts`, `sendRefundReceipt(refundId, { source, force })`:**
  - **The source invoice:** it must be SENT; with no row or a FAILED one it's sent first (`allowRefunded`); PENDING or REVIEW gives "invoice_not_ready".
  - **The guard:** the other SENT, PENDING and REVIEW receipts plus this one must not exceed the invoice amount.
  - **The lines:** the source invoice's own payload lines split in proportion (the original method, whatever `Refund.channel` says), with `Refund.reference` as the transaction id.
  - **The body:** `subscription_id` = the invoice's `daftraId`, the date from `refundedAt` in Riyadh, one line with the source product and item.
  - **`refundLines` and `buildRefundBody`** are exported for tests.
- **`lib/daftra/auto.ts`:** `queueOrderInvoice` and `queueRefundReceipt` run after the response (next's `after()`, the pattern of the whatsapp webhook), so they never throw or delay. failed, review, client_not_ready and invoice_not_ready alert the admin telegram with the oid or rfid, the status and the row's `lastError`.
- **Call sites:**
  - `onPaymentSuccess` (`handlers/admin/order/payment.ts`): `queueOrderInvoice(order.oid)` after its existing try/catch. It runs after the response, by when `orderStatusPaid` has written PAID (it calls `onPaymentSuccess` before that update).
  - `recordRefund` (`data/gatewaies/webhook.ts`, the Moyasar and Tabby refund webhooks): `queueRefundReceipt` after the transaction commits (the refund select also returns `rfid`).
- **`lib/auth/dashboard-secret.ts`, `verifyDashboardSecret`:** `Authorization: Bearer <DASHBOARD_SECRET>` with `timingSafeEqual` (length first; an unset secret never matches).
- **`app/api/dashboard/daftra/invoice` and `refund`:** POST, zod bodies (`{oid, force?}` and `{refundId, force?}`), the handler's typed result, generic messages.
  - No `runtime` export: it isn't allowed with `cacheComponents`, and Node is the default.
  - `routes.ts`: `/api/dashboard/daftra` is public, since the route checks the secret itself.

**Findings**

- **`Payment.paid`, `wallet` and `credit`:** in this repo no live path writes them; `payAllByWallet`, `requestUsingWallet` and `updateOrderPaidByOid` have no callers. Live web payments are Moyasar or Tabby only.
  - `Payment.wallet` is the VAT-inclusive SAR debited from the wallet when the order turns PAID (`payPartiallyByWallet`).
  - `paid` and `credit` are only edited by hand in the dashboard, and their meaning isn't defined in code, so the invoice doesn't use them.
- **`Refund.amount`:** gateway refunds (`recordRefund`) are the gateway's refunded charge, so VAT is included.
  - The dashboard caps a refund at `refundBase = paid ?? total`. With `paid` empty, that's the pre-VAT `total`, so a dashboard "full refund" can be at most 700 of an 805 charge.
  - The receipt treats `Refund.amount` as VAT-inclusive. This cap should be fixed in the dashboard repo.
- **Refund rows** are created here (the gateway webhooks via `recordRefund`) and in the dashboard repo (`finance-refunds.ts`), which must call `POST /api/dashboard/daftra/refund` after each one.
- **There's no paid-at field** (the payment has none, `due_at` defaults to creation). The invoice date is `order.created_at`.

**Verified**

- `prisma validate` and `generate`, `tsc --noEmit` 0 errors, eslint clean (only the old `refund` unused warning in `payment.ts`), a clean `npm run build`, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.
- **The sample bodies,** generated by the real builders with fake orders and no network: client, Moyasar, Tabby (with مرافعة), a 5 × 30 package, partial wallet (505 + 300), a full refund (805) and a partial refund of the partial-wallet order (200 → 125.47 + 74.53). All lines add up.
- **`next start`:** both dashboard routes answer 401 without or with a wrong bearer, and 405 for GET. No call was made to Daftra.

**Env (Vercel, server-only):** `DAFTRA_ENABLED`, `DAFTRA_SUBDOMAIN`, `DAFTRA_API_KEY`, `DAFTRA_PRODUCT_ID_30`, `DAFTRA_PRODUCT_ID_45`, `DAFTRA_PRODUCT_ID_60`, `DAFTRA_METHOD_WALLET` (`DASHBOARD_SECRET` already exists). `.env.example` wasn't created: CLAUDE.md forbids editing `.env*` files.

**Open questions**

- `db push` before enabling.
- The dashboard refund cap.
- Old meeting-less orders (e.g. legacy reconciliation) can't be invoiced ("the order has no meeting").
- **Two different refunds of one order sent at the same moment** could both pass the guard (no row lock); rare.

## 2026-10-13 · Daftra follow-up: duplicate refunds, dashboard header, invoice pdf on WhatsApp

**1. Duplicate Refund rows: the finding**

- **What `recordRefund` matches on today.** No refund id: the gateways don't give one here (Moyasar reports a cumulative `refunded` on the payment; the Tabby caller passes the sum of `refunds[]`). It sums every `Refund` row of the payment, the dashboard's included, and creates a row only for `gateway cumulative − already recorded`. Pending requests are linked by amount (±0.01).
- **So a dashboard row is already reused** (the webhook adds nothing) when its amount equals the gateway's refund.
- **A duplicate is possible in two cases:**
  - **(a) The amounts differ.** The dashboard caps a refund at `refundBase = paid ?? total`, the pre-VAT total when `paid` is empty. A 700 dashboard row for an 805 gateway refund makes the webhook add a 105 top-up row: two rows, two receipts.
  - **(b) A race.** Two writers read the sum before either inserts: two overlapping webhook deliveries, or a dashboard save at the same moment as a webhook.

**The fix here:** `recordRefund` now locks the payment row (`SELECT … FROM payments WHERE id = $1 FOR UPDATE`) before reading the sum.
- **Fixed:** webhook versus webhook can never double, and any writer that takes the same lock is serialized.
- **Unchanged:** the matching rule, which already reuses existing rows.

**Not safe from this side alone. The dashboard (`finance-refunds.ts processRefund`) must:**
1. **Store the refund amount VAT-inclusive,** exactly what the gateway returned. Fix `refundBase` to the charged amount (`withTax(total)`, or `paid` once it holds the charge).
2. **Take the same lock in its transaction** before reading the refunded sum: `SELECT id FROM payments WHERE id = <paymentId> FOR UPDATE`.
3. **Store the gateway reference as `Refund.reference`:** the Moyasar payment id (`pay_…`, what the webhook stores) or the Tabby payment id. That isn't a key the match uses (there's no per-refund id), but it makes rows traceable.

With 1 and 2, one real refund always gives one row and one receipt.

**2. Dashboard auth:** both Daftra routes use `x-dashboard-secret`, like the existing dashboard routes.
- The shared guard is `verifyDashboardSecret` in `lib/auth/dashboard-secret.ts` (`timingSafeEqual`, length first, an unset secret never matches).
- `app/api/uploadthing/delete` now uses the same guard (its old private copy, same logic).
- `/api/revalidate` keeps its own compare, unchanged.

**3. The invoice pdf on WhatsApp**

- **Schema:** `DaftraInvoice.pdfUrl String?` and `whatsappSentAt DateTime?`. **`db push` by Ziad**, together with the earlier daftra tables.
- **`lib/daftra/invoice-pdf.ts`, `deliverInvoicePdf(oid, { resend })`:** runs after an INVOICE becomes SENT (`sendOrderInvoice`, any source: payment, dashboard, or the refund path's invoice).
  1. `GET /invoices/{daftraId}.json` (`daftraGet`) → `invoice_pdf_url` (`data.Invoice` or `Invoice`), saved to `pdfUrl` once.
  2. **The claim:** `whatsappSentAt = now` where it's null (resend: always). Zero rows means skip.
  3. **The send:** `sendWhatsappTemplate(phoneNumber(order.phone), "order_invoice", { header: { type: "document", value: pdfUrl, filename: "فاتورة-{daftraNo}.pdf" }, text: [oid] })`.
  4. **A failed send** clears `whatsappSentAt` (a resend restores the earlier time) and alerts the admin telegram.
  - It never throws.
- **On the payment path** it runs inside the same `after()` task, after `onPaymentSuccess`'s order confirmation template, which is unchanged and sent first.
- **The WhatsApp helper:** the document header takes an optional `filename`. Nothing else uses it, so existing templates send exactly as before.
- **The invoice route:** optional `resendWhatsapp`. When the invoice is already SENT, it resends after the response, whatever `whatsappSentAt` says, and still updates it. A fresh send already delivers inside the handler.
- **Not for refund receipts.**
- **Meta:** the template `order_invoice` (a document header and body {{1}} = the order number) must exist and be approved.

**4. Every path that calls `onPaymentSuccess` writes PAID before its response:**
- **The Moyasar invoice callback** (`POST /api/gatewaies/moyasar`, the raw invoice payload) → `moyasarPayment` → `CheckPaymentState` → `await updateOrderStatus(pid, PAID)`.
- **The Tabby webhook** (`POST /api/gatewaies/tabby`, status authorized) → `tabbyPayment` → capture → `await updateOrderStatus(pid, PAID)`.
- **Both go through `orderStatusPaid`:** `await onPaymentSuccess(order)` (which only queues the `after()` task), then the wallet part, then `await prisma.payment.update({ payment: PAID })`. All of it is awaited before the route returns, so the task always sees PAID.
- **Exceptions, by design:**
  - a failed wallet withdraw writes HOLD instead, so the invoice is "not_eligible"
  - if the PAID update itself throws, the task sees no PAID and skips it (no invoice for an unpaid order)
- **`payAllByWallet`** (`data/wallet.ts`) writes PAID before `onPaymentSuccess`, but has no callers. The mobile reservations route's call is commented out.

**Verified:** `prisma validate` and `generate`, `tsc --noEmit` 0 errors, eslint clean (only the old unused `error` in `uploadthing/delete`), a clean `npm run build`, and the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`. `next start`: the Daftra routes and `uploadthing/delete` answer 401 with no header, a wrong `x-dashboard-secret`, or the old Bearer form.

## 2026-10-13 · Daftra go-live date, PAID options and idempotency, dashboard mark-as-paid

**1. Daftra go-live date (`DAFTRA_START_DATE`, yyyy-MM-dd, Asia/Riyadh).**
- `lib/daftra/config.ts`: required when `DAFTRA_ENABLED=true`. A missing or invalid date (2026-02-30 is refused) is a config error, so nothing is sent.
- `sendOrderInvoice` and `sendRefundReceipt`: an order whose `created_at` (Riyadh day) is before the date returns `not_eligible`, "الطلب قبل تاريخ بدء الربط مع دفترة". The check runs before the claim, so nothing is sent, no `DaftraInvoice` row is written and no Telegram alert fires (`not_eligible` isn't an alert status).
- `force: true` (dashboard routes only) skips it. A forced refund of a pre-start order also forces its source invoice past the guard. The automatic paths (`queueOrderInvoice`, `queueRefundReceipt`) never pass force.
- `getDaftraRefund` now selects `order.created_at`.
- **Ziad:** set `DAFTRA_START_DATE` in Vercel before (or with) `DAFTRA_ENABLED=true`, or Daftra stays off with a config error.

**2. `PaidOptions` through `orderStatusPaid` → `onPaymentSuccess`:** `{ source: "webhook" | "dashboard", notifications = true, daftra = true }`.
- **`notifications: false`:** no client or consultant WhatsApp/email (`notificationNewOrder`) or app push (`mobileNotifyOrderConfirmed`), no admin Telegram new-order message (`newOrdertelegram`) and no invoice PDF on WhatsApp (`queueOrderInvoice(oid, { whatsapp: false })` → `sendOrderInvoice({ whatsapp: false })`).
- **`daftra: false`:** no Daftra invoice is queued.
- **Always run:** `createNewMeeting`, `linkPaidPleading`, the wallet part and the PAID write. Error alerts (the `onPaymentSuccess` catch, Daftra failed/review, the PDF failure, refund problems) still go to Telegram.
- **The webhooks** (Moyasar, Tabby, the mobile confirm route) call `updateOrderStatus(pid, PAID)` → `orderStatusPaid(pid)` with no options, so every default is the old behaviour.

**Idempotency: the webhooks weren't safe under concurrency.**
- **Before:** Moyasar's `CheckPaymentState`, the Tabby route, `updateOrderStatus` and `orderStatusPaid` all checked `payment !== PAID` by reading first. Two concurrent deliveries could both pass the read and both run the meeting, the notifications, the wallet withdraw and the Daftra queue.
- **Now:** `orderStatusPaid` claims the transition first with `updateMany({ where: { id, payment: { not: PAID } }, data: { payment: PAID } })`. Only the caller with `count = 1` runs the side effects. A repeat or a concurrent call returns `"already_paid"` and does nothing. The dashboard source claims only from NEW/PROCESSING/HOLD.
- **What else changed:**
  - PAID is written before the side effects, not after. The split (`paidSplit`) and the "changed to PAID" info line are still written after the wallet step, exactly as before.
  - A wallet failure still ends in HOLD with the same info line. It now moves PAID → HOLD, and the split isn't written, as before.
  - A crash between the claim and the side effects now leaves a PAID order without them. Before, it left an unpaid order with them sent.
- **Return values:** `orderStatusPaid` now returns `"paid" | "already_paid" | "not_allowed" | "hold" | "not_found" | "failed"`. No caller of `updateOrderStatus` reads its result.
- **`payAllByWallet`** (`data/wallet.ts`) has no callers and is unchanged.

**3. Dashboard mark-as-paid:** `POST /api/dashboard/orders/paid` (`x-dashboard-secret`, Node runtime, public in `routes.ts` because the route checks the secret).
- **Body:** `{ oid, method: transaction | visaMoyasar | tabby, reference?, notifications = true, daftra = true, actor: { id, name, role } }`. The amount is never an input: `Payment.total` stays the price.
- **Handler:** `markOrderPaidByDashboard` (`handlers/admin/order/mark-paid.ts`), with its data in `data/order/mark-paid.ts`.
  - **States:** only NEW/PROCESSING/HOLD can be marked paid. PAID gives `already_paid`. CANCELED/REFUSED/REFUND/STALL give `not_allowed` with the state in the message.
  - **Method and reference:** it sets `Payment.method`, and `Payment.pid` = the reference only when pid is empty (conditional, never overwritten). A reference that is already another payment's pid gives `failed` ("المرجع مستخدم في طلب آخر").
  - **Paying:** it then runs `orderStatusPaid({ oid }, { source: "dashboard", notifications, daftra })`, the webhooks' own path.
- **Audit (after paid, or hold after the claim):**
  - the order info line "تم التأكيد يدويًا من لوحة التحكم — {name} ({role}) — {method} — {reference or -}"
  - a FinanceLog row (entity ORDER, entityId = oid, action APPROVE, changes for payment/method/pid)
- **Response:** `{ state, status: paid | already_paid | not_allowed | not_found | failed, message, oid }`, HTTP 200. A wallet failure (HOLD) is `failed`. 401 without the secret, 400 on a bad body.

**Files:**
- `lib/daftra/config.ts`, `lib/daftra/invoice.ts`, `lib/daftra/refund.ts`, `lib/daftra/auto.ts`
- `data/daftra.ts`, `data/order/reserveation.ts`, `data/order/mark-paid.ts` (new)
- `handlers/admin/order/payment.ts`, `handlers/admin/order/mark-paid.ts` (new)
- `app/api/dashboard/orders/paid/route.ts` (new)
- `routes.ts`

**Verified:**
- tsc is clean.
- eslint on the changed files: 0 errors (1 old unused-var warning in `payment.ts`).
- `npm run build` passes, and `/api/dashboard/orders/paid` is in the build.
- The manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- The date validator was checked with node (2026-02-30 and malformed values refused; a 00:30 Riyadh order counts as the Riyadh day).
- The route wasn't called against the database.

**Open questions:**
- The dashboard repo needs a mark-as-paid button that calls the route.
- The route's messages are Arabic; the Daftra routes' are English.

## 2026-10-13 · Follow-up on 6ecdd6a: paid-without-room safety net, wallet failure, Arabic Daftra messages

**1. Safety net in the cancel-orders cron** (`app/api/cron/cancel-orders/route.ts`, every 20 minutes).
- **What it finds:** after the cancel step, `markPaidOrdersWithoutRoom` (`data/order/reserveation.ts`) looks for orders that are PAID, created between 3 days and 15 minutes ago, and have no room on any of their meetings.
- **Why rooms:** the meeting rows exist from booking, so a missing room is what an unfinished `onPaymentSuccess` leaves behind.
- **The alert:** one `telegramAdmin` per order, "طلب مدفوع بدون جلسة — #{oid}". Nothing is fixed.
- **Alert once:** the marker "alert: paid order without a session room" is appended to `orders.info` by the same UPDATE … RETURNING that checks for it, the same pattern as the pleading closed-case alert. Concurrent cron runs can't both alert, and each run handles at most 20 orders.
- **Scope:**
  - Only orders with a gateway pid are checked. Dashboard-created orders (`createOrderAdmin`, pid empty) never get a room when notify is off, so they would alert falsely.
  - A mark-as-paid without a reference (no pid) is therefore not covered.
  - The 3-day lower bound keeps the first run from alerting on old history.
- **The SQL wasn't run** against the database. Its table and column names were checked against the prisma models (`orders`, `payments`, `rooms`, `meetings`, `"orderId"`, `"meetingId"`, `created_at`, `info`).

**2. Wallet failure: before this change the notifications did go out.**
- `orderStatusPaid` ran `onPaymentSuccess` (room, client/consultant WhatsApp/email or app push, admin new-order Telegram, Daftra queue) before the wallet step. That was the order before 6ecdd6a too.
- So a failed withdraw (PAID → HOLD) had already sent the confirmations and the new-order Telegram.
- The Daftra invoice and its PDF did not go out: the deferred send re-reads the order and only sends for PAID, so HOLD returned `not_eligible`, with no row and no alert.
- **Now:** the wallet step runs right after the claim and before `onPaymentSuccess`. On failure: HOLD with the same info line, a new admin alert "wallet: order #{oid} wallet withdraw failed, payment set to HOLD", and a return. No notification, room, pleading link, Daftra invoice or PDF.
- **No alert existed before:** the only trace was the info line. The new one is the only message sent.
- A later dashboard mark-as-paid from HOLD runs the whole path once (the wallet is retried; its own "already withdrawn" check stays).
- **Success path:** the same steps, with the withdraw moved before the room and the notifications.

**3. Arabic messages for the Daftra routes:**
- The `message` of every `sendOrderInvoice` / `sendRefundReceipt` / `claimOutcome` result is now in Arabic, and so is the routes' "unexpected error" ("حدث خطأ غير متوقع").
- Statuses are unchanged. Nothing matches on the old strings: the dashboard passes `message` straight to its toast.
- The `error` keys (`unauthorized`, `invalid body`) stay as they are, like the mark-as-paid route.
- Telegram alerts that fall back to `result.message` are now in Arabic too.

**Files:**
- `data/order/reserveation.ts`, `handlers/admin/order/mark-paid.ts` (a comment)
- `app/api/cron/cancel-orders/route.ts`
- `lib/daftra/invoice.ts`, `lib/daftra/refund.ts`
- `app/api/dashboard/daftra/invoice/route.ts`, `app/api/dashboard/daftra/refund/route.ts`

**Verified:**
- tsc is clean.
- eslint on the changed files is clean.
- `npm run build` passes.
- The manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-14 · Phone input: every country

- `components/shared/phone-input.tsx` (the shared phone input):
  - **Countries:** the `countries` whitelist (13 countries) is gone, so every country the library knows (245) is listed.
  - **Order:** the same 13 stay at the top, in their old order, via `countryOptionsOrder={[...TOP_COUNTRIES, "..."]}`. The rest follow, sorted by their Arabic name.
  - **Names:** the library's Arabic locale (`react-phone-number-input/locale/ar.json`), with the site's own names (`constants/phone/countries-phone.json`) kept for those 13.
- **Server rules are unchanged** (`schemas.phone`: 9 to 15 characters, length only). Numbers from other countries already pass. A full 15-digit E.164 number plus the "+" would be 16 characters and is refused, as before.
- **Verified:** tsc is clean, eslint shows 0 errors (1 old warning), `npm run build` passes, and the manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`. Not checked in a browser.

## 2026-10-14 · Daftra: client_email on every invoice and refund receipt

**The bug:** Daftra refused invoices for clients without an email ("client_email": "البريد الإلكتروني مطلوب إذا اخترت أن ترسل الفاتورة عبر البريد"). New Daftra clients default to the email invoicing method.

**The fix:**
- **New env `DAFTRA_CLIENT_EMAIL`** (the fallback email). `lib/daftra/config.ts` requires it when `DAFTRA_ENABLED=true`. A missing or malformed value is a config error, so nothing is sent.
- **The invoice body** (`buildInvoiceBody`) always has `Invoice.client_email`: the order author's email when the author is a real user with one, else `DAFTRA_CLIENT_EMAIL`.
- **The refund receipt body** (`buildRefundBody`) follows the same rule. `getDaftraRefund` now also returns `authorEmail`, from `order.author`.
- **The author email lookup** is now one helper, `authorEmailOf` in `data/daftra.ts`, used by both loaders. Guests ("temp") get null.
- **Client create is unchanged:** a real email only, omitted otherwise.
- **Ziad:** set `DAFTRA_CLIENT_EMAIL` in Vercel. Without it, the Daftra config is incomplete and nothing is sent.

**Files:** `lib/daftra/config.ts`, `lib/daftra/invoice.ts`, `lib/daftra/refund.ts`, `data/daftra.ts`.

**Open question:** invoices that failed with this error are FAILED rows. The dashboard's "send the invoice" button re-sends them (a FAILED row is re-claimed without force).

**Verified:** tsc is clean, eslint on the changed files is clean, `npm run build` passes, and the manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`. Nothing was sent to Daftra.

## 2026-10-14 · Daftra: invoice PDF on/off, daily retry cron

**1. Invoice PDF on WhatsApp on/off.**
- `sendOrderInvoice` already took `whatsapp` (since 6ecdd6a). The dashboard invoice route body now takes `whatsapp?: boolean` too, default true.
- `false` creates the invoice in Daftra without the `order_invoice` WhatsApp. `whatsappSentAt` stays null, so `resendWhatsapp` can send it later.
- The automatic payment path keeps the default. The confirmation templates are untouched.

**2. Daily retry: `app/api/cron/daftra-retry/route.ts`** (`vercel.json` "0 3 * * *").
- **Auth:** `isCronRequest`, as in the other crons.
- **Time limit:** `maxDuration = 300`. No new send starts in the last 90 seconds (a send can take up to three 20-second Daftra calls). Sends run one at a time with a 1-second gap. What's left goes to the next run and is counted in the summary.
- **Code:** the runner is `lib/daftra/retry.ts`; the queries are in `data/daftra.ts` (`getRetryInvoiceOrders`, `getRetryRefunds`, `markStuckDaftraDocuments`).

**The conditions:**
- **Start instant:** `since` = `DAFTRA_START_DATE` 00:00 Riyadh (`riyadhDayStart`, UTC+3, no DST). `before` = now − 30 minutes.
- **Invoices:** orders with `created_at >= since AND created_at <= before`, `payment.payment = PAID`, and either no `daftra_invoices` row of type INVOICE, or an INVOICE row with `state = FAILED AND attempts < 5`. Sent oldest oid first with `sendOrderInvoice(oid, { source: "cron", whatsapp: false })`.
- **Refund receipts:** Refund rows with `createdAt <= before` and `order.created_at >= since`, and either no linked `daftra_invoices` row, or one with `state = FAILED AND attempts < 5`. Sent oldest first, after the invoices, with `sendRefundReceipt(id, { source: "cron" })`.
  - When the receipt has to send its source invoice first, the cron path passes `whatsapp: false` to it (no PDF at night).
- **Stuck sends:** `state = PENDING AND updatedAt < now − 1 hour` become REVIEW with lastError "stuck in PENDING". Each row gets a conditional update on the same condition, and none is resent.
- **Never touched:** SENT and REVIEW rows, and PENDING rows younger than an hour. The send functions' own claim also refuses them.
- **Dates:** documents keep their own dates (the builders are unchanged): invoices `order.created_at` (Riyadh), refund receipts `refundedAt`. A closed financial period rejection ends FAILED with Daftra's reason, like any rejection.
- **`source`** now allows `"cron"` (`DaftraSource` in `lib/daftra/format.ts`). The DaftraInvoice schema comment still says "payment | dashboard"; it's a free text column, so I didn't edit the schema.

**Telegram:** one summary per run, only when something was sent, failed, got stuck or is left for the next run. It lists sent, failed (with the status and a short reason from `lastError`), stuck → REVIEW, rows that reached 5 attempts and the count left. A config error sends one line. Nothing is sent when there was nothing to do.

**Ziad:** `maxDuration = 300` needs Fluid compute (the Vercel default) or the Pro plan. The other crons use 60.

**Verified:**
- tsc and eslint on the changed files are clean.
- `npm run build` passes, and `/api/cron/daftra-retry` is in the build.
- The manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- The summary builder was run on sample data with node: a full summary renders, and an empty run or a disabled config returns null (no message).
- The cron wasn't run against the database or Daftra.

## 2026-10-15 · Daftra: invoice PDF fetched on the server and sent as a WhatsApp file

**The bug:** Daftra's `invoice_pdf_url` requires a login. Meta downloaded the login page, and clients got "فاتورة-000112.pdf.html".

**The fix:** the PDF is fetched on our server through the invoice's public hash preview link, checked, uploaded to WhatsApp and sent by media id. No Daftra link is ever sent: the hash link logs anyone into the client's portal.

**What changed:**
1. **Schema:** `DaftraInvoice.htmlUrl String?` (`prisma/models/daftra.prisma`). The existing GET `/invoices/{daftraId}.json` now saves `invoice_html_url` with `invoice_pdf_url` (`saveInvoiceLinks`). When htmlUrl is null, it's fetched and saved at send time.
   - **Ziad: `prisma db push` first.** Validate and generate pass. Every DaftraInvoice read selects all columns, so deploying before the push breaks every Daftra send.
   - The column holds the hash link, so treat it as a secret.
2. **`lib/daftra/pdf.ts`, `fetchInvoicePdf(htmlUrl, daftraId)`:**
   - GET the preview link with `redirect: "manual"`, following up to 5 redirects by hand, with a name=value cookie jar from every Set-Cookie.
   - Then GET `https://{DAFTRA_SUBDOMAIN lowercased}.daftra.com/client/invoices/view/{daftraId}.pdf` with the jar.
   - Each request times out after 20s. Only https daftra.com hosts are followed or get the cookies. Cookies, links and the hash are never logged or stored.
3. **The check before any send (keep it):**
   - HTTP 200.
   - A PDF content-type: `application/pdf`, or `application/octet-stream` with a Content-Disposition filename ending in `.pdf`. Daftra serves the real PDF as octet-stream (`attachment; filename=TAX_Invoice-000014.pdf`); Ziad chose this rule on 2026-10-15.
   - The buffer starts with `%PDF`.
   - More than 5 KB.
   - A failure isn't sent: no claim, `whatsappSentAt` stays empty, and the admin gets "daftra: invoice oid=X pdf fetch failed (reason)".
4. **Upload and send:**
   - `uploadWhatsappMedia` (`lib/api/whatsapp/index.ts`, POST `/{phone-number-id}/media`, the same `WHATSAPP_URL` / `WHATSAPP_TOKEN`).
   - The `order_invoice` template gets a document header by media id, filename "فاتورة-{daftraNo}.pdf".
   - `HeaderParam`'s document now takes `value` (link) or `id`. Every existing template builds exactly the same body (only `order_invoice` used a document header).
5. **The old "pdfUrl as a link" send is removed.** pdfUrl is still saved and never sent.
6. **Kept as they were:**
   - The `whatsappSentAt` claim, now taken after the PDF passes the check. A failed upload or send gives it back and alerts.
   - `resendWhatsapp`, and `whatsapp: false` from the cron and the dashboard.
   - The Telegram alerts.
   - No WhatsApp for refund receipts.
   - An already-sent PDF without resend now returns before fetching anything.

**Local test** (Daftra invoice 15, run on this machine with the env loaded by `node --env-file`; nothing sent on WhatsApp):
- `/invoices/15.json`: invoice no 000014, the preview link is present.
- The preview: 302 → `/client/invoices/preview/{id}` 200, 3 cookies.
- The PDF: 200, `application/octet-stream`, `attachment; filename=TAX_Invoice-000014.pdf`.
- `fetchInvoicePdf`: ok. First bytes `25 50 44 46 2d 31 2e 34 0a 31 20 30 20 6f 62 6a` ("%PDF-1.4.1 0 obj"), ending "%%EOF", 86937 bytes (84.9 KB), saved to a local scratch file.
- **Negative cases:** the preview link without its hash is rejected ("content-type text/html", Daftra's login page). A non-Daftra link is rejected ("preview link outside daftra").

**Files:**
- `prisma/models/daftra.prisma`
- `lib/daftra/pdf.ts` (new), `lib/daftra/invoice-pdf.ts`
- `lib/api/whatsapp/index.ts`
- `data/daftra.ts`

**Verified:** `npx prisma validate` and `generate` pass, tsc and eslint on the changed files are clean, `npm run build` passes, and the manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`. Not deployed, and nothing sent on WhatsApp.

## 2026-10-15 · One-off: correct the Daftra product on SENT invoices

**The bug:** on production, `DAFTRA_PRODUCT_ID_30` was set to 2 (the 45-minute product), so SENT invoices for 30-minute sessions were booked under product 2. The env is fixed.

**`scripts/daftra-fix-products.ts`** (a script, not a route; `npx tsx`). `.gitignore` now ignores `/scripts/*` with an exception for this file, so the other scripts stay ignored.
- **Reads:** every DaftraInvoice of type INVOICE in state SENT. The correct product comes from the builder's mapping (first meeting's duration → `DAFTRA_PRODUCT_ID_30/45/60`); the current one from GET `/invoices/{daftraId}.json`.
- **Changes** only invoices with one line whose product differs. The PUT `/invoices/{daftraId}.json` body:
  - the existing header (no, client_id, date, draft, currency, discount, po_number, notes, client_email)
  - the same line with only `product_id` changed (item, description, unit_price, quantity, and its tax1/tax2/store_id kept)
  - the payments back unchanged (method, amount, transaction_id, date, treasury_id, status)
  - Edit Invoice replaces items and payments, which is why everything is sent back.
- **Verification after each PUT:** a GET checks that these are unchanged: the invoice number, total, paid, unpaid, line and payment counts, item, description, unit price, quantity, tax, and each payment's method, amount, transaction, date and treasury. It also checks the product is now the correct one. The run stops on the first difference.
- **After a verified PUT:** the row's stored `payload` gets the corrected product_id. Refund receipts take their line's product from it, so a later refund uses the right product.
- **Defaults and options:** dry run by default; `--apply` writes; `--only <oid>` limits it to one order. 1 second between Daftra calls.
- **Never:** touches refund receipts (it only counts the SENT ones on each fixed order), creates or deletes anything, or sends WhatsApp.

**Dry run against production** (2026-10-15, read-only): products 30→1 45→2 60→3. 100 SENT invoices: 80 to fix (all 30-minute, 2 → 1, no refund receipts on them), 20 already correct, 0 skipped.

**Not run with `--apply`:** the PUT is untested. Ziad: run `--apply --only 22232` first, check invoice 000014 in Daftra (product, total, payment, treasury), then `--apply`.

**Verified:** tsc and eslint on the script are clean. No build change (scripts aren't part of the app).

## 2026-10-16 · SEO: blocking metadata for Google's crawlers, no cached "not found" on database errors

**1. Googlebot got no metadata on dynamic pages.**
- **The cause:** Next.js streams metadata to every user agent outside `htmlLimitedBots`, and bots only get the static response. So on articles, consultants, programs and scales, Googlebot's HTML had no `<title>`, description, canonical or robots tag. They existed only in the React payload.
- **`next.config.ts`:** `htmlLimitedBots` = `Googlebot|GoogleOther|` + Next.js's own default (`HTML_LIMITED_BOT_UA_RE`, imported so it follows upgrades).
  - The option replaces the default; it isn't merged with it.
  - The default already covers Google-InspectionTool, Storebot-Google, AdsBot-Google, Mediapartners-Google, Bingbot, facebookexternalhit and the rest.
  - The build writes it as each route's bot-bypass rule, so on Vercel these user agents skip the prerender cache and get a full render.
- **Read counter:** `ArticleReadTracker` skips crawlers (`userAgent().isBot`, plus GoogleOther), since Google's crawlers now render it. Bingbot and the other bots stop counting too (Ziad: keep).

**2. A database error was cached as "not found".**
- **The fetchers:** `getArticleByAid`, `getConsultantInfo` and `getProgramInfo` return null only for a missing row (or an id that can't exist). A database error throws, so `"use cache"` doesn't store it and the next request retries.
  - **Before:** a caught error returned null, and the article was cached as missing for days, the program for weeks.
  - `getScaleBySlug` already threw.
- **Error boundary:** new `app/(pages)/(site)/error.tsx` shows the existing 404 content inside the site layout. There was no error boundary before.
- **Mobile `reservation-info` route:** a database error is now a 500 JSON (its wrapper's catch) instead of 200 "الاستشاري غير متاح".

**Verified on a local `next build` + `next start`:**
- **Googlebot desktop and mobile:** /articles/92, /consultants/13, /programs/5, /scales/gad-7 and / have title, description, canonical and robots in `<head>`.
- **Google-InspectionTool and Bingbot:** the same on /articles/92.
- **Browser:** the same values, streamed into the body as before.
- **Not found:** invalid and missing ids still give the not-found page (200 + noindex).
- **Checks:** tsc clean, eslint 0 errors (3 old warnings), build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.
- **Not tested:** a real database failure.

**Read counter note:** the 2026-10-15 investigation crawl (278 sitemap articles with a browser user agent) and one local check added one read to each of those articles.

## 2026-10-16 · Follow-up: htmlLimitedBots matched by the Vercel edge as ^value$

**The problem:** after e331415 deployed, real Googlebot user agents still got the cached prerender on production (`x-vercel-cache: HIT`) and no metadata.
- **The edge treats the bypass value as `^value$` without a group.** The first alternative only matched at the start of the user agent, and the last only at its end.
- **The evidence:**
  - `Googlebot/2.1 (+…)` → BYPASS, `x Googlebot/2.1 …` → HIT.
  - `… googleweblight` → BYPASS, `… googleweblight x` → HIT.
  - Middle alternatives (Bingbot, Yeti) matched anywhere.
- **Effect:** real Googlebot user agents start with "Mozilla/5.0", so they never matched.
- **GoogleOther from a non-Google IP** got 403 `x-vercel-mitigated: deny` (Vercel's firewall), unrelated.

**The fix (`next.config.ts`):** the value is now `.*(?:Googlebot|GoogleOther|<next default>).*`, which matches anywhere both at the edge and in Next.js's own unanchored test.
- **Node simulation of both readings:** Googlebot desktop, mobile and classic, Google-InspectionTool, Mediapartners-Google, Bingbot and googleweblight mid-string all match. Chrome and iPhone browser user agents don't.
- **Build:** the wrapped value is the user-agent bypass on /articles/[aid], /consultants/[cid], /programs/[prid], /scales/[slug] and /.

**Verified:** tsc and eslint clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`. The production recheck happens after the deploy.

## 2026-10-17 · Shifts step 1: customer service shift tables and meeting log (schema only)

Spec: the dashboard repo's `SHIFTS.md` §3 (customer service shift tracking). Commit 79ad4ee. No app code.

**Schema**
- **New `prisma/models/shift.prisma`:**
  - enums `ShiftSlotSource`, `MeetingLogSource`, `MeetingLogAction`;
  - tables `shift_agents`, `shift_templates`, `shift_slots`, `shift_attendances`, `meeting_logs`, with the indexes the daily timeline, per-shift counts and per-meeting drill-down need.
- **Existing models, relations and one index only (no column changes):**
  - `User.shiftAgent` and `Meeting.logs` back-relations;
  - `RefundRequest @@index([requestedById, createdAt])`.

**Applied:** by Ziad with `prisma db push`, no data-loss warnings. Before the push, the read-only `prisma migrate diff --from-config-datasource --to-schema prisma --script` showed only CREATE TYPE, CREATE TABLE, CREATE INDEX, the new foreign keys and the one `refund_requests` index.

**Verified**
- `prisma validate`, `prisma generate`, `tsc --noEmit` and `npm run build` pass; the manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- **After the push (read-only):**
  - `migrate diff` from the live database is empty;
  - the 5 tables, 3 enums, 18 indexes (all valid, `refund_requests_requestedById_createdAt_idx` included) and 5 foreign keys exist.

**Open:** the dashboard copies the four model files and runs `prisma generate`.

## 2026-10-17 · Shifts step 2 (main site half): meeting log writes

Spec: the dashboard repo's `SHIFTS.md` §4, main-site table. Writes to `meeting_logs` (schema from step 1). The dashboard half (D1–D5) is separate work in that repo.

**New `data/meeting-log.ts`** (server-only)
- **`writeMeetingLog({ meetingId, orderId, session, action, source, actor, before, after })`:**
  - never throws: try/catch, `console.error`, return;
  - called after the change succeeded, outside any transaction, so a failed log can't fail or roll back a booking, payment, webhook or customer action;
  - awaited everywhere (safe, since it can't throw).
- **`changedFields`:** keeps before/after to the fields that changed.
- **`logBookedMeeting(order)`:** CREATED for a booking's first meeting.
- **Actor:** the session user only (web session for the consultant's chat block, the Better Auth session for the mobile "end"), else null. The role is stored only when it is a real `UserRole`.

**Paths logged (S9, S11 and S13 skipped, as the spec says)**

| Path | File | Action | Source / actor |
|---|---|---|---|
| S1 `meetingDone` | `data/reschedule.ts` | DONE if done flipped, CHECKED if checked flipped | SITE / none |
| S2 `rescheduleMeeting` | `data/reschedule.ts` | RESCHEDULED (date, time and duration always on both sides since 2026-10-18; checked when it changed) | SITE / none |
| S3 `checkReschedule` | `data/reschedule.ts` | CHECKED if checked flipped | SYSTEM |
| S4 `participantAttendance` | `data/meetings.ts` | ATTENDANCE_CHANGED (the update only matches `attended: false`, so a row means it changed) | SITE / none |
| S5 LiveKit `participant_left` | `app/api/livekit/webhook/route.ts` | ATTENDANCE_CHANGED only when `attended` flips | SYSTEM |
| S6 `createNewMeeting` from `onPaymentSuccess` | `data/rooms.ts` | ROOM_CREATED (`{ url }`) | SYSTEM (new optional `source` argument, default SYSTEM; `handlers/` untouched) |
| S7 `selectSession` | `data/sessions.ts` | CREATED, then ROOM_CREATED via `createNewMeeting(…, "SITE")` | SITE / none |
| S8 checkout / program / instant | `data/order/reserveation.ts`, `data/order/program.ts`, `data/online.ts` | CREATED, right after `order.create` | SITE / none |
| S10 mobile end | `app/api/mobile/room/[mid]/end/route.ts` | DONE if done flipped | SITE / mobile session user |
| S12 `toggleUserBlock` | `data/chats.ts` + `actions/site.ts` | BLOCKED if blocked flipped | SITE / session consultant, none when only the participant token matched |

**Unchanged behavior**
- Every return value and response is the same. In the webhook, mobile end and `createNewMeeting`, the log is the last step before returning.
- **Extra reads only:**
  - S1 and S3 read `{ done, checked }` / `{ checked }` before their update;
  - S5, S10 and S12 select a few more fields in reads they already did;
  - S4 selects `role`.
- **`toggleUserBlock` action:** its client signature is now spelled out (`mid, shouldBlock, participantId?`). The data function's new third argument (the actor) comes from the session and can't be sent by the client.

**Verified**
- `tsc --noEmit` passes.
- `npm run build` passes; the manifest prints only `"data/event.ts"` and `"lib/api/google.ts"`.
- `eslint .`: 164 problems (40 errors, 124 warnings) before and after; none are new.
- **Not tested:** live events. Check after the deploy with the read-only query in the hand-off.

**Open**
- The dashboard half (D1–D5, actor threaded into the meeting actions).
- S1 and S3 log only on a real flip, so a second "done" click adds no line.

## 2026-10-18 · Meeting log: RESCHEDULED always holds date, time and duration

**Why:** the dashboard's SHIFTS.md §6.1 and §7 item 8. A reschedule counts in the shift the meeting was in before the change. A line with only the changed fields had no `before.date` (time-only change) or no `before.time` (date-only change).

**The change:**
- `rescheduleMeeting` (`data/reschedule.ts`, S2) writes `before: { date, time, duration }` and `after: { date, time, duration }` on every `RESCHEDULED` line, even when only one of them changed. Duration is the meeting's own, unchanged by a reschedule.
- `checked` is added only when it changed, as before.
- The `MeetingLogInput` comment says so.
- `TIME_CHANGED` is written only by the dashboard, so this repo has nothing else to change.

**Live status:** the meeting-log commits (`79ad4ee` schema, `2264278` writes, 2026-10-17) are not pushed. origin/main is still c164b28, so no meeting log is written on production yet.

**Verified:** tsc and eslint clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-18 · Schema: Payment.paidAt (additive, waiting for db push)

**Why:** the dashboard's SHIFTS.md §6.1 and §7 item 9 ("paid during the shift"). Today the paid moment exists only as text in `orders.info`, with inconsistent clocks.

**The change:** `prisma/models/payment.prisma` Payment gets `paidAt DateTime?`: the real UTC moment the payment first became PAID, set once and never overwritten. Older rows stay null, so counts start from the deploy.

**`npx prisma migrate diff --from-config-datasource --to-schema prisma --script`** (read-only, against the live database), the whole output:
```sql
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paidAt" TIMESTAMP(3);
```
One nullable column, nothing else. This also shows the shift tables from 79ad4ee are already in the live database.

**Not yet:** the writes to `paidAt`. They come after Ziad's `prisma db push`, in their own commit.

**Verified:** `prisma validate` and `prisma generate`, tsc clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-18 · Payment.paidAt written on the transition to PAID

`prisma db push` was done by Ziad (no warnings).

**Where it is written:**
- **`orderStatusPaid`** (`data/order/reserveation.ts`), the one PAID path for the Moyasar and Tabby webhooks, the mobile `/confirm` route and `POST /api/dashboard/orders/paid`:
  - `paidNow = new Date()` (real UTC) is taken just before the conditional claim.
  - After the wallet step has succeeded (or there is none), and before `onPaymentSuccess`, it runs `updateMany({ where: { id, paidAt: null }, data: { paidAt: paidNow } })`.
  - Only the claim winner gets there, so a repeated or concurrent call never writes it. The `paidAt: null` condition means it's never overwritten.
  - A failed wallet withdraw goes to HOLD without it, so a later mark-as-paid from HOLD sets it at that moment.
- **`payAllByWallet`** (`data/wallet.ts`, no callers): `paidAt: new Date()` with its PAID write, only when the row's `paidAt` was null.

**Unchanged:** every return value, response, notification and step order. The mobile `GET /api/mobile/reservations/[oid]/result` direct write is left alone until Ziad's OK (payment code); it sets no `paidAt`.

**Read-only check of that route** (production database; order numbers only):
- **History:** the direct `payment: PAID` write has been there since the route was added on 2026-08-14 (776e94c).
- **App orders:** 37 with `origin = APP`, all CANCELED or REFUSED (2026-08-09 → 2026-09-05). None paid. The mobile booking route is commented out, so the app creates no orders now.
- **Any origin:** of 1,466 orders paid or refunded and created since 2026-08-14, 17 have no "order's payment status changed to PAID" line. All 17 are `transaction` with no gateway id (dashboard-created as PAID): 20635, 20636, 20639, 20640, 20641, 20642, 20645, 20651, 20652, 20653, 21643, 21799, 21800, 21801, 21802, 21803, 21804.
- **The /result route** only writes Moyasar payments with a gateway id. A payment it wrote would never get that line later, because the webhook skips orders already PAID. So **no order has gone through it**.
- **Room checks** aren't usable as a signal: 5,770 older web orders have no room tied to session 1.

**Verified:** tsc and eslint clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## Known open issue: mobile /result writes PAID directly, skips orderStatusPaid

**What:** `GET /api/mobile/reservations/[oid]/result` (`app/api/mobile/reservations/[oid]/result/route.ts`, since 2026-08-14, 776e94c). When Moyasar reports a settled payment that matches the amount, currency and oid, it runs `prisma.payment.update({ payment: PAID })` itself (REFUSED the same way).
- **What it skips:** `orderStatusPaid`, so no wallet part, paidAt, split, "changed to PAID" line, room, notifications or Daftra invoice.
- **The webhook can't repair it:** a later Moyasar webhook sees PAID and does nothing.

**Impact so far (read-only check, 2026-10-18, production database):**
- **App orders:** 37 with `origin = APP`, all CANCELED (35) or REFUSED (2), 2026-08-09 → 2026-09-05. None paid.
- **Any origin:** of 1,466 orders paid or refunded and created since 2026-08-14, 17 lack the PAID info line, and all 17 are dashboard bank transfers (`transaction`, no gateway id). So **0 orders** have gone through the direct write.
- **Mobile booking:** `app/api/mobile/reservations/route.ts` is commented out, so the app creates no orders now.

**Proposed fix (deferred with the other mobile fixes, Ziad 2026-10-18):** replace both direct writes with `updateOrderStatus(order.payment.pid, state)`, as `/confirm` does.
- **Response:** unchanged (it's built from the same local `state`).
- **/result and the webhook together:** the `orderStatusPaid` claim makes the second call a no-op.
- **Must be done before mobile booking is turned back on.**

## 2026-10-18 · Daftra: dashboard endpoints (status, PDF resend, resolve), no forced REVIEW resend

**Why:** the dashboard never calls Daftra itself (its `docs/DAFTRA.md`). It reads `daftra_invoices` directly and acts through these routes.

**Decisions (Ziad, 2026-10-18):**
- Dashboard-paid orders get an invoice only when an agent ticks "Send Daftra invoice" in the dashboard, which calls the existing `/invoice`. Nothing changes here for that.
- REVIEW invoices are never force-resent from the dashboard, only settled through `/resolve`.
- No refund receipt PDF to customers for now.
- Credit notes: not now (waiting for the accountant).
- The dashboard logs who pressed each button in `finance_logs`.

**Commits:**
- `597de2e` `POST /api/dashboard/daftra/status`
- `3775f97` `POST /api/dashboard/daftra/invoice/resend`, and `deliverInvoicePdf` returns a typed outcome
- `880c8d6` `POST /api/dashboard/daftra/resolve` (`lib/daftra/resolve.ts`, `data/daftra.ts` `settleReviewDocument`)
- `58e1420` `/invoice` refuses a forced resend of a REVIEW invoice (`use_resolve`); `sendOrderInvoice` never forces the claim
- `41eff3b` schema: FinanceLog values (**waiting for `db push` by Ziad**)

**The routes:** all POST, `verifyDashboardSecret` (401 `{ error: "unauthorized" }`), zod bodies (400 `{ error: "invalid body" }`), Arabic messages, no `htmlUrl`, Daftra link or secret in any response.
- **`/status`:** no body → `{ enabled, configOk, missing?, startDate, maxAttempts }`. `missing` holds env var names only.
- **`/invoice/resend`:** `{ oid, actor }` → `{ state, status, invoiceState?, message }`.
  - `status`: `sent` | `no_invoice` | `pdf_failed` | `whatsapp_failed` | `disabled` | `failed`.
  - `no_invoice` comes with `invoiceState`: `"missing"`, `PENDING`, `FAILED` or `REVIEW`. It never creates or sends an invoice.
  - 60 s max: the Daftra GET, the PDF fetch and the WhatsApp upload run inside the request.
- **`/resolve`:** `{ dedupeKey, outcome: "in_daftra", daftraId, daftraNo?, actor }` or `{ dedupeKey, outcome: "not_in_daftra", actor }` → `{ state, status, documentState?, daftraId?, daftraNo?, message }`.
  - `status`: `resolved` | `not_found` | `not_review` | `daftra_not_found` | `mismatch` | `duplicate` | `disabled` | `failed`.
  - `in_daftra` reads Daftra's copy (GET only) and compares id, client and total where Daftra returns them, then marks the row SENT.
  - `not_in_daftra` moves REVIEW → FAILED ("safe to resend").
  - REVIEW rows only, with a conditional update.
- **`/invoice`:** `force` on a REVIEW invoice → `{ state: false, status: "use_resolve", message }`. `force` still skips the go-live date.

**The nightly retry (`lib/daftra/retry.ts`, unchanged):** it never uses `force`. Its queries pick missing or FAILED documents under 5 attempts, and its PENDING-for-1-h step turns rows into REVIEW. It never retries a REVIEW row.

**Refund receipts to customers (report only):** this app never sends one: no WhatsApp, email or notification in the refund paths (`lib/daftra/refund.ts`, `data/gatewaies/webhook.ts`). `deliverInvoicePdf` is invoices only.
- Like invoices, refund receipts are created in Daftra with `client_email` (the author's real email, else `DAFTRA_CLIENT_EMAIL`), and new Daftra clients default to email invoicing.
- Whether Daftra itself emails the document depends on the Daftra account's settings; that can't be seen from this code.

**Differences from the dashboard's `docs/DAFTRA.md` §5** (not edited from here, it was read only):
- **`/invoice/resend`:** "no invoice" is `status: "no_invoice"` plus `invoiceState` (the plan had `not_sent`). An unexpected error is `failed`.
- **`/resolve`:** the outcomes are `in_daftra` / `not_in_daftra` as planned.
  - Added statuses: `daftra_not_found` (Daftra didn't return the document; nothing changes), `duplicate` (another row holds that `daftraId`), `disabled`.
  - `documentState` says the row's state after the call.
  - No `deliverPdf` flag: after an `in_daftra` invoice, the dashboard calls `/invoice/resend` if it wants the PDF sent.
- **`/invoice`:** besides the new `use_resolve`, `force` can no longer re-send a REVIEW invoice from any path.
- **Not built:** `/credit-note` (decision), `/invoice-pdf` and `/retry` (optional).

**Schema (`41eff3b`, waiting for `db push` by Ziad):** additive enum values, nothing else.
```sql
ALTER TYPE "FinanceLogAction" ADD VALUE 'RETRY';
ALTER TYPE "FinanceLogAction" ADD VALUE 'RESEND_PDF';
ALTER TYPE "FinanceLogAction" ADD VALUE 'RESOLVE';
ALTER TYPE "FinanceLogEntity" ADD VALUE 'DAFTRA_DOCUMENT';
```
- `DAFTRA_DOCUMENT`: a `daftra_invoices` row; `entityId` = its `dedupeKey`.
- `CREATE` (exists) = send a missing invoice.
- This app writes no `finance_logs`. The dashboard copies the model after the push.

**Verified:**
- **Every part:** `tsc --noEmit` clean, `next build` passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`. The schema part also passed `prisma validate` and `generate`.
- **The test setup:** `next start` on a throwaway local database. Daftra was enabled with a fake subdomain and key, WhatsApp pointed at a closed port, and Telegram had an invalid token, so nothing real was sent.
- **`/status`:** the shape above; 401 with no or a wrong secret.
- **`/invoice/resend`:**
  - SENT invoice → `pdf_failed` (the fake preview link);
  - no row → `no_invoice` `"missing"`;
  - FAILED / REVIEW → `no_invoice` with that state, no row written;
  - 400 without an actor, 401 without the secret.
- **`/resolve`:**
  - `not_in_daftra` for an invoice and a refund receipt → FAILED; again → `not_review`;
  - SENT → `not_review`, unknown key → `not_found`;
  - `in_daftra` with Daftra unreachable → `daftra_not_found`, and the row stays REVIEW;
  - 400 for a bad key or a missing `daftraId`.
  - The match functions and `settleReviewDocument` (duplicate / settled / not_review) were also checked directly against the local database.
- **`/invoice`:** forced REVIEW → `use_resolve`, unforced REVIEW → `review`, SENT forced or not → `already_sent`. `sendOrderInvoice(…, { force: true })` on a REVIEW invoice → `review`, with no Daftra call.

**Not exercised (needs real Daftra / WhatsApp):** the resend's `sent` and `whatsapp_failed`, and a matching `in_daftra`. The Daftra GET path for refund receipts (`/refund_receipts/{id}.json`) and the document fields (`id`, `no`, `client_id`, `summary_total`) should be confirmed on the first real use. A field Daftra doesn't return isn't compared, and an unreadable answer is `daftra_not_found`, which changes nothing.

**Open questions:**
1. **The refund route:** `/refund` with `force` can still re-send a REVIEW refund receipt. Should it answer `use_resolve` too, like `/invoice`?
2. **The old PDF resend:** `/invoice`'s `resendWhatsapp` still works, but answers before the send. Remove it once the dashboard uses `/invoice/resend`?
3. **Double resends:** a resend always claims the WhatsApp send (that's how resend works), so two clicks send the PDF twice. The dashboard should disable the button while a resend runs.

## 2026-10-18 · Daftra follow-up: /refund answers use_resolve; the open questions settled

**Decisions (Ziad, 2026-10-18)**, on the open questions of the entry above:
1. **`/refund` with `force` on a REVIEW receipt:** answers `use_resolve`, like `/invoice` (`52552c8`).
2. **`/invoice`'s `resendWhatsapp`:** kept for now. See the pending cleanup below.
3. **The dashboard's `docs/DAFTRA.md`:** updated in the dashboard repo to match what was built here.

**`52552c8`:**
- **`/api/dashboard/daftra/refund`:** `force` on a refund whose receipt row is REVIEW → `{ state: false, status: "use_resolve", message }`, and nothing is sent. `force` still skips the go-live date.
- **`sendRefundReceipt`** no longer forces the claim.
- **`claimDaftraDocument`** loses its `force` option. A REVIEW row always answers `review`, whoever calls, so no path can re-send a REVIEW invoice or refund receipt. They are only settled through `/resolve`.

**Schema:** the FinanceLog values of `41eff3b` (`RETRY`, `RESEND_PDF`, `RESOLVE`, `DAFTRA_DOCUMENT`) are on the live database (Ziad ran `db push`, 2026-10-18).

**Pending cleanup:** remove `resendWhatsapp` from `/api/dashboard/daftra/invoice` (the `after()` call to `deliverInvoicePdf`). Do it only after the dashboard calls `/invoice/resend` instead and that is deployed. Until then both work. The old flag answers before the PDF goes out, so the dashboard can't tell whether it was sent.

**Verified:**
- `tsc --noEmit` clean, `next build` passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.
- `next start` on the local test database:
  - forced `/refund` on a REVIEW receipt → `use_resolve`; unforced → `review`. The row is unchanged both times (state, attempts, `updatedAt`).
  - an unknown refund with `force` → `not_eligible`;
  - 401 without the secret.

## 2026-10-19 · Schema: Order.daftraSkip (additive, waiting for db push)

**Why:** the dashboard's decision that an order can be marked "never send to Daftra".

**The change:** `prisma/models/reservation.prisma` Order gets:
- `daftraSkip Boolean @default(false)`
- `daftraSkipById String?`, `daftraSkipByName String?`, `daftraSkipAt DateTime?` (who set or cleared it, and when)

Nothing reads or writes them yet. The skip rule and the endpoints come after Ziad's `prisma db push`, in their own commits.

**`npx prisma migrate diff --from-config-datasource --to-schema prisma --script`** (read-only, against the live database), the whole output:
```sql
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "daftraSkip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "daftraSkipAt" TIMESTAMP(3),
ADD COLUMN     "daftraSkipById" TEXT,
ADD COLUMN     "daftraSkipByName" TEXT;
```
Only added columns on `orders`: one with a constant default (no table rewrite on Postgres 11+), three nullable.

**Verified:** `prisma validate` and `prisma generate`, tsc clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-19 · Daftra: automatic paths skip "never send to daftra" orders

`prisma db push` for `Order.daftraSkip` was done by Ziad (no warnings).

**The rule:** an order with `daftraSkip = true` never gets an invoice or a refund receipt from an automatic path.
- **Where it's checked:** in the two senders, before anything is claimed: no `DaftraInvoice` row, no Daftra call, no PDF.
  - `sendOrderInvoice` (`lib/daftra/invoice.ts`)
  - `sendRefundReceipt` (`lib/daftra/refund.ts`). The refund check runs before its "send the source invoice first" step, so a skipped order's invoice is never sent from a refund either.
- **Result:** `{ state: false, status: "skipped", message: "الطلب مستثنى من الإرسال إلى دفترة" }`, logged with `console.info` (oid, rfid for refunds, source).
- **No alert:** `skipped` is in neither the payment path's alert set nor the retry's, so it never reaches Telegram.
- **`override?: boolean`** on both senders: only the dashboard routes pass it (next entry); no automatic path does. An overridden refund passes it to its source invoice too.

**The automatic paths, all covered:**

| Path | How it reaches Daftra |
|---|---|
| Invoice after payment: webhooks, mobile `/confirm` and dashboard mark-as-paid, all through `orderStatusPaid` | `onPaymentSuccess` → `queueOrderInvoice` → `sendOrderInvoice` (source payment). Its PDF only runs after a fresh SENT. |
| Refund receipt after a Moyasar refund webhook | `recordRefund` (`data/gatewaies/webhook.ts`) → `queueRefundReceipt` → `sendRefundReceipt` (source payment), which may send the invoice first |
| Nightly retry, `/api/cron/daftra-retry` | `getRetryInvoiceOrders` and `getRetryRefunds` (`data/daftra.ts`) now filter `daftraSkip: false` / `order.daftraSkip: false`, so skipped orders aren't listed. The senders check again. |

`markStuckDaftraDocuments` (PENDING → REVIEW) sends nothing, so it's unchanged.

**Verified:** tsc and eslint clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-19 · Daftra: dashboard endpoints for "never send to daftra"

All routes check `x-dashboard-secret` (`verifyDashboardSecret`): 401 `{ "error": "unauthorized" }` without it, 400 `{ "error": "invalid body" }` on a bad body. They are public in `routes.ts` under `/api/dashboard/daftra`.

**`POST /api/dashboard/daftra/skip`** (new): sets or clears the flag. It sends nothing either way; clearing it only lets the next automatic path or a dashboard call send again.
```jsonc
// request
{ "oid": 4512, "skip": true, "actor": { "id": "u_1", "name": "Ziad" } }
// 200 updated (who/when = the last change, on set and on clear)
{ "state": true, "status": "updated", "oid": 4512, "daftraSkip": true,
  "daftraSkipById": "u_1", "daftraSkipByName": "Ziad", "daftraSkipAt": "2026-10-19T09:12:03.120Z",
  "invoiceState": "missing",          // the order's invoice row: "missing" | PENDING | SENT | FAILED | REVIEW
  "message": "لن يُرسل هذا الطلب إلى دفترة" }   // clear: "أُلغي استثناء الطلب من دفترة"
// 200 not_found
{ "state": false, "status": "not_found", "oid": 999999, "message": "الطلب غير موجود" }
// 500
{ "state": false, "status": "failed", "oid": 4512, "message": "حدث خطأ غير متوقع" }
```

**`POST /api/dashboard/daftra/invoice`** gets `override?: boolean`:
```jsonc
// request ("create anyway" sends override: true; nothing else does)
{ "oid": 4512, "override": true }
// a daftraSkip order without override: nothing claimed, sent or delivered
{ "state": false, "status": "skipped", "message": "الطلب مستثنى من الإرسال إلى دفترة" }
```
- **With override:** the normal send (and its PDF unless `whatsapp: false`). The flag stays set.
- **`resendWhatsapp`:** still only acts on `already_sent`, so on a skipped order without override it does nothing. `/invoice/resend` covers an invoice that exists.

**`POST /api/dashboard/daftra/invoice/resend`:** a daftraSkip order with no SENT invoice answers
```jsonc
{ "state": false, "status": "skipped", "invoiceState": "missing", "message": "الطلب مستثنى من الإرسال إلى دفترة" }
```
- A daftraSkip order whose invoice exists (created with override) is resent as usual. A non-skipped order with no invoice still answers `no_invoice`.

**`POST /api/dashboard/daftra/refund`** gets `override?: boolean` (an addition beyond the request).
- **Why:** the dashboard calls this route after every refund row it creates, so it follows the automatic rule. A daftraSkip order answers the same `skipped` result.
- **What override does:** sends the receipt anyway, the order's invoice first if needed. Without it, an order invoiced with "create anyway" could never get a refund receipt.

**Verified:** tsc and eslint clean, build passes (`/api/dashboard/daftra/skip` in the route list), manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-19 · Daftra: "never twice" checked, including PAID → HOLD → PAID

**Why an order can't get a second invoice or PDF:**
- **The `DaftraInvoice` row `invoice:{oid}`** (unique `dedupeKey`) is the only way in. `claimDaftraDocument` answers `already_sent` for SENT, `already_claimed` for PENDING and `review` for REVIEW, so only a missing or FAILED row is ever sent.
  - **FAILED** means Daftra rejected the invoice, so it isn't in Daftra.
  - **REVIEW** (an unknown outcome) is never re-sent automatically; it's settled with `/resolve`.
- **The PDF** is only delivered right after a fresh SENT (inside `sendOrderInvoice`), behind the `whatsappSentAt` claim. An automatic delivery for an already-delivered invoice answers `already_delivered`. Only the dashboard's resend sends it again.
- **PAID → HOLD → PAID:** the second transition wins a new `orderStatusPaid` claim, so `onPaymentSuccess` runs again and queues the invoice. That send finds the SENT row and answers `already_sent`: no Daftra call, no PDF, no alert.
  - The order confirmation messages do go out again on that second transition. That's unchanged existing behaviour, not Daftra.
- **The nightly retry** only lists orders with no invoice row or a FAILED one under the attempt cap, never SENT.
- **A refund receipt** sends the source invoice first only when it's missing or FAILED.

**The test** (a local harness, not committed: the real `lib/daftra/*` and `data/daftra.ts` against an in-memory Prisma, a fake Daftra API behind `fetch`, stubbed WhatsApp and Telegram, the env pointed at dead endpoints, and a check that the stubs loaded). 14 scenarios, all passing:
1. **First PAID:** 1 invoice POST, 1 PDF download, 1 WhatsApp PDF, row SENT.
2. **PAID → HOLD → PAID:** the second `queueOrderInvoice` sends nothing (still 1 row, no PDF, no alert).
3. **A third PAID-path call** with WhatsApp off: nothing.
4. **Nightly retry:** the SENT invoice isn't listed; a cron send answers `already_sent`.
5. **Dashboard `/invoice`,** with or without override, on an invoiced order: `already_sent`.
6. **Automatic PDF delivery** after it was sent: `already_delivered`, no download, no WhatsApp.
7. **Automatic refund receipt,** queued twice: 1 receipt POST, 0 invoice POSTs, no PDF.
8. **daftraSkip, payment path:** skipped, no row, no Daftra call, no PDF, no alert.
9. **daftraSkip, automatic refund receipt:** skipped, no invoice sent first, no row.
10. **daftraSkip, nightly retry:** not listed (invoice and refund); a direct cron send answers `skipped`.
11. **daftraSkip, dashboard `/invoice` without override:** `skipped`.
12. **daftraSkip, "create anyway" twice:** 1 invoice, 1 PDF; the second answers `already_sent`.
13. **daftraSkip after "create anyway":** the automatic paths still skip it.
14. **Clearing the flag:** who and when stored, nothing sent.

## 2026-10-19 · Daftra: refund receipts of daftraSkip orders once their invoice is in Daftra

**The rule change (Ziad):** the daftraSkip check stops a refund receipt only when the order has no invoice in Daftra.
- **No invoice in Daftra** means no row, or one that is FAILED, PENDING or REVIEW. Then the receipt is skipped, and the invoice is never sent first, as before.
- **A SENT invoice** (sent before the flag, or from "create anyway"): the receipt goes automatically as before. No override is needed.
- **The automatic invoice path** still skips the order whatever its invoice state.

**The changes:**
- **`sendRefundReceipt`** (`lib/daftra/refund.ts`): on a daftraSkip order without override, it reads the order's invoice row. It answers `skipped` only when that row isn't SENT with a `daftraId`; otherwise it continues as usual (no invoice send, since it's SENT).
- **`getRetryRefunds`** (`data/daftra.ts`): lists refunds of orders with `daftraSkip: false` OR a SENT invoice row. A daftraSkip order's refund comes back into the nightly retry once its invoice is in Daftra.
- **`/api/dashboard/daftra/refund`:** comment updated. The response shapes are unchanged: `skipped` now only for a daftraSkip order with no invoice in Daftra, and `override` still forces it, the invoice first if needed.

**Harness** (local, not committed), 15 scenarios, all passing:
- **Scenario 13 now:** after "create anyway" (invoice SENT), the automatic invoice path still skips the order, but its refund receipt is sent automatically, queued twice → 1 receipt POST, 0 invoice POSTs, no PDF. The nightly retry listed that refund until it was sent.
- **New 13b:** a normal order invoiced first, then flagged: its refund receipt is sent automatically, no second invoice.
- **Scenario 9 unchanged:** a daftraSkip order with no invoice gets no refund receipt and no invoice sent first.

**Verified:** tsc and eslint clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`. The first build attempt failed at "collect page data" for `/scales/[slug]` with `P1001 DatabaseNotReachable` (that page reads the database during the build). The rerun passed with no database errors.

## 2026-10-21 · Pleading agreement PDF, phase 1: schema, terms constants, date helper

The plan was approved with Ziad's decisions on 2026-10-21. The PDF and the checkout dialog will both render from one shared builder over these constants; no caller yet in this phase.

**The terms source:** `docs/pleading-terms.md` (Ziad's file, not committed by me).
- **Part 1, the service guide:** the مرافعة intro, the 4 steps and the contact-info warning.
- **Part 2, the agreement** "اتفاقية حماية حقوق العميل عند طلب خدمات الترافع والخدمات القانونية": its header lines, the articles and the two acknowledgements.
- **Numbering:** the file already has articles 1–12 in their final numbering. The sample's articles 10–13 are not in it, and its 14/15/16 are already المادة العاشرة "حدود الخدمة والنتائج", الحادية عشرة "الموافقة الإلكترونية" and الثانية عشرة "أحكام ختامية". So nothing was removed or renumbered here.

**`constants/pleading-terms.ts`** (new), generated from the file by a script that copies every string verbatim and fails on any line it doesn't recognise:
- **Version and title:** `TERMS_VERSION = "2026-10-v1"`, and `PLEADING_AGREEMENT_DOCUMENT_TITLE = "شروط وأحكام خدمة المرافعة واتفاقية التكليف"` (Ziad's title).
- **Content:**
  - `PLEADING_SERVICE_GUIDE`: title, intro, steps title, 4 steps, warning.
  - `PLEADING_AGREEMENT`: the operator line, the agreement title, and the 3 header lines (الإصدار, الجهة المشغلة, النطاق الجغرافي).
  - `PLEADING_ARTICLES`: 12 articles, 75 numbered items. Definitions keep their bold label separately; lead and closing paragraphs are kept too.
  - `PLEADING_ACKNOWLEDGEMENTS`: إقرار العميل and إقرار المحامي, exactly as written.
- **Numbering:**
  - `ARTICLE_ORDINALS` (الأولى … الثانية والعشرون) and `articleHeading(n)`.
  - The consultant's special terms continue from المادة الثالثة عشرة; 10 items at most reach المادة الثانية والعشرون.
  - The generator checks every article's ordinal against this table.
- **Limits for the quote form:**

  | Field | Limit |
  |---|---|
  | Special terms | 10 × 500 characters |
  | Notes | 1000 characters |
  | Case type | 100 characters |
  | Summary | 300 characters, 3 lines |

- **Checked:** a second script rebuilds the markdown from the constants and compares it with the file line by line: **115 of 115 content lines, 0 differences.**

**`utils/date.ts`:**
- **New helpers:** `riyadhArabicDate(date)` → "20 أكتوبر 2026" and `riyadhSlashDate(date)` → "2026/10/20". Riyadh time, the Gregorian calendar (never Hijri), Latin digits, as in the sample.
- **Checked:** the day rollover (21:00 UTC is the next Riyadh day) and all 12 month names.

**Schema** (`prisma/models/pleading.prisma`, additive): `PleadingDocument`, its enums `PleadingDocumentKind` (QUOTE, FINAL) and `PleadingDocumentState` (PENDING, READY, FAILED), and `Pleading.documents`.
- **Fields:** version, termsVersion, the rendered blocks (clientName, consultantName, caseType, summary, consultantTerms Json string[], notes), fileUrl, fileKey, messageId (unique), lastError, acceptedAt and orderId (FINAL), createdAt, updatedAt.
- **Keys:** unique on (pleadingId, kind, version); `onDelete: Restrict` (Ziad). No price column.
- **`npx prisma migrate diff --from-config-datasource --to-schema prisma --script`** (read-only): `CREATE TYPE "PleadingDocumentKind"` and `"PleadingDocumentState"`, `CREATE TABLE "pleading_documents"`, the unique index on `messageId`, the index on (`pleadingId`, `createdAt`), the unique index on (`pleadingId`, `kind`, `version`), and the foreign key to `pleadings` with `ON DELETE RESTRICT`. Nothing on any existing table.
- **Waiting for Ziad's `prisma db push`.**

**Size baseline for phase 2's isolation check** (Next.js 16 prints no sizes, so a script reads the build):
- **Measured:** every route's `.nft.json` trace (file count, bytes, any Chromium file), and every page's first-load client chunks (the root chunks plus its `entryJSFiles`, raw and gzip).
- **Result:** 176 server functions, the largest 22.3 MB, **no Chromium anywhere**; 79 pages, first load 147–490 KB gzip.

**Follow-ups logged:**
- **UploadThing URLs are public by link** (the case PDFs will be too, like today's chat attachments). Review private access later.
- **The terms text needs final legal review before go-live.** It's labelled a draft ("الإصدار: مسودة أولية للاعتماد والمراجعة القانونية", and article 12.5). Article 8.2's disclosure of "أتعاب المحامي وعمولة المنصة" doesn't match the checkout yet, which shows only the total. The text is not changed.

**Verified:** `prisma validate` and `prisma generate`, tsc and eslint clean, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`.

## 2026-10-21 · Pleading agreement PDF, phase 2: the renderer (no quote-form or payment changes)

**Dependencies** (pinned, both published 14+ days before today; transitive ones resolved with `npm install --before=2026-10-07`):
- **`@sparticuz/chromium` 153.0.0** (2026-09-11, Chromium 153) and **`puppeteer-core` 25.11.0** (2026-09-14, built for Chrome 153.0.8010.36).
- **The lockfile:** 34 entries added, 0 changed, 0 removed.
- **`next.config.ts`:**
  - `serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"]`
  - `outputFileTracingIncludes` for `/api/internal/pleading-pdf` only: Chromium's `bin/**`, `lib/pleading-pdf/fonts/**` and `lib/pleading-pdf/assets/**`
- **`vercel.json`:** `functions["app/api/internal/pleading-pdf/route.ts"] = { memory: 2048, maxDuration: 60 }`, and the route exports `maxDuration = 60`.
  - **Ziad:** with Fluid compute, check after the deploy that this function really runs with 2048 MB; Vercel may apply the project-level memory setting instead.

**The route, `POST /api/internal/pleading-pdf`:**
- **Secret:** `x-internal-secret` = `INTERNAL_SHARED_SECRET`, the existing internal secret (no new env), through the new constant-time `lib/auth/internal-secret.ts`.
- **404s:** a missing or wrong secret answers 404 with an empty body, and so do GET, PUT, PATCH and DELETE. Checked on a local `next start`.
- **Routing:** no new public entry. `/api/internal` was already a public prefix (the presence routes), and the proxy passes non-protected paths through anyway, so the route's own check is the guard.
- **Body:** `{ documentId }` only. The data comes from the database (`data/pleading-documents.ts` `getPleadingDocumentForPdf`); a FINAL takes the consultant's date from its QUOTE version.
- **What it does:**
  - A READY document is answered as it is, never rendered twice.
  - Otherwise: render → `UTApi.uploadFiles` (`pleading-{plid}-v{n}[-final].pdf`) → READY with `fileUrl` and `fileKey`.
  - A failure: FAILED with `lastError`, an admin Telegram alert, and 500 `{ status: "failed" }`.
- **Not tested:** the authorised render-and-upload path. It needs the secret and a real PleadingDocument, and would upload to the live UploadThing app, so it's left for phase 3's test.

**Calling it** (`lib/pleading-pdf/request.ts` `requestPleadingPdf(id)`, no caller yet): always over HTTP, never an import.
- **The base URL:**
  - `INTERNAL_BASE_URL` when set (an explicit override).
  - Production (`VERCEL_ENV=production`): `mainRoute`, `https://www.shwerni.sa`. Deployment protection never covers the production domain.
  - Preview: `https://$VERCEL_URL`, plus `x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET` when that system variable exists. **Ziad: enable "Protection Bypass for Automation"** in the project settings if previews are protected; without it a preview call gets 401 and the document stays PENDING or FAILED.
  - Local: `http://localhost:$PORT` (3000).
- **Safety:** a 65 s timeout, and it never throws.

**Local development:** `CHROME_EXECUTABLE_PATH` (an installed Chrome) is used when set; otherwise `@sparticuz/chromium`, which is Linux only.

**The renderer** (`lib/pleading-pdf/render.ts`):
- One browser per instance, relaunched on disconnect.
- Each page runs with JavaScript disabled and request interception that allows only `data:` URLs.
- A4, background colours, Chromium's header and footer templates.

**The template** (`lib/pleading-pdf/template.ts`), RTL, after the sample:
- **Fonts and logo:** IBM Plex Sans Arabic 400, 600 and 700 (OFL, committed in `lib/pleading-pdf/fonts` with `OFL.txt`) as base64 `@font-face`, also inside the header and footer.
  - **The logo is the PNG** (`public/layout/logo.png`, copied to `lib/pleading-pdf/assets`). The repo has no vector version of the full logo (the SVGs are fragments, or wrap a raster image).
- **Running header** (logo, "منصة شاورني") and **footer** "منصة شاورني · اتفاقية حماية حقوق العميل - خدمة المرافعة · صفحة X من Y".
- **Content order:**
  1. the title card (the document title, the agreement's 3 header lines, the version and terms version, a FINAL badge)
  2. the service guide (intro, 4 steps, warning)
  3. the case table (plid, request date, client, consultant, case type, "60 دقيقة عبر المنصة", summary; "—" when empty)
  4. the agreement title with the 12 articles
  5. the special terms (المادة الثالثة عشرة …) and notes: each block removed entirely when empty
  6. the acknowledgements, verbatim: QUOTE says "تتم موافقة العميل إلكترونيًا عند الحجز والدفع"; FINAL gives the acceptance date and TERMS_VERSION. The consultant's date is the quote's.
- **Everything from `buildPleadingAgreement`** (`utils/pleading-agreement.ts`, client-safe), the builder the checkout dialog will use in phase 4.
- **`PleadingPdfInput` has no price field.**
- **Escaping:** every dynamic value is HTML-escaped, and mixed values are bidi-isolated.
- **Page breaks:** each article's heading, lead paragraph and first item form one unbreakable block (the agreement title joins article 1's), items never split, and articles may break between items.

**Samples** (local Chrome, about 0.7–1.4 s each, 219–243 KB; rasterised and checked page by page):
- **Covered:** (a) a QUOTE with every optional field empty, (b) a QUOTE with everything filled (10 special terms, mixed Arabic and digits, multi-line notes), (c) a FINAL with an acceptance date.
- **Results:**
  - Arabic shaping, ligatures and RTL are right; numbers inside Arabic ("(451092)", "2026/10/12"، "PDF", "(PDPL)") and the ordinals المادة الثالثة عشرة → الثانية والعشرون too.
  - No orphan headings; footer numbering "صفحة X من 6".
  - Fixed while checking: the agreement title was alone at the bottom of page 1; long pages had large gaps; the case table labels wrapped; and `<bdi>` put spaces inside the special-terms heading's brackets.
- **Known, not a defect:** like the sample, the PDF's text layer copies Arabic oddly (Chromium writes presentation forms). It's visual only.

**Isolation proof** (`next build`, every route's `.nft.json` trace and every page's first-load client chunks, against the phase 1 baseline):
- **Result:**

  | | Before | After |
  |---|---|---|
  | Server functions | 176 | 177; the 176 are byte-identical |
  | `api/internal/pleading-pdf` | — | 77.8 MB, 566 files, the only one with Chromium |
  | Pages | 79 | 79, First Load JS unchanged |

- **Fixed on the way** (shared modules, not new code reaching other routes):
  - **+131 bytes in 17 route functions:** the Prisma enums module kept `PleadingDocumentKind` and `PleadingDocumentState` once the PDF code imported them, in the enums module every route handler shares. The PDF code now imports them as types only, with string literals.
  - **+142, then +396 bytes in 65 route functions:** the phase 1 date helpers in `utils/date.ts` became live. After moving them out, importing date-fns from a second module stopped Turbopack inlining date-fns into `utils/date.ts`.
  - **The fix for the dates:** `riyadhArabicDate` and `riyadhSlashDate` moved to the new `utils/document-date.ts` with **no imports** (UTC+3 offset plus a month table). `utils/date.ts` is back to its pre-phase-1 code. Checked against date-fns-tz over 42,617 instants (every 37 minutes, 2025–2027): 0 mismatches.
- **Lesson for phases 3–4:** a runtime import of a shared module (the enums, `utils/date`) from new code can grow every function that shares it.

**Verified:** tsc and eslint clean on every changed file, build passes, manifest only `"data/event.ts"` and `"lib/api/google.ts"`, the isolation table above, and the 404s.

## 2026-10-21 · Pleading agreement PDF, phase 3: quote form, AI summary, the PDF in the chat (no checkout or payment changes)

**Schema** (Ziad's db push and commit `1859ec7`): `PleadingDocumentState` gained `RENDERING` (claimed by one render) and `SUPERSEDED` (a newer version exists, never rendered or posted).

**AI:**
- **The client:** the OpenAI client moved from `lib/api/ai/chat-guard.ts` to `lib/api/ai/client.ts` (`openai`). `checkMessageWithAI` is unchanged.
- **The summary draft:** `lib/api/ai/pleading-summary.ts` `draftPleadingSummary(brief)`.
  - It calls gpt-4o-mini with JSON output, asking for at most 3 lines and 300 characters, with no names, contact details, numbers or prices.
  - The result is clamped to 3 lines and 300 characters. It's dropped (null) when it still has price text or `checkMessageWithAI` flags it.
  - The brief is the client's first message in the case chat (`getPleadingBrief`, owner only).
- **The action** `draftPleadingSummary`: OWNER, the owner's own case, 10 a minute and 100 a day per user.

**The quote form** (`components/consultant/pleadings/quote-form.tsx`):
- **Unchanged:** the reply and price come first and are still the only required fields, with the same markup, total box and button.
- **The new collapsible section** "تفاصيل اتفاقية التكليف (اختياري)" (`agreement-fields.tsx`, a `<details>`) holds:
  - case type (max 100);
  - the summary: drafted by AI the first time the section opens if it's empty, editable, with "إعادة الصياغة";
  - the special terms: a +/− list labelled المادة الثالثة عشرة … الثانية والعشرون (max 10 × 500);
  - notes (max 1000).
- **A re-quote** prefills these from the latest version.
- **The checks:**
  - **The schema** `pleadingQuoteSchema` (moved to the new client-safe `utils/pleading-quote.ts`) enforces every limit, on the client for inline errors and again on the server on whatever is submitted, not only on the AI draft.
  - **Price text** (digits with ريال / ر.س / SAR, in either order, Arabic-Indic digits too) is refused in the case type, summary, terms and notes.
  - **On the server,** `quotePleading` runs `checkMessageWithAI` in parallel on the reply and every non-empty agreement field. Each field has its own error code (`contact_case_type`, `contact_summary`, `contact_notes`, `contact_term_N`), and the message shows under that field (the section opens itself).
- **The term list** keeps its values in the form and its row keys in local state (not `useFieldArray`; see isolation).

**`quotePleading`** (`data/pleading.ts`), in the same transaction as the price and the quote message:
- Older QUOTE rows still PENDING or FAILED become SUPERSEDED.
- It creates the new QUOTE `PleadingDocument`: version = last + 1, PENDING, termsVersion, client and consultant names, the agreement fields, and `createdAt` = the quote message's time.
- **Then the action's `after()`** calls the internal route over HTTP (`requestPleadingPdf`, the phase 2 base-URL rules), never by import.

**The route, safe to call twice** (`app/api/internal/pleading-pdf/route.ts` + `data/pleading-documents.ts`):
- **The claim:** READY is answered as is, and SUPERSEDED is skipped. Then one conditional `UPDATE … SET state = 'RENDERING'` runs:
  - it succeeds only from PENDING, FAILED, or a RENDERING claim older than 2 minutes (past the route's 60 s limit);
  - it succeeds only while no newer version of the same kind exists;
  - of two concurrent calls, one wins and the other gets `busy`.
- **On success:**
  - The file is uploaded as `pleading-{plid}-v{n}.pdf`.
  - Then one transaction locks the pleading row (`FOR UPDATE`, the same row the quote transaction updates) and checks for a newer version again.
  - It posts **one** file message: sender OWNER, `pleadingId` set, "اتفاقية التكليف (النسخة n)", stamped quote time + 1 ms so it sits right after that version's quote message.
  - It marks the row READY with `fileUrl`, `fileKey` and `messageId`, conditional on still being RENDERING.
  - **If anything replaced the row in the meantime** (superseded, or a stale takeover finished first), nothing is posted and the upload is deleted.
  - The message is created directly, not through `sendPleadingMessage`, so there's no WhatsApp.
- **On failure:**
  - FAILED with `lastError`, and the upload (if any) is deleted.
  - A Telegram admin alert `pleading-pdf: #plid vN failed`, with no client data.
- **Retry:** the action `retryPleadingDocument` (OWNER, 5 a minute) works only on the latest version of the owner's case, when it's FAILED or RENDERING for over 2 minutes. It re-calls the route for the same row.
- **An older version is never posted after a newer one exists:** both the claim and the completion check for a newer version.

**The case page** (`dashboard/pleadings/[plid]`):
- A new "اتفاقية التكليف" card (`agreement-versions.tsx`) lists every version with its state: قيد الإنشاء / جاري التجهيز / جاهزة / تعذر الإنشاء / استُبدلت بنسخة أحدث.
- READY versions link to their PDF ("عرض PDF").
- "إعادة توليد الاتفاقية" appears when the latest version failed or is stuck.
- While a version is being generated, the page refreshes every 5 s, for at most 3 minutes.
- "Stuck" is worked out on the server, so the markup matches.

**Constants:** `TERMS_VERSION`, the article ordinals and the field limits moved to the small `constants/pleading-agreement.ts`, which `constants/pleading-terms.ts` re-exports. That keeps the legal text out of the quote form's bundle and out of the functions that bundle `data/pleading.ts`. The terms text is unchanged (round trip against `docs/pleading-terms.md`: 115/115 lines, 0 differences). `buildPleadingAgreement` checks that there are 12 static articles. The 3 phase 2 samples were re-rendered with the same page counts.

**Not touched:** the checkout, payment and webhook code (the dialog is phase 4, FINAL is phase 5).

**Isolation** (clean `next build`s of HEAD `1859ec7` and of this phase, plus a second build of this phase for determinism; every page's first-load client chunks, every function's `.nft.json` trace):
- **Determinism:** two builds of the same phase 3 code differ by 2 raw bytes on 5 pages (`centers/[slug]/consultants/[cid]`, `discover`, `instant`, `consultants/[cid]`, `programs/reserve/[prid]`) and by a few gzip bytes on 60 pages. Every function is byte-identical between the two. Page differences of that kind are build noise: server-action ids, module ids, chunk file names, minifier names, and module order inside a chunk. Every function difference against HEAD is real.
- **Pages:** every non-pleading page has the same First Load JS as HEAD, apart from that noise, with one exception, the dashboard home (−257 B, smaller).
- **The dashboard home, −257 B:** it renders the pleading opt-in switch (`components/consultant/pleadings/opt-in.tsx`), which imports `utils/pleading.ts`. That module no longer builds the old quote schema (zod schemas are side effects, so it used to ship). It now exports the min and max price. `/pleading/q` and `/pleading/request` show the same −257 B.
- **The pleading case page:** +10.6 KB raw / +3.0 KB gzip (the agreement fields and the versions card).
- **Functions:**
  - **39 non-pleading SSR functions** (consultant dashboard pages, site pages with booking, payment result pages, and others) that share one SSR chunk with `data/pleading.ts` (reached through the server actions → payment handler → `linkPaidPleading`): +1,825 B each. It comes from the new code in `data/pleading.ts` (the document row in the quote transaction, `getPleadingBrief`, `canRetryPleadingDocument`), plus `constants/pleading-agreement.ts`, `utils/pleading.ts` exporting the price bounds, and the old schema leaving.
  - **The dashboard home, `/pleading/q` and `/pleading/request` functions:** +7.4 KB, the new actions in `actions/pleading.ts` (every action of a "use server" file is registered where any one is imported).
  - **The case page function:** +19 KB (and 2 files: the agreement components).
  - **`api/internal/pleading-pdf`:** +2.4 KB.
  - **18 route functions that bundle `utils/pleading.ts`** (the Moyasar and Tabby webhooks, crons, `orders/paid`, the mobile wallet, confirm and presence routes, pusher, whatsapp, uploadthing, the pleading chat route): −272 B (the old schema left).
  - **The 2 meetings chat routes:** +7 B, one module id (`lib/api/ai/client.ts` joins chat-guard's merged module; no code).
- **Chromium and puppeteer-core:** only in `api/internal/pleading-pdf`.
- **Fixed on the way:**
  - **`useFieldArray`** (no other user on the site) made react-hook-form's shared chunk grow by 1.2 KB gzip on 20 form pages. It was replaced.
  - **Lucide's `minus`, `sparkles`, `plus` and `file-check-2`** each had a single importer elsewhere (the OTP input, the center forms, the consultant profile form), where Turbopack inlines them. A second importer turned them into shared modules on those pages (+18 to +62 B). They're now drawn in the pleading-only `agreement-icons.tsx`.

**Verified:** tsc and eslint clean, build passes, the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`, the isolation above, the terms round trip, and the PDF samples.

**Open:**
- **The end-to-end test** (quote → PDF in chat → re-quote → v2, and a forced failure with retry) is Ziad's: it uploads to the live UploadThing app and needs a real case.
- **The phase 2 follow-ups still stand:** UploadThing URLs are public by link, and the terms need final legal review.

## 2026-10-21 · Pleading agreement: phases 4 and 5 cancelled; the checkout links the agreement

**Decision (Ziad):** phases 4 and 5 of the engagement-agreement plan are **cancelled**. There's no terms dialog at checkout and no FINAL PDF after payment. This entry replaces those phases in the plan; the phase 2 and 3 entries above that mention "the dialog (phase 4)" or "FINAL (phase 5)" describe work that won't happen. The agreement the client accepts is the latest QUOTE version's PDF, linked from the checkout's terms checkbox.

**The checkout** (`/pleading/q/[token]`):
- **The new label:** "أوافق على اتفاقية التكليف الخاصة بهذا الطلب وشروط منصة شاورني".
- **The link:** when the latest QUOTE version is READY, "اتفاقية التكليف" links to its PDF in a new tab (`rel="noopener noreferrer"`). If the latest version isn't READY (pending, rendering or failed), the whole label is plain text. An older READY file is never linked for a newer quote, and checkout never waits for the PDF.
- **The field:** `components/clients/pleading/terms-field.tsx`, the booking flow's terms form markup (unchanged checkbox, description and error) with the new label.
  - The shared `components/clients/consultants/reservation/forms/terms.tsx` is untouched; the booking flows keep their label.
- **The data:** the case poll (`/api/pleadings/[plid]/chat`) now also returns `agreementUrl`, from the new `getLatestAgreementUrl` in `data/pleading-documents.ts`. So the link follows a re-quote live, like the price.
- **No change to** `checkoutPleading`, `PayPleading`, `Pay`, the webhooks or any payment code.

**Phase 4/5 code removed:**
- **What existed:** no phase 4 or 5 code had been written: no dialog, and nothing creates FINAL rows. What did exist was phase 2's FINAL branch in the renderer, and it's now removed:
  - the template's FINAL badge, its CSS and the client acceptance-date block (QUOTE always shows "تتم موافقة العميل إلكترونيًا عند الحجز والدفع.");
  - `PleadingPdfInput.kind` and `clientAcceptedAt`;
  - the FINAL lookup of the accepted QUOTE's date in `getPleadingDocumentForPdf`, which now reads QUOTE rows only;
  - the route's `-final` file suffix;
  - the comments that pointed at the dialog or the FINAL document.
- **Unchanged PDF:** for fixed QUOTE inputs, the template HTML differs only by the removed unused `.chip.final` rule and one blank line. The terms round trip is still 115/115 lines, 0 differences.
- **Schema:** unchanged, so no db push. `PleadingDocumentKind.FINAL`, `PleadingDocument.acceptedAt` and `orderId` stay, unused.

**Isolation** (clean build vs the phase 3 commit `d988dcf`; two builds of identical code differ by up to 6 raw bytes, so that's the noise floor):
- **Pleading:**
  - `/pleading/q/[token]`: +145 B raw, one chunk fewer;
  - its function: −173 B, one file fewer;
  - `api/pleadings/[plid]/chat`: +3.6 KB (the agreement URL read);
  - `api/internal/pleading-pdf`: −1.1 KB (FINAL removed).
- **Non-pleading pages with booking terms:**
  - `discover`: −176 B raw, one chunk fewer;
  - `consultants/[cid]`: −62 B;
  - their functions: −176 and −63 B.
- **Why those changed:** an experiment build with only the pleading checkout switched back to the shared `TermsForm` (everything else kept) put both back to the phase 3 sizes within noise. So the change is entirely the pleading page no longer importing the booking terms form: the bundler splits the shared booking chunks differently. The modules and code on those pages are the same, and no non-pleading file changed. Keeping them byte-identical would mean leaving a dead import of the old form in the pleading checkout, so I didn't.
- **Every other page and function:** unchanged within noise.
- **Chromium and puppeteer-core:** only in `api/internal/pleading-pdf`.

**Verified:** tsc and eslint clean, a clean build, the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`, the field rendered to static markup with and without a URL, the QUOTE HTML diff, and the terms round trip.

**Open (Ziad's test):**
- On a quoted case, open checkout → step 2. The label should link to the latest PDF.
- Re-quote and reopen: the label is plain text until v2 is ready, then links to v2.
- Paying works as before.

## 2026-10-21 · Tracking: GTM and the pixels load early again; ad landings request gtm.js at parse time

**Why:** GA4 Paid Search sessions fell about 85% around Oct 10–11.
- **The cause found in this repo:** 2605dd6 ("scripts enhance", pushed Oct 8 20:49 +0300) changed two things:
  - GTM: from `@next/third-parties` `<GoogleTagManager>` (right after hydration) to `GTM_QUEUE` plus a `lazyOnload` loader (after the load event and idle time);
  - the Meta, Snap and Twitter pixels: from `afterInteractive` to `lazyOnload`.
- **Why that breaks attribution:**
  - The conversion linker and GA4 read the click id (`gclid`, `gbraid`, `wbraid`) from the url when GTM runs, not when the page loaded.
  - A visitor's first in-site navigation removes it from the url. A visitor who tapped a link before GTM ran got no `_gcl_*` cookie, and a GA4 page_view without the click id (filed by referrer, so not as Paid Search).
- **Not explained here:** nothing was pushed between Oct 9 19:22 and Oct 12 01:02, so this repo deployed nothing on Oct 10–11.
- **Checked:**
  - Click ids survive the landing: the proxy keeps every query param, and `next.config` redirects carry the query.
  - Nothing rewrites the url on load. The nuqs filters only change their own keys on user action; the only automatic `router.replace` is on `/payment/success`.

**02e4c67 (Ziad's commit, "fixing seo", pushed 10:42): the revert**
- `app/layout.tsx`: the `gtm-load` loader is `afterInteractive` again.
- `metaPixel.js`, `snapPixel.js`, `twitterPixel.js`: `afterInteractive` again.
- `gtm.ts`: comments only.
- **Unchanged:** `GTM_QUEUE` (early clicks are still queued for GTM), the `TRACKING_OFF` guard on `/pleading/q/`, `inlineCss` off, the redirects. `@next/third-parties` stays uninstalled: its component renders unconditionally, so it would lose the guard.
- **Production result:** gtm.js moved from after the load event to right after hydration. On the phone profile that's about when the load event fires, so a tap at ~6.5s still lost the click id (table below).

**This commit: ad landings**
- `GTM_QUEUE` calls `__loadGtm()` while the html is parsed when the url has `gclid=`, `gbraid=` or `wbraid=`, like google's standard head snippet.
- Every other visit still waits for the `afterInteractive` loader.
- The `TRACKING_OFF` guard runs first, so `/pleading/q/` still loads nothing.

**Verified:**
- **Method:** headless edge on a phone profile (4x cpu, 1.6 mbps, 150 ms latency) with fake click ids. Every GA4, Ads and pixel hit was intercepted and aborted, so nothing reached our accounts.
- **Before the revert:** production, late loading. **After the revert:** production, 02e4c67. **This commit:** local `next start`.

  | Scenario | Build | gtm.js requested | GTM running | `_gcl_*` cookie | first GA4 page_view (url) |
  |---|---|---|---|---|---|
  | gclid, stays | before the revert | 9.5s | | `_gcl_aw` | 16.5s (with gclid) |
  | | after the revert | 4.9s | 8.8s | `_gcl_aw` 9.2s | 12.0s (with gclid) |
  | | this commit | 1.6s | 5.9s | `_gcl_aw` 6.2s | 11.9s (with gclid) |
  | gclid, tap at ~6.5–7s | before the revert | 5.1–6.5s | | none | 14.9–16.8s (no gclid) |
  | | after the revert | 4.4s | 8.3s | none | 13.9s (no gclid) |
  | | this commit (tap 6.7s) | 1.6s | 6.1s | `_gcl_aw` 6.5s | 13.2s (no gclid) |
  | gbraid, tap at ~6.5–7s | before the revert | 5.2s | | none | 14.8s (no gbraid) |
  | | after the revert | 4.8s | 9.9s | none | 14.5s (no gbraid) |
  | | this commit (tap 6.6s) | 1.6s | 6.1s | `_gcl_ag` 6.4s | 12.9s (no gbraid) |
  | no click id | this commit | 3.5s (after hydration) | 8.2s | none | 13.3s |

- **Other checks:**
  - `/pleading/q/<token>`: no tracking request and no tracking globals (local and production).
  - A clean build; the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

**Open:**
- **The margin is thin.** On the phone profile the cookie lands at 6.2–6.5s, so a tap earlier than about 6.2s still loses the click id. gtm.js takes about 4s to download at 1.6 mbps, while the page's own assets compete for the same bandwidth (D1 removes about 1 MB of avatar svgs from the home page).
- **GA4's first page_view still misses the click id after an early tap.** It needs a second gtag.js and goes out at about 12–13s. The fix is in the GTM container: send the landing url as `page_location` on the session's first hit (GTM_QUEUE can push it into the dataLayer).
- **Window load moves later** when gtm.js is requested before it (dynamically inserted async scripts hold the load event): about 15s locally on the phone profile. No metric we track uses the load event.

## 2026-10-21 · Performance D1: the gender avatars as webp

**Why:** the mobile LCP plan found two avatar svgs downloading on the home page before LCP:
- `man-avatar.svg` is 712 KB and `woman-avatar.svg` 599 KB (524 + 441 KB transferred).
- Each one only wraps a 1006×1024 png, stretched to its 110×112 box (the same aspect).
- next/image doesn't optimize svgs, so every visit downloaded the full files.

**Changes:**
- `public/layout/man-avatar.webp` and `woman-avatar.webp`: that same png at 503×512, webp quality 90 (5.4 KB and 6.3 KB).
  - 503 px covers the largest use (`lg`, 160 px, which next/image requests at 384 px on 2x screens).
  - The difference to the original png, compared at 56, 112, 160 and 320 px, averages 0.40–0.57 on a 0–255 scale.
- `components/clients/shared/consultant-image.tsx` and `components/clients/centers/center-avatar.tsx`: the fallback points at the webp files. These are the only two references.
- **next/image now optimizes the fallback:** the home carousel gets a 0.7 KB avif per avatar (`w=128`).
- **The svgs stay** in `public/svg/`, in case anything outside this repo links to them.

**Verified:**
- **Same look:** home consultant section on a mobile viewport (412 px, 2x) with the carousel frozen. A webp screenshot, then the same `<img>` elements pointed back at the svgs:
  - mean difference 0.013/255;
  - 0.008% of channels off by more than 8;
  - side by side, no visible change.
- **Lighthouse mobile, `/`, local `next start`, three runs each:**
  - Tracker domains were blocked, so the test loads sent no hits.
  - Before is c2b6935 (svg avatars); after is this commit.

  | | score | LCP | TBT | KB downloaded before LCP (images) |
  |---|---|---|---|---|
  | before, median | 76 | 5.03s | 258 ms | 1,649 (1,075) |
  | after, median | 76 | 5.09s | 247 ms | 709 (126) |

  - **LCP and TBT:** unchanged within noise.
  - **Why the lab LCP didn't move:** lighthouse's simulated LCP for an image only counts the requests the LCP depends on, and other images aren't among them. So the avatars never weighed on the lab number, and the plan's "large lab LCP impact" was wrong.
  - **What did change:** the bytes before LCP, which is what a real phone downloads.
- **Real effect on a throttled phone** (4x cpu, 1.6 mbps, 150 ms; the click-id test from the tracking entry, local, trackers' hits aborted):
  - gtm.js downloads in about 2.8s instead of about 4s, because it no longer shares the bandwidth with 1 MB of svgs.

  | | c2b6935 | this commit |
  |---|---|---|
  | GTM running | 5.9–6.1s | 4.7–4.8s |
  | `_gcl_aw` / `_gcl_ag` stored (ad landing) | 6.2–6.5s | 4.8–5.1s |
  | first GA4 page_view | 11.9–13.4s | 9.6–10.7s |
  | window load | 14.8–16.3s | 11.0–12.8s |

  - The ad-landing margin before an early tap grows from about 0.2s to about 1.3s.
- A clean build; the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`; tsc and eslint clean on both files.

**Open:**
- Measure production after the push: lighthouse (median of 3) and Speed Insights p75 over 7 days. The lab LCP isn't expected to move; real-phone LCP and INP may.
- A2, A1 and C are on hold (Ziad is checking the Google Ads conversion and the GA4 property first).

## 2026-10-21 · WhatsApp: a coupon (copy-code) button param for templates

**Why:** the campaign with template `mark_coupon` failed twice. The code sent as body `text` gave (#132000) parameter count mismatch; as a `url` param it gave (#131008) required parameter missing. The template has a copy-code button, which needs its own component.

**Files changed**

- `lib/api/whatsapp/components.ts` (new): the component building moved out of `sendWhatsappTemplate` unchanged, as a pure `buildTemplateComponents(params)`, plus `couponError(coupon)` and `COUPON_CODE_MAX` (15). `TemplateParams` and `HeaderParam` live here; `lib/api/whatsapp/index.ts` re-exports them.
- `TemplateParams.coupon?: { code: string; index?: number }` builds `{ type: "button", sub_type: "copy_code", index, parameters: [{ type: "coupon_code", coupon_code }] }` (index defaults to 0, the code is trimmed).
- `sendWhatsappTemplate` builds first. An invalid coupon (an empty code, more than 15 characters, a list instead of one coupon, an index outside 0–9) answers `{ ok: false, errorMessage: "coupon: …" }` without calling Meta, so the campaign cron logs a clear error per send.
- The campaign cron (`app/api/cron/whatsapp-campaigns`) is unchanged: it passes the stored `templateParams`, so a campaign whose params carry `coupon: { code, index }` (the dashboard's form writes it) sends the button. Older campaigns have no `coupon` and build as before.

**Verified**

- A throwaway vitest run (not committed) against the committed builder: 12 param sets without a coupon (text, url, quick_reply, headers, flow) build byte-identical components; the coupon cases and the validation pass; `mark_coupon` with `DIS25` sends exactly `{ type: "button", sub_type: "copy_code", index: 0, parameters: [{ type: "coupon_code", coupon_code: "DIS25" }] }` (fetch stubbed); a 16+ character code makes no request.
- tsc and eslint clean; `npm run build` passes; the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`.

**Open:**
- Meta's template definitions aren't read anywhere (no business account id in the env), so the button index is set by hand in the dashboard form.


## 2026-10-21 · Pusher removal: plan, and step 1 (consultant instant dashboard on the realtime server)

**Plan.** Instant (presence, online consultants, busy on booking) moves from Pusher to the NestJS realtime server (`shwerni.backend`). The app already uses it (`hooks/realtime/*` in the app repo) with the events `consultant-online`, `consultant-offline` and `presence-changed {consultantId, online, onlineCount, counts}`. The website uses the same events. The mobile API routes don't change.

| Step | What | Status |
|---|---|---|
| 0 | realtime server (not this repo): `POST /internal/consultant-busy {consultantId, orderId}` (forced offline for every socket of that consultant, `presence-changed` broadcast, `notifyPresenceChange(false)`, a new `instant-booked {orderId}` to `user:{id}`); an ack from `consultant-online`; `ALLOWED_ORIGIN` must cover every site origin | open: who changes the server |
| 1 | consultant dashboard `/dashboard/instant` on the realtime server | done, waiting for review |
| 2 | client lists (home `InstantList`, the `/instant` page) via `hooks/useOnlineConsultants.ts` rewritten in place; the list keeps its current filters and also requires the server's `onlineIds` | waiting |
| 3 | `broadcastConsultantBusy` calls the server's `consultant-busy` instead of Pusher; the dashboard handles `instant-booked` | waiting for decisions 1 and 2 |
| 4 | remove Pusher: `app/api/pusher/*`, `lib/api/pusher/*`, `hooks/useOnlineConsultant.ts`, the webhook and trigger code in `data/online.ts`, the dead `checkIsAnyConsultantOnline`, the `routes.ts` entry, the two prepared `.txt` files, `npm uninstall pusher pusher-js`. Vercel env vars removed **after** this is deployed (`data/online.ts` loads the Pusher server client as soon as it's imported): `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`; then the webhook disabled in the Pusher dashboard | waiting |

Steps 1 and 2 go out in the same push: between them, lists load correctly from the database (the realtime server keeps `online_status` in sync through `/api/internal/presence`) but no longer update live.

**Step 1 files changed**

- `lib/api/realtime/socket-client.ts` (new): `socket.io-client` loaded on demand; `auth` is a callback, so every connect and reconnect gets a fresh 60s token (`/api/realtime-token` or `/guest`); `fetchOnlineIds` and `fetchPresenceCounts` for the server's public presence endpoints.
- `hooks/realtime/useOnlineConsultant.ts`:
  - `connected` now means "the realtime server lists this consultant", not "the socket opened". The server checks the token after `connect` fires, so an emit right after connect can be ignored, and a refused token still fires `connect`. The hook emits `consultant-online` and confirms against `/presence/online`. It emits again (at most 3 times) only while the server doesn't list the consultant, because every processed emit adds a presence reference on the server.
  - A server-side disconnect (refused token, rate limit) is retried after 5s; socket.io never retries those itself.
  - New `goOffline()`: emits `consultant-offline` and disconnects, without changing the page's state.
  - Counts are refreshed every 30s while online, because client connections don't broadcast counts.
- `components/consultant/instant/index.tsx`: `index.txt` applied, plus:
  - on timeout, `goOffline()` runs before `router.push("/dashboard")`, so the consultant goes offline on the server explicitly, not only because the page unmounts;
  - the countdown is computed from a deadline (a background tab slows its timers); still 10 minutes and 45 seconds, same UI;
  - a dropped connection closes an open popup (the 10-minute cycle restarts on reconnect);
  - `text-theme-500` → `text-theme-600`: `theme-500` isn't defined in `globals.css`, so the icon had no colour.
- `app/api/realtime-token/route.ts` (website only): roles map to `OWNER` / `USER`, as the mobile route does. Before, staff roles reached the server as-is and were counted as guests.

**Intended UI changes (from `index.txt`):** the single "عدد العملاء المتواجدين الآن" number (which actually counted consultants) is replaced by two cards, "مستشارون متصلون" (`counts.owners`) and "عملاء متواجدون" (`counts.clients`, guests not shown); the "العملاء" tile icon uses the theme colour.

**Open questions**

1. When the consultant goes busy: at order creation, before payment (current behaviour, recommended), or after PAID.
2. What the dashboard does on `instant-booked`: go to `/dashboard` like the timeout (recommended), or a new UI.
3. Step 0: changed by Ziad, or by Claude Code in `shwerni.backend`.
4. The icon colour: `text-theme-600` (used here) or keep `text-blue-500`.

## 2026-10-22 · Pusher removal: plan revised after Ziad's answers (replaces the plan table of 2026-10-21)

**Decisions (Ziad)**

1. The consultant goes offline when the instant order is **PAID**, in the shared paid path, for website and app bookings alike. An abandoned payment never knocks a consultant offline.
2. On `instant-booked` the website dashboard goes to `/dashboard` (no new UI).
3. Step 0 is drafted by Claude Code in `shwerni.backend`. It is additive only: nothing the app uses today changes. Ziad reviews and deploys.
4. The icon is `text-theme-600`.
5. Every instant API route and server function on the main site is going to be reused by the app. Paths, request and response shapes stay exactly as they are; only Pusher internals change.
6. Pushes: Step 0 first, then Steps 1+2+3 together, then Step 4.

**Findings**

- **The shared PAID point is `onPaymentSuccess`** (`handlers/admin/order/payment.ts`). Both PAID writers call it:
  - `orderStatusPaid`, reached through `updateOrderStatus` (the Moyasar and Tabby callbacks and webhooks, and the mobile `reservations/[oid]/confirm` route) and through the dashboard mark-paid;
  - `data/wallet.ts` (wallet payment).
  The meeting's participants (and so the consultant's meeting url) only exist after `createNewMeeting`, which `onPaymentSuccess` calls first.
- **Nothing stops two clients paying for the same consultant at the same time.**
  - `checkMeetingTimeConflict` only matches PAID meetings at exactly time−30 or time+30. The time itself isn't in its list, and minutes in between never match. An instant booked at 14:05 never conflicts with one at 14:06.
  - Neither `reserveInstant` nor `Pay` checks that the consultant is online or free.
  - Today the only protection is the Pusher broadcast that hides the consultant from open lists when the order is created. Decision 1 removes that.
  - Unpaid orders are cancelled by the cron after 20 to 40 minutes.
- The app's realtime hooks only listen to `presence-changed`. They don't listen to `instant-booked` or `instant-busy` yet, and they don't use the server's existing `instant-request` / `instant-response`.

**Revised plan**

| Step | What |
|---|---|
| 0 | `shwerni.backend`, additive only (spec below) |
| 1 | consultant dashboard on the realtime server: done, not committed |
| 2 | client lists (home `InstantList`, the `/instant` page): `hooks/useOnlineConsultants.ts` rewritten in place, same return shape; `getOnlineConsultantsList` unchanged (database based; the realtime server keeps `online_status` in sync); on `presence-changed`, remove locally when offline, debounced refetch when online; a USER or GUEST socket; `instant-list-new.txt` applied |
| 3a | `reserveInstant`: no busy broadcast when the order is created; a guard before creating it (below). Its return shape doesn't change |
| 3b | `lib/api/realtime/internal.ts` (new, server-only): `markConsultantBusy()` → `POST {BACKEND_URL}/internal/consultant-busy` with `INTERNAL_SHARED_SECRET`, a 3s timeout, never throws |
| 3c | `onPaymentSuccess` (payment flow, applied only with Ziad's approval of this diff): after `createNewMeeting`, for an INSTANT order whose consultant has a user and whose meeting hasn't ended: `setConsultantOffline(userId)`, then `markConsultantBusy(...)`. It never throws and never delays the payment |
| 3d | the dashboard hook: `instant-booked` or `instant-busy` → `/dashboard`; no more online retries while busy |
| 4 | remove Pusher (as before); Vercel env vars removed after it is deployed: `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`; then the webhook disabled in the Pusher dashboard |

**Guard before payment (3a, smallest fix).** Inside `reserveInstant`, the check and the order creation run in one transaction behind `pg_advisory_xact_lock(cid)`, so two simultaneous requests can't both pass. A booking is refused when this consultant already has an INSTANT order that is either:
- PAID, with a meeting that hasn't ended (start + duration); or
- NEW or PROCESSING, created in the last 10 minutes (the checkout hold).

The hold blocks only other bookings; it never changes presence. The refusal uses the existing `{ state: false, code: "info", message }` with one new message, e.g. "هذا المستشار لديه حجز فوري الآن، برجاء اختيار مستشار آخر". Safety net in 3c: if a second INSTANT order still becomes PAID for a consultant who is already busy, alert the admin on Telegram.

**Step 0 spec (`shwerni.backend`, additive)**

- `PresenceService`: a `busyUntil` map; `setBusy(id, until)`, `isBusy(id)` (expired entries are dropped when read), `clear(id)` (removes every presence reference at once).
- `POST /internal/consultant-busy` (`InternalSecretGuard`), body = the `instant-booked` payload. For every socket in `user:{id}`, `isOnlineConsultant = false`; then `clear(id)`, a `presence-changed online:false` broadcast if they were online, `notifyPresenceChange(id, false)` (always), and `instant-booked` to `user:{id}`.
- `consultant-online` while busy: no presence; emits `instant-busy` to that socket; calls `notifyPresenceChange(id, false)`, which undoes the database ONLINE the app's presence route writes before it emits. Otherwise it behaves as today. The handler returns `{ online, busyUntil? }` as an ack; clients that don't ask for an ack (the app today) see no difference.
- `ALLOWED_ORIGIN` accepts a comma-separated list; a single value works as today.
- Unchanged: `consultant-offline`, `presence-changed`, `get-online-consultants`, `/presence/*`, `instant-request`, `instant-response`, `chat-message`.
- The busy map lives in memory and is lost on a restart. The 3a guard still refuses bookings for a busy consultant.

**Events (shared with the app)**

- `instant-booked`, to `user:{consultantUserId}`:
  `{ orderId: number, meetingId: string, meetingUrl: string, startsAt: string /* ISO */, duration: number, busyUntil: number /* epoch ms */ }`
  `meetingUrl` is the consultant's own url (`meetingUrl(mid, OWNER participant)`, the one the WhatsApp meeting-url button sends). `busyUntil` = meeting start + duration.
- `instant-busy`, to the socket that emitted `consultant-online`: `{ orderId: number, busyUntil: number }`.
- The app doesn't listen for either yet (that's work in the app repo).

**Instant API routes and server functions (paths and shapes unchanged)**

| Route | Function behind it | Caller | Changes |
|---|---|---|---|
| `GET /api/realtime-token` | `mintRealtimeToken` | website socket client | Step 1: the role inside the token (open question) |
| `GET /api/realtime-token/guest` | `mintRealtimeToken` | website guests (Step 2) | none |
| `GET /api/online` | `getConsultantsOnline` | none on the website today | none |
| `POST /api/internal/presence` | `setConsultantOnline/Offline` | realtime server | none |
| `POST /api/internal/instant-snapshot` | `recordInstantSnapshot` | realtime server | none |
| `POST /api/pusher/auth`, `/api/pusher/webhook` | Pusher, `handlePresenceWebhook` | pusher-js, the Pusher service | removed in Step 4 |
| `GET /api/mobile/realtime-token` (+ `/guest`) | `mintRealtimeToken` | app `use-realtime-socket`, `lib/auth/realtime-auth` | none |
| `GET /api/mobile/online` | `getConsultantsOnline` | app `use-online-consultants` | none |
| `POST /api/mobile/consultants/consultant/presence` | `setConsultantOnline/Offline` | app `use-consultant-presence-toggle` | none |
| `GET /api/mobile/consultants/consultant/instant-guard` | `getOwnerbyAuthor`, `checkUpcomingPaidSession` | app `use-instant-guard` | none |
| `/api/mobile/reservations/instant` | POST commented out, GET stub | none | none |
| `POST /api/mobile/reservations/[oid]/confirm` | `updateOrderStatus` → `onPaymentSuccess` | app | the 3c side effect only |
| `POST /api/mobile/room/presence` | `userPresence` upsert (meeting presence, not instant) | app `use-heartbeat` | none |
| server action `getOnlineConsultantsList` | `data/online.ts` | `hooks/useOnlineConsultants` | none |
| server action `Pay` | `reserveInstant` | the `/instant` form | 3a |

**Open**

- `/api/realtime-token` (Step 1) now maps roles to OWNER / USER. The response shape is unchanged, but this isn't a Pusher change. Keep it or revert it?
- The 10-minute checkout hold.
- The 3c `onPaymentSuccess` diff needs Ziad's explicit approval (payment flow).

## 2026-10-22 · Pusher removal: plan approved

**Approved by Ziad**, with:

- **`/api/realtime-token` role mapping (Step 1): kept.** The app never calls it. Its `api` helper prefixes every endpoint with `/api/mobile/` (`lib/api.ts:85` in the app repo), so `use-realtime-socket` and `lib/auth/realtime-auth` both go to `/api/mobile/realtime-token`, and nothing in the app calls `/api/realtime-token` directly.
- **10-minute checkout hold: OK, released as soon as our status says the payment failed or was cancelled.** The 3a guard only counts NEW and PROCESSING orders, so every outcome that changes the status releases it at once:
  - Moyasar callback, definitive failure → HOLD;
  - Tabby, any verified status other than authorized or closed → HOLD;
  - the `/payment/failed` page → REFUSED;
  - the `/payment/cancel` page → REFUSED (the owner's own NEW order);
  - mobile `reservations/[oid]/confirm` → the gateway's state.

  A checkout the client just closes stays NEW (nothing tells us), so it holds for the full 10 minutes. HOLD is also used for "paid, but the amount doesn't match" (an admin case): it releases the hold too, and if an admin later marks it paid, 3c makes the consultant busy if the meeting hasn't ended.

**App follow-up** (app repo, not this one)

- Listen for `instant-booked` on the consultant's socket: show the booking (the in-app notification with `meetingUrl`) and show the consultant as offline.
- Listen for `instant-busy`: the realtime server refused `consultant-online` until `busyUntil`.
- The presence toggle must reflect a refused `consultant-online`. Today `use-consultant-presence-toggle` sets `intendedOnline` after the POST to `consultants/consultant/presence` and the emit, without waiting for the server. It should use the `consultant-online` ack (`{ online, busyUntil? }`) or `instant-busy`, and must never show "online" while busy. The realtime server already writes OFFLINE back to the database when it refuses.
- Optional: use the `consultant-online` ack to confirm the toggle in general.

## 2026-10-22 · Pusher removal step 0 (realtime server, `shwerni.backend`)

**Committed: `c1d2f32` realtime: consultant-busy for paid instant orders (additive)**

- `POST /internal/consultant-busy` (internal secret):
  - every socket of the consultant stops counting as online;
  - `presence-changed online:false` if they were online;
  - `instant-booked { orderId, meetingId, meetingUrl, startsAt, duration, busyUntil }` to `user:{id}`;
  - next.js told OFFLINE;
  - 400 for a bad body or a `busyUntil` in the past.
- `consultant-online` while busy: refused until `busyUntil`; `instant-busy { orderId, busyUntil }` to that socket; the database put back OFFLINE.
- `consultant-online` returns `{ online, busyUntil? }` as an ack. Clients that don't ask for one (the app today) see no change.
- `ALLOWED_ORIGIN` accepts a comma-separated list.
- Ziad's uncommitted `src/realtime/presence-notifier.ts` was left out.
- Verified: `nest build`; 5 unit tests; a local run of the built server (throwaway secrets, `NEXT_INTERNAL_URL` pointed at a dead local port) passed 16 end-to-end checks; CORS with two origins.

**Second commit (waiting for Ziad's OK):**

- A second `consultant-online` from a socket that is already online adds no reference. Before, that left the consultant listed after disconnect (a ghost).
- `src/realtime/realtime.gateway.spec.ts`: 4 tests (double emit then disconnect, two sockets, offline then online on one socket, refused while busy). The double-emit test fails without the fix.
- `package.json` jest `moduleNameMapper` (`.js` specifiers → `.ts`): needed by the first test that imports the gateway. Tests only.
- `scripts/realtime-busy-test.js`: the end-to-end script (19 checks, double emit included). Secrets come from env vars only; `socket.io-client` comes through `NODE_PATH` (not a dependency of this repo).
- Verified: eslint clean on the changed files; 9 of 9 realtime tests; `nest build`; 19 of 19 end-to-end checks locally.
- `src/app.controller.spec.ts` was already broken (`getHello` no longer exists) and is unchanged.

## 2026-10-22 · Pusher removal: independent review, and step 0b (realtime server)

**State found by the review.** `c1d2f32`, `c395a73` and `4bb5072` are on `origin/main` of `shwerni.backend`, and every push to main deploys (`deploy.yml`), so Step 0 is most likely live. Step 1 isn't uncommitted: it is commit `56c6130` here, not pushed.

**Step 0b (`shwerni.backend`): committed `1a74ea2`, not pushed (Ziad pushes after review).** Additive for the app: no event, payload or route changes.

- Rate limiter: keyed on the right-most `X-Forwarded-For` entry (the one the AWS load balancer appends), falling back to `handshake.address`. Before, every client behind the load balancer shared its ip and the 20 connections a minute. Ips with no attempt in the last minute are dropped once a minute.
- CORS: `ALLOWED_ORIGIN` entries lose trailing slashes; `http://localhost:3000` only when `NODE_ENV` isn't `production`; the list is read on each request through a cors callback (`corsOrigin`), in `main.ts` and the gateway, so a value from `.env` works too.
- `/internal/consultant-busy`: 400 when `duration` isn't 30, 45 or 60, `startsAt` isn't a date, or `busyUntil` is more than 4 hours ahead.
- `setBusy` keeps the block that ends later. `instant-booked` carries the `busyUntil` in force (same fields).
- Internal secret guard: 401 (not 500) for an unset secret, a missing, empty or repeated header, or a header of another byte length.
- Verified: `nest build`; eslint clean on the changed files; 47 unit tests pass (the old `app.controller.spec.ts` still fails as before); `scripts/realtime-busy-test.js` 30 of 30 against a local build; CORS headers checked with curl on a production-mode local build.

**Website follow-ups from the review (not started).**

- Step 1: confirm `consultant-online` with the ack (`emitWithAck`) instead of `/presence/online`, which also lists the consultant's other tabs, the app and a dropped socket for ~45s; a per-run `cancelled` flag in `useConsultantPresence` (StrictMode leaves an orphan socket in dev); back off and cap the server-disconnect retries, stop on a 401, show an error after the last emit.
- Step 2 (B2): `BUSY_SUBQUERY` counts NEW and PROCESSING orders, so an abandoned checkout hides the consultant from the website list for 30 minutes. One predicate in both `getOnlineConsultantsList` and `getConsultantsOnline` (the app's list): a PAID meeting with start ≤ now < start + duration, in Riyadh time. It also covers a realtime restart or a failed `consultant-busy` call. Connect list pages as GUEST (every USER connection makes the server call `/api/internal/instant-snapshot`).
- Step 3 (B1): the 10-minute hold can't stop a second payment: the Moyasar invoice has no `expired_at`, and the cron only cancels in the database after 20 to 40 minutes. Expire the gateway checkout with the hold, cancel the order at expiry, and refund an INSTANT order paid after its hold or for a consultant who is already busy.
- Step 3: `reserveInstant` takes the date and time from the client (`addNMinutes` at the form's first render). Set them from the server clock; compute `busyUntil` with `+03:00`.
- Step 3a: the guard also checks scheduled PAID meetings that overlap now, requires the consultant online, and uses `pg_advisory_xact_lock(<const>, cid)` on the transaction client.
- Step 3c: run the `consultant-busy` call with `after()` or await it with its timeout; an un-awaited fetch can be cut off on Vercel.
- Step 3c: when the `consultant-busy` call fails (timeout, network error, 400, 401, 5xx), alert the admin on Telegram with the order id and the consultant (name and user id), not only a console log. The alert itself never throws and never delays the payment.
- `ALLOWED_ORIGIN` on the realtime server must list every origin the site is served from before Step 1 ships.

## 2026-10-22 · Pusher removal step 1 follow-ups (consultant dashboard), on top of `56c6130`

The realtime server (0 + 0b) is deployed; `scripts/realtime-busy-test.js` passes 28 of 28 against production (Ziad).

**Files changed**

- `hooks/realtime/useOnlineConsultant.ts`:
  - "Online" comes from this socket's own ack: `socket.timeout(5000).emitWithAck("consultant-online")`, which answers `{ online, busyUntil? }`. The global `/presence/online` check is gone; it also listed the consultant's other tabs, the app, and a dropped socket for about 45s.
  - Asking again is safe now, since the server counts a socket once. It's needed: an emit at `connect` can arrive before the server's token check and get `{ online: false }` with no `busyUntil` (seen in 1 of 3 local runs; the retry then acked online).
  - `{ online: false, busyUntil }` (busy) stops asking; the page's reaction is step 3d.
  - The shared `stoppedRef` is replaced by a `cancelled` flag per effect run. Each run owns its socket and timers, so a strict-mode double mount or a retry can't leave an older socket online. `goOffline()` calls the current run's `stop()`.
  - Retries back off 2s, 4s, 8s, 16s, 30s, at most 5 in a row (ack timeouts, early refusals, server-side disconnects). socket.io's own reconnects use the same cap and delays. A 401 from `/api/realtime-token` stops at once. When retries run out, the hook returns `failure` (`"unreachable"` or `"session"`); `retry()` starts a fresh run.
- `lib/api/realtime/socket-client.ts`: `createRealtimeSocket(kind, options?)` takes socket.io options and `onTokenError(status)`. With no second argument it behaves as before. The unused `fetchOnlineIds` is removed.
- `components/consultant/instant/index.tsx`:
  - The 10-minute cycle starts on the first connect and a reconnect never restarts it. An open 45-second countdown keeps running through a drop: its popup shows again on reconnect, and expiring while disconnected still sends the consultant offline and to `/dashboard`. The timers end only when the page unmounts.
  - New error screen (below).

**New UI (the only addition):** shown in place of the "جاري الاتصال بالخادم..." screen, with the same layout, once retries run out:

- server unreachable: title "تعذّر الاتصال بالخادم", text "لم نتمكن من تفعيل حالتك كمتاح للعملاء، تحقق من اتصالك بالإنترنت ثم أعد المحاولة";
- session ended (401): title "انتهت جلسة الدخول", text "برجاء تسجيل الدخول مرة أخرى ثم إعادة المحاولة";
- both: a red `WifiOff` icon and a button "إعادة المحاولة".

**Verified**

- tsc clean; eslint clean on the three files.
- Against a local build of the realtime server (throwaway secrets): an emit at `connect` was refused before the token check in 1 of 3 runs, and the retry acked online; the consultant was listed once and gone after disconnect; a bad token ends in `io server disconnect`.

**Open**

- `docs/progress.md` also holds the uncommitted review entry ("independent review, and step 0b"), which isn't from this step: does it go in this commit?

## 2026-10-22 · Realtime server HTTP behind the internal secret: plan (approved), and the dashboard retry fix

**Decision (Ziad).** There are no installed app versions yet, so every HTTP route on the realtime server requires `x-internal-secret` (`INTERNAL_SHARED_SECRET`). The exceptions are the socket.io path (JWT) and the public `/` and `/robots.txt`. The secret never goes into browser code or the app.

**The realtime server's HTTP routes and their callers**

| Route | Before | Callers | After |
|---|---|---|---|
| `GET /`, `GET /robots.txt` | public | browsers, crawlers, maybe the Mau health check | public |
| `GET /presence/online` | public | main-site server (`app/api/online`, `app/api/mobile/online`), the test script | callers move to `/internal/presence/online`; removed in 4a |
| `GET /presence/counts` | public | website browser (consultant dashboard) | replaced by the socket event `get-presence-counts`; removed in 4a |
| `GET /internal/presence/online` | secret | none until 2b | secret |
| `POST /internal/consultant-busy` | secret | the test script; main site from 3b | secret |
| `POST /internal/instant-request` | secret | none | secret |
| `/socket.io/` | JWT | website browser, app | JWT (Nest guards don't apply to it) |

- **Mau health check:** not set in the repo, `deploy.yml` or the Mau CLI package. It's on Mau's side; Ziad checks the console. `/` and `/robots.txt` stay public either way.
- **The app makes no HTTP calls to the realtime server** (only the socket), so no app change is needed for this. Its list comes from the main site's `/api/mobile/online`.

**Who reads `counts` from `presence-changed`:** only OWNER sockets: the app's `use-consultant-presence-toggle` and the website's `useConsultantPresence`. The app's client list (`use-online-consultants`) only refetches on the event and reads nothing from it. Sending `counts` only to OWNER sockets breaks no client. That change waits for Ziad's go (it's an addition to 0c).

**Steps**

| Step | What |
|---|---|
| 0c | realtime server, additive, deployed before the website push: `get-presence-counts` (owners get `{ counts }`, every other socket `{ counts: null }`, so the ack always arrives); the test script reads `/internal/presence/online` with the secret; with Ziad's go, `presence-changed` carries `counts` only for OWNER sockets |
| 2 | client lists (as planned) |
| 2b | website: the dashboard asks for counts over the socket (`get-presence-counts`); `app/api/online` and `app/api/mobile/online` call `/internal/presence/online` with the secret (same `{ onlineIds }`, same responses); `/api/internal/presence` and `/api/internal/instant-snapshot` use the existing `verifyInternalSecret` (`lib/auth/internal-secret.ts`): 401 for an unset secret, a missing or empty header, or another byte length (an unset secret was a 500 before) |
| 2b | `/api/internal/presence` body: bad JSON → 400; `consultantId` a non-empty string; `online` a real boolean; an unknown consultantId → 404 (was a 500); success stays `{ ok: true }` |
| 2b | `/api/internal/instant-snapshot` body: bad JSON → 400; `consultantsNow` and `clientsNow` non-negative integers; `role` OWNER, USER or GUEST; success stays `{ ok: true }` |
| 3 | busy on PAID (as planned) |
| push | Steps 1 + 2 + 2b + 3 together |
| 4a | realtime server: the secret is required on every HTTP route by default, with `/` and `/robots.txt` (plus the Mau health path, if it's another one) exempt; the public `PresenceController` removed; after the push is checked (no browser requests to the realtime server, no `/presence/*` hits in its logs) |
| 4 | Pusher removal |

Dashboard tabs still running the old javascript get 401 on counts after 4a until they're refreshed (the counts just stop updating).

**Dashboard retry fix (website, before this plan).** On localhost, `/dashboard/instant` looped on `connect_error: xhr poll error`, because production CORS doesn't allow localhost.
- In Node, socket.io's own reconnection did stop after 5 attempts and fired `reconnect_failed`, after about 60 to 90s with the hook's delays. The browser's endless loop wasn't reproduced; either way, the cap no longer depends on socket.io.
- `reconnection: false`: `connect_error`, every disconnect (a drop or a server-side one), an ack failure or an early refusal each count as one failed attempt in the hook's own `retryLater` (2s, 4s, 8s, 16s, 30s). After 5 in a row comes the error screen. Only one retry is pending at a time.
- Verified with the same loop against a dead port, delays scaled down: 6 attempts (the first plus 5 retries), then the failure, and nothing after it. tsc and eslint clean.

## 2026-10-22 · Dashboard retry fix committed; Step 0c committed (realtime server, not pushed)

**Website `856d9cb` (not pushed): dashboard retries capped for connect_error too.** Before the commit, the real hook (`hooks/realtime/useOnlineConsultant.ts`) was tested with a throwaway vitest harness outside the repo: a minimal react stand-in and a scripted socket that behaves like socket.io-client (a client disconnect emits `"io client disconnect"`). 7 of 7 pass:

- `goOffline()` (revalidation timeout): one `consultant-offline`, one disconnect, then no reconnect, no new socket and no second `consultant-online` over 10 minutes;
- unmount: the same;
- `goOffline()` cancels a retry that was already scheduled;
- unmount while the socket client is still loading: the socket is closed and never announces itself;
- the counter resets after each online ack: 12 separate drops, each retried after the first delay (2s), never reach the error screen;
- 5 failures in a row end on the error screen, with nothing after it;
- `retry()` starts a fresh run with a fresh counter.

Mutation checks:

- Removing the `cancelled` check on `disconnect` alone still passes, because `retryLater`'s timer checks `cancelled` too (two guards). With both removed, the goOffline and unmount tests fail.
- Removing the counter reset fails the 12-drops test.

`npm run build` passes; the manifest shows only `"data/event.ts"` and `"lib/api/google.ts"`; eslint clean.

**Realtime server `982cd65`: `get-presence-counts`.** Owners get `{ counts }`; every other socket gets `{ counts: null }`, so the ack always arrives. The test script reads `/internal/presence/online` with the secret.

**Realtime server `6f2046a`: `presence-changed` counts for owner sockets only.**

- Owner sockets also join `owners`. The event with `counts` goes to `owners`; the same change without `counts` goes to `public-presence` except `owners`, so every socket gets one event per change.
- Unit tests: the two sends and their payloads; only owners join `owners`. 39 realtime tests pass.
- `scripts/realtime-busy-test.js` locally (throwaway secrets): 36 of 36. An owner watcher and the consultant itself get one event with counts; a USER and a GUEST get one event without.

**Mau health-check path:** still not filled in. `/` and `/robots.txt` stay public either way (Step 4a).

**Next:** Ziad pushes Step 0c and runs the busy test against production. Then Step 2 (client lists) and Step 2b on the website.

## 2026-10-22 · Step 2 plan (approved) and Step 0d (realtime server rate limit buckets)

Step 0c is deployed; the busy test passes against production (Ziad).

**Step 2 decisions (Ziad)**

1. One source and one rule for both lists:
   - online = the realtime server's `onlineIds`; the website's server action reads them server-side from the guarded `/internal/presence/online`;
   - filters: approved, active, not in a center, **published** (now required by the app's list too), and the B2 busy rule.
   - Response shapes don't change: the website keeps `{ userId, cid, name, image, gender, category, rate, cost30 }`; the app keeps `ConsultantCard` through `toCard`.
2. B2 busy rule, one SQL fragment in `getOnlineConsultantsList` and `getConsultantsOnline`. Busy only with a PAID meeting, `done = false`, where start ≤ now < start + duration. The start is `(date || 'T' || time || ':00+03:00')::timestamptz` (correct across midnight), and `m.date` is limited to today or yesterday in Riyadh. NEW and PROCESSING no longer hide anyone.
3. The consultant dashboard's "عملاء متواجدون" card shows `clients + guests` (website visitors connect as GUEST).
4. The busy SQL is tested in a throwaway in-memory Postgres (PGlite through `npx`, outside the project, no dependency added). Cases: during a meeting, after it, before it, unpaid orders, `done = true`, and a session across midnight.
5. Rate limit: Step 0d (below), deployed before the website push.
6. List pages connect as GUEST, everyone included:
   - **home:** only once the `InstantList` section scrolls into view (`IntersectionObserver`), disconnected when leaving the page;
   - **`/instant`:** on mount.

   Offline events remove the consultant locally; online events and reconnects trigger a debounced refetch; the list refetches when the tab becomes visible. Retries are capped and silent (the list still works, just not live). No browser HTTP to the realtime server.
7. Callers:
   - `getOnlineConsultantsList`: the `actions/site.ts` server action → `hooks/useOnlineConsultants.ts` → the home `InstantList` and `/instant`'s `steps/details.tsx`;
   - `getConsultantsOnline`: `app/api/mobile/online` (the app) and `app/api/online` (no caller).
   - `BUSY_SUBQUERY` stays only for the dead `checkIsAnyConsultantOnline` and the Pusher-only `getAvailableCount` until Step 4.
8. `instant-list-new.txt` only moves two imports: no visible change.
9. Pusher after Step 2: no client code. Server-side: the `reserveInstant` broadcast (removed in Step 3); dead until Step 4: `/api/pusher/*`, `lib/api/pusher/*`, `hooks/useOnlineConsultant.ts`, the packages and the env vars.

**Step 0d (`shwerni.backend`, not committed yet):** separate rate limit buckets per ip.

- `ConnectionRateLimiter.allow(ip, bucket = 'member')`: members (USER / OWNER) keep 20 a minute; guests get 120 a minute in a map of their own. Both maps are swept once a minute.
- `handleConnection` checks the token first, then rate-limits by the verified role. GUEST sockets, and connections with a missing or invalid token, use the guest bucket, so guests on a shared ip (carrier nat) can never use up a consultant's or app user's limit.
- Tests: 44 realtime tests. New ones: 120 guests a minute; separate windows per bucket on one ip; guest ips swept; through `handleConnection`, 120 guests then a refused guest and a refused invalid token while an OWNER and a USER from the same ip still connect; 20 members then refused while a guest still connects. The existing x-forwarded-for test now expects the guest bucket for a connection without a valid token.
- `scripts/realtime-busy-test.js`:
  - locally: the member bucket (20, then refused, another ip connects, a guest still connects) and the guest bucket (120, then refused, an OWNER and a USER from that ip still connect);
  - `--rate-limit` against a server that isn't local: only the guest bucket (refused at or before 121, a faked x-forwarded-for still refused, a consultant on the ip still connects).
  - Test ips now come from 198.18.0.0/15, each used once per run: the old 250-address pick collided once between two runs within a minute (an ip the first run had used up), which looked like a limiter failure.
- Verified: eslint clean; `nest build`; the busy test 41 of 41, three runs in a row on one local server.

## 2026-10-22 · Step 0d committed; Pusher removal step 2 (client lists on the realtime server)

**Realtime server `7cdac2f` (not pushed): separate rate limit buckets for guests and members.** Ziad deploys it before the website push.

**Step 2 files changed**

- `data/online-busy.ts` (new): the one rule both lists use.
  - `ONLINE_LISTABLE`: approved, active, published, not a center consultant.
  - `consultantBusyAt(now)`, the B2 busy rule: a PAID meeting, `done = false`, start ≤ now < start + duration. The start is read with a fixed `+03:00`; only today's and yesterday's Riyadh dates are checked; a malformed `time` or `duration` is never cast (CASE). `now` is a parameter, so the test can fix it.
- `data/online.ts`:
  - `getOnlineConsultantsList(onlineIds)`: the realtime server's ids instead of `online_status`, plus `ONLINE_LISTABLE` and `NOT consultantBusyAt(now)`. `$queryRaw` instead of `$queryRawUnsafe`. Same columns.
  - `getConsultantsOnline` (the app's list): the same two fragments in place of its own filters, so it now also requires published and leaves busy consultants out. Same columns and response.
  - `BUSY_SUBQUERY` stays only for the dead `checkIsAnyConsultantOnline` and the Pusher-only `getAvailableCount` (Step 4).
- `lib/api/realtime/internal.ts` (new, server-only): `getRealtimeOnlineIds()`, `GET {BACKEND_URL}/internal/presence/online` with `x-internal-secret`, a 3s timeout; throws on any failure.
- `actions/site.ts`: the public `getOnlineConsultantsList` reads the ids through `getRealtimeOnlineIds()`. If that fails, it returns an empty list and logs. Same return type.
- `hooks/useOnlineConsultants.ts`, rewritten in place, same return `{ consultants, loading, refetch }`:
  - the list from the server action on mount, and again when the tab becomes visible (at most every 15s);
  - live updates over a GUEST socket. An offline event removes that consultant locally; online events and reconnects trigger one debounced refetch (1s). An older answer still in flight when someone goes offline is dropped and fetched again.
  - Capped silent retries: socket.io's own reconnection off; 5 failed connections in a row (2s to 30s), then live updates stop and the list keeps working. A connection counts as healthy only after 10s up, so a server that refuses right after connecting is capped too.
  - New option `liveWhenVisible` (a ref): the socket opens only once that element scrolls into view (`IntersectionObserver`). Without it, it opens on mount. It closes on unmount.
- `components/clients/home/instant/instant-list.tsx`: `instant-list-new.txt` applied (imports reordered), plus `liveWhenVisible` on its `Section`.
- `components/clients/shared/section.tsx`: an optional `ref` prop (React 19), passed to the `<section>` it already renders. No markup change; other callers are unchanged.
- `components/consultant/instant/index.tsx`: the "عملاء متواجدون" card shows `counts.clients + counts.guests`.
- Unchanged: `/instant`'s `steps/details.tsx` (connects on mount), `app/api/mobile/online/route.ts`, `app/api/online/route.ts`. Their switch to `/internal/presence/online` is Step 2b.

**Verified**

- tsc clean; eslint clean on the changed files (`actions/site.ts` keeps its old unused `checkIsAnyConsultantOnline` warning).
- The busy SQL, the real fragments, in PGlite (outside the project, no dependency added): 9 of 9.
  - Cases: before, at the start, during, the last millisecond, at the end and after a meeting; a 60-minute session; NEW, PROCESSING, HOLD, REFUSED, CANCELED and REFUND never busy; `done = true` frees the consultant; a 23:45 and a 23:30 session crossing midnight; a 01:00 Riyadh meeting (22:00 UTC the day before); other days ignored; malformed `time` or `duration` rows skipped without breaking the query; `ONLINE_LISTABLE`.
  - Mutations: removing `done = false`, or yesterday's date, fails its test.
- The real hook through the throwaway vitest harness: 12 of 12 (with the dashboard hook's 7: 19 of 19).
  - Cases: GUEST socket on mount for `/instant`; no socket until the home section is in view; leaving before that opens nothing; a lazy start refetches; offline removes without a refetch; a burst means one refetch; a stale answer is dropped; unmount never reconnects; connect errors capped at 6 attempts; refusal right after connect capped; a stable connection resets the counter; refetch on tab visible, at most every 15s, never while hidden.
  - Mutations: removing the stale-answer drop, or resetting the counter on connect, fails its test.
- No client code imports Pusher any more (only the dead `hooks/useOnlineConsultant.ts` and `lib/api/pusher/pusher-client.ts`, removed in Step 4).

### Step 2 additions (Ziad, before testing): refetch stampede, home page clamp

**Refetch stampede.** Every `presence-changed` online event made every connected visitor refetch about 1s later, all at once.

- `lib/api/realtime/online-list-timing.ts` (new): `ONLINE_LIST_TTL_MS = 2000`, `REFETCH_MIN_MS = 2000`, `REFETCH_MAX_MS = 4000`, `refetchDelay()`. One file, so the cache and the jitter can't drift apart.
- `lib/shared-ttl.ts` (new), `sharedTtl(load, ttlMs)`: callers share one in-flight load; a result is reused until its load *started* `ttlMs` ago; a failure is never kept. Per server instance, in memory.
- `actions/site.ts`: `getOnlineConsultantsList` goes through `sharedTtl(loadOnlineConsultantsList, ONLINE_LIST_TTL_MS)`. However many visitors (or bots) call it, each instance does at most one database query and one realtime call per 2s. The return type is unchanged.
- `hooks/useOnlineConsultants.ts`:
  - after a change (an online event, a connection, a dropped stale answer), the visitor refetches at a random moment 2–4s later instead of about 1s;
  - one refetch covers a burst. A change that arrives too late for the refetch already scheduled gets one more, between 2s after the last such change and 4s after the first (never an empty window: they all arrived in the 2s before that refetch);
  - every connection now refetches, including the first on `/instant`, so changes between the page load and the connection are caught.
- **How the TTL and the jitter fit the constraint:**
  - every change-triggered refetch starts at least `REFETCH_MIN_MS` (= the TTL) after the client heard of the change. The server reuses a list only while its load started less than one TTL ago, so a refetch always gets a list loaded after the change, and a new consultant always appears;
  - the latest refetch is 4s after the change, plus the request (a cache hit, or about 0.3s for a fresh load): within about 4.5s;
  - going offline is still client-side and immediate;
  - a jitter starting at 0.5s (below the TTL) would let a refetch get the list cached just before the change, and that visitor would miss the new consultant until the next event.

**Home list page.** `utils/pagination.ts` (new) has `clampPage(page, count, perPage)`. `instant-list.tsx` derives the page it shows from the selected page and the list length (no extra state or effect), so a shrinking list never shows an empty page; the arrows move from the page shown.

**Verified**

- tsc clean; eslint clean on the changed files (`actions/site.ts`: the old warning only).
- Hook, cache and pagination tests through the throwaway vitest harness: 31 of 31.
  - **Jitter:** bounds 2.0s / 3.0s / 3.999s; a burst inside the window means one refetch; a late change gets a follow-up at 3.5s (= its change + 2s).
  - **Property:** 20 random sequences of 8 changes each (a fixed seed); every change gets a refetch 2–4s after it.
  - **`sharedTtl`:** 50 concurrent callers share one load; reuse until 2s after the load started; the TTL counts from the start of a slow load; failures are not kept.
  - **Invariant:** `REFETCH_MIN_MS ≥ ONLINE_LIST_TTL_MS`.
  - **Stampede:** 300 visitors after one consultant comes online, with a list cached just before the change; all 300 see the consultant within 5s, from at most 3 loads.
  - **`clampPage`:** cases covered.
- Mutations:
  - spreading the follow-up from the last missed change (my first version) fails the property test (a change at 4626ms, its next refetch 4.5s later);
  - `REFETCH_MIN_MS = 500` fails the invariant, the stampede (stale lists served) and the jitter tests.
- The busy SQL in PGlite: 9 of 9, unchanged.
