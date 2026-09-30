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
