"use server";

// React & Next
import { updateTag } from "next/cache";

// prisma data
import {
  cancelPleading as cancelPleadingData,
  createPleadingDraft,
  declinePleading as declinePleadingData,
  finalizePleadingDraft,
  quotePleading as quotePleadingData,
  sendPleadingMessage,
} from "@/data/pleading";
import { getOwnerCidByAuthor, setPleadingEnabled } from "@/data/consultant";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { createAction, fail, ok } from "@/lib/safe-action";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import {
  pleadingClientMessageSchema,
  pleadingDeclineSchema,
  pleadingFinalizeSchema,
  pleadingOwnerMessageSchema,
  pleadingQuoteSchema,
  pleadingRequestSchema,
  pleadingToggleSchema,
  pleadingTokenSchema,
} from "@/utils/pleading";

// the client side of a case is public (guests too): their link token is their identity, and
// "not found" and "not yours" are the same answer. never a token in a rate limit key: keys
// are stored and logged. the consultant side is the OWNER session, ownership checked in the query

// public: step 1 of the request form. the brief becomes the case chat's first message
export const requestPleading = createAction(
  {
    name: "pleading.request",
    schema: pleadingRequestSchema,
    auth: "public",
    rateLimit: [
      { by: "ip", limit: 5, window: "1 h" },
      { by: (input) => input.phone, limit: 3, window: "1 h" },
    ],
  },
  async (input, { user }) => {
    if (!(await checkHuman("requestPleading"))) return fail("bot_detected");

    // the author comes from the session only (null for a guest)
    return createPleadingDraft({ ...input, author: user?.id ?? null });
  },
);

// public: step 2, after the uploads. the case goes to the consultant
export const finalizePleadingRequest = createAction(
  {
    name: "pleading.finalize",
    schema: pleadingFinalizeSchema,
    auth: "public",
    rateLimit: [{ by: "ip", limit: 20, window: "1 h" }],
  },
  async ({ token, files }) => {
    if (!(await checkHuman("finalizePleadingRequest")))
      return fail("bot_detected");

    return finalizePleadingDraft(token, files);
  },
);

// public: the client's case chat message (sender USER from the token)
export const sendPleadingClientMessage = createAction(
  {
    name: "pleading.message.client",
    schema: pleadingClientMessageSchema,
    auth: "public",
    rateLimit: [{ by: "ip", limit: 30, window: "1 m" }],
  },
  async ({ token, content, file }) => {
    if (!(await checkHuman("sendPleadingClientMessage")))
      return fail("bot_detected");

    return sendPleadingMessage({ token }, { content, file });
  },
);

// public: the client withdraws an open case
export const cancelPleading = createAction(
  {
    name: "pleading.cancel",
    schema: pleadingTokenSchema,
    auth: "public",
    rateLimit: [{ by: "ip", limit: 10, window: "1 h" }],
  },
  async ({ token }) => {
    if (!(await checkHuman("cancelPleading"))) return fail("bot_detected");

    return cancelPleadingData({ token });
  },
);

// consultant: a case chat message (sender OWNER from the session)
export const sendPleadingOwnerMessage = createAction(
  {
    name: "pleading.message.owner",
    schema: pleadingOwnerMessageSchema,
    auth: [UserRole.OWNER] as const,
    rateLimit: [{ by: "user", limit: 30, window: "1 m" }],
  },
  async ({ plid, content, file }, { user }) =>
    sendPleadingMessage({ plid, userId: user.id }, { content, file }),
);

// consultant: the reply and the pre-vat price (integer, 100 to 100000)
export const quotePleading = createAction(
  {
    name: "pleading.quote",
    schema: pleadingQuoteSchema,
    auth: [UserRole.OWNER] as const,
    rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
  },
  async ({ plid, reply, price }, { user }) =>
    quotePleadingData({ plid, userId: user.id }, { reply, price }),
);

// consultant: declines an open case, with an optional reason (the client is always notified)
export const declinePleading = createAction(
  {
    name: "pleading.decline",
    schema: pleadingDeclineSchema,
    auth: [UserRole.OWNER] as const,
    rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
  },
  async ({ plid, reason }, { user }) =>
    declinePleadingData({ plid, userId: user.id }, reason),
);

// consultant: the pleading opt-in (LAW consultants only)
export const togglePleading = createAction(
  {
    name: "pleading.toggle",
    schema: pleadingToggleSchema,
    auth: [UserRole.OWNER] as const,
    rateLimit: [{ by: "user", limit: 10, window: "1 m" }],
  },
  async ({ enabled }, { user }) => {
    const cid = await getOwnerCidByAuthor(user.id);
    if (!cid) return fail("forbidden");

    if (!(await setPleadingEnabled(cid, enabled))) return fail("not_law");

    // the public pleading page's consultant list
    updateTag("pleading-consultants");

    return ok({ enabled });
  },
);
