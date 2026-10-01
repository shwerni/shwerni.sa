# Project map

Read-only survey, Sep 30, 2026, branch `main` with the uncommitted working tree as it was that day. Facts come from the code. Anything not checked is marked "unverified". Companion to `docs/reference/server-surface.md`.

## Versions and config

| Item | Value | Source |
| ---- | ----- | ------ |
| Next.js | 16.2.9 (Turbopack build) | `package.json` `"next": "16.2.9"`, `node_modules/next` |
| React | 19.2.7 | `node_modules/react` |
| zod | 3.25.76 (`^3.25.76`) | `node_modules/zod` |
| next-auth | 5.0.0-beta.31 installed (`^5.0.0-beta.30`) | `node_modules/next-auth` |
| better-auth | 1.6.23 | `node_modules/better-auth` |
| Prisma | `prisma` 7.9.1, `@prisma/client` 7.8.0 | `node_modules` |
| botid | 1.5.11 installed (`^1.5.11`) | `node_modules/botid` |
| server-only | not in `package.json` or `node_modules` | only `lib/safe-action.ts`, `lib/rate-limit.ts` and two `docs/reference` files import it |
| TypeScript | 5.9.3 | `node_modules/typescript` |
| **cacheComponents** | **on**: `cacheComponents: true` | `next.config.ts`; build log prints "Cache Components enabled" |
| Other `next.config.ts` flags | `experimental.optimizeCss`, `experimental.useLightningcss`, `compress: true`, image remote patterns for UploadThing | `next.config.ts` |
| BotID wiring | `withBotId` is not used in `next.config.ts`; no `instrumentation-client.ts` at the root | |
| Type-check scope | `tsconfig.json` includes `**/*.ts`, `**/*.tsx`, so `docs/reference/**` is type-checked by `next build` | `tsconfig.json` |

## Top-level folders

Directive counts come from the first statement of each `.ts`/`.tsx` file.

| Folder | Files | What it actually contains |
| ------ | ----: | ------------------------- |
| `app/` | 161 | `(pages)/` with route groups `(auth)`, `(consultants)` (the consultant dashboard), `(reels)`, `(site)`; `api/` with 75 `route.ts` files; root `layout.tsx` (wraps everything in `ReCaptchaWrapper`), `sitemap.ts`, `robots.ts`. 3 files are `"use client"`. 10 files are `"use server"`: 5 pages (`dashboard/freesession`, `dashboard/programs/[prid]`, `dashboard/timings`, `programs/[prid]`, `programs/reserve/[prid]`), `(sub-pages)/reels/actions.ts`, and 4 route files (`gatewaies/moyasar`, `mobile/reservations/[oid]/gatewaies/tabby-payload`, `mobile/reservations/[oid]/status`, `uploadthing/delete`). |
| `components/` | 340 | `auth/` (login, register, OTP, reset forms), `clients/` (site features by domain), `consultant/`, `legacy/` (older dashboard and layout components, including the consultant owner dashboard), `shared/`, `ui/` (shadcn), `wrappers/` (`recaptcha.tsx`). 160 files are `"use client"`, none `"use server"`. |
| `data/` | 47 | Prisma queries by domain, plus `admin/` (`bot.ts`, `collaboration.ts`, `settings/`, `tools/`), `order/` (`reserveation.ts`, `program.ts`), `gatewaies/` (`moyasar.ts`, `tabby.ts`, `webhook.ts`). **42 files are `"use server"`**; 5 have no directive. Also holds business rules: coupon validation (`applyCoupon`), order status transitions (`updateOrderStatus`), wallet payments, and order creation with notifications. |
| `handlers/` | 15 | `admin/` (`freesession.ts`, `order/payment.ts` with `Pay` and `onPayment*`, `recaptcha.ts`), `auth/` (`login`, `register`, `reset`, `userInfo`, `verify`), `clients/order.ts`, `conusltant/owner/` (`profile.ts`, `bank-account.ts`, `timings.ts`), `gatewaies/` (`moyasar.ts`, `moyasar-webhook.ts`, `tabby.ts`). 12 files are `"use server"`. `handlers/admin/recaptcha.ts` and `handlers/conusltant/owner/timings.ts` have no directive and are imported by client components. |
| `lib/` | 138 | `api/` (`ai`, `gatewaies`, `google.ts`, `http-error.ts`, `pusher`, `realtime`, `recaptcha.ts`, `room`, `routes` (route factories), `sms.ts`, `telegram`, `uploadthing`, `whatsapp`), `auth/`, `database/db.ts` (Prisma client), `generated/prisma/` (generated client), `notifications/` (`site.ts`, `mobile/`), `nuqs`, `site`, `upload`, plus the new `safe-action.ts` and `rate-limit.ts`. 15 files are `"use server"`, 1 is `"use client"`. `lib/api/pusher/pusher-client.ts` is client-reachable. |
| `utils/` | 17 | Helpers: `admin/` (includes `payments.ts` `calculatePayment` and `encryption.ts`), `gatewaies/` (`verify/verify.ts` reads `process.env.MOYASAR_SECRET`, `verify/tabby.ts`), `app.ts` (`requireAppSecret`, reads `APP_SECRET`), `auth.ts`, `date.ts`, `phone.ts`, `time`, `user.ts`, and the new `action-errors.ts`, `bot-protection.ts`. No directives. `utils/admin/encryption.ts` is client-reachable and contains a hardcoded `secret_token` string. |
| `hooks/` | 14 | Client hooks: `use-action.ts` (new), `useOnlineConsultant.ts`, `useOnlineConsultants.ts`, `usIsOnline.ts`, `realtime/`, `store`, `zustand`, `debounced.ts`, `fetch.ts`, `localStorage.ts`, `scroll.ts`, `use-mobile.ts`. 6 are `"use client"`. |
| `schemas/` | 6 | zod schemas (`index.ts`, `schemas.ts`, `chat.ts`, `consultant/`). |
| `types/` | 7 | `.d.ts` type files, including `action.d.ts`. |
| `constants/` | 9 | Static data: `index.ts` (includes the `zencrypt` / `zdencrypt` digit maps), `links.ts`, `menu.ts`, `saudi-banks.ts`, `phone`, `locales`, `theme`, `admin.ts`, `data.ts`. |
| `prisma/` | 18 | `schema.prisma`, `models/*.prisma` (multi-file schema), `seed`. |
| `scripts/` | 3 | `css-error.mjs`, `enums-expot.js`, `prisma-to-one.js`. |
| `backups/` | 1 | `14-07-2026_db_backup.sql`. Git-ignored (`.gitignore:44 /backups`); not opened. |
| `public/` | 115 | Static assets (`audio`, `layout`, `meta`, `other`, `svg`). |
| `styles/` | 5 | Feature CSS (`article.css`, `bot-button.css`, `order-notification.css`, `room.css`, `upload-thing.css`). |
| `docs/` | 8 | The refactor plan, playbook and `reference/`. |
| Root files | | `auth.ts`, `auth.config.ts`, `better-auth.config.ts`, `proxy.ts` (Next 16 proxy / middleware), `routes.ts` (public and auth route lists), `next-auth.d.ts`, `prisma.config.ts`, `vercel.json`, `todo.md`. |
| Not present | | `actions/` and `services/` do not exist yet. |

## Shared business functions

Callers are files that import the function, excluding the defining file. `[client]` marks a client-reachable caller.

### Pricing

| Function | Defined | Called from |
| -------- | ------- | ----------- |
| `calculatePayment` | `utils/admin/payments.ts:2` (client-reachable) | `handlers/admin/order/payment.ts`; `[client]` `components/clients/consultants/reservation/form.tsx`, `components/clients/instant/reservation/form.tsx`, `components/clients/programs/reservation/form.tsx`, `components/clients/sub-pages/marriage-awareness/form.tsx`; imported by `app/api/mobile/reservations/instant/route.ts` (its POST is commented out) |
| `resolveConsultantPricing` | `data/event.ts:20` | `handlers/admin/order/payment.ts`, `components/clients/consultants/reservation/reserve.tsx` (no directive) |
| `getFinanceConfig` | `data/admin/settings/finance.ts:87` | `handlers/admin/order/payment.ts`, `app/api/mobile/consultants/[cid]/reservation-info/route.ts`, `app/(pages)/(reels)/discover/page.tsx`, `app/(pages)/(site)/(sub-pages)/marriage-awareness/page.tsx`, `components/clients/consultants/reservation/reserve.tsx`, `components/clients/instant/index.tsx`, `components/clients/programs/reservation/reserve.tsx` |
| `getConsultantCost` | `data/consultant.ts:523` | `data/event.ts`, `app/api/mobile/consultants/[cid]/reservation-info/route.ts` |
| `getActiveDiscount`, `applyDiscount` | `data/discounts.ts:21`, `:98` | only inside `data/discounts.ts` |
| `reserveConsultant(formdata, total, tax, commissionRate, origin)` | `data/order/reserveation.ts:38` | `handlers/admin/order/payment.ts` (`Pay`) |
| `reserveProgram(formdata, total, tax)` | `data/order/program.ts:24` | `handlers/admin/order/payment.ts` |
| `reserveInstant(formdata, total, tax, commissionRate)` | `data/online.ts:178` | `handlers/admin/order/payment.ts`, `app/api/mobile/reservations/instant/route.ts` (import only) |

### Coupons

| Function | Defined | Called from |
| -------- | ------- | ----------- |
| `applyCoupon(user, code, cid)` | `data/coupon.ts:35` | `handlers/admin/order/payment.ts`; `[client]` `components/clients/consultants/reservation/forms/coupons.tsx`, `components/clients/instant/reservation/forms/coupons.tsx`, `components/clients/programs/reservation/forms/coupons.tsx`; `components/clients/forms/coupons.tsx` (not client-reachable in this build) |
| `saveACoupon` | `data/coupon.ts:98` | `handlers/admin/order/payment.ts`; also referenced in the commented-out POST of `app/api/mobile/reservations/route.ts` and `new/route.ts` |

### Order status

| Function | Defined | Called from |
| -------- | ------- | ----------- |
| `updateOrderStatus(pid, status)` | `data/order/reserveation.ts:779` | `handlers/gatewaies/moyasar.ts`, `handlers/gatewaies/moyasar-webhook.ts`, `handlers/gatewaies/tabby.ts`, `app/api/gatewaies/tabby/route.ts`, `app/api/mobile/reservations/[oid]/confirm/route.ts`, `app/(pages)/(site)/(sub-pages)/payment/cancel/page.tsx`, `app/(pages)/(site)/(sub-pages)/payment/failed/page.tsx` |
| `orderStatusPaid` / `orderStatusRefund` / `orderStatusHold` | `data/order/reserveation.ts:840` / `:961` / `:940` | called by `updateOrderStatus`; also `[client]` `components/clients/home/test.tsx` → `orderStatusPaid` (file not imported anywhere) and `[client]` `components/legacy/layout/orderCard/refundButton/index.tsx` → `orderStatusRefund` |
| `onPaymentSuccess` / `onPaymentRefund` / `onPaymentHold` | `handlers/admin/order/payment.ts:52` / `:83` / `:100` | `data/order/reserveation.ts`; `onPaymentSuccess` also from `data/wallet.ts` |
| `cancelOrders` | `data/order/reserveation.ts:1124` | `app/api/cron/cancel-orders/route.ts` |
| `Pay` (the web booking flow) | `handlers/admin/order/payment.ts:107` | `[client]` `components/clients/consultants/reservation/form.tsx`, `components/clients/discover/discover.tsx`, `components/clients/instant/reservation/form.tsx`, `components/clients/programs/reservation/form.tsx`, `components/clients/sub-pages/marriage-awareness/form.tsx` |
| Wallet: `addWalletCredit`, `payPartiallyByWallet` | `data/wallet.ts:43`, `:220` | `data/order/reserveation.ts` |
| Wallet: `payAllByWallet`, `requestUsingWallet`, `adjustWalletCredit` | `data/wallet.ts:98`, `:193`, `:290` | no importers outside `data/wallet.ts` found |

### Notifications

| Function | Defined | Called from |
| -------- | ------- | ----------- |
| `sendNotification` (mobile push) | `lib/notifications/mobile/send-notification.ts:32` | `lib/notifications/mobile/notify/reservation.ts`, `app/api/mobile/notifications/send/route.ts`, `app/api/mobile/test/notifications/route.ts`, `app/api/mobile/test/notifications/instant/route.ts` |
| `sendCampaign` (mobile) | `lib/notifications/mobile/send-campaign.ts:26` | `app/api/mobile/notifications/campaigns/route.ts` |
| `notificationSecurityOtp` | `lib/notifications/site.ts:34` | `data/verificationTokens.ts`, `handlers/auth/reset.ts`, `lib/auth/mobile-auth.ts` |
| `notificationNewOrder` | `lib/notifications/site.ts:50` | `handlers/admin/order/payment.ts` |
| Other `notification*` in `lib/notifications/site.ts` | `:207`–`:418` | `data/preconsultation.ts`, `data/freesession.ts`, `data/programs.ts`, `data/sessions.ts`, `handlers/clients/order.ts`, `data/scales.ts`, `data/reschedule.ts`, `data/chats.ts`; `notificationNewOwner` has no importer |
| `sendWhatsappTemplate` | `lib/api/whatsapp/index.ts:61` | `lib/notifications/site.ts`, `app/api/cron/whatsapp-campaigns/route.ts` |
| `sendWhatsappText` | `lib/api/whatsapp/index.ts:177` | `lib/api/ai/bot/bot.ts`, `lib/api/ai/bot/index.ts`, `lib/api/whatsapp/logic.ts`, `lib/api/whatsapp/special-replies.ts` |
| `telegram*` (7 functions) | `lib/api/telegram/telegram.ts` | `telegramAdmin` from 6 server files including the payment handlers; the others from 1 file each (see `server-surface.md`) |

### Payment clients

| Function | Defined | Called from |
| -------- | ------- | ----------- |
| `createMoyasarCheckout` | `lib/api/gatewaies/moyasar.ts:63` | `handlers/admin/order/payment.ts` |
| `moyasarPaymentStatus` | `lib/api/gatewaies/moyasar.ts:95` | `handlers/gatewaies/moyasar.ts`; the commented-out POST in `app/api/mobile/reservations/new/route.ts` |
| `moyasarPaymentDetails` | `lib/api/gatewaies/moyasar.ts:105` | no importer found |
| `moyasarInvoiceDetails`, `moyasarSettlementDetails` | `lib/api/gatewaies/moyasar.ts:120`, `:153` | `handlers/gatewaies/moyasar-webhook.ts` |
| `verifyMoyasarPayment` | `utils/gatewaies/verify/verify.ts:19` | `app/api/mobile/reservations/[oid]/confirm/route.ts` |
| Direct Moyasar fetch | `app/api/mobile/reservations/[oid]/result/route.ts:57` | builds `Authorization: Basic …` from `MOYASAR_SECRET` itself |
| `createTabbyCheckout` | `lib/api/gatewaies/tabby.ts:124` | `handlers/admin/order/payment.ts` |
| `capturePayment` | `lib/api/gatewaies/tabby.ts:154` | `handlers/gatewaies/tabby.ts` (errors swallowed, result ignored) |
| `tabbyPaymentDetails` | `lib/api/gatewaies/tabby.ts:228` | `handlers/gatewaies/tabby.ts` (refund path) |
| `tabbyBody` | `lib/api/gatewaies/tabby.ts:57` | `app/api/mobile/reservations/[oid]/gatewaies/tabby-payload/route.ts` |
| `tabbyPreScoring` | `lib/api/gatewaies/tabby.ts:166` | no importer found |
| `verifyTabbyPayment` | `utils/gatewaies/verify/tabby.ts:15` | `app/api/mobile/reservations/[oid]/confirm/route.ts` |

## Auth helpers

### NextAuth (web)

| Helper | Where | Notes |
| ------ | ----- | ----- |
| `GET`, `POST`, `auth`, `signIn`, `signOut` | `auth.ts` | `NextAuth({ … session: { strategy: "jwt" }, adapter: PrismaAdapter(prisma), ...authConfig })`. The `signIn` callback requires a verified phone. The `jwt` callback loads `phone` and `role` once via `getUserById`. `session` copies `id`, `phone`, `role` from the token. |
| Credentials provider | `auth.config.ts` | `LogInSchema.safeParse`, `getUserByPhone`, `bcrypt.compare` |
| `userServer()` | `lib/auth/server.ts:5` | `(await auth())?.user`; no arguments; used in 34 files |
| `roleServer()` | `lib/auth/server.ts:14` | `(await auth())?.user.role`; no arguments; used in 4 files |
| `proxy()` | `proxy.ts` | `getToken({ req, secret: process.env.AUTH_SECRET })`; redirects to `/login` unless the path is in `publicRoutes` / `DynamicpublicRoutes` / `authRoutes` or starts with `/api/auth`; `/api/mobile/*` needs `x-app-secret` instead |
| Route lists | `routes.ts` | `publicRoutes`, `DynamicpublicRoutes`, `authRoutes`, `apiAuthPrefix = "/api/auth"` |
| Type augmentation | `next-auth.d.ts` | |
| `login` action | `handlers/auth/login.ts:20` | calls `signIn("credentials", …)` at L61 |
| `signOut` | used in 2 files, including `components/auth/logout-form.tsx` (imports from `next-auth/react`) | |

### Better Auth (mobile app only; recorded, not reviewed)

| Helper | Where | Notes |
| ------ | ----- | ----- |
| `mobileAuth` | `lib/auth/mobile-auth.ts` | used in 5 files |
| `auth` (re-export) | `better-auth.config.ts` | `export { mobileAuth as auth } from "./lib/auth/mobile-auth"` |
| `requireMobileUser(request)` | `lib/auth/require-mobile-user.ts:15` | reads `x-session-token` (copied into `cookie`), `mobileAuth.api.getSession`, throws `HttpError("unauthorized", 401)`; used in 39 files |
| `legacyPasswordLogin` | `lib/auth/legacy-password-login.ts` | used in 2 files |
| Handler | `app/api/mobile/auth/[...all]/route.ts` | `toNextJsHandler(mobileAuth)` |
| `set-password` | `app/api/mobile/auth/set-password/route.ts` | `mobileAuth.api.getSession` + `mobileAuth.api.setPassword`, then writes the bcrypt hash NextAuth reads |
| App secret | `utils/app.ts:9` `requireAppSecret`, `proxy.ts` | `x-app-secret === APP_SECRET`; used by the route factories in `lib/api/routes/` |

## Environment variable names referenced in code

Names only, collected with `process.env.X` over all source outside `node_modules`, `.next`, `lib/generated` and `backups`. No `.env*` file was opened. No destructured `process.env` reads were found.

**Server:** `APNS_AUTH_KEY`, `APNS_BUNDLE_ID`, `APNS_ENV`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APP_SECRET`, `AUTH_SECRET`, `BACKEND_URL`, `BETTER_AUTH_URL`, `CRON_SECRET`, `DASHBOARD_SECRET`, `DATABASE_URL`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`, `INTERNAL_SHARED_SECRET`, `JAWALY_KEY`, `JAWALY_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `MEET_CLIENT_EMAIL`, `MEET_PRIVATE_KEY`, `MEET_SERVICE_EMAIL`, `MOYASAR_ENDPOINT`, `MOYASAR_SECRET`, `NODE_ENV`, `OPENAI_API_KEY`, `PUSHER_APP_ID`, `PUSHER_SECRET`, `REALTIME_JWT_SECRET`, `RECAPTCHA_SECRET_KEY`, `TABBY_ENDPOINT`, `TABBY_SECRET`, `TELEGRAM_APIKEY`, `WHATSAPP_PASS`, `WHATSAPP_TOKEN`, `WHATSAPP_URL`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`

**`NEXT_PUBLIC_` (shipped to the browser):**

- `NEXT_PUBLIC_BACKEND_URL` (`hooks/realtime/useOnlineConsultant.ts`)
- `NEXT_PUBLIC_PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY` (`lib/api/pusher/pusher-client.ts`, `lib/api/pusher/pusher-server.ts`)
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (`components/wrappers/recaptcha.tsx`)

None of the `NEXT_PUBLIC_` names is a secret by name. Their values were not checked.

Not read from env: `utils/admin/encryption.ts` has a hardcoded `secret_token` constant, and the `zid` order-id encoding uses maps in `constants/`.
