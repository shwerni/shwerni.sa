import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import { userServer, roleServer } from "@/lib/auth/server";
import { rateLimit, getClientIp, type RateWindow } from "@/lib/rate-limit";

type SessionUser = NonNullable<Awaited<ReturnType<typeof userServer>>>;
type Role = NonNullable<Awaited<ReturnType<typeof roleServer>>>;

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
          const role = await roleServer();
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
