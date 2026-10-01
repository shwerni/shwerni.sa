# Shwerni — Server Actions Security Refactor & Rate Limiting

Sep 30, 2026 · @shwerni

> **Decisions made after this plan was written override it** (see CLAUDE.md and `docs/refactor-playbook.md`):
> bot protection is Vercel BotID, not reCAPTCHA; session helpers are `userServer()` / `roleServer()` in `lib/auth/server.ts`;
> `createAction` lives in `lib/safe-action.ts` with a `bot` option and the `bot_detected` error code.

## 1. Background and audit findings

Every exported async function in a `"use server"` file is a Server Action: a public POST endpoint anyone can call, with its ID shipped in the client JavaScript. The main site (Next.js on Vercel, Prisma on Supabase Postgres) had `"use server"` on the whole `data/` folder and on parts of `handlers/` and `lib/`, so internal Prisma functions were publicly callable.

### `"use server"` vs `import "server-only"`

|                  | `"use server"`                                             | `import "server-only"`                             |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| What it does     | Turns every exported async function into a public endpoint | Build fails if a client component imports the file |
| Use for          | Functions the browser triggers (forms, buttons)            | DB queries, secrets, internal helpers              |
| Export limits    | Only async functions                                       | None (constants, types, sync helpers allowed)      |
| Security meaning | Every export must check auth, validate input and ownership | Nothing is exposed                                 |

### How the audit was done

After `npm run build`, `.next/server/server-reference-manifest.json` lists every exposed action and its source file. The pre-refactor manifest for the consultants dashboard page (`app/(pages)/(consultants)/dashboard/page`) exposed 44 functions from `data/user.ts`, `data/consultant.ts`, `data/admin/tools/oath.ts`, `data/uploads.ts`, `handlers/auth/verify.ts`, `handlers/conusltant/owner/profile.ts` and `lib/api/ai/ai.ts`. Other pages were not checked yet.

### Severity triage of exposed functions

| Severity | Functions                                                                                                                                                                                   | Risk                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Critical | `getAllUsers`, `getUsersByRole`                                                                                                                                                             | Dumps the whole user base (names, phones, emails)                      |
| Critical | `getUserByEmail`, `getUserByPhone`, `getUserById`, `getUserLogin`                                                                                                                           | Account lookup; `getUserLogin` may return login fields                 |
| Critical | `getBankAccountByAuthor`                                                                                                                                                                    | Consultants' bank details (IBAN)                                       |
| Critical | `getOwnerForDues`                                                                                                                                                                           | Consultant earnings and payouts                                        |
| Critical | `removeUnverifiedUsers`                                                                                                                                                                     | Anyone can delete users                                                |
| Critical | `createUser`                                                                                                                                                                                | Account creation bypassing registration                                |
| Critical | `getUserOrders`                                                                                                                                                                             | Any user's order history                                               |
| High     | `saveConsultant`, `ownerVisibility`                                                                                                                                                         | Profile edits and publish/hide without ownership check                 |
| High     | `confirmOathAcceptance`, `getAuthStateById`                                                                                                                                                 | Fake oath acceptance, read auth state                                  |
| High     | `phoneToken`                                                                                                                                                                                | OTP/SMS spam, cost and harassment                                      |
| High     | `saveUploadedFile`, `saveUploadedImage`                                                                                                                                                     | Unauthenticated uploads to storage                                     |
| High     | `aiConsultantSummary`                                                                                                                                                                       | Burns AI API credits                                                   |
| Lower    | `getConsultants`, `getConsultantInfo`, `getConsultantReviews`, `getConsultantAvailableTimes`, `getConsultantCost`, `getDiscountedConsultants`, `getPuslishedConsultantsForHome` and similar | Mostly public data; check raw Prisma objects don't leak private fields |

The manifest also contains an `encryptionKey` for action closure values. It lives in `.next/server` (not served publicly), is regenerated each build unless `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is set, and should not be pasted anywhere.

## 2. Target architecture

Only two places are public after the refactor: `actions/` and `app/api/**/route.ts`. All security checks live there; everything else is `server-only` and physically blocked from the client bundle.

| Folder                 | Directive                                                                           | Contains                                                                               | Who may import it                                                   |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `data/`                | `import "server-only"`                                                              | Prisma queries only; no auth, no business rules                                        | `services/`, `actions/`, `handlers/`, `route.ts`, Server Components |
| `services/` (optional) | `import "server-only"`                                                              | Business rules shared by web and mobile (pricing, discounts, booking flow)             | `actions/`, `handlers/`, `route.ts`                                 |
| `handlers/`            | `import "server-only"`                                                              | Webhook and route-handler logic (Moyasar, Tabby, cron)                                 | `route.ts`                                                          |
| `lib/`                 | `import "server-only"` on every file touching secrets, env, Prisma or external APIs | Reusable server functions (`sendWhatsappMessage`, payment clients, auth config)        | Server code only                                                    |
| `actions/`             | `"use server"`                                                                      | Thin actions called by the React UI: auth, validate, call data/services, return result | Client components, forms                                            |
| `utils/`               | none                                                                                | Pure helpers safe anywhere; no Prisma, no secrets                                      | Anyone                                                              |
| `hooks/`               | none (the components using them are `"use client"`)                                 | Client hooks that call `actions/` or fetch `app/api/`                                  | Client components                                                   |
| `app/api/**/route.ts`  | none                                                                                | HTTP endpoints for the mobile app, webhooks, cron                                      | HTTP only                                                           |

Rules that keep this true:

- `handlers/` must NOT use `"use server"`. It is called from `route.ts`, never from the browser, and `"use server"` would expose it.
- Do not move Prisma code into `actions/`. Keep the query in `data/` and write a thin wrapper action that calls it, so Server Components and route handlers can reuse it without a public endpoint.
- Client-safe files in `lib/` move to `utils/`, so "lib = server" is always true.
- Secrets never use the `NEXT_PUBLIC_` prefix; anything with it ships to the browser.
- Reads for pages happen in Server Components calling `data/` directly and passing props down. Actions are for mutations (they are POST requests and run one at a time).
- `handlers/` is not a Next.js convention; Next only gives meaning to special files in `app/`. Here it means server-side webhook/route logic.

## 3. Migration plan

Close the critical holes first with a hotfix, then do the full refactor with `npm run build` as the safety net.

### Step 0: hotfix (same day, before the refactor)

For every Critical and High function in section 1:

- Only used by server code: remove `"use server"` from its file and add `import "server-only"`. It disappears from the manifest.
- Really called from a client component: add an auth and role check as its first line, then deploy immediately.

```ts
export async function getAllUsers() {
  const role = await roleServer();
  if (role !== "ADMIN") throw new Error("unauthorized");
  // ...
}
```

### Step 1: check for past abuse

Server Action calls are POST requests to a page URL with a `Next-Action` header holding the action ID. Search hosting or proxy logs for the IDs of `removeUnverifiedUsers`, `getAllUsers` and `getBankAccountByAuthor`. Check the database for unexpected deletions of unverified users or unexpected new accounts.

### Step 2: the refactor

1. `npm i server-only`.
2. Replace `"use server"` with `import "server-only"` in every file in `data/`, `handlers/` and server files in `lib/`.
3. Run `npm run build`. Each error saying a client file imports a `server-only` module names exactly which function needs an action wrapper.
4. Create those actions in `actions/` using `createAction` (section 4), and point client imports at them.
5. Rebuild and open `.next/server/server-reference-manifest.json`. Only `actions/...` files may appear. A `data/`, `handlers/` or `lib/` file there means it still has `"use server"`.
6. Click through every form and mutation in dev and on a preview deployment.

Find which action files client code imports:

```bash
grep -rl '"use client"' src app | xargs grep -h "from ['\"].*actions" | sort -u
```

### What each check catches

| Check                | Catches                                                                                                                                                                       | Misses                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `npx tsc --noEmit`   | Nothing related to this; directives are invisible to TypeScript                                                                                                               | Everything below                                                       |
| `npm run build`      | A `"use client"` file importing a `server-only` file (error shows the import chain)                                                                                           | Server functions passed as props to client components on dynamic pages |
| Manual click-through | "Functions cannot be passed directly to Client Components" at render time, e.g. `<BookingForm onSubmit={createBooking} />` or `<form action={fn}>` with a non-action function | —                                                                      |
| Manifest review      | Anything still exposed that shouldn't be                                                                                                                                      | —                                                                      |

## 4. Action rules and the `createAction` wrapper

Every action is treated as a public API called by an attacker with any input. If calling it directly is as safe as using the UI, it is secure.

### Rules for every action

- Auth check first (session), then role check where needed, via `userServer()` and `userRole()`.
- Validate all input with zod.
- Ownership inside the query: `where: { oid, author: userId }`, so another user's record looks exactly like a missing one.
- Never accept prices, totals, discount amounts or user IDs from the client (see section 5).
- Return only what the UI needs; never raw Prisma objects.
- Return error codes, not user-facing text; the client maps codes to Arabic messages and fires the toast.
- Mutations only; page data comes from Server Components.

### `lib/safe-action.ts`

Pipeline per call: IP rate limit → auth and role → per-user rate limit → zod → input-based rate limit (e.g. per phone) → handler. Checks within a stage run in parallel. Errors are logged server-side and returned as `server_error`; `redirect()` and `notFound()` still work through `unstable_rethrow` (Next 15+). `rateLimit` is optional per action.

Assumptions to confirm against the codebase: `userServer()` returns the session user (with `id`) or `null`; `userRole()` returns the role or `null`; both take no arguments; import path `@/lib/auth/user`.

```ts
import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import { userServer, userRole } from "@/lib/auth/user"; // adjust to your actual path
import { rateLimit, getClientIp, type RateWindow } from "@/lib/rate-limit";

type SessionUser = NonNullable<Awaited<ReturnType<typeof userServer>>>;
type Role = NonNullable<Awaited<ReturnType<typeof userRole>>>;

export type BaseActionError =
  | "invalid_input"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "server_error";

export type ActionResult<T, E extends string = never> =
  | { ok: true; data: T }
  | { ok: false; error: E | BaseActionError };

export const ok = <T>(data: T) => ({ ok: true as const, data });
export const fail = <E extends string>(error: E) => ({
  ok: false as const,
  error,
});

type AuthRule = "public" | "user" | readonly Role[];

type ActionContext<A extends AuthRule> = {
  ip: string;
  user: A extends "public" ? SessionUser | null : SessionUser;
};

type RateRule<I> = {
  limit: number;
  window: RateWindow;
  by: "ip" | "user" | ((input: I) => string);
};

type ActionConfig<S extends z.ZodType, A extends AuthRule> = {
  name: string;
  schema: S;
  auth: A;
  rateLimit?: RateRule<z.output<S>>[];
};

export function createAction<
  S extends z.ZodType,
  const A extends AuthRule,
  T,
  E extends string = never,
>(
  config: ActionConfig<S, A>,
  handler: (
    input: z.output<S>,
    ctx: ActionContext<A>,
  ) => Promise<ActionResult<T, E>>,
) {
  const rules = config.rateLimit ?? [];
  const ipRules = rules.filter((r) => r.by === "ip");
  const userRules = rules.filter((r) => r.by === "user");
  const inputRules = rules.filter((r) => typeof r.by === "function");

  const passes = async (checks: Promise<boolean>[]) =>
    checks.length === 0 || (await Promise.all(checks)).every(Boolean);

  const keyFor = (rule: RateRule<z.output<S>>, id: string) =>
    `${config.name}:${rule.limit}/${rule.window}:${id}`;

  return async (raw: unknown): Promise<ActionResult<T, E>> => {
    try {
      const ip = await getClientIp();

      // 1. IP limits: before any session or DB work
      if (
        !(await passes(ipRules.map((r) => rateLimit(keyFor(r, `ip:${ip}`), r))))
      ) {
        return fail("rate_limited");
      }

      // 2. auth + role
      const user = await userServer();
      if (config.auth !== "public") {
        if (!user) return fail("unauthorized");
        if (typeof config.auth !== "string") {
          const role = await userRole();
          if (!role || !config.auth.includes(role)) return fail("forbidden");
        }
      }

      // 3. per-user limits (guests fall back to IP)
      const identity = user ? `u:${user.id}` : `ip:${ip}`;
      if (
        !(await passes(userRules.map((r) => rateLimit(keyFor(r, identity), r))))
      ) {
        return fail("rate_limited");
      }

      // 4. validate input
      const parsed = await config.schema.safeParseAsync(raw);
      if (!parsed.success) return fail("invalid_input");

      // 5. input-based limits (e.g. per phone)
      const inputChecks = inputRules.map((r) =>
        rateLimit(
          keyFor(r, `in:${(r.by as (i: z.output<S>) => string)(parsed.data)}`),
          r,
        ),
      );
      if (!(await passes(inputChecks))) return fail("rate_limited");

      // 6. the action itself
      return await handler(parsed.data, { ip, user } as ActionContext<A>);
    } catch (err) {
      unstable_rethrow(err); // keep redirect() / notFound() working
      console.error(`[action:${config.name}]`, err);
      return fail("server_error");
    }
  };
}
```

### Usage

A `"use server"` file may export `createAction(...)` results because they are async functions. Data-layer names below (`getOrderForOwner`, `cancelOrderById`, `getAllUsersForAdmin`) are examples; use the real `data/` functions.

```ts
// actions/order.ts
"use server";

import { z } from "zod";
import { createAction, ok, fail } from "@/lib/safe-action";
import { getOrderForOwner, cancelOrderById } from "@/data/order";

export const cancelOrderAction = createAction(
  {
    name: "order.cancel",
    schema: z.object({ oid: z.coerce.number().int().positive() }),
    auth: "user",
    rateLimit: [{ by: "user", limit: 10, window: "1 m" }],
  },
  async ({ oid }, { user }) => {
    const order = await getOrderForOwner(oid, user.id); // where: { oid, author: userId }
    if (!order) return fail("not_found");
    if (order.status !== "PENDING") return fail("not_cancellable");

    await cancelOrderById(order.oid);
    return ok({ oid: order.oid });
  },
);
```

```ts
// actions/admin/users.ts
"use server";

import { z } from "zod";
import { createAction, ok } from "@/lib/safe-action";
import { getAllUsersForAdmin } from "@/data/user";

export const listUsersAction = createAction(
  {
    name: "admin.users.list",
    schema: z.object({ page: z.coerce.number().int().min(1).default(1) }),
    auth: ["ADMIN", "MANAGER"],
  },
  async ({ page }) => ok(await getAllUsersForAdmin(page)),
);
```

The existing `Pay` function returns `{ state, step, message }`. It can stay as is or move to `ActionResult` later; new actions use `ActionResult`.

## 5. Public guest booking (no sign-in)

The guest booking action is public by design; anyone can call it directly, like any form. What makes it safe is that it enforces the same rules no matter who calls it, so a direct call gives an attacker nothing beyond what the UI gives.

### Checks besides zod

| Check                                                                              | Why                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Rate limit per IP and per phone                                                    | Stops slot-blocking spam; the only defense without auth                                |
| reCAPTCHA, verified server-side                                                    | Stops bots; token must come from a real browser solve                                  |
| Server-side pricing                                                                | Client sends intent only; server computes the total                                    |
| Consultant exists and is published                                                 | Prevents booking hidden or deleted consultants                                         |
| Slot in the future, inside the booking window, still free                          | Business rules re-checked on the server                                                |
| Coupon active, not expired, under usage limit, not on already-discounted durations | Via `applyCoupon`                                                                      |
| Unique constraint on `(consultantId, slotStart)`                                   | The real guarantee against double booking                                              |
| Order starts `PENDING`                                                             | Confirmed only by the verified Moyasar/Tabby webhook                                   |
| Pending orders expire after 10–15 minutes                                          | Stops slot hoarding with unpaid bookings                                               |
| Random public token for follow-up links                                            | `oid` is sequential and enumerable; use `crypto.randomBytes(24).toString("base64url")` |
| Minimal response                                                                   | Only status, booking token and payment URL; never reveal whether a phone is registered |
| Length limits on text fields                                                       | Stops junk storage                                                                     |

### Pricing flow

1. Page render (server): `resolveConsultantPricing` computes the price for display.
2. On click: the client sends `consultantId`, duration, slot and `couponCode` only.
3. In the action: the server calls `resolveConsultantPricing` again and `applyCoupon`, then passes that total to `createMoyasarCheckout` or `createTabbyCheckout`.

Optional: the client also sends `expectedTotal`. If it differs from the server total, return `price_changed` so the user sees the new price before paying. It is used only for that comparison, never for charging. The existing `Pay` function already follows this rule.

### Transactions

`prisma.$transaction(async (tx) => { ... })` runs all queries in the callback as one unit: if anything throws, everything rolls back. Use `tx`, not `prisma`, inside it. Returning `{ ok: false }` does not roll back; only throwing does.

- Call the payment gateway after the transaction commits, never inside it. Transactions hold locks and time out after 5 seconds by default.
- A transaction alone does not prevent double booking: two requests can both see a free slot. The unique constraint stops the second insert; map Prisma error `P2002` to `slot_unavailable`.

### Step order inside the booking action

Cheap checks first, so spam is rejected in milliseconds and only real requests pay for expensive steps:

1. IP limit (Vercel Firewall at the edge, then `createAction` IP rule)
2. zod validation
3. Per-phone limit (about 2 ms)
4. reCAPTCHA verification (about 100–300 ms)
5. Transaction: consultant, slot, pricing, create `PENDING` order
6. Payment gateway checkout

### Toast and client handling

The toast fires in the client component; a Server Action runs on the server and cannot show UI. The action returns an error code; the client maps it to Arabic text. When the Vercel Firewall blocks a call (429), the action never runs and the client `await` throws, so wrap calls in `try/catch`.

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createGuestBookingAction, type BookingError } from "@/actions/booking";

const errorMessages: Record<BookingError, string> = {
  invalid_input: "تأكد من صحة البيانات المدخلة",
  unauthorized: "يجب تسجيل الدخول",
  forbidden: "غير مسموح",
  rate_limited: "محاولات كثيرة، حاول مرة أخرى بعد قليل",
  captcha_failed: "فشل التحقق، أعد المحاولة",
  consultant_unavailable: "المستشار غير متاح حالياً",
  slot_unavailable: "هذا الموعد تم حجزه، اختر موعداً آخر",
  invalid_coupon: "كود الخصم غير صالح",
  price_changed: "تغير السعر، راجع المبلغ الجديد",
  server_error: "حدث خطأ، حاول مرة أخرى",
};

// inside the component
const [isPending, startTransition] = useTransition();

function submit(values: BookingFormValues, captchaToken: string) {
  startTransition(async () => {
    try {
      const result = await createGuestBookingAction({
        ...values,
        captchaToken,
      });
      if (!result.ok) {
        toast.error(errorMessages[result.error]);
        return;
      }
      toast.success("تم إنشاء الحجز، سيتم تحويلك للدفع");
      window.location.href = result.data.paymentUrl;
    } catch {
      // blocked by the firewall (429) or a network failure
      toast.error("محاولات كثيرة أو مشكلة في الاتصال، حاول مرة أخرى بعد قليل");
    }
  });
}
```

`BookingError` is the union of `BaseActionError` and the action's own codes (`captcha_failed`, `consultant_unavailable`, `slot_unavailable`, `invalid_coupon`, `price_changed`). The guest booking action itself will be written with `createAction` after the reCAPTCHA review (section 9).

## 6. Route handlers (`app/api/**/route.ts`)

Route handlers take no directive: they are server-only by nature and are not Server Actions. They serve callers that cannot use actions: the mobile app, Moyasar/Tabby webhooks and cron jobs.

### Rules

- No `"use server"`. It is misleading, breaks route config exports (`export const dynamic`, `export const runtime`), and exposes `GET` as an action if client code ever imports the file.
- Auth (e.g. `requireMobileUser`) or, for webhooks, signature verification before trusting the payload.
- Validate params, query and body with zod. `Number("abc")` is `NaN` and makes Prisma throw a 500.
- Ownership check; answer 404 (not 403) for other users' records so IDs cannot be probed.
- Return an explicitly shaped JSON object, never the raw Prisma record.
- Thrown errors are not turned into responses automatically. A thrown `HttpError` becomes a 500 unless the handler is wrapped by code that catches it.
- Keep the handler thin; queries live in `data/`.

### Example

```ts
// app/api/mobile/orders/[oid]/payment-status/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { getOrderPaymentStatus } from "@/data/order";

const paramsSchema = z.object({ oid: z.coerce.number().int().positive() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> },
) {
  const user = await requireMobileUser(request); // make sure its throw is handled

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const order = await getOrderPaymentStatus(parsed.data.oid);

  // ownership check: never trust the oid alone
  if (!order || order.author !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ status: order.payment?.payment ?? null });
}
```

```ts
// data/order.ts
import "server-only";
import prisma from "@/lib/database/db";

export async function getOrderPaymentStatus(oid: number) {
  return prisma.order.findUnique({
    where: { oid },
    select: { author: true, payment: { select: { payment: true } } },
  });
}
```

## 7. Rate limiting setup

Two layers: Vercel Firewall for coarse per-IP limits at the edge (no added function time), and a Postgres limiter for precise per-action, per-user and per-phone limits. No Redis provider; the counters live in the existing Supabase database.

### Layer 1: Vercel Firewall rules

Project → Firewall → Configure → + New Rule, then save and publish.

| Rule                  | If                                                                                            | Rate limit                                    | Then       |
| --------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| Server Actions per IP | Request header `Next-Action` exists AND method is `POST`                                      | Fixed window, 60 s, 30 requests, keyed by IP  | Deny (429) |
| API routes per IP     | Path starts with `/api/` AND path does not start with the webhook path (e.g. `/api/webhooks`) | Fixed window, 60 s, 120 requests, keyed by IP | Deny (429) |

Firewall notes:

- Window 10–3,600 seconds, limit 1–10,000,000 requests, keyed by IP (default), JA4 or a header; fixed window is the default algorithm and token bucket is Enterprise-only ([Vercel CLI firewall docs](https://vercel.com/docs/cli/firewall)).
- The WAF counts CDN cache hits too, so rules are scoped to actions and API paths, not the whole site.
- Webhook paths are excluded because Moyasar and Tabby send from a small set of their own server IPs.
- Start with the Log action for a few days, check real per-IP traffic, then switch to Deny. Saudi mobile carriers put many users behind shared IPs (carrier-grade NAT), so edge limits stay loose and only stop floods.
- Attack Challenge Mode on the Firewall page is the emergency brake.

### Layer 2: Postgres limiter

Prisma model:

```prisma
model RateLimit {
  key         String   @id
  count       Int
  windowStart DateTime @map("window_start") @db.Timestamptz(3)

  @@map("rate_limit")
}
```

Migration (from the codebase that owns migrations, since three codebases share the database):

```bash
npx prisma migrate dev --name rate_limit --create-only
```

In the generated `migration.sql`, change `CREATE TABLE "rate_limit"` to `CREATE UNLOGGED TABLE "rate_limit"`, then run `npx prisma migrate dev`. Unlogged skips the crash-recovery log, making writes cheaper; the table is emptied only if the database crashes, which is fine for counters.

Cleanup (enable the `pg_cron` extension in Supabase under Database → Extensions, then run once in the SQL editor):

```sql
select cron.schedule(
  'rate-limit-cleanup',
  '*/30 * * * *',
  $$DELETE FROM rate_limit WHERE window_start < now() - interval '1 day'$$
);
```

The longest rate-limit window must stay at 1 day or less, matching this interval and `MAX_WINDOW_SECONDS`.

### `lib/rate-limit.ts`

Fixed-window counter in one atomic query. Fails open on errors or after 800 ms, so a slow check never blocks real bookings. IPv6 is bucketed by /64 prefix because one user can rotate through a whole /64 block. `x-real-ip` is set by Vercel from the real connection and cannot be spoofed by the client.

```ts
import "server-only";
import { headers } from "next/headers";
import prisma from "@/lib/database/db";

export type RateWindow = `${number} ${"s" | "m" | "h" | "d"}`;
export type RateLimitConfig = { limit: number; window: RateWindow };

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;
const MAX_WINDOW_SECONDS = 86400; // must match the cleanup cron interval
const TIMEOUT_MS = 800;

function toSeconds(window: RateWindow): number {
  const [amount, unit] = window.split(" ") as [
    string,
    keyof typeof UNIT_SECONDS,
  ];
  const seconds = Number(amount) * UNIT_SECONDS[unit];
  if (
    !Number.isFinite(seconds) ||
    seconds <= 0 ||
    seconds > MAX_WINDOW_SECONDS
  ) {
    throw new Error(`Invalid rate limit window: ${window}`);
  }
  return seconds;
}

async function hit(key: string, windowSeconds: number): Promise<number> {
  // one atomic round trip: insert, increment, or reset if the window expired
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN 1 ELSE rate_limit.count + 1 END,
      window_start = CASE
        WHEN rate_limit.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN now() ELSE rate_limit.window_start END
    RETURNING count
  `;
  return rows[0]?.count ?? 1;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("rate limit timeout")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Returns true if the request is allowed. Fails open on errors or timeouts. */
export async function rateLimit(
  key: string,
  { limit, window }: RateLimitConfig,
): Promise<boolean> {
  try {
    const count = await withTimeout(hit(key, toSeconds(window)), TIMEOUT_MS);
    return count <= limit;
  } catch (err) {
    console.error("[rateLimit]", key, err);
    return true;
  }
}

/**
 * IPv6 users can rotate through billions of addresses inside their /64 block,
 * so IPv6 is bucketed by /64 prefix. IPv4 is used as is.
 */
function normalizeIp(ip: string): string {
  if (!ip.includes(":")) return ip; // IPv4

  if (ip.includes(".")) return ip.slice(ip.lastIndexOf(":") + 1); // IPv4-mapped IPv6

  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const full =
    tail !== undefined
      ? [
          ...headParts,
          ...Array(8 - headParts.length - tailParts.length).fill("0"),
          ...tailParts,
        ]
      : headParts;

  return `${full
    .slice(0, 4)
    .map((part) => part.toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // x-real-ip is set by Vercel from the real connection and cannot be spoofed by the client
  const raw =
    h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return raw ? normalizeIp(raw) : "unknown";
}
```

### Limits per action

```ts
// public guest booking
rateLimit: [
  { by: "ip", limit: 5, window: "10 m" },
  { by: (input) => input.phone, limit: 3, window: "1 h" },
],

// OTP / phone token
rateLimit: [
  { by: "ip", limit: 5, window: "15 m" },
  { by: (input) => input.phone, limit: 3, window: "15 m" },
],

// AI summary (costs money per call)
rateLimit: [{ by: "user", limit: 10, window: "1 h" }],

// optional: logged-in user mutations
rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
```

### Alternatives considered

| Option                                     | Latency per check                                               | Verdict                                                             |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Vercel Firewall dashboard rule             | None (edge, before the function)                                | Used for coarse per-IP limits                                       |
| Postgres limiter                           | About 1–3 ms if Vercel functions and Supabase share a region    | Used for precise limits                                             |
| Upstash Redis                              | About 1 ms                                                      | Rejected: no new Redis provider wanted                              |
| Self-hosted Redis on the AWS NestJS server | About 1 ms same region                                          | Rejected: must be exposed to the internet and secured; saves 1–2 ms |
| HTTP call to the NestJS server             | Extra HTTP hop, slowest                                         | Rejected                                                            |
| `@vercel/firewall` SDK with custom key     | Network call; limit set per dashboard rule; counters per region | Rejected: less flexible, not faster                                 |
| In-memory `Map`                            | Instant but wrong                                               | Rejected: Vercel instances share no memory                          |

## 8. Which layer where, and speed

Each layer stops a different attack, and each is used only where needed; most actions touch no limiter at all.

| Layer                            | Stops                                                                 | Applied to                                                   | Added time                                              |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| Vercel Firewall                  | Floods from one IP                                                    | All Server Actions and `/api/*` except webhooks              | None (edge)                                             |
| reCAPTCHA                        | Bots on public forms                                                  | Guest booking, OTP request, sign-up                          | Script load on those pages; 100–300 ms verify on submit |
| Postgres limiter                 | Targeted abuse of one phone or user from many IPs with valid CAPTCHAs | OTP/phone token, guest booking, AI summary, optionally login | 1–3 ms per rule, only on those actions                  |
| Auth + ownership + firewall only | —                                                                     | All normal logged-in actions                                 | —                                                       |

Why counters must be stored: Vercel runs many function instances that share no memory, so an in-memory counter counts nothing. Vercel Firewall sees only IP and headers; it cannot read the phone number in the request body.

### Speed notes

- Page loads are not affected by the firewall or the limiter; neither runs on page views.
- reCAPTCHA's browser script is the heaviest piece. Load it only on pages with protected forms, never site-wide.
- Check that the Vercel function region matches the Supabase region. A mismatch slows every Prisma query on the site, not just rate limiting.
- Measure in production before optimizing further:

```ts
const t = performance.now();
const allowed = await rateLimit(key, rule);
console.log(`[rateLimit] ${key} ${(performance.now() - t).toFixed(1)}ms`);
```

1–5 ms means done. 50 ms or more points to a region mismatch or connection setup.

## 9. Open items and next steps

- [ ] Hotfix Critical and High functions from section 1 and deploy
- [ ] Search logs for abuse of `removeUnverifiedUsers`, `getAllUsers`, `getBankAccountByAuthor`
- [ ] Convert `data/`, `handlers/` and server `lib/` files to `import "server-only"`
- [x] Write `lib/safe-action.ts`, `lib/rate-limit.ts`, `types/action.ts`, `utils/action-errors.ts`, `hooks/use-action.ts`
- [ ] Commit the foundation files; confirm `userServer()` / `roleServer()` signatures in `lib/auth/server.ts`
- [ ] Add the `RateLimit` model, unlogged migration and `pg_cron` cleanup
- [ ] Rebuild actions in `actions/` with `createAction`; update client imports
- [ ] Add the two Vercel Firewall rules in Log mode, review traffic, then switch to Deny
- [x] Review the reCAPTCHA implementation (found: client-only verification bypassable, verifier exposed as action, no action binding, no timeout)
- [x] Decide bot protection: Vercel BotID with Deep Analysis (Vercel Pro); reCAPTCHA dropped
- [ ] Add `bot: "log" | "enforce"` to `createAction`; `instrumentation-client.ts`; `utils/bot-protection.ts` (not done: `lib/safe-action.ts` has no `bot` option, and no action uses `createAction` yet. `instrumentation-client.ts` and `utils/bot-protection.ts` were added on 2026-10-01 in `e3d76ec`; until then the actions call `checkHuman` from `lib/bot-protection.ts` directly)
- [ ] Install `botid`, wrap `next.config` with `withBotId`, list real protected page paths, enable Deep Analysis (code done 2026-10-01, `e3d76ec`: protect list is `"/*"`, `checkHuman` in 12 actions plus NextAuth `authorize`; Deep Analysis is a dashboard step, still open)
- [ ] Remove reCAPTCHA: `app/layout.tsx`, `components/wrappers/recaptcha.tsx`, `lib/api/recaptcha.ts`, login, register, bot component, discover, marriage-awareness form, consultant / free-session / instant reservation forms, `RECAPTCHA_*` env
- [ ] Run protected actions with `bot: "log"` for a week, review the Firewall BotID view, then switch to `"enforce"`
- [ ] Write the guest booking action with `createAction`, public order token and pending-order expiry
- [ ] Rebuild and confirm the manifest lists only `actions/` files, across all pages
- [ ] Click through every form and mutation on a preview deployment
- [ ] Check Vercel function region vs Supabase region
- [ ] Plan mobile app attestation for OTP and booking API routes (BotID doesn't cover native apps)

Open question: which Vercel region the main site's functions run in, and which region the Supabase project is in.
