# Shwerni main site: Claude Code instructions

Next.js (App Router) on Vercel, Prisma on Supabase Postgres, NextAuth v5 for web sessions. Arabic RTL site.
Current work: the Server Actions security refactor in `docs/security-refactor.md`, done with `docs/refactor-playbook.md`.

## Hard rules

- **Do not change UI or UX.** No changes to markup, styling, Arabic copy, component structure, loading states or user-visible flows unless a task explicitly says so. The only allowed new user-facing text is error messages for new error codes.
- **Do not change business logic.** Pricing, discounts, coupons, booking rules, slot rules, payment flow (Moyasar, Tabby) and notifications behave exactly as before. Paid and order status changes go through `updateOrderStatus()`. Move and wrap code; don't rewrite it. If a security fix would change behavior, stop and ask.
- **Never read, print or edit `.env*` files.** Secrets never get the `NEXT_PUBLIC_` prefix.
- **Never apply anything to the remote database.** Three codebases share it. This repo owns the schema (`prisma/schema.prisma` + `prisma/models/*.prisma`). There are no migrations: Ziad applies schema changes with `prisma db push`, and only Ziad does. Claude Code edits the schema files, runs `npx prisma validate` and `npx prisma generate`, then stops and asks. Never run `prisma db push`, `prisma migrate` or write SQL against the database.
- **No git push, deploys, force operations or dependency upgrades** beyond what the plan lists.
- **Only commit files your task changed.** Other uncommitted changes in the working tree belong to Ziad; never stage them.
- **Payments and webhooks** (`handlers/` for Moyasar, Tabby, cron, and their `route.ts`): propose changes, don't apply them without approval.
- **Don't change session or auth configuration.** NextAuth v5 handles web platform sessions (Server Actions, `userServer()` / `roleServer()`). Better Auth handles mobile app sessions (`app/api/mobile/**`, `requireMobileUser`). Never mix them or change either one's config.

## Code style

Follow the "Code style" section of `docs/refactor-playbook.md`: lowercase comments, grouped import headers in its order, kebab-case files, named component exports.

## Rules for new code

- **Database queries live in `data/`**, and every file there starts with `import "server-only"`.
- **Only `actions/` holds functions the client can call** (`"use server"`). Each one checks the session, the role and ownership before it does anything else.
- **Public actions call `checkHuman`** (`lib/bot-protection.ts`) first, and return the action's existing failure result when it's false.
- **Never trust ids, prices or user ids from the client.** Take the user from the session, look up the owner from the database, and compute prices on the server.
- **Before every push**, run the manifest check from "After every phase".

## Decisions that override the plan

- **Bot protection is Vercel BotID**, not reCAPTCHA or Turnstile. reCAPTCHA removal is its own phase (files listed in section 9 of the plan); don't mix it into other phases.
- **Session helpers:** `userServer()` and `roleServer()` from `lib/auth/server.ts`. Plan text that says `userRole()` means `roleServer()`.
- **`createAction`** lives in `lib/safe-action.ts`, with `bot?: "log" | "enforce"`. New public actions (login, register, reset password, OTP, guest booking) start with `bot: "log"`. Every page that calls a `bot` action must be listed in `utils/bot-protection.ts`.
- **Base error codes:** `invalid_input`, `unauthorized`, `forbidden`, `rate_limited`, `bot_detected`, `server_error`. Messages are in `utils/action-errors.ts`; client components use `hooks/use-action.ts`.

## Real code vs reference

- **Real code, used as written:** `lib/safe-action.ts`, `lib/rate-limit.ts`, `types/action.ts`, `utils/action-errors.ts`, `utils/bot-protection.ts` (with its placeholder paths replaced by real routes), `hooks/use-action.ts`, `instrumentation-client.ts`.
- **Reference only:** `docs/reference/example/` shows the full data → action → client pattern with placeholder field names. It's excluded from type checking. Apply the pattern to real code; never copy these files into `data/`, `actions/` or `components/`.

## After every phase

1. `npm run build` passes.
2. The actions manifest exposes only `actions/` files. This should print only `"data/event.ts"` and `"lib/api/google.ts"` (their `"use cache"` registrations, `$$RSC_SERVER_CACHE_*`, not Server Actions):
   `grep -oE '"(data|handlers|lib)/[^"]*"' .next/server/server-reference-manifest.json | sort -u`
3. Append to `docs/progress.md`: date, phase, files changed, what was verified, open questions.
4. Tick the matching item in section 9 of `docs/security-refactor.md` only when 1 and 2 pass.

## Stop and ask when

- A client component calls a server function and the correct auth rule (public / user / roles) is unclear.
- UI code depends on fields of a raw Prisma object that the new action wouldn't return.
- A function is used by both server and client code in ways that don't fit the plan.

## Progress log

At the end of every phase, append to `docs/progress.md`: date, phase, files changed,
what was verified (build, manifest), and open questions for review. Alsotick the
matching items in section 9 of `docs/security-refactor.md`. Then commit.