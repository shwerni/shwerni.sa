// lib
import prisma from "@/lib/database/db";

// expo push service accepts a max of 100 messages per request
const EXPO_PUSH_BATCH_SIZE = 100;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  // widened to accept prisma's JsonValue shape coming straight off a
  // notification row (string | number | boolean | object | array)
  data?: unknown;
  priority?: "default" | "normal" | "high";
  sound?: "default";
  // links this push to a client-registered notification category, which
  // is what actually attaches os-level action buttons (e.g. "mark done")
  categoryId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

// splits an array into fixed-size chunks
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

/**
 * sends push notifications through expo's push service in batches of 100,
 * pruning any tokens expo reports as no longer registered
 * @param messages notifications to send, each targeting one expo push token
 * @returns tickets reporting per-message delivery acceptance from expo
 */
export async function sendPushNotifications(
  messages: PushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) {
    console.warn("[push] sendPushNotifications called with zero messages - likely no registered push tokens for the due notifications");
    return [];
  }

  const batches = chunk(messages, EXPO_PUSH_BATCH_SIZE);
  const tickets: ExpoPushTicket[] = [];
  const deadTokens: string[] = [];

  for (const batch of batches) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      console.error(`[push] expo request failed with status ${response.status}`);
      continue;
    }

    const result = await response.json();
    const batchTickets: ExpoPushTicket[] = result.data ?? [];

    // expo returns tickets in the same order as the messages sent, so this
    // index lines each ticket back up with the token that produced it
    batchTickets.forEach((ticket, index) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        deadTokens.push(batch[index].to);
      }
    });

    tickets.push(...batchTickets);
  }

  const okCount = tickets.filter((t) => t.status === "ok").length;
  const errorTickets = tickets.filter((t) => t.status === "error");

  console.log(`[push] dispatched ${tickets.length} ticket(s): ${okCount} ok, ${errorTickets.length} error`);

  errorTickets
    .filter((t) => t.details?.error !== "DeviceNotRegistered")
    .forEach((t) => console.error("[push] expo ticket error:", t.message, t.details?.error));

  if (deadTokens.length > 0) {
    await prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } });
    console.warn(`removed ${deadTokens.length} push token(s) no longer registered`);
  }

  return tickets;
}