"use client";

// packages
import useSWR from "swr";

// prisma types
import type { PleadingState, UserRole } from "@/lib/generated/prisma/enums";

// schemas
import type { MeetingMessage } from "@/schemas/chat";

// what /api/pleadings/[plid]/chat returns (dates as json strings)
export type PleadingCaseData = {
  plid: number;
  state: PleadingState;
  price: number | null;
  quotedAt: string | null;
  expiresAt: string | null;
  checkout: "paid" | "running" | null;
  role: UserRole;
  messages: (MeetingMessage & { blocked?: boolean })[];
};

// one key for the chat and the case panel, so they share a single poll. the client's link token
// goes in a header, never in the url
const caseKey = (plid: number, token?: string) =>
  [`/api/pleadings/${plid}/chat`, token ?? ""] as const;

const fetcher = async ([url, token]: readonly [string, string]) => {
  const res = await fetch(
    url,
    token ? { headers: { "x-pleading-token": token } } : undefined,
  );
  if (!res.ok) throw new Error(`pleading chat ${res.status}`);
  return (await res.json()) as PleadingCaseData;
};

// the case and its chat, polled like the meeting chat
export function usePleadingCase(plid: number, token?: string) {
  return useSWR(caseKey(plid, token), fetcher, {
    refreshInterval: 7000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });
}
