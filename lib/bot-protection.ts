import "server-only";

// React & Next
import { headers } from "next/headers";

// packages
import { checkBotId } from "botid/server";

// "block": a bot verdict makes checkHuman return false and the action returns its existing
// failure result (table in docs/progress.md). "log" records verdicts without blocking.
// every call is logged in both modes
export const BOTID_MODE: "log" | "block" = "block";

type Verdict = Awaited<ReturnType<typeof checkBotId>> | null;

// one botid verdict per request: the login action and nextauth's authorize run in the
// same request, so the second check reuses the first instead of a second deep analysis call.
// keyed on the request's headers object, which next keeps for the whole request
const verdicts = new WeakMap<object, Promise<Verdict>>();

async function verdict(): Promise<Verdict> {
  const requestHeaders = await headers();

  let pending = verdicts.get(requestHeaders);
  if (!pending) {
    pending = checkBotId().catch((err) => {
      console.error("[botid] check failed", err);
      return null;
    });
    verdicts.set(requestHeaders, pending);
  }

  return pending;
}

// true when the request may go on: a human, or "log" mode. the calling page must match a path
// in utils/bot-protection.ts. fails open: if botid itself errors, the request goes through
export async function checkHuman(action: string): Promise<boolean> {
  const result = await verdict();

  if (!result) {
    console.warn(`[botid] action=${action} mode=${BOTID_MODE} error=fail-open`);
    return true;
  }

  // only present on some result shapes
  const name = "verifiedBotName" in result ? result.verifiedBotName : undefined;

  console.log(
    `[botid] action=${action} mode=${BOTID_MODE} isBot=${result.isBot} verified=${result.isVerifiedBot} bypassed=${result.bypassed} name=${name ?? "-"}`,
  );

  if (BOTID_MODE === "log") return true;

  return !result.isBot;
}
