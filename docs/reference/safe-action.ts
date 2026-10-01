import "server-only";

// React & Next
import { unstable_rethrow } from "next/navigation";

// packages
import { createHash } from "node:crypto";
import { checkBotId } from "botid/server";
import type { z } from "zod";

// lib
import { userServer, roleServer } from "@/lib/auth/server";
import { rateLimit, getClientIp, type RateWindow } from "@/lib/rate-limit";

// types
import type { ActionResult } from "@/types/action";

type SessionUser = NonNullable<Awaited<ReturnType<typeof userServer>>>;
type Role = NonNullable<Awaited<ReturnType<typeof roleServer>>>;

type AuthRule = "public" | "user" | readonly Role[];

type ActionContext<A extends AuthRule> = {
  ip: string;
  user: A extends "public" ? SessionUser | null : SessionUser;
};

type RateRule<I> = {
  limit: number;
  window: RateWindow;
  // for input rules, return an already-normalized value (e.g. the phone after the schema's transform)
  by: "ip" | "user" | ((input: I) => string);
};

type ActionConfig<S extends z.ZodType, A extends AuthRule> = {
  name: string;
  schema: S;
  auth: A;
  rateLimit?: RateRule<z.output<S>>[];
  // vercel botid: "log" records verdicts, "enforce" blocks; the calling page must be in utils/bot-protection.ts
  bot?: "log" | "enforce";
};

export const ok = <T>(data: T) => ({ ok: true as const, data });
export const fail = <E extends string>(error: E) => ({ ok: false as const, error });

// input values (phones, emails) are hashed so the counters table holds no personal data
const hashKey = (value: string) => createHash("sha256").update(value).digest("base64url").slice(0, 22);

const allAllowed = async (checks: Promise<boolean>[]) =>
  checks.length === 0 || (await Promise.all(checks)).every(Boolean);

/**
 * pipeline, with at most two database round trips before the handler:
 * [ip limits + session] -> auth and role -> zod -> [user limits + input limits] -> bot check -> handler
 */
export function createAction<S extends z.ZodType, const A extends AuthRule, T, E extends string = never>(
  config: ActionConfig<S, A>,
  handler: (input: z.output<S>, ctx: ActionContext<A>) => Promise<ActionResult<T, E>>,
) {
  const rules = config.rateLimit ?? [];
  const ipRules = rules.filter((r) => r.by === "ip");
  const userRules = rules.filter((r) => r.by === "user");
  const inputRules = rules.filter((r) => typeof r.by === "function");

  // limit and window are part of the key, so changing a limit starts a fresh counter
  const keyFor = (rule: RateRule<z.output<S>>, id: string) => `${config.name}:${rule.limit}/${rule.window}:${id}`;

  // typed input for callers; still validated at runtime because anyone can call it with anything
  return async (input: z.input<S>): Promise<ActionResult<T, E>> => {
    try {
      const ip = await getClientIp();

      // 1. ip limits and session in parallel (a cookie read when nextauth uses the jwt strategy)
      const [ipAllowed, user] = await Promise.all([
        allAllowed(ipRules.map((r) => rateLimit(keyFor(r, `ip:${ip}`), r))),
        userServer(),
      ]);
      if (!ipAllowed) return fail("rate_limited");

      // 2. auth and role
      if (config.auth !== "public") {
        if (!user) return fail("unauthorized");

        if (typeof config.auth !== "string") {
          const role = await roleServer();
          if (!role || !config.auth.includes(role)) return fail("forbidden");
        }
      }

      // 3. validate input (cpu only, no round trip)
      const parsed = await config.schema.safeParseAsync(input);
      if (!parsed.success) return fail("invalid_input");

      // 4. per-user and per-input limits together (guests fall back to ip)
      const identity = user ? `u:${user.id}` : `ip:${ip}`;
      const limitsAllowed = await allAllowed([
        ...userRules.map((r) => rateLimit(keyFor(r, identity), r)),
        ...inputRules.map((r) => {
          const value = (r.by as (i: z.output<S>) => string)(parsed.data);
          return rateLimit(keyFor(r, `in:${hashKey(value)}`), r);
        }),
      ]);
      if (!limitsAllowed) return fail("rate_limited");

      // 5. bot check last: deep analysis is billed per call, so floods never reach it
      if (config.bot && (await isBotRequest(config.name, ip)) && config.bot === "enforce") {
        return fail("bot_detected");
      }

      // 6. the action itself
      return await handler(parsed.data, { ip, user } as ActionContext<A>);
    } catch (err) {
      // keep redirect() and notFound() working
      unstable_rethrow(err);

      console.error(`[action:${config.name}]`, err);
      return fail("server_error");
    }
  };
}

// fails open if botid itself errors: rate limits still apply, and an outage shouldn't block every login
async function isBotRequest(action: string, ip: string): Promise<boolean> {
  try {
    const result = await checkBotId();

    if (result.isBot) {
      // only present on some result shapes
      const name = "verifiedBotName" in result ? result.verifiedBotName : undefined;
      console.warn(`[botid] action=${action} ip=${ip} verified=${result.isVerifiedBot} name=${name ?? "-"}`);
    }

    return result.isBot;
  } catch (err) {
    console.error(`[botid] check failed action=${action}`, err);
    return false;
  }
}