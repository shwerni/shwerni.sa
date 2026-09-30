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
