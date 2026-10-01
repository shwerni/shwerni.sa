# Server surface audit

Read-only audit, Sep 30, 2026, branch `main` with the uncommitted working tree as it was that day. Companion to `docs/security-refactor.md` (section 1) and `docs/reference/project-map.md`.

## How this was produced

- `npm run build` (Next.js 16.2.9, Turbopack). **Compilation succeeded; the type check failed**, so the build as a whole did not pass:

  ```
  ./docs/reference/example/visibility-switch.tsx:13:37
  Type error: Cannot find module '@/actions/consultant' or its corresponding type declarations.
  ```

  `tsconfig.json` includes `**/*.tsx`, so the reference example in `docs/` is type-checked, and `actions/consultant.ts` does not exist yet. Nothing was changed to work around it.
- `.next/server/server-reference-manifest.json` was written by this build's compile step (13:18:20 local, after the build started). Structure: `{ node: { <actionId>: { workers: { <page>: { moduleId, async, exportedName, filename } }, filename, exportedName } }, edge: {}, encryptionKey }`. `node` has 304 action IDs, `edge` has 0. The `encryptionKey` was not printed or copied.
- Callers come from a TypeScript AST pass over every `.ts`/`.tsx` file outside `node_modules`, `.next`, `backups` and `docs`. Type-only imports are ignored. **Client callers** are files reachable from a `"use client"` file through imports (stopping at `"use server"` files). **Server callers** are everything else that imports the function.
- "Public page" means at least one exposing page is let through `proxy.ts` without a NextAuth token (`publicRoutes`, `DynamicpublicRoutes` or `authRoutes` in `routes.ts`). Whether an action ID can also be posted to a page whose worker does not list it was **not verified**.
- R/M (read or mutation) is derived from Prisma write calls and message/gateway calls in the function body, propagated through calls to other exported functions.
- Nothing was exercised against a running server. Every exploit path below is from reading the code.

## Totals

- **304 exposed functions** from 73 files on 64 pages: `data/` 220 (36 files), `lib/` 42 (10 files), `handlers/` 19 (9 files), plus 23 entries from `app/` and `components/`: 14 `"use cache"` registrations, 5 page `default` exports and 2 `generateMetadata` from page files that start with `"use server"`, and 2 functions in `app/(pages)/(site)/(sub-pages)/reels/actions.ts`. `data/event.ts` adds a 15th `"use cache"` registration.
- **No exposed function reads the session.** No body contains `userServer()`, `roleServer()`, `auth()` or `getSession`.
- 286 of 304 are exposed on at least one public page.
- All 26 functions named in section 1 are still exposed.

| Severity | Total | Only server code calls it | A client component calls it |
| -------- | ----: | ------------------------: | ---------------------------: |
| Critical |    79 |                        73 |                            6 |
| High     |   114 |                        76 |                           38 |
| Lower    |   111 |                       101 |                           10 |

Planned fix: 227 remove `"use server"`, 52 need an action, 2 move the read to a Server Component, 7 remove `"use server"` from a page file, 1 remove (reCAPTCHA), 15 `"use cache"` registrations need nothing (unverified).

## Severity rules used

Section 1 names 26 functions. Every other function was placed by analogy to those rows; the reason is in the table.

- **Critical**: returns other users' PII or login data, financial data (bank, earnings, orders, wallet, payments), changes money or order state, creates or deletes accounts, or takes over an account (§1: `getAllUsers`, `getUserByPhone`, `getBankAccountByAuthor`, `getOwnerForDues`, `removeUnverifiedUsers`, `createUser`, `getUserOrders` …).
- **High**: mutations without auth or ownership, reads of another user's private records, sending SMS/WhatsApp/Telegram, paid APIs (§1: `saveConsultant`, `ownerVisibility`, `confirmOathAcceptance`, `phoneToken`, `saveUploadedImage`, `aiConsultantSummary` …).
- **Lower**: public data, slot availability, page renders (§1: `getConsultants`, `getConsultantAvailableTimes` …).

## Findings more serious than section 1

Section 1 was written from one page's manifest. These come from the full manifest and the route handlers. None were exercised.

1. **Unauthenticated account takeover by phone number (actions).**
   - `forgetpassowrd(phone)` (`handlers/auth/reset.ts:26`, exposed on `/forget-password`) ends with ``redirect(`/reset-password?token=${verificationToken?.token}`)``, so the caller receives the token.
   - `checkToken(token)` (`handlers/auth/verify.ts:22`, exposed on the public `/reset-password` and `/verify-otp`) returns `{ phone, name, otp: tokenExist.otp }`.
   - `verifyReset` (`handlers/auth/reset.ts:68`) only compares that OTP.
   - The same pair (`phoneToken` + `checkToken` + `verifyToken`) verifies any phone number without receiving the SMS.
2. **Account changes by id or phone, no session (actions).** Exposed on `/dashboard/profile`:
   - `userPasswrodChange(data, id)` sets any user's password.
   - `userInfoChange(data, id)` edits any user's profile.
   - `unauthorizedPhoneChangeByToken(data, oldPhone)` moves any account's phone to a new number, then sends the OTP to the new number.
3. **Order and payment state (actions).** Exposed on 12 pages including public ones:
   - `updateOrderStatus`, `orderStatusPaid`, `orderStatusRefund`, `updateOrderPaidByOid`, `cancelOrderByOid`, `cancelOrders` change order state.
   - `onPaymentSuccess` / `onPaymentRefund` / `onPaymentHold` run the post-payment flows.
   - `reserveConsultant(formdata, total, tax, commissionRate)`, `reserveProgram`, `reserveInstant` create orders with caller-supplied totals.
   - `createMoyasarCheckout`, `capturePayment`, `updateMoyasarPid` and `updateTabbyPid` are exposed alongside them.
   - Wallet: `addWalletCredit`, `adjustWalletCredit`, `payAllByWallet`, `payPartiallyByWallet`.
4. **Forged Tabby webhook marks orders paid (route, payments: propose only).** `app/api/gatewaies/tabby/route.ts` has no signature check. For `status === "authorized"` it calls `tabbyPayment(payment.id, payment.amount)`. That calls `capturePayment`, which swallows errors (`catch { return null; }`, `lib/api/gatewaies/tabby.ts:160`) and uses `fetch`, which does not throw on 4xx. `updateOrderStatus(pid, PAID)` then runs regardless of the capture result. Any other status sets the order to HOLD. Needs the order's Tabby payment id, which the buyer receives in the Tabby redirect.
5. **Any order can be flipped to REFUSED with a GET (page, payments: propose only).** `app/(pages)/(site)/(sub-pages)/payment/cancel/page.tsx` calls `updateOrderStatus(payment.pid, PaymentState.REFUSED)` for any `id` with no PAID guard. The failed page has the guard `if (payment.payment !== PaymentState.PAID …)`; cancel does not. `id` is `zencryption(oid)`, a digit-substitution map from `constants/` (client-reachable, so it ships in the bundle), and `oid` is sequential.
6. **Chat routes are open.**
   - `/api/meetings/*` is public in `routes.ts`.
   - `GET /api/meetings/[mid]/chat` returns any meeting's messages and raw `participants` records.
   - `GET /api/meetings/chats?author=&role=` returns any user's chat list from query parameters.
   - `createMeetingMessage` and `toggleUserBlock` are client-called actions with no session.
7. **`POST /api/uploadthing/delete`** (public, file has `"use server"`) deletes any UploadThing `key` with no auth. The `chatAttachment` uploader in `app/api/uploadthing/core.ts` has `.middleware(async () => { return {}; })`, so it accepts uploads without login.
8. **Messaging from company accounts.** `sendWhatsappText` (arbitrary text to any phone), `sendWhatsappTemplate`, 12 `notification*` functions including `notificationSecurityOtp`, and 7 `telegram*` functions are exposed on 12–22 pages.
9. **`POST /api/pusher/auth`** trusts `userId` from form data (`const userId = formData.get("userId") as string;`). Any logged-in user can join the consultants presence channel as any consultant.
10. **Admin and staff data.**
    - `setSetting` / `setSettings` write site settings.
    - `getEmployeeInfo` / `getEmployeesByRole` look up staff.
    - `getAllUsers` returns `prisma.user.findMany()` with no `select`, so it includes the `password` hash column.
11. **Unverified: `POST /api/mobile/auth/set-password`** needs a Better Auth session but not the current password. The comment says "called once, right after a fresh otp verification", but nothing in the route enforces that. Whether `mobileAuth.api.setPassword` refuses when a password already exists was not checked; if it throws, the bcrypt update after it does not run.

## 1. Exposed Server Actions

Sorted by severity, then file. "Pages" lists pages when there are one or two; otherwise see the appendix. Callers show at most three client and two server files.

| # | Function · file | Pages | Client callers | Server callers | R/M | Current check | Severity | Planned fix |
|---|---|---|---|---|---|---|---|---|
| 1 | `getEmployeeInfo`<br>data/admin/settings/employee.ts:17 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **Critical**: staff lookup (like `getUsersByRole`; fields unverified) | remove "use server" |
| 2 | `getEmployeesByRole`<br>data/admin/settings/employee.ts:39 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **Critical**: staff lookup (like `getUsersByRole`; fields unverified) | remove "use server" |
| 3 | `setSetting`<br>data/admin/settings/settings.ts:9 | 22 pages (see appendix)<br>public page: yes | — | — | mutation | none | **Critical**: writes site settings | remove "use server" |
| 4 | `setSettings`<br>data/admin/settings/settings.ts:18 | 22 pages (see appendix)<br>public page: yes | — | — | mutation | none | **Critical**: writes site settings | remove "use server" |
| 5 | `getChatList`<br>data/chats.ts:281 | `/chats/[mid]`<br>public page: yes | — | `app/api/meetings/chats/route.ts` | read | none (scoped only by caller-supplied `author`) | **Critical**: any meeting's messages and participants | remove "use server" |
| 6 | `getChatMeeting`<br>data/chats.ts:151 | `/chats/[mid]`<br>public page: yes | — | `app/(pages)/(site)/(features)/chats/[mid]/page.tsx` | read | none (scoped only by caller-supplied `mid`) | **Critical**: any meeting's messages and participants | remove "use server" |
| 7 | `getMeetingData`<br>data/chats.ts:182 | `/chats/[mid]`<br>public page: yes | — | `app/api/meetings/[mid]/chat/route.ts` | read | none (scoped only by caller-supplied `mid`) | **Critical**: any meeting's messages and participants | remove "use server" |
| 8 | `getBankAccountByAuthor`<br>data/consultant.ts:972 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/page.tsx` | read | none (scoped only by caller-supplied `author`) | **Critical**: §1 | remove "use server" |
| 9 | `getOwnerForDues`<br>data/consultant.ts:802 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/dues/page.tsx` | read | none (scoped only by caller-supplied `userId`) | **Critical**: §1 | remove "use server" |
| 10 | `getAllDuesOwner`<br>data/dues.ts:12 | `/dashboard/dues`<br>public page: no | — | `app/(pages)/(consultants)/dashboard/dues/page.tsx` | read | none (scoped only by caller-supplied `cid`) | **Critical**: consultant earnings (like `getOwnerForDues`) | remove "use server" |
| 11 | `getDuesOwnenByMonth`<br>data/dues.ts:52 | `/dashboard/dues`<br>public page: no | `components/legacy/consultants/owner/dues/index.tsx` | `data/bot.ts` | read | none (scoped only by caller-supplied `cid`) | **Critical**: consultant earnings (like `getOwnerForDues`) | needs an action (read, rate limited) |
| 12 | `updateMoyasarPid`<br>data/gatewaies/moyasar.ts:12 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/gatewaies/moyasar.ts` | mutation | none (scoped only by caller-supplied `oid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 13 | `updateTabbyPid`<br>data/gatewaies/moyasar.ts:44 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/gatewaies/tabby.ts` | mutation | none (scoped only by caller-supplied `oid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 14 | `getTabbyBuyerLoyalty`<br>data/gatewaies/tabby.ts:88 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/gatewaies/tabby.ts` | read | none (scoped only by caller-supplied `author`) | **Critical**: payment gateway / payment records | remove "use server" |
| 15 | `getTabbyOrderHistory`<br>data/gatewaies/tabby.ts:29 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/gatewaies/tabby.ts` | read | none (scoped only by caller-supplied `oid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 16 | `getTabbyRegisteredDate`<br>data/gatewaies/tabby.ts:101 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/gatewaies/tabby.ts` | read | none (scoped only by caller-supplied `id`) | **Critical**: payment gateway / payment records | remove "use server" |
| 17 | `reserveInstant`<br>data/online.ts:178 | 12 pages (see appendix)<br>public page: yes | — | `app/api/mobile/reservations/instant/route.ts`<br>`handlers/admin/order/payment.ts` | mutation | none | **Critical**: creates an order with caller-supplied `total`, `tax` | remove "use server" |
| 18 | `reserveProgram`<br>data/order/program.ts:24 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation | none | **Critical**: creates an order with caller-supplied `total`, `tax` | remove "use server" |
| 19 | `cancelOrderByOid`<br>data/order/reserveation.ts:1103 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `oid`) | **Critical**: changes order payment status / cancels orders | remove "use server" |
| 20 | `cancelOrders`<br>data/order/reserveation.ts:1124 | 12 pages (see appendix)<br>public page: yes | — | `app/api/cron/cancel-orders/route.ts` | read | none | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 21 | `getAllOrders`<br>data/order/reserveation.ts:381 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 22 | `getAllOrdersByAuthor`<br>data/order/reserveation.ts:417 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 23 | `getAllOrdersByAuthorAndMonth`<br>data/order/reserveation.ts:531 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 24 | `getAllOrdersDesc`<br>data/order/reserveation.ts:397 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 25 | `getAllOwnersOrdersByAuthor`<br>data/order/reserveation.ts:449 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 26 | `getAllOwnersOrdersByAuthorAndMonth`<br>data/order/reserveation.ts:573 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 27 | `getAllPaidOwnersOrdersByAuthor`<br>data/order/reserveation.ts:479 | 12 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/orders/page.tsx` | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 28 | `getPaidOwnersOrdersByAuthorAndMonth`<br>data/order/reserveation.ts:613 | 12 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/orders/index.tsx` | — | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | needs an action (read, rate limited) |
| 29 | `getPaidOwnersOrdersByAuthorAndRange`<br>data/order/reserveation.ts:673 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 30 | `getPaidOwnersOrdersByCidAndRange`<br>data/order/reserveation.ts:712 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 31 | `getReservationById`<br>data/order/reserveation.ts:273 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `id`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 32 | `getReservationByOid`<br>data/order/reserveation.ts:289 | 12 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(features)/sessions/[id]/page.tsx`<br>`app/(pages)/(site)/(sub-pages)/payment/cancel/page.tsx`<br>+5 more | read | none (scoped only by caller-supplied `oid`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 33 | `getReservationByPid`<br>data/order/reserveation.ts:324 | 12 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/payment/success/page.tsx` | read | none (scoped only by caller-supplied `pid`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 34 | `getReservationPaymentByOid`<br>data/order/reserveation.ts:760 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `oid`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 35 | `getReservationPaymentByPid`<br>data/order/reserveation.ts:741 | 12 pages (see appendix)<br>public page: yes | — | `handlers/gatewaies/moyasar.ts` | read | none (scoped only by caller-supplied `pid`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 36 | `getReservationPidByOid`<br>data/order/reserveation.ts:362 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `oid`) | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 37 | `getUnpaidOrder`<br>data/order/reserveation.ts:1080 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **Critical**: order and payment records (like `getUserOrders`) | remove "use server" |
| 38 | `orderStatusHold`<br>data/order/reserveation.ts:940 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `pid`) | **Critical**: changes order payment status / cancels orders | remove "use server" |
| 39 | `orderStatusPaid`<br>data/order/reserveation.ts:840 | 12 pages (see appendix)<br>public page: yes | `components/clients/home/test.tsx` | — | mutation | none (scoped only by caller-supplied `pid`) | **Critical**: changes order payment status / cancels orders | remove "use server" (only client caller is unused: components/clients/home/test.tsx is not imported anywhere) |
| 40 | `orderStatusRefund`<br>data/order/reserveation.ts:961 | 12 pages (see appendix)<br>public page: yes | `components/legacy/layout/orderCard/refundButton/index.tsx` | — | mutation | none (scoped only by caller-supplied `pid`) | **Critical**: changes order payment status / cancels orders | needs an action (auth rule unclear: ask) |
| 41 | `reserveConsultant`<br>data/order/reserveation.ts:38 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation | none | **Critical**: creates an order with caller-supplied `total`, `tax`, `commissionRate` | remove "use server" |
| 42 | `updateOrderPaidByOid`<br>data/order/reserveation.ts:1062 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `oid`) | **Critical**: changes order payment status / cancels orders | remove "use server" |
| 43 | `updateOrderStatus`<br>data/order/reserveation.ts:779 | 12 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/payment/cancel/page.tsx`<br>`app/(pages)/(site)/(sub-pages)/payment/failed/page.tsx`<br>+5 more | mutation | none (scoped only by caller-supplied `pid`) | **Critical**: changes order payment status / cancels orders | remove "use server" |
| 44 | `getOrderScaleFullReport`<br>data/scales.ts:67 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/scales/results/[zid]/page.tsx` | read | none | **Critical**: order with assessment results | remove "use server" |
| 45 | `getOrderWithScaleByOid`<br>data/scales.ts:176 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/scales/orders/[zid]/page.tsx` | read | none (scoped only by caller-supplied `oid`) | **Critical**: order with assessment results | remove "use server" |
| 46 | `createUser`<br>data/user.ts:94 | 61 pages (see appendix)<br>public page: yes | — | `handlers/auth/register.ts` | mutation | none | **Critical**: §1 | remove "use server" |
| 47 | `getAllUsers`<br>data/user.ts:84 | 61 pages (see appendix)<br>public page: yes | — | — | read | none | **Critical**: §1 | remove "use server" |
| 48 | `getUserByEmail`<br>data/user.ts:71 | 61 pages (see appendix)<br>public page: yes | — | `handlers/auth/userInfo.ts` | read | none | **Critical**: §1 | remove "use server" |
| 49 | `getUserById`<br>data/user.ts:46 | 61 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/layout.tsx`<br>`app/(pages)/(consultants)/dashboard/profile/page.tsx`<br>+5 more | read | none (scoped only by caller-supplied `id`) | **Critical**: §1 | remove "use server" |
| 50 | `getUserByPhone`<br>data/user.ts:36 | 61 pages (see appendix)<br>public page: yes | — | `auth.config.ts`<br>`auth.ts`<br>+5 more | read | none | **Critical**: §1 | remove "use server" |
| 51 | `getUserLogin`<br>data/user.ts:9 | 61 pages (see appendix)<br>public page: yes | — | `handlers/auth/login.ts` | read | none | **Critical**: §1 | remove "use server" |
| 52 | `getUserOrders`<br>data/user.ts:117 | 61 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(user)/orders/page.tsx` | read | none (scoped only by caller-supplied `userId`) | **Critical**: §1 | remove "use server" |
| 53 | `getUsersByRole`<br>data/user.ts:59 | 61 pages (see appendix)<br>public page: yes | — | `data/preconsultation.ts` | read | none | **Critical**: §1 | remove "use server" |
| 54 | `removeUnverifiedUsers`<br>data/user.ts:152 | 61 pages (see appendix)<br>public page: yes | — | `app/api/cron/users/unverified/route.ts` | mutation | none | **Critical**: §1 | remove "use server" |
| 55 | `addWalletCredit`<br>data/wallet.ts:43 | 12 pages (see appendix)<br>public page: yes | — | `data/order/reserveation.ts` | mutation | none (scoped only by caller-supplied `author`) | **Critical**: wallet balance and transactions | remove "use server" |
| 56 | `adjustWalletCredit`<br>data/wallet.ts:290 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `userId`) | **Critical**: wallet balance and transactions | remove "use server" |
| 57 | `getWalletByAuthor`<br>data/wallet.ts:30 | 12 pages (see appendix)<br>public page: yes | — | `app/api/mobile/account/wallet/route.ts` | read | none (scoped only by caller-supplied `author`) | **Critical**: wallet balance and transactions | remove "use server" |
| 58 | `getWalletTransactions`<br>data/wallet.ts:342 | 12 pages (see appendix)<br>public page: yes | — | `app/api/mobile/account/wallet/transactions/route.ts` | read | none (scoped only by caller-supplied `userId`) | **Critical**: wallet balance and transactions | remove "use server" |
| 59 | `payAllByWallet`<br>data/wallet.ts:98 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `author`) | **Critical**: wallet balance and transactions | remove "use server" |
| 60 | `payPartiallyByWallet`<br>data/wallet.ts:220 | 12 pages (see appendix)<br>public page: yes | — | `data/order/reserveation.ts` | mutation | none (scoped only by caller-supplied `author`) | **Critical**: wallet balance and transactions | remove "use server" |
| 61 | `requestUsingWallet`<br>data/wallet.ts:193 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `oid`) | **Critical**: wallet balance and transactions | remove "use server" |
| 62 | `onPaymentHold`<br>handlers/admin/order/payment.ts:100 | 12 pages (see appendix)<br>public page: yes | — | `data/order/reserveation.ts` | mutation | none | **Critical**: runs post-payment / refund flow for any order | remove "use server" |
| 63 | `onPaymentRefund`<br>handlers/admin/order/payment.ts:83 | 12 pages (see appendix)<br>public page: yes | — | `data/order/reserveation.ts` | mutation | none | **Critical**: runs post-payment / refund flow for any order | remove "use server" |
| 64 | `onPaymentSuccess`<br>handlers/admin/order/payment.ts:52 | 12 pages (see appendix)<br>public page: yes | — | `data/order/reserveation.ts`<br>`data/wallet.ts` | mutation | none | **Critical**: runs post-payment / refund flow for any order | remove "use server" |
| 65 | `unauthorizedPhoneChangeByToken`<br>handlers/auth/userInfo.ts:21 | `/dashboard/profile`<br>public page: no | `components/legacy/layout/settings/index.tsx` | — | mutation | none (scoped only by caller-supplied `oldPhone`) | **Critical**: changes any account's password/phone/profile by caller-supplied id or phone | needs an action |
| 66 | `userInfoChange`<br>handlers/auth/userInfo.ts:91 | `/dashboard/profile`<br>public page: no | `components/legacy/layout/settings/index.tsx` | — | mutation | none (scoped only by caller-supplied `id`) | **Critical**: changes any account's password/phone/profile by caller-supplied id or phone | needs an action |
| 67 | `userPasswrodChange`<br>handlers/auth/userInfo.ts:151 | `/dashboard/profile`<br>public page: no | `components/legacy/layout/settings/index.tsx` | — | mutation | none (scoped only by caller-supplied `id`) | **Critical**: changes any account's password/phone/profile by caller-supplied id or phone | needs an action |
| 68 | `checkToken`<br>handlers/auth/verify.ts:22 | `/reset-password`<br>`/verify-otp`<br>public page: yes | — | `app/(pages)/(auth)/reset-password/page.tsx`<br>`app/(pages)/(auth)/verify-otp/page.tsx` | read | token lookup only: `if (!tokenExist)` (L27); **returns `otp: tokenExist.otp`** (L47) | **Critical**: returns the OTP for a verification token | remove "use server" |
| 69 | `createMoyasarCheckout`<br>lib/api/gatewaies/moyasar.ts:63 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation (external API) | none (scoped only by caller-supplied `oid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 70 | `moyasarInvoiceDetails`<br>lib/api/gatewaies/moyasar.ts:120 | 12 pages (see appendix)<br>public page: yes | — | `handlers/gatewaies/moyasar-webhook.ts` | read (external API) | none | **Critical**: payment gateway / payment records | remove "use server" |
| 71 | `moyasarPaymentDetails`<br>lib/api/gatewaies/moyasar.ts:105 | 12 pages (see appendix)<br>public page: yes | — | — | read (external API) | none (scoped only by caller-supplied `pid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 72 | `moyasarPaymentStatus`<br>lib/api/gatewaies/moyasar.ts:95 | 12 pages (see appendix)<br>public page: yes | — | `handlers/gatewaies/moyasar.ts` | read (external API) | none (scoped only by caller-supplied `pid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 73 | `moyasarSettlementDetails`<br>lib/api/gatewaies/moyasar.ts:153 | 12 pages (see appendix)<br>public page: yes | — | `handlers/gatewaies/moyasar-webhook.ts` | read (external API) | none (scoped only by caller-supplied `id`) | **Critical**: payment gateway / payment records | remove "use server" |
| 74 | `capturePayment`<br>lib/api/gatewaies/tabby.ts:154 | 12 pages (see appendix)<br>public page: yes | — | `handlers/gatewaies/tabby.ts` | mutation (external API) | none (scoped only by caller-supplied `pid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 75 | `createTabbyCheckout`<br>lib/api/gatewaies/tabby.ts:124 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation (external API) | none | **Critical**: payment gateway / payment records | remove "use server" |
| 76 | `tabbyBody`<br>lib/api/gatewaies/tabby.ts:57 | 12 pages (see appendix)<br>public page: yes | — | `app/api/mobile/reservations/[oid]/gatewaies/tabby-payload/route.ts` | read (external API) | none | **Critical**: payment gateway / payment records | remove "use server" |
| 77 | `tabbyPaymentDetails`<br>lib/api/gatewaies/tabby.ts:228 | 12 pages (see appendix)<br>public page: yes | — | `handlers/gatewaies/tabby.ts` | read (external API) | none (scoped only by caller-supplied `pid`) | **Critical**: payment gateway / payment records | remove "use server" |
| 78 | `tabbyPreScoring`<br>lib/api/gatewaies/tabby.ts:166 | 12 pages (see appendix)<br>public page: yes | — | — | mutation (external API) | none | **Critical**: payment gateway / payment records | remove "use server" |
| 79 | `sendWhatsappText`<br>lib/api/whatsapp/index.ts:177 | 22 pages (see appendix)<br>public page: yes | — | `lib/api/ai/bot/bot.ts`<br>`lib/api/ai/bot/index.ts`<br>+2 more | mutation (sends message) | none | **Critical**: arbitrary text from the official WhatsApp number to any phone | remove "use server" |
| 80 | `getCollaborator`<br>data/admin/collaboration.ts:24 | `/consultants/[cid]`<br>public page: yes | — | `components/shared/collaboration-badge.tsx` | read | none (scoped only by caller-supplied `id`) | **High**: collaboration records (fields unverified) | remove "use server" |
| 81 | `getCollaboratorById`<br>data/admin/collaboration.ts:6 | `/consultants/[cid]`<br>public page: yes | — | — | read | none (scoped only by caller-supplied `id`) | **High**: collaboration records (fields unverified) | remove "use server" |
| 82 | `getServiceTelegramIds`<br>data/admin/settings/employee.ts:50 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/telegram/telegram.ts` | read | none | **High**: staff telegram ids | remove "use server" |
| 83 | `getAllSettings`<br>data/admin/settings/settings.ts:34 | 22 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: reads site settings (contents unverified) | remove "use server" |
| 84 | `getExtractSettings`<br>data/admin/settings/settings.ts:110 | 22 pages (see appendix)<br>public page: yes | — | `data/admin/settings/finance.ts` | read | none | **High**: reads site settings (contents unverified) | remove "use server" |
| 85 | `getSetting`<br>data/admin/settings/settings.ts:45 | 22 pages (see appendix)<br>public page: yes | — | `data/admin/settings/employee.ts`<br>`data/discounts.ts` | read | none | **High**: reads site settings (contents unverified) | remove "use server" |
| 86 | `getSettingsByCategory`<br>data/admin/settings/settings.ts:79 | 22 pages (see appendix)<br>public page: yes | — | `data/admin/settings/finance.ts` | read | none | **High**: reads site settings (contents unverified) | remove "use server" |
| 87 | `getSettingsBySubKeysCategory`<br>data/admin/settings/settings.ts:94 | 22 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: reads site settings (contents unverified) | remove "use server" |
| 88 | `getSettingValues`<br>data/admin/settings/settings.ts:60 | 22 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: reads site settings (contents unverified) | remove "use server" |
| 89 | `confirmOathAcceptance`<br>data/admin/tools/oath.ts:28 | 18 pages (see appendix)<br>public page: no | `components/legacy/consultants/owner/oath/index.tsx` | — | mutation | none (scoped only by caller-supplied `userId`) | **High**: §1 | needs an action |
| 90 | `getAuthStateById`<br>data/admin/tools/oath.ts:6 | 18 pages (see appendix)<br>public page: no | — | `app/(pages)/(consultants)/dashboard/layout.tsx` | read | none (scoped only by caller-supplied `userId`) | **High**: §1 | remove "use server" |
| 91 | `addArticleComment`<br>data/article.ts:354 | `/articles`<br>`/articles/[aid]`<br>public page: yes | `components/clients/articles/add-comments.tsx` | — | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 92 | `toggleArticleLike`<br>data/article.ts:308 | `/articles`<br>`/articles/[aid]`<br>public page: yes | `components/clients/articles/article/like.tsx` | — | mutation | none (scoped only by caller-supplied `userId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 93 | `createMeetingMessage`<br>data/chats.ts:25 | `/dashboard/chats/[mid]`<br>`/chats/[mid]`<br>public page: yes | `components/clients/chats/chat.tsx`<br>`components/clients/chats/list/chat.tsx` | — | mutation | none | **High**: post or block in any meeting chat | needs an action |
| 94 | `toggleUserBlock`<br>data/chats.ts:244 | `/dashboard/chats/[mid]`<br>`/chats/[mid]`<br>public page: yes | `components/clients/chats/chat.tsx`<br>`components/clients/chats/list/chat.tsx` | — | mutation | none (scoped only by caller-supplied `mid`) | **High**: post or block in any meeting chat | needs an action |
| 95 | `getAllOwnersConsultants`<br>data/consultant.ts:621 | 32 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: raw consultant records (include `phone`, `commission`; unverified per function) | remove "use server" |
| 96 | `getOwnerbyAuthor`<br>data/consultant.ts:725 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/freesession/page.tsx`<br>`app/(pages)/(consultants)/dashboard/instant/page.tsx`<br>+8 more | read | none (scoped only by caller-supplied `userId`) | **High**: raw consultant records (include `phone`, `commission`; unverified per function) | remove "use server" |
| 97 | `getOwnerByCid`<br>data/consultant.ts:677 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(features)/reschedule/[mid]/page.tsx`<br>`app/(pages)/(site)/(features)/sessions/[id]/page.tsx` | read | none (scoped only by caller-supplied `cid`) | **High**: raw consultant records (include `phone`, `commission`; unverified per function) | remove "use server" |
| 98 | `getOwnerByCids`<br>data/consultant.ts:696 | 32 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: raw consultant records (include `phone`, `commission`; unverified per function) | remove "use server" |
| 99 | `getOwnerCidByAuthor`<br>data/consultant.ts:770 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/coupons/page.tsx`<br>`app/(pages)/(consultants)/dashboard/discounts/[did]/page.tsx` | read | none (scoped only by caller-supplied `userId`) | **High**: raw consultant records (include `phone`, `commission`; unverified per function) | remove "use server" |
| 100 | `ownerExistbyAuthor`<br>data/consultant.ts:712 | 32 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `userId`) | **High**: raw consultant records (include `phone`, `commission`; unverified per function) | remove "use server" |
| 101 | `createConsultantsCoupon`<br>data/coupon.ts:177 | 14 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/coupons/index.tsx` | — | mutation | none (scoped only by caller-supplied `consultantId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 102 | `deleteConsultantsCoupon`<br>data/coupon.ts:162 | 14 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/coupons/table.tsx` | — | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 103 | `saveACoupon`<br>data/coupon.ts:98 | 14 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation | none (scoped only by caller-supplied `user`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 104 | `toggleDiscountState`<br>data/discounts.ts:53 | 3 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/discount/index.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 105 | `getFavorite`<br>data/favorites.ts:31 | `/favorite`<br>`/consultants/[cid]`<br>public page: yes | — | `components/clients/consultants/consultant/consultant.tsx` | read | none (scoped only by caller-supplied `id`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 106 | `getFavoriteConsultants`<br>data/favorites.ts:72 | `/favorite`<br>`/consultants/[cid]`<br>public page: yes | — | `app/api/mobile/consultants/favorites/route.tsx` | read | none (scoped only by caller-supplied `userId`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 107 | `getFavorites`<br>data/favorites.ts:7 | `/favorite`<br>`/consultants/[cid]`<br>public page: yes | — | `app/(pages)/(site)/(user)/favorite/page.tsx` | read | none (scoped only by caller-supplied `userId`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 108 | `toggleFavorite`<br>data/favorites.ts:51 | `/favorite`<br>`/consultants/[cid]`<br>public page: yes | `components/shared/favorite-btn.tsx` | `app/api/mobile/consultants/favorites/[cid]/route.ts` | mutation | none (scoped only by caller-supplied `userId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 109 | `freeSessionAttendance`<br>data/freesession.ts:177 | 3 pages (see appendix)<br>public page: yes | — | — | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 110 | `freeSessionMeetingUrl`<br>data/freesession.ts:216 | 3 pages (see appendix)<br>public page: yes | — | `handlers/admin/freesession.ts` | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 111 | `getFreeSessionByFid`<br>data/freesession.ts:79 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/freesessions/(layout)/[zid]/page.tsx` | read | none | **High**: another user's records by caller-supplied id | remove "use server" |
| 112 | `getOwnerFreeSessions`<br>data/freesession.ts:64 | 3 pages (see appendix)<br>public page: yes | — | `components/legacy/consultants/owner/freeSession/sessions/index.tsx` | read | none (scoped only by caller-supplied `cid`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 113 | `getOwnerFreeTimings`<br>data/freesession.ts:49 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/freesession/page.tsx` | read | none (scoped only by caller-supplied `cid`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 114 | `reserveFreeSession`<br>data/freesession.ts:99 | 3 pages (see appendix)<br>public page: yes | — | `handlers/admin/freesession.ts` | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 115 | `toggleFreesessionState`<br>data/freesession.ts:246 | 3 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/freeSession/toggle/index.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 116 | `getMeeting`<br>data/meetings.ts:118 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | `app/(pages)/(site)/(features)/meetings/[mid]/page.tsx`<br>`app/(pages)/(site)/(features)/reschedule/[mid]/page.tsx` | read | none (scoped only by caller-supplied `mid`) | **High**: private session data / meeting links | remove "use server" |
| 117 | `getMeetings`<br>data/meetings.ts:271 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | `app/api/mobile/account/sessions/route.ts` | read | none (scoped only by caller-supplied `userId`) | **High**: private session data / meeting links | remove "use server" |
| 118 | `getMeetingsByCidAndRange`<br>data/meetings.ts:78 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **High**: private session data / meeting links | remove "use server" |
| 119 | `getMeetingUrl`<br>data/meetings.ts:144 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | `lib/api/whatsapp/logic.ts` | read | none (scoped only by caller-supplied `mid`) | **High**: private session data / meeting links | remove "use server" |
| 120 | `isMeetingNeedsReschedule`<br>data/meetings.ts:176 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | `lib/api/whatsapp/logic.ts` | read | none (scoped only by caller-supplied `mid`) | **High**: private session data / meeting links | remove "use server" |
| 121 | `orderMeetingUrl`<br>data/meetings.ts:48 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `oid`) | **High**: private session data / meeting links | remove "use server" |
| 122 | `participantAttendance`<br>data/meetings.ts:18 | `/meetings/[mid]`<br>`/reschedule/[mid]`<br>public page: yes | — | `components/clients/meetings/index.tsx` | mutation | none | **High**: private session data / meeting links | remove "use server" |
| 123 | `handlePresenceWebhook`<br>data/online.ts:107 | 12 pages (see appendix)<br>public page: yes | — | `app/api/pusher/webhook/route.ts` | mutation | none (scoped only by caller-supplied `userId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 124 | `setConsultantOffline`<br>data/online.ts:348 | 12 pages (see appendix)<br>public page: yes | — | `app/api/internal/presence/route.ts`<br>`app/api/mobile/consultants/consultant/presence/route.ts` | mutation | none (scoped only by caller-supplied `userId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 125 | `setConsultantOnline`<br>data/online.ts:339 | 12 pages (see appendix)<br>public page: yes | — | `app/api/internal/presence/route.ts`<br>`app/api/mobile/consultants/consultant/presence/route.ts` | mutation | none (scoped only by caller-supplied `userId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 126 | `updateConsultantBaseCosts`<br>data/packages.ts:18 | `/dashboard/packages`<br>`/consultants/[cid]`<br>public page: yes | `components/consultant/packages/packages.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 127 | `upsertConsultantPackage`<br>data/packages.ts:43 | `/dashboard/packages`<br>`/consultants/[cid]`<br>public page: yes | `components/consultant/packages/packages.tsx` | — | mutation | none (scoped only by caller-supplied `consultantId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 128 | `checkProgramNextSession`<br>data/programs.ts:307 | 6 pages (see appendix)<br>public page: yes | — | `data/reschedule.ts` | mutation | none (scoped only by caller-supplied `oid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 129 | `createNewProgram`<br>data/programs.ts:410 | 7 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/programs/new/index.tsx` | — | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 130 | `EnrollOnProgram`<br>data/programs.ts:360 | 6 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/programs/enroll/index.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 131 | `toggleProgramState`<br>data/programs.ts:375 | 6 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/programs/enroll/index.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 132 | `getReconciliation`<br>data/reconciliation.ts:14 | `/reschedule/[mid]`<br>`/reconciliation/[id]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/reconciliation/[id]/page.tsx` | read | none (scoped only by caller-supplied `oid`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 133 | `reserveReconciliation`<br>data/reconciliation.ts:26 | `/reschedule/[mid]`<br>`/reconciliation/[id]`<br>public page: yes | — | `handlers/clients/order.ts` | mutation | none (scoped only by caller-supplied `author`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 134 | `checkReschedule`<br>data/reschedule.ts:108 | `/reschedule/[mid]`<br>public page: yes | — | `app/api/cron/reschedule/route.ts` | mutation | none (scoped only by caller-supplied `mid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 135 | `meetingDone`<br>data/reschedule.ts:29 | `/reschedule/[mid]`<br>public page: yes | `components/clients/sub-pages/reschedule/reschedule.tsx` | `lib/api/whatsapp/logic.ts` | mutation | none (scoped only by caller-supplied `mid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 136 | `rescheduleMeeting`<br>data/reschedule.ts:57 | `/reschedule/[mid]`<br>public page: yes | `components/clients/sub-pages/reschedule/reschedule.tsx` | — | mutation | none (scoped only by caller-supplied `mid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 137 | `acceptNewreview`<br>data/review.ts:114 | `/`<br>`/consultants/[cid]`<br>public page: yes | `components/clients/consultants/consultant/post-review.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 138 | `acceptWhatsappReview`<br>data/review.ts:235 | `/`<br>public page: yes | — | `lib/api/whatsapp/logic.ts` | mutation | none (scoped only by caller-supplied `oid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 139 | `getreviewsByAuthor`<br>data/review.ts:50 | `/`<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **High**: another user's records by caller-supplied id | remove "use server" |
| 140 | `getReviewsForConsultant`<br>data/review.ts:211 | `/dashboard/reviews`<br>`/`<br>public page: yes | `app/(pages)/(consultants)/dashboard/reviews/page.tsx` | — | read | none | **High**: all consultants' reviews, raw, unpaginated by owner | move the read to a Server Component |
| 141 | `postreview`<br>data/review.ts:86 | `/`<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | remove "use server" |
| 142 | `createNewMeeting`<br>data/rooms.ts:109 | 12 pages (see appendix)<br>public page: yes | — | `data/sessions.ts`<br>`handlers/admin/order/payment.ts` | mutation | none | **High**: private session data / meeting links | remove "use server" |
| 143 | `createParticipants`<br>data/rooms.ts:56 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none (scoped only by caller-supplied `mid`) | **High**: private session data / meeting links | remove "use server" |
| 144 | `createRoom`<br>data/rooms.ts:27 | 12 pages (see appendix)<br>public page: yes | — | — | mutation | none | **High**: private session data / meeting links | remove "use server" |
| 145 | `getParticipants`<br>data/rooms.ts:90 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: private session data / meeting links | remove "use server" |
| 146 | `getRoom`<br>data/rooms.ts:14 | 12 pages (see appendix)<br>public page: yes | — | — | read | none | **High**: private session data / meeting links | remove "use server" |
| 147 | `submitScaleResult`<br>data/scales.ts:242 | 4 pages (see appendix)<br>public page: yes | `components/clients/sub-pages/scales/order.tsx` | — | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 148 | `selectSession`<br>data/sessions.ts:15 | `/sessions/[id]`<br>public page: yes | `components/clients/sub-pages/sessions/sessions.tsx` | — | mutation | none (scoped only by caller-supplied `oid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 149 | `updateConsultantSpecialties`<br>data/specialties.ts:40 | 4 pages (see appendix)<br>public page: yes | `components/legacy/consultants/owner/specialty/index.tsx` | — | mutation | none (scoped only by caller-supplied `cid`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 150 | `updateTimings`<br>data/timings.ts:9 | `/dashboard/timings`<br>public page: no | `handlers/conusltant/owner/timings.ts` | — | mutation | none (scoped only by caller-supplied `userId`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 151 | `saveUploadedFile`<br>data/uploads.ts:49 | `/dashboard`<br>public page: no | `components/legacy/consultants/owner/profile/file-upload.tsx` | — | mutation | none | **High**: §1 | needs an action |
| 152 | `saveUploadedImage`<br>data/uploads.ts:6 | `/dashboard`<br>public page: no | `components/legacy/consultants/owner/profile/file-upload.tsx` | — | mutation | none | **High**: §1 | needs an action |
| 153 | `confirmFreeSession`<br>handlers/admin/freesession.ts:16 | `/freesessions/consultants/[cid]`<br>public page: yes | `components/clients/freesessions/reservation/form.tsx` | — | mutation | none | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 154 | `Pay`<br>handlers/admin/order/payment.ts:107 | 16 pages (see appendix)<br>public page: yes | `components/clients/consultants/reservation/form.tsx`<br>`components/clients/discover/discover.tsx`<br>`components/clients/instant/reservation/form.tsx`<br>+2 more | — | mutation | none (block list only: `const isBlocked = await CheckIsBlocked(data.phone);`) | **High**: public booking flow; spam and slot blocking | needs an action |
| 155 | `login`<br>handlers/auth/login.ts:20 | `/login`<br>public page: yes | `components/auth/login-form.tsx` | — | mutation | credentials only, no session: `await signIn("credentials", {` (L61; bcrypt compare happens in auth.config.ts `authorize`) | **High**: public auth flow: OTP/SMS cost, brute force (like `phoneToken`) | needs an action |
| 156 | `register`<br>handlers/auth/register.ts:16 | `/register`<br>public page: yes | `components/auth/resgister-form.tsx` | — | mutation | none (`if (phoneExist)` / `CheckIsBlocked` only) | **High**: public auth flow: OTP/SMS cost, brute force (like `phoneToken`) | needs an action |
| 157 | `forgetpassowrd`<br>handlers/auth/reset.ts:26 | `/forget-password`<br>public page: yes | `components/auth/forget-password-form.tsx` | — | mutation | none (zod + `CheckIsBlocked` only) | **High**: public auth flow: OTP/SMS cost, brute force (like `phoneToken`) | needs an action |
| 158 | `verifyReset`<br>handlers/auth/reset.ts:68 | `/reset-password`<br>public page: yes | `components/auth/reset-password-form.tsx` | — | mutation | OTP compare, no session: `if (tokenExist?.otp !== otp)` (L97) | **High**: public auth flow: OTP/SMS cost, brute force (like `phoneToken`) | needs an action |
| 159 | `phoneToken`<br>handlers/auth/verify.ts:101 | 23 pages (see appendix)<br>public page: yes | `components/legacy/layout/zErrors/auth/verify.tsx`<br>`components/shared/error-verify.tsx` | — | mutation | none | **High**: §1 | needs an action |
| 160 | `verifyToken`<br>handlers/auth/verify.ts:51 | `/reset-password`<br>`/verify-otp`<br>public page: yes | `components/auth/verify-otp.tsx` | — | mutation | OTP compare, no session: `if (tokenExist?.otp !== otp)` (L64) | **High**: public auth flow: OTP/SMS cost, brute force (like `phoneToken`) | needs an action |
| 161 | `confirmReconciliation`<br>handlers/clients/order.ts:39 | `/reschedule/[mid]`<br>`/reconciliation`<br>public page: yes | `app/(pages)/(site)/(sub-pages)/reconciliation/page.tsx` | — | mutation | none (scoped only by caller-supplied `author`) | **High**: mutation without auth or ownership (like `saveConsultant`) | needs an action |
| 162 | `reviewReminder`<br>handlers/clients/order.ts:13 | `/reschedule/[mid]`<br>public page: yes | — | `data/reschedule.ts` | mutation | none (scoped only by caller-supplied `oid`) | **High**: sends a WhatsApp reminder | remove "use server" |
| 163 | `ownerVisibility`<br>handlers/conusltant/owner/profile.ts:193 | `/dashboard`<br>public page: no | `components/legacy/consultants/owner/profile/toggle-visibility.tsx` | — | mutation | none (scoped only by caller-supplied `author`) | **High**: §1 | needs an action |
| 164 | `saveConsultant`<br>handlers/conusltant/owner/profile.ts:30 | `/dashboard`<br>public page: no | `components/legacy/consultants/owner/profile/form.tsx` | — | mutation | none (scoped only by caller-supplied `author`) | **High**: §1 | needs an action |
| 165 | `Ai`<br>lib/api/ai/ai.ts:12 | `/`<br>public page: yes | — | `lib/api/ai/bot/bot.ts` | mutation (external API) | none | **High**: AI API cost (like `aiConsultantSummary`) | remove "use server" |
| 166 | `aiAcceptOwners`<br>lib/api/ai/ai.ts:120 | `/`<br>public page: yes | — | `handlers/conusltant/owner/profile.ts` | mutation (external API) | none | **High**: AI API cost (like `aiConsultantSummary`) | remove "use server" |
| 167 | `aiAcceptReview`<br>lib/api/ai/ai.ts:56 | `/`<br>public page: yes | — | `data/review.ts` | mutation (external API) | none | **High**: AI API cost (like `aiConsultantSummary`) | remove "use server" |
| 168 | `aiConsultantSummary`<br>lib/api/ai/ai.ts:178 | `/dashboard`<br>`/`<br>public page: yes | `components/legacy/consultants/owner/marketingCard/index.tsx` | — | mutation (external API) | none | **High**: §1 | needs an action |
| 169 | `SendChatBot`<br>lib/api/ai/chat-bot.ts:8 | 39 pages (see appendix)<br>public page: yes | `components/clients/bot/index.tsx` | — | mutation (external API) | none (per-phone bot limit: `const allowed = await checkBotLimit(from);`) | **High**: AI API cost (like `aiConsultantSummary`) | needs an action |
| 170 | `checkMessageWithAI`<br>lib/api/ai/chat-guard.ts:9 | `/chats/[mid]`<br>public page: yes | — | `data/chats.ts` | mutation (external API) | none | **High**: AI API cost (like `aiConsultantSummary`) | remove "use server" |
| 171 | `adminCreateMeeting`<br>lib/api/google.ts:50 | 14 pages (see appendix)<br>public page: yes | — | — | mutation (external API) | none | **High**: Google Meet API | remove "use server" |
| 172 | `createGoogleMeeting`<br>lib/api/google.ts:25 | 14 pages (see appendix)<br>public page: yes | — | `data/freesession.ts`<br>`data/meetings.ts`<br>+2 more | mutation (external API) | none | **High**: Google Meet API | remove "use server" |
| 173 | `endMeeting`<br>lib/api/google.ts:39 | 14 pages (see appendix)<br>public page: yes | — | — | mutation (external API) | none | **High**: Google Meet API | remove "use server" |
| 174 | `newOrdertelegram`<br>lib/api/telegram/telegram.ts:45 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 175 | `telegram`<br>lib/api/telegram/telegram.ts:101 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 176 | `telegramAdmin`<br>lib/api/telegram/telegram.ts:127 | 12 pages (see appendix)<br>public page: yes | — | `app/api/cron/whatsapp-campaigns/route.ts`<br>`handlers/admin/order/payment.ts`<br>+4 more | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 177 | `telegramCService`<br>lib/api/telegram/telegram.ts:114 | 12 pages (see appendix)<br>public page: yes | — | — | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 178 | `telegramDocuments`<br>lib/api/telegram/telegram.ts:153 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/telegram/templates/owner.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 179 | `telegramEmployees`<br>lib/api/telegram/telegram.ts:140 | 12 pages (see appendix)<br>public page: yes | — | `lib/api/telegram/templates/owner.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 180 | `telegramRefund`<br>lib/api/telegram/telegram.ts:86 | 12 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 181 | `sendWhatsappTemplate`<br>lib/api/whatsapp/index.ts:61 | 22 pages (see appendix)<br>public page: yes | — | `app/api/cron/whatsapp-campaigns/route.ts`<br>`lib/notifications/site.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 182 | `notificationCheckRescheduling`<br>lib/notifications/site.ts:382 | 22 pages (see appendix)<br>public page: yes | — | `data/reschedule.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 183 | `notificationConfirmRescheduling`<br>lib/notifications/site.ts:400 | 22 pages (see appendix)<br>public page: yes | — | `data/reschedule.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 184 | `notificationNewChatMessage`<br>lib/notifications/site.ts:418 | 22 pages (see appendix)<br>public page: yes | — | `data/chats.ts` | mutation (sends message) | none (scoped only by caller-supplied `oid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 185 | `notificationNewFreeSession`<br>lib/notifications/site.ts:233 | 22 pages (see appendix)<br>public page: yes | — | `data/freesession.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 186 | `notificationNewOrder`<br>lib/notifications/site.ts:50 | 22 pages (see appendix)<br>public page: yes | — | `handlers/admin/order/payment.ts` | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 187 | `notificationNewOwner`<br>lib/notifications/site.ts:207 | 22 pages (see appendix)<br>public page: yes | — | — | mutation (sends message) | none (scoped only by caller-supplied `cid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 188 | `notificationNewPreConsultation`<br>lib/notifications/site.ts:220 | 22 pages (see appendix)<br>public page: yes | — | `data/preconsultation.ts` | mutation (sends message) | none (scoped only by caller-supplied `pid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 189 | `notificationPickNewSession`<br>lib/notifications/site.ts:267 | 22 pages (see appendix)<br>public page: yes | — | `data/programs.ts` | mutation (sends message) | none (scoped only by caller-supplied `oid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 190 | `notificationReviewReminder`<br>lib/notifications/site.ts:347 | 22 pages (see appendix)<br>public page: yes | — | `handlers/clients/order.ts` | mutation (sends message) | none (scoped only by caller-supplied `oid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 191 | `notificationScaleReminder`<br>lib/notifications/site.ts:365 | 22 pages (see appendix)<br>public page: yes | — | `data/scales.ts` | mutation (sends message) | none (scoped only by caller-supplied `oid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 192 | `notificationSecurityOtp`<br>lib/notifications/site.ts:34 | 22 pages (see appendix)<br>public page: yes | — | `data/verificationTokens.ts`<br>`handlers/auth/reset.ts`<br>+1 more | mutation (sends message) | none | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 193 | `notificationSessionConfirm`<br>lib/notifications/site.ts:289 | 22 pages (see appendix)<br>public page: yes | — | `data/sessions.ts` | mutation (sends message) | none (scoped only by caller-supplied `oid`) | **High**: sends messages (spam, cost; like `phoneToken`) | remove "use server" |
| 194 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(consultants)/dashboard/discounts/page.tsx | `/dashboard/discounts`<br>public page: no | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 195 | `default`<br>app/(pages)/(consultants)/dashboard/freesession/page.tsx | `/dashboard/freesession`<br>public page: no | — | — | read (page render) | page reads the session itself: `const user = await userServer();` | **Lower**: page / cached public read | remove "use server" from the page file |
| 196 | `default`<br>app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx | `/dashboard/programs/[prid]`<br>public page: no | — | — | read (page render) | page reads the session itself: `const user = await userServer();` (L45) | **Lower**: page / cached public read | remove "use server" from the page file |
| 197 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(consultants)/dashboard/programs/page.tsx | `/dashboard/programs`<br>public page: no | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 198 | `default`<br>app/(pages)/(consultants)/dashboard/timings/page.tsx | `/dashboard/timings`<br>public page: no | — | — | read (page render) | page reads the session itself: `const user = await userServer();` | **Lower**: page / cached public read | remove "use server" from the page file |
| 199 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/(sub-pages)/articles/[aid]/page.tsx | `/articles/[aid]`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 200 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/(sub-pages)/articles/page.tsx | `/articles`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 201 | `getAvailableTimesForDate`<br>app/(pages)/(site)/(sub-pages)/reels/actions.ts:46 | `/reels`<br>public page: yes | `app/(pages)/(site)/(sub-pages)/reels/page.tsx` | — | read | none | **Lower**: page / cached public read | needs an action (read, rate limited) |
| 202 | `getConsultantsAvailableAt`<br>app/(pages)/(site)/(sub-pages)/reels/actions.ts:83 | `/reels`<br>public page: yes | `app/(pages)/(site)/(sub-pages)/reels/page.tsx` | — | read | none (scoped only by caller-supplied `consultantId`) | **Lower**: page / cached public read | needs an action (read, rate limited) |
| 203 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/consultants/[cid]/page.tsx | `/consultants/[cid]`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 204 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/consultants/page.tsx | `/consultants`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 205 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/programs/[prid]/page.tsx | `/programs/[prid]`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 206 | `default`<br>app/(pages)/(site)/programs/[prid]/page.tsx | `/programs/[prid]`<br>public page: yes | — | — | read (page render) | none (public page) | **Lower**: page / cached public read | remove "use server" from the page file |
| 207 | `generateMetadata`<br>app/(pages)/(site)/programs/[prid]/page.tsx:29 | `/programs/[prid]`<br>public page: yes | — | — | read (page render) | none (public page) | **Lower**: page / cached public read | remove "use server" from the page file |
| 208 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/programs/page.tsx | `/programs`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 209 | `$$RSC_SERVER_CACHE_0`<br>app/(pages)/(site)/programs/reserve/[prid]/page.tsx | `/programs/reserve/[prid]`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 210 | `default`<br>app/(pages)/(site)/programs/reserve/[prid]/page.tsx | `/programs/reserve/[prid]`<br>public page: yes | — | — | read (page render) | none (public page) | **Lower**: page / cached public read | remove "use server" from the page file |
| 211 | `generateMetadata`<br>app/(pages)/(site)/programs/reserve/[prid]/page.tsx:29 | `/programs/reserve/[prid]`<br>public page: yes | — | — | read (page render) | none (public page) | **Lower**: page / cached public read | remove "use server" from the page file |
| 212 | `$$RSC_SERVER_CACHE_0`<br>components/clients/consultants/consultant/coupons/coupons.tsx | `/consultants/[cid]`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 213 | `$$RSC_SERVER_CACHE_0`<br>components/clients/consultants/consultant/reviews.tsx | `/consultants/[cid]`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 214 | `$$RSC_SERVER_CACHE_0`<br>components/clients/home/consultant/consultants.tsx | `/`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 215 | `$$RSC_SERVER_CACHE_0`<br>components/clients/home/reviews/reviews.tsx | `/`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 216 | `$$RSC_SERVER_CACHE_0`<br>components/clients/home/statistics/statistics.tsx | `/`<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 217 | `getAllPublishedArticles`<br>data/article.ts:195 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 218 | `getAllPublishedArticlesIds`<br>data/article.ts:207 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 219 | `getArticleByAid`<br>data/article.ts:233 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/articles/[aid]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 220 | `getArticleComments`<br>data/article.ts:386 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `components/clients/articles/comments.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 221 | `getArticleLikes`<br>data/article.ts:251 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/articles/[aid]/page.tsx` | read | none (scoped only by caller-supplied `userId`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 222 | `getArticleMetaData`<br>data/article.ts:292 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 223 | `getArticles`<br>data/article.ts:73 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/articles/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 224 | `getArticleTitleByBid`<br>data/article.ts:220 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 225 | `getRecommendedConsultants`<br>data/article.ts:162 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `components/clients/articles/article/recommendation.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 226 | `getSimilarArticles`<br>data/article.ts:133 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `components/clients/articles/article/recommendation.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 227 | `incrementArticleRead`<br>data/article.ts:282 | `/articles`<br>`/articles/[aid]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/articles/[aid]/page.tsx` | mutation | none | **Lower**: view counter | remove "use server" |
| 228 | `CheckIsBlocked`<br>data/blocked.ts:4 | 14 pages (see appendix)<br>public page: yes | — | `app/api/mobile/reservations/instant/route.ts`<br>`handlers/admin/order/payment.ts`<br>+5 more | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 229 | `getAllOwnersPuslished`<br>data/consultant.ts:633 | 32 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 230 | `getAllOwnersPuslishedPreview`<br>data/consultant.ts:650 | 32 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 231 | `getAvailableOwnersByTime`<br>data/consultant.ts:892 | 32 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 232 | `getAvailableOwnersGrouped`<br>data/consultant.ts:818 | 32 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 233 | `getConsultant`<br>data/consultant.ts:239 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/questions/[qid]/page.tsx`<br>`app/api/mobile/consultants/consultant/route.ts`<br>+3 more | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 234 | `getConsultantAvailableTimes`<br>data/consultant.ts:431 | 33 pages (see appendix)<br>public page: yes | `components/clients/consultants/reservation/steps/date-time.tsx`<br>`components/clients/freesessions/reservation/steps/date-time.tsx`<br>`components/clients/programs/reservation/steps/date-time.tsx`<br>+2 more | `app/api/mobile/consultants/[cid]/times/route.ts` | read | none (scoped only by caller-supplied `cid`) | **Lower**: §1 | needs an action (read, rate limited) |
| 235 | `getConsultantCost`<br>data/consultant.ts:523 | 32 pages (see appendix)<br>public page: yes | — | `app/api/mobile/consultants/[cid]/reservation-info/route.ts`<br>`data/event.ts` | read | none (scoped only by caller-supplied `cid`) | **Lower**: §1 | remove "use server" |
| 236 | `getConsultantCoupons`<br>data/consultant.ts:335 | 32 pages (see appendix)<br>public page: yes | — | `components/clients/consultants/consultant/coupons/coupons.tsx` | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 237 | `getConsultantInfo`<br>data/consultant.ts:289 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/consultants/[cid]/page.tsx`<br>`app/api/mobile/consultants/[cid]/reservation-info/route.ts`<br>+2 more | read | none (scoped only by caller-supplied `cid`) | **Lower**: §1 | remove "use server" |
| 238 | `getConsultantReserved`<br>data/consultant.ts:546 | 32 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 239 | `getConsultantReviews`<br>data/consultant.ts:361 | 32 pages (see appendix)<br>public page: yes | — | `components/clients/consultants/consultant/reviews.tsx` | read | none (scoped only by caller-supplied `cid`) | **Lower**: §1 | remove "use server" |
| 240 | `getConsultants`<br>data/consultant.ts:44 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/consultants/page.tsx`<br>`app/api/mobile/consultants/list/route.ts` | read | none | **Lower**: §1 | remove "use server" |
| 241 | `getConsultantStates`<br>data/consultant.ts:319 | 32 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/freesessions/(layout)/consultants/[cid]/page.tsx` | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 242 | `getDiscountedConsultants`<br>data/consultant.ts:943 | 32 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **Lower**: §1 | remove "use server" |
| 243 | `getOwnerCidNameByAuthor`<br>data/consultant.ts:786 | 32 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `userId`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 244 | `getOwnersInfoByAuthor`<br>data/consultant.ts:754 | 32 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `userId`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 245 | `getOwnersInfoCid`<br>data/consultant.ts:738 | 32 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 246 | `getPuslishedConsultantsForHome`<br>data/consultant.ts:570 | 32 pages (see appendix)<br>public page: yes | — | `app/api/mobile/consultants/route.ts`<br>`components/clients/home/consultant/consultants.tsx` | read | none | **Lower**: §1 | remove "use server" |
| 247 | `getUnavailableWeekdays`<br>data/consultant.ts:501 | 32 pages (see appendix)<br>public page: yes | — | `app/api/mobile/consultants/[cid]/reservation-info/route.ts`<br>`components/clients/consultants/reservation/reserve.tsx` | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 248 | `applyCoupon`<br>data/coupon.ts:35 | 18 pages (see appendix)<br>public page: yes | `components/clients/consultants/reservation/forms/coupons.tsx`<br>`components/clients/instant/reservation/forms/coupons.tsx`<br>`components/clients/programs/reservation/forms/coupons.tsx` | `components/clients/forms/coupons.tsx`<br>`handlers/admin/order/payment.ts` | read | none (business rules only, e.g. `if (coupon.consultantId !== cid && coupon.type === CouponType.CONSULTANT)`) | **Lower**: public data (like `getConsultants`) | needs an action (read, rate limited) |
| 249 | `getAvailableCoupons`<br>data/coupon.ts:255 | 14 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 250 | `getConsultantsCoupons`<br>data/coupon.ts:146 | 14 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/coupons/page.tsx` | read | none (scoped only by caller-supplied `consultantId`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 251 | `getCouponByCode`<br>data/coupon.ts:131 | 14 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 252 | `getCoupons`<br>data/coupon.ts:292 | 14 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/coupons/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 253 | `getCouponsForHome`<br>data/coupon.ts:218 | 14 pages (see appendix)<br>public page: yes | — | `components/clients/home/coupons/coupons.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 254 | `getPublishedCoupons`<br>data/coupon.ts:22 | 14 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 255 | `applyDiscount`<br>data/discounts.ts:98 | 3 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `user`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 256 | `getActiveDiscount`<br>data/discounts.ts:21 | 3 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 257 | `getActiveDiscounts`<br>data/discounts.ts:9 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/discounts/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 258 | `getDiscountByDid`<br>data/discounts.ts:42 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/discounts/[did]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 259 | `getDiscountConsultant`<br>data/discounts.ts:81 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/discounts/[did]/page.tsx` | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 260 | `getDiscountConsultants`<br>data/discounts.ts:182 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/event/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 261 | `$$RSC_SERVER_CACHE_0`<br>data/event.ts | 14 pages (see appendix)<br>public page: yes | — | — | read (page render) | n/a (`"use cache"` function) | **Lower**: page / cached public read | none needed (`"use cache"` registration; unverified whether callable) |
| 262 | `getAllFreeSessions`<br>data/freesession.ts:25 | 3 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 263 | `getFreeSessionConsultants`<br>data/freesession.ts:291 | 3 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/freesessions/(layout)/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 264 | `broadcastConsultantBusy`<br>data/online.ts:156 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `userId`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 265 | `checkIsAnyConsultantOnline`<br>data/online.ts:51 | 12 pages (see appendix)<br>public page: yes | `hooks/usIsOnline.ts` | — | read | none | **Lower**: public data (like `getConsultants`) | needs an action (read, rate limited) |
| 266 | `getConsultantsOnline`<br>data/online.ts:357 | 12 pages (see appendix)<br>public page: yes | — | `app/api/mobile/online/route.ts`<br>`app/api/online/route.ts` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 267 | `getOnlineConsultantsList`<br>data/online.ts:64 | 14 pages (see appendix)<br>public page: yes | `hooks/useOnlineConsultants.ts` | — | read | none | **Lower**: public data (like `getConsultants`) | needs an action (read, rate limited) |
| 268 | `alreadyReservedTimes`<br>data/order/reserveation.ts:1026 | 12 pages (see appendix)<br>public page: yes | — | — | read | none (scoped only by caller-supplied `cid`) | **Lower**: slot availability | remove "use server" |
| 269 | `checkMeetingTimeConflict`<br>data/order/reserveation.ts:200 | 12 pages (see appendix)<br>public page: yes | — | `data/freesession.ts`<br>`data/online.ts` | read | none (scoped only by caller-supplied `cid`) | **Lower**: slot availability | remove "use server" |
| 270 | `checkUpcomingPaidSession`<br>data/order/reserveation.ts:243 | 12 pages (see appendix)<br>public page: yes | — | `app/api/mobile/consultants/consultant/instant-guard/route.ts` | read | none (scoped only by caller-supplied `cid`) | **Lower**: slot availability | remove "use server" |
| 271 | `getPaidPast3Days`<br>data/order/reserveation.ts:1157 | 13 pages (see appendix)<br>public page: yes | `components/clients/home/notification/notification.tsx` | — | read | none | **Lower**: recent paid orders' first names, already shown on the home page | move the read to a Server Component |
| 272 | `getConsultantsPackages`<br>data/packages.ts:9 | `/dashboard/packages`<br>`/consultants/[cid]`<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/packages/page.tsx`<br>`app/api/mobile/consultants/consultant/packages/route.ts`<br>+1 more | read | none (scoped only by caller-supplied `consultantId`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 273 | `getAllPrograms`<br>data/programs.ts:133 | 6 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 274 | `getAllPublishedPrograms`<br>data/programs.ts:163 | 6 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/programs/page.tsx`<br>`components/clients/home/programs/programs.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 275 | `getConsultantProgramByCid`<br>data/programs.ts:396 | 6 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx` | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 276 | `getProgram`<br>data/programs.ts:179 | 6 pages (see appendix)<br>public page: yes | — | `components/clients/programs/program/program.tsx`<br>`components/clients/programs/reservation/reserve.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 277 | `getProgramAvailableConsultants`<br>data/programs.ts:253 | 6 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 278 | `getProgramByPrid`<br>data/programs.ts:215 | 6 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 279 | `getProgramConsultantsByPrid`<br>data/programs.ts:288 | 6 pages (see appendix)<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 280 | `getProgramInfo`<br>data/programs.ts:231 | 6 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/programs/reserve/[prid]/page.tsx`<br>`app/(pages)/(site)/programs/[prid]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 281 | `getPrograms`<br>data/programs.ts:32 | 6 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/programs/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 282 | `getProgramsForHome`<br>data/programs.ts:147 | 6 pages (see appendix)<br>public page: yes | — | `app/api/mobile/programs/route.ts` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 283 | `getAllPublishedQuestion`<br>data/question.ts:22 | `/questions`<br>`/questions/[qid]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/questions/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 284 | `getQuestionByQid`<br>data/question.ts:47 | `/questions`<br>`/questions/[qid]`<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/questions/[qid]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 285 | `getQuestionsInfo`<br>data/question.ts:9 | `/questions`<br>`/questions/[qid]`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 286 | `getQuestionTitleByQid`<br>data/question.ts:34 | `/questions`<br>`/questions/[qid]`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 287 | `getAvailableTimesForDate`<br>data/reels.ts:38 | `/discover`<br>public page: yes | `components/clients/discover/discover.tsx` | — | read | none | **Lower**: public data (like `getConsultants`) | needs an action (read, rate limited) |
| 288 | `getConsultantsAvailableAt`<br>data/reels.ts:63 | `/discover`<br>public page: yes | `components/clients/discover/reels.tsx` | — | read | none | **Lower**: public data (like `getConsultants`) | needs an action (read, rate limited) |
| 289 | `isRescheduled`<br>data/reschedule.ts:130 | `/reschedule/[mid]`<br>public page: yes | — | `app/(pages)/(site)/(features)/reschedule/[mid]/page.tsx` | read | none (scoped only by caller-supplied `mid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 290 | `getConsultantPaginatedReviews`<br>data/review.ts:314 | `/`<br>public page: yes | — | `app/api/mobile/consultants/consultant/reviews/route.ts` | read | none (scoped only by caller-supplied `cid`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 291 | `getReviewsForHome`<br>data/review.ts:64 | `/`<br>public page: yes | — | `components/clients/home/reviews/reviews.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 292 | `reviewIsReservedByAuthor`<br>data/review.ts:36 | `/`<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 293 | `reviewsExistByAuthor`<br>data/review.ts:22 | `/`<br>public page: yes | — | — | read | none (scoped only by caller-supplied `author`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 294 | `getAllScales`<br>data/scales.ts:22 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/scales/page.tsx` | read | none (scoped only by caller-supplied `id`) | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 295 | `getAllScaleSlugs`<br>data/scales.ts:54 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/scales/[slug]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 296 | `getScaleBySlug`<br>data/scales.ts:37 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/scales/[slug]/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 297 | `getScalesForHome`<br>data/scales.ts:303 | 4 pages (see appendix)<br>public page: yes | — | `app/api/mobile/scales/route.ts` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 298 | `getConsultantSpecialties`<br>data/specialties.ts:9 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(consultants)/dashboard/specialty/page.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 299 | `getSpecialties`<br>data/specialties.ts:4 | 4 pages (see appendix)<br>public page: yes | — | `app/(pages)/(site)/(sub-pages)/articles/page.tsx`<br>`app/(pages)/(site)/consultants/page.tsx`<br>+1 more | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 300 | `getHomeSecondaryStatistics`<br>data/statistics.ts:48 | `/`<br>public page: yes | — | `components/clients/home/statistics/statistics.tsx` | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 301 | `getHomeStatistics`<br>data/statistics.ts:15 | `/`<br>public page: yes | — | — | read | none | **Lower**: public data (like `getConsultants`) | remove "use server" |
| 302 | `getTimings`<br>data/timings.ts:46 | `/dashboard/timings`<br>public page: no | `components/legacy/consultants/owner/timings/tables/index.tsx` | — | read | none (scoped only by caller-supplied `userId`) | **Lower**: public data (like `getConsultants`) | needs an action (read, rate limited) |
| 303 | `getYouTubeVideos`<br>lib/api/google.ts:71 | 14 pages (see appendix)<br>public page: yes | — | `components/clients/home/youtube/youtube.tsx` | read (external API) | none | **Lower**: public videos; API quota | remove "use server" |
| 304 | `verifyRecaptcha`<br>lib/api/recaptcha.ts:29 | 42 pages (see appendix)<br>public page: yes | `components/auth/login-form.tsx`<br>`components/auth/resgister-form.tsx`<br>`components/clients/bot/index.tsx`<br>+1 more | — | read (external API) | none | **Lower**: proxy to Google verify; replaced by BotID | remove (BotID replaces reCAPTCHA) |

## 2. Route handlers (`app/api/**/route.ts`)

75 route files. Two layers apply before the handler runs:

- `proxy.ts` rejects every `/api/mobile/*` request without `x-app-secret === APP_SECRET`. The same secret is checked again by `requireAppSecret` inside `createGetRoute` / `createPostRoute` / `route-factory`. It is a shared app secret, not a user identity.
- Other `/api/*` paths need a NextAuth token unless they are in `publicRoutes` / `DynamicpublicRoutes` in `routes.ts`. Public: `/api/cron`, `/api/gatewaies/*`, `/api/internal`, `/api/meetings`, `/api/online`, `/api/pusher/webhook`, `/api/realtime-token`, `/api/revalidate`, `/api/uploadthing`, `/api/whatsapp`, plus `/api/auth` (prefix). Not public: `/api/pusher/auth` and `/api/livekit/webhook`.

"App secret" below means both layers. "Raw Prisma" is "yes" when the route returns a Prisma model type or a query without `select`, "no" when it builds its own object, and "unverified" when the shape comes from a `data/` function that wasn't read for this audit.

| Route | Methods | Auth | zod | Ownership | Raw Prisma | Notes |
| ----- | ------- | ---- | --- | --------- | ---------- | ----- |
| `auth/[...nextauth]` | GET, POST | NextAuth handler | n/a | n/a | n/a | `export { GET, POST } from "@/auth"` |
| `cron/cancel-orders` | GET | cron secret (`Bearer ${process.env.CRON_SECRET}`) | no | n/a | no | |
| `cron/mobile/notifications/dispatch` | GET, POST | cron secret | no | n/a | no | |
| `cron/mobile/room/call` | GET, POST | cron secret | no | n/a | no | |
| `cron/reschedule` | GET | cron secret | no | n/a | unverified (`notified`) | |
| `cron/shuffle/consultants` | GET | cron secret | no | n/a | unverified | returns `reshuffleConsultants()` result |
| `cron/users/unverified` | GET | cron secret | no | n/a | no | calls `removeUnverifiedUsers` |
| `cron/wa-debounce-process` | GET | cron secret | no | n/a | no | |
| `cron/whatsapp-campaigns` | GET | cron secret | no | n/a | unverified (`processed: results`) | |
| `gatewaies/moyasar` | POST | none at the route; status re-fetched from Moyasar (`moyasarPaymentStatus`, `moyasarInvoiceDetails`, `moyasarSettlementDetails`) | no | n/a | no | file starts with `"use server"`; envelope `secret_token` is not checked |
| `gatewaies/tabby` | POST | **none** | no | n/a | no | see finding 4: `authorized` → `tabbyPayment` marks PAID even if capture fails; any other status → HOLD |
| `internal/instant-snapshot` | POST | shared secret `x-internal-secret` (`timingSafeEqual`) | no | n/a | no | |
| `internal/presence` | POST | shared secret `x-internal-secret` (`timingSafeEqual`) | no | n/a | no | |
| `livekit/webhook` | POST | webhook signature (`receiver.receive(body, authorization)`) | no | n/a | no | not in the public route lists, so `proxy.ts` may redirect it to `/login` (unverified) |
| `meetings/[mid]/chat` | GET | **none** (public) | no | **no** | yes: `participants: meeting.participants` | called by `components/clients/chats/chat.tsx` via SWR |
| `meetings/chats` | GET | **none** (public) | no | **no**: `author` and `role` from query string | unverified (`getChatList`) | called by `components/clients/chats/list/list.tsx` |
| `mobile/account/profile/name` | POST | app secret + `requireMobileUser` | yes | session id | no | |
| `mobile/account/profile/password` | POST | app secret + `requireMobileUser` | yes | session id | no | |
| `mobile/account/profile/phone` | POST | app secret + `requireMobileUser` | yes | session id | no | |
| `mobile/account/profile` | GET | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/account/sessions` | GET | app secret + `requireMobileUser` | no (`as SessionFilter`, `Number(limit)`) | session id | unverified (`getMeetings`) | |
| `mobile/account/wallet` | GET | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/account/wallet/transactions` | GET | app secret + `requireMobileUser` | no | session id | unverified (`getWalletTransactions`) | |
| `mobile/auth/[...all]` | GET, POST | Better Auth handler (`toNextJsHandler(mobileAuth)`) | n/a | n/a | n/a | |
| `mobile/auth/set-password` | POST | app secret + Better Auth `mobileAuth.api.getSession` | no (manual `typeof` / length check) | session id | no | see finding 11 |
| `mobile/consultants/[cid]/reservation-info` | GET | app secret only | no (`Number(cidParam)`) | n/a | no | |
| `mobile/consultants/[cid]/times` | GET | app secret only | no | n/a | unverified | |
| `mobile/consultants/consultant/instant-guard` | GET | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/consultants/consultant/packages` | GET | app secret only | no | n/a | yes (`Package[]`) | |
| `mobile/consultants/consultant/presence` | POST | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/consultants/consultant/reviews` | GET | app secret only | no | n/a | yes (`Review[]`) | |
| `mobile/consultants/consultant` | GET | app secret + `requireMobileUser` | no | n/a | yes (`Consultant & {…}`; the model has `phone`, `commission`) | |
| `mobile/consultants/favorites/[cid]` | DELETE, PATCH | app secret + `requireMobileUser` | no (`Number`) | session id | no | |
| `mobile/consultants/list` | GET | app secret (proxy only; not a factory route) | no | n/a | unverified (`getConsultants`) | |
| `mobile/consultants` | GET | app secret only | no | n/a | unverified (typed `ConsultantCard[]`) | |
| `mobile/notifications/[id]/read` | POST | app secret + `requireMobileUser` | no | yes: `notification.userId !== user.id` | no | built with `createGetRoute` |
| `mobile/notifications/campaigns` | POST | app secret (proxy) + NextAuth `roleServer()` = `ADMIN` | no | n/a | unverified (`campaign`) | |
| `mobile/notifications/mark-all-read` | POST | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/notifications/register-token` | POST | app secret + `requireMobileUser` | no | session id (upsert by push token) | no | |
| `mobile/notifications` | GET | app secret + `requireMobileUser` | no | session id | yes (`findMany` without `select`, own rows) | |
| `mobile/notifications/send` | POST | app secret + `requireMobileUser` | no (manual checks) | session id | unverified (`notification`) | |
| `mobile/notifications/unread-count` | GET | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/online` | GET | app secret only | no | n/a | unverified (typed `ConsultantCard[]`) | |
| `mobile/programs` | GET | app secret only | no | n/a | yes (`Program[]`) | |
| `mobile/realtime-token/guest` | GET | app secret (proxy) | no | n/a | no | |
| `mobile/realtime-token` | GET | app secret + `requireMobileUser` | no | session id | no | |
| `mobile/reservations/[oid]/cancel` | POST | app secret + `requireMobileUser` | no (`Number(oid)`) | yes: `where: { oid: Number(oid), author: user.id }` | no | |
| `mobile/reservations/[oid]/confirm` | POST | app secret + `requireMobileUser` | no | yes: same `where` | no (shaped) | |
| `mobile/reservations/[oid]/gatewaies/tabby-payload` | POST | app secret + `requireMobileUser` | no | yes: same `where` | unverified | file starts with `"use server"` |
| `mobile/reservations/[oid]/result` | GET | app secret + `requireMobileUser` | no | yes: same `where` | no (shaped) | |
| `mobile/reservations/[oid]/status` | GET | app secret (proxy) + `requireMobileUser` | no | yes: `order.author !== user.id` → 404 | no | file starts with `"use server"`; not a factory route, so a thrown `HttpError` is not caught here (unverified status code) |
| `mobile/reservations/instant` | GET | app secret (proxy) | n/a | n/a | no | POST commented out; GET returns `{ sucess: true }` |
| `mobile/reservations/new` | GET | app secret (proxy) | n/a | n/a | no | POST commented out; GET returns `{ sucess: true }` |
| `mobile/reservations` | GET | app secret (proxy) | n/a | n/a | no | POST commented out; GET returns `{ sucess: true }` |
| `mobile/room/[mid]/end` | POST | app secret + `requireMobileUser` | no | yes: consultant or `orders.author` | no | |
| `mobile/room/[mid]/guard` | GET | app secret + `requireMobileUser` | no | yes: `isConsultant` / `isClient` | unverified | |
| `mobile/room/[mid]/ring` | POST | app secret + `requireMobileUser` | no | yes: `isConsultant` / `isClient` | unverified | |
| `mobile/room/[mid]` | GET, POST | app secret + `requireMobileUser` | no | yes: `isConsultant` / `isClient` | unverified | |
| `mobile/room/guard/[mid]` | GET | app secret + `requireMobileUser` | no | yes: `isConsultant` / `isClient` | unverified | duplicate of `room/[mid]/guard` |
| `mobile/room/presence` | POST | app secret + `requireMobileUser` | no (`as Body`) | session id | no | |
| `mobile/room/ring/[mid]` | POST | app secret + `requireMobileUser` | no | yes: `isConsultant` / `isClient` | unverified | duplicate of `room/[mid]/ring` |
| `mobile/room` | POST | app secret + `requireMobileUser` | no (`as Body`) | yes: `isConsultant` / `isClient` | unverified | |
| `mobile/room/token` | POST | app secret + `requireMobileUser` | no (`as Body`) | session id | no | |
| `mobile/scales` | GET | app secret only | no | n/a | yes (`Scale[]`) | |
| `mobile/test/notifications/instant` | POST | app secret + `requireMobileUser` | no | session id | unverified | test route |
| `mobile/test/notifications` | POST | app secret + `requireMobileUser` | no | session id | no | test route |
| `online` | GET | **none** (public) | no | n/a | unverified (`getConsultantsOnline`) | |
| `pusher/auth` | POST | NextAuth token required by `proxy.ts`; the route itself reads none | no | **no**: `userId` from form data | no | see finding 9 |
| `pusher/webhook` | POST | webhook signature (HMAC of body vs `x-pusher-signature`, compared with `!==`) | no | n/a | no | |
| `realtime-token/guest` | GET | **none** (public) | no | n/a | no | mints a `GUEST` token |
| `realtime-token` | GET | NextAuth `auth()` | no | session id | no | |
| `revalidate` | POST | shared secret `x-dashboard-secret` | no (`typeof tag`) | n/a | no | |
| `uploadthing/delete` | POST | **none** (public) | no | **no** | no | file starts with `"use server"`; see finding 7 |
| `uploadthing` | GET, POST | UploadThing handler: `imageUploader` / `pdfUploader` check `userServer()`; `chatAttachment` has no check | n/a | n/a | n/a | |
| `whatsapp` | GET, POST | GET: verify token `WHATSAPP_PASS`; POST: **none** (no signature check found) | no | n/a | no | |

## 3. Client components that load data after mount

Found by scanning `useEffect` / `React.useEffect` bodies (and local functions they call) in client-reachable files, plus SWR hooks. Three hits were false positives and are excluded: `scrollToBottom` in both chat components, `clearHide` in the notification component. The programs and consultants `date-time.tsx` steps call `getConsultantAvailableTimes` from a date-select handler, not on mount.

| File | Line | Loads |
| ---- | ---: | ----- |
| `app/(pages)/(consultants)/dashboard/reviews/page.tsx` (whole page is `"use client"`) | 40 | `getReviewsForConsultant` (via `fetchReviews`) |
| `components/clients/discover/reels.tsx` | 99, 157 | `getConsultantsAvailableAt` from `data/reels.ts` (initial load and `loadMore`) |
| `components/clients/freesessions/reservation/steps/date-time.tsx` | 150 | `getConsultantAvailableTimes` (via `fetchTimes`) |
| `components/clients/home/notification/notification.tsx` | 23 | `getPaidPast3Days` |
| `components/legacy/consultants/owner/timings/tables/index.tsx` | 55 | `getTimings(author, cid, tday)` |
| `hooks/useOnlineConsultants.ts` | 31 | `getOnlineConsultantsList` (via `fetchList`) |
| `hooks/usIsOnline.ts` | 9 | `checkIsAnyConsultantOnline` |
| `hooks/realtime/useOnlineConsultant.ts` | 28 | ``fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presence/counts`)`` and `fetch("/api/realtime-token")` |
| `components/clients/chats/chat.tsx` | 123 | SWR ``/api/meetings/${mid}/chat``, every 7 s |
| `components/clients/chats/list/chat.tsx` | 122 | SWR ``/api/meetings/${mid}/chat``, every 7 s |
| `components/clients/chats/list/list.tsx` | 163 | SWR `/api/meetings/chats?author=${author}&role=${role}`, every 15 s |

## 4. reCAPTCHA usages

- `package.json:72`: `"react-google-recaptcha-v3": "^1.10.1"`
- `app/layout.tsx:18`: `import ReCaptchaWrapper from "@/components/wrappers/recaptcha";`, wraps the tree at L82–94
- `components/wrappers/recaptcha.tsx`: `GoogleReCaptchaProvider` with `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (L15)
- `lib/api/recaptcha.ts` (`"use server"`): `verifyRecaptcha` (L29), posts `RECAPTCHA_SECRET_KEY` to `https://www.google.com/recaptcha/api/siteverify` (L16–19). Exposed as an action on 42 pages.
- `handlers/admin/recaptcha.ts` (no directive, imported by client components): `runRecaptcha(executeRecaptcha)` calls `verifyRecaptcha` from the browser
- `components/auth/login-form.tsx`: L10, L29, L57, L65, L81, L84, L87 (`useGoogleReCaptcha`, `verifyRecaptcha`)
- `components/auth/resgister-form.tsx`: L10, L28, L68, L76, L92, L95, L98
- `components/clients/bot/index.tsx`: L23, L24, L128, L138, L154, L157, L160, L223
- `components/clients/consultants/reservation/form.tsx`: L8, L23, L73, L172 (`runRecaptcha`)
- `components/clients/discover/discover.tsx`: L36, L37, L88, L162 (`runRecaptcha`)
- `components/clients/freesessions/reservation/form.tsx`: L8, L26, L49, L117 (`runRecaptcha`)
- `components/clients/instant/reservation/form.tsx`: L8, L21, L44, L113 (`runRecaptcha`)
- `components/clients/sub-pages/marriage-awareness/form.tsx`: L12, L42, L122, L208 (`runRecaptcha`)

In every form the verification result is only checked in the browser before the real call. The server actions they then call (`login`, `register`, `Pay`, `confirmFreeSession`, `SendChatBot`) do not verify a token.

## 5. `"use server"` exports not in this manifest

These files still start with `"use server"`, but nothing on a page imported these exports in this build. Any future import from a page or client component exposes them. Route-handler exports are listed because their files start with `"use server"`.

- `app/api/gatewaies/moyasar/route.ts#POST`, `app/api/mobile/reservations/[oid]/gatewaies/tabby-payload/route.ts#POST`, `app/api/mobile/reservations/[oid]/status/route.ts#GET`, `app/api/uploadthing/delete/route.ts#POST`, `lib/api/uploadthing/delete/route.ts#POST`
- `data/campaigns.ts`: `getCampaignCandidatePhones`, `getCampaigns`, `createCampaign`, `setCampaignStatus`, `deleteCampaign`, `updateCampaignRate`
- `data/gatewaies/webhook.ts`: `getOrderForRefund`, `getWebhookActor`, `recordMoyasarSettlement`, `recordRefund`
- `data/instant.ts`: `recordInstantSnapshot`, `recordUniqueInstantVisitor`, `getTodayInstantStats`, `getInstantStatsRange`
- `data/preconsultation.ts`: `getPreConsultationSeassion`, `newPreConsultationSeassion`, `updatePreConsultationSeassion`
- `data/seo.ts`: `siteMapDynamic`, `siteMapConsultants`, `siteMapArticles`, `siteMapPrograms`
- `data/shuffle.ts#reshuffleConsultants`, `data/timings.ts`: `getTimingsByCid`, `getTimingsDayByCid`, `getTimingsReservation`, `data/uploads.ts#getUploadedImages`
- `data/whatsapp.ts`: `upsertWhatsappChat`, `getWhatsappContact`, `getWhatsappChat`
- `handlers/conusltant/owner/bank-account.ts#saveBankAccount`, `handlers/gatewaies/moyasar.ts#moyasarPayment`, `handlers/gatewaies/tabby.ts`: `tabbyPayment`, `tabbyRefundWebhook`
- `lib/api/ai/bot/setup.ts#AiBot`, `lib/api/sms.ts#smsSending`, `lib/api/telegram/templates/owner.ts#sendReviewerNotification`, `lib/upload/actions.ts#deleteImageAdmin`
- Page components named `Page` in `dashboard/freesession`, `dashboard/programs/[prid]` and `dashboard/timings` (they appear in the manifest as `default`)

## Appendix: pages per exposed file

<details><summary><code>app/(pages)/(consultants)/dashboard/discounts/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/discounts`


</details>

<details><summary><code>app/(pages)/(consultants)/dashboard/freesession/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/freesession`


</details>

<details><summary><code>app/(pages)/(consultants)/dashboard/programs/[prid]/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/programs/[prid]`


</details>

<details><summary><code>app/(pages)/(consultants)/dashboard/programs/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/programs`


</details>

<details><summary><code>app/(pages)/(consultants)/dashboard/timings/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/timings`


</details>

<details><summary><code>app/(pages)/(site)/(sub-pages)/articles/[aid]/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/articles/[aid]`


</details>

<details><summary><code>app/(pages)/(site)/(sub-pages)/articles/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/articles`


</details>

<details><summary><code>app/(pages)/(site)/(sub-pages)/reels/actions.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/reels`


</details>

<details><summary><code>app/(pages)/(site)/consultants/[cid]/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/consultants/[cid]`


</details>

<details><summary><code>app/(pages)/(site)/consultants/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/consultants`


</details>

<details><summary><code>app/(pages)/(site)/programs/[prid]/page.tsx</code> (3 exposed, 1 pages)</summary>

All functions in this file: `/programs/[prid]`


</details>

<details><summary><code>app/(pages)/(site)/programs/page.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/programs`


</details>

<details><summary><code>app/(pages)/(site)/programs/reserve/[prid]/page.tsx</code> (3 exposed, 1 pages)</summary>

All functions in this file: `/programs/reserve/[prid]`


</details>

<details><summary><code>components/clients/consultants/consultant/coupons/coupons.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/consultants/[cid]`


</details>

<details><summary><code>components/clients/consultants/consultant/reviews.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/consultants/[cid]`


</details>

<details><summary><code>components/clients/home/consultant/consultants.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/`


</details>

<details><summary><code>components/clients/home/reviews/reviews.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/`


</details>

<details><summary><code>components/clients/home/statistics/statistics.tsx</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/`


</details>

<details><summary><code>data/admin/collaboration.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/consultants/[cid]`


</details>

<details><summary><code>data/admin/settings/employee.ts</code> (3 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/admin/settings/settings.ts</code> (8 exposed, 22 pages)</summary>

All functions in this file: `/dashboard/discounts`, `/dashboard/discounts/[did]`, `/dashboard/dues`, `/dashboard/freesession`, `/dashboard/orders`, `/dashboard/programs`, `/discover`, `/reschedule/[mid]`, `/sessions/[id]`, `/event`, `/freesessions`, `/freesessions/[zid]`, `/instant`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/reconciliation/[id]`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/consultants/[cid]`, `/programs/reserve/[prid]`


</details>

<details><summary><code>data/admin/tools/oath.ts</code> (2 exposed, 18 pages)</summary>

All functions in this file: `/dashboard`, `/dashboard/chats`, `/dashboard/chats/[mid]`, `/dashboard/coupons`, `/dashboard/discounts`, `/dashboard/discounts/[did]`, `/dashboard/dues`, `/dashboard/freesession`, `/dashboard/instant`, `/dashboard/orders`, `/dashboard/packages`, `/dashboard/profile`, `/dashboard/programs`, `/dashboard/programs/[prid]`, `/dashboard/programs/new`, `/dashboard/reviews`, `/dashboard/specialty`, `/dashboard/timings`


</details>

<details><summary><code>data/article.ts</code> (13 exposed, 2 pages)</summary>

All functions in this file: `/articles`, `/articles/[aid]`


</details>

<details><summary><code>data/blocked.ts</code> (1 exposed, 14 pages)</summary>

All functions in this file: `/reset-password`, `/verify-otp`, `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/chats.ts</code> (5 exposed, 2 pages)</summary>

All functions in this file: `/chats/[mid]`

- `createMeetingMessage` also: `/dashboard/chats/[mid]`
- `toggleUserBlock` also: `/dashboard/chats/[mid]`

</details>

<details><summary><code>data/consultant.ts</code> (27 exposed, 33 pages)</summary>

All functions in this file: `/dashboard`, `/dashboard/chats`, `/dashboard/chats/[mid]`, `/dashboard/coupons`, `/dashboard/discounts`, `/dashboard/discounts/[did]`, `/dashboard/dues`, `/dashboard/freesession`, `/dashboard/instant`, `/dashboard/orders`, `/dashboard/packages`, `/dashboard/profile`, `/dashboard/programs`, `/dashboard/programs/[prid]`, `/dashboard/programs/new`, `/dashboard/reviews`, `/dashboard/specialty`, `/dashboard/timings`, `/`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/freesessions/consultants/[cid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/consultants`, `/consultants/[cid]`

- `getConsultantAvailableTimes` also: `/programs/reserve/[prid]`

</details>

<details><summary><code>data/coupon.ts</code> (10 exposed, 18 pages)</summary>

All functions in this file: `/dashboard/coupons`, `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/coupons`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`

- `applyCoupon` also: `/discover`, `/instant`, `/consultants/[cid]`, `/programs/reserve/[prid]`

</details>

<details><summary><code>data/discounts.ts</code> (7 exposed, 3 pages)</summary>

All functions in this file: `/dashboard/discounts`, `/dashboard/discounts/[did]`, `/event`


</details>

<details><summary><code>data/dues.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/dues`


</details>

<details><summary><code>data/event.ts</code> (1 exposed, 14 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/consultants/[cid]`


</details>

<details><summary><code>data/favorites.ts</code> (4 exposed, 2 pages)</summary>

All functions in this file: `/favorite`, `/consultants/[cid]`


</details>

<details><summary><code>data/freesession.ts</code> (9 exposed, 3 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/freesessions`, `/freesessions/[zid]`


</details>

<details><summary><code>data/gatewaies/moyasar.ts</code> (2 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/gatewaies/tabby.ts</code> (3 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/meetings.ts</code> (7 exposed, 2 pages)</summary>

All functions in this file: `/meetings/[mid]`, `/reschedule/[mid]`


</details>

<details><summary><code>data/online.ts</code> (8 exposed, 14 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`

- `getOnlineConsultantsList` also: `/`, `/instant`

</details>

<details><summary><code>data/order/program.ts</code> (1 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/order/reserveation.ts</code> (29 exposed, 13 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`

- `getPaidPast3Days` also: `/`

</details>

<details><summary><code>data/packages.ts</code> (3 exposed, 2 pages)</summary>

All functions in this file: `/dashboard/packages`, `/consultants/[cid]`


</details>

<details><summary><code>data/programs.ts</code> (14 exposed, 7 pages)</summary>

All functions in this file: `/dashboard/programs`, `/dashboard/programs/[prid]`, `/reschedule/[mid]`, `/programs`, `/programs/[prid]`, `/programs/reserve/[prid]`

- `createNewProgram` also: `/dashboard/programs/new`

</details>

<details><summary><code>data/question.ts</code> (4 exposed, 2 pages)</summary>

All functions in this file: `/questions`, `/questions/[qid]`


</details>

<details><summary><code>data/reconciliation.ts</code> (2 exposed, 2 pages)</summary>

All functions in this file: `/reschedule/[mid]`, `/reconciliation/[id]`


</details>

<details><summary><code>data/reels.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/discover`


</details>

<details><summary><code>data/reschedule.ts</code> (4 exposed, 1 pages)</summary>

All functions in this file: `/reschedule/[mid]`


</details>

<details><summary><code>data/review.ts</code> (9 exposed, 3 pages)</summary>

All functions in this file: `/`

- `acceptNewreview` also: `/consultants/[cid]`
- `getReviewsForConsultant` also: `/dashboard/reviews`

</details>

<details><summary><code>data/rooms.ts</code> (5 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/scales.ts</code> (7 exposed, 4 pages)</summary>

All functions in this file: `/scales`, `/scales/[slug]`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>data/sessions.ts</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/sessions/[id]`


</details>

<details><summary><code>data/specialties.ts</code> (3 exposed, 4 pages)</summary>

All functions in this file: `/dashboard/specialty`, `/articles`, `/consultants`, `/programs`


</details>

<details><summary><code>data/statistics.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/`


</details>

<details><summary><code>data/timings.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/timings`


</details>

<details><summary><code>data/uploads.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/dashboard`


</details>

<details><summary><code>data/user.ts</code> (9 exposed, 61 pages)</summary>

All functions in this file: `/logout`, `/reset-password`, `/verify-otp`, `/dashboard`, `/dashboard/chats`, `/dashboard/chats/[mid]`, `/dashboard/coupons`, `/dashboard/discounts`, `/dashboard/discounts/[did]`, `/dashboard/dues`, `/dashboard/freesession`, `/dashboard/instant`, `/dashboard/orders`, `/dashboard/packages`, `/dashboard/profile`, `/dashboard/programs`, `/dashboard/programs/[prid]`, `/dashboard/programs/new`, `/dashboard/reviews`, `/dashboard/specialty`, `/dashboard/timings`, `/discover`, `/`, `/chats/[mid]`, `/meetings/[mid]`, `/reschedule/[mid]`, `/sessions/[id]`, `/articles`, `/articles/[aid]`, `/coupons`, `/event`, `/freesessions`, `/freesessions/[zid]`, `/freesessions/consultants/[cid]`, `/instant`, `/marriage-awareness`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/preconsultation`, `/preconsultation/[cpid]`, `/questions`, `/questions/[qid]`, `/reconciliation`, `/reconciliation/[id]`, `/reels`, `/scales`, `/scales/[slug]`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/terms`, `/account`, `/favorite`, `/orders`, `/consultants`, `/consultants/[cid]`, `/contact-us`, `/programs`, `/programs/[prid]`, `/programs/reserve/[prid]`


</details>

<details><summary><code>data/wallet.ts</code> (7 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>handlers/admin/freesession.ts</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/freesessions/consultants/[cid]`


</details>

<details><summary><code>handlers/admin/order/payment.ts</code> (4 exposed, 16 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`

- `Pay` also: `/discover`, `/instant`, `/consultants/[cid]`, `/programs/reserve/[prid]`

</details>

<details><summary><code>handlers/auth/login.ts</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/login`


</details>

<details><summary><code>handlers/auth/register.ts</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/register`


</details>

<details><summary><code>handlers/auth/reset.ts</code> (2 exposed, 2 pages)</summary>

All functions in this file: 

- `forgetpassowrd` also: `/forget-password`
- `verifyReset` also: `/reset-password`

</details>

<details><summary><code>handlers/auth/userInfo.ts</code> (3 exposed, 1 pages)</summary>

All functions in this file: `/dashboard/profile`


</details>

<details><summary><code>handlers/auth/verify.ts</code> (3 exposed, 23 pages)</summary>

All functions in this file: `/reset-password`, `/verify-otp`

- `phoneToken` also: `/dashboard`, `/dashboard/chats`, `/dashboard/chats/[mid]`, `/dashboard/coupons`, `/dashboard/discounts`, `/dashboard/discounts/[did]`, `/dashboard/dues`, `/dashboard/freesession`, `/dashboard/instant`, `/dashboard/orders`, `/dashboard/packages`, `/dashboard/profile`, `/dashboard/programs`, `/dashboard/programs/[prid]`, `/dashboard/programs/new`, `/dashboard/reviews`, `/dashboard/specialty`, `/dashboard/timings`, `/account`, `/favorite`, `/orders`

</details>

<details><summary><code>handlers/clients/order.ts</code> (2 exposed, 2 pages)</summary>

All functions in this file: `/reschedule/[mid]`

- `confirmReconciliation` also: `/reconciliation`

</details>

<details><summary><code>handlers/conusltant/owner/profile.ts</code> (2 exposed, 1 pages)</summary>

All functions in this file: `/dashboard`


</details>

<details><summary><code>lib/api/ai/ai.ts</code> (4 exposed, 2 pages)</summary>

All functions in this file: `/`

- `aiConsultantSummary` also: `/dashboard`

</details>

<details><summary><code>lib/api/ai/chat-bot.ts</code> (1 exposed, 39 pages)</summary>

All functions in this file: `/`, `/chats/[mid]`, `/meetings/[mid]`, `/reschedule/[mid]`, `/sessions/[id]`, `/articles`, `/articles/[aid]`, `/coupons`, `/event`, `/freesessions`, `/freesessions/[zid]`, `/freesessions/consultants/[cid]`, `/instant`, `/marriage-awareness`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/preconsultation`, `/preconsultation/[cpid]`, `/questions`, `/questions/[qid]`, `/reconciliation`, `/reconciliation/[id]`, `/reels`, `/scales`, `/scales/[slug]`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/terms`, `/account`, `/favorite`, `/orders`, `/consultants`, `/consultants/[cid]`, `/contact-us`, `/programs`, `/programs/[prid]`, `/programs/reserve/[prid]`


</details>

<details><summary><code>lib/api/ai/chat-guard.ts</code> (1 exposed, 1 pages)</summary>

All functions in this file: `/chats/[mid]`


</details>

<details><summary><code>lib/api/gatewaies/moyasar.ts</code> (5 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>lib/api/gatewaies/tabby.ts</code> (5 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>lib/api/google.ts</code> (4 exposed, 14 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/`, `/meetings/[mid]`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>lib/api/recaptcha.ts</code> (1 exposed, 42 pages)</summary>

All functions in this file: `/login`, `/register`, `/discover`, `/`, `/chats/[mid]`, `/meetings/[mid]`, `/reschedule/[mid]`, `/sessions/[id]`, `/articles`, `/articles/[aid]`, `/coupons`, `/event`, `/freesessions`, `/freesessions/[zid]`, `/freesessions/consultants/[cid]`, `/instant`, `/marriage-awareness`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/preconsultation`, `/preconsultation/[cpid]`, `/questions`, `/questions/[qid]`, `/reconciliation`, `/reconciliation/[id]`, `/reels`, `/scales`, `/scales/[slug]`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/terms`, `/account`, `/favorite`, `/orders`, `/consultants`, `/consultants/[cid]`, `/contact-us`, `/programs`, `/programs/[prid]`, `/programs/reserve/[prid]`


</details>

<details><summary><code>lib/api/telegram/telegram.ts</code> (7 exposed, 12 pages)</summary>

All functions in this file: `/dashboard/freesession`, `/dashboard/orders`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales/orders/[zid]`, `/scales/results/[zid]`


</details>

<details><summary><code>lib/api/whatsapp/index.ts</code> (2 exposed, 22 pages)</summary>

All functions in this file: `/reset-password`, `/verify-otp`, `/dashboard/freesession`, `/dashboard/orders`, `/dashboard/programs`, `/dashboard/programs/[prid]`, `/chats/[mid]`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales`, `/scales/[slug]`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/programs`, `/programs/[prid]`, `/programs/reserve/[prid]`


</details>

<details><summary><code>lib/notifications/site.ts</code> (12 exposed, 22 pages)</summary>

All functions in this file: `/reset-password`, `/verify-otp`, `/dashboard/freesession`, `/dashboard/orders`, `/dashboard/programs`, `/dashboard/programs/[prid]`, `/chats/[mid]`, `/reschedule/[mid]`, `/sessions/[id]`, `/freesessions`, `/freesessions/[zid]`, `/payment/cancel`, `/payment/failed`, `/payment/paid`, `/payment/success`, `/scales`, `/scales/[slug]`, `/scales/orders/[zid]`, `/scales/results/[zid]`, `/programs`, `/programs/[prid]`, `/programs/reserve/[prid]`


</details>

