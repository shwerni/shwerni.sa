"use server";

// React & Next
import { updateTag } from "next/cache";
import { after } from "next/server";

// packages
import { z } from "zod";

// prisma data
import {
  canRetryPleadingDocument,
  cancelPleading as cancelPleadingData,
  createPleadingDraft,
  declinePleading as declinePleadingData,
  finalizePleadingDraft,
  getPleadingBrief,
  quotePleading as quotePleadingData,
  sendPleadingMessage,
} from "@/data/pleading";
import { getOwnerCidByAuthor, setPleadingEnabled } from "@/data/consultant";

// handlers
import { PayPleading } from "@/handlers/admin/order/payment";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { createAction, fail, ok } from "@/lib/safe-action";
import { requestPleadingPdf } from "@/lib/pleading-pdf/request";
import { draftPleadingSummary as draftSummary } from "@/lib/api/ai/pleading-summary";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import {
  pleadingCheckoutSchema,
  pleadingClientMessageSchema,
  pleadingDeclineSchema,
  pleadingFinalizeSchema,
  pleadingOwnerMessageSchema,
  pleadingRequestSchema,
  pleadingToggleSchema,
  pleadingTokenSchema,
} from "@/utils/pleading";
import { pleadingQuoteSchema } from "@/utils/pleading-quote";

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

// consultant: the reply and the pre-vat price (integer, 100 to 100000), and the engagement
// agreement's optional blocks. the agreement pdf is generated after the response, over http
// (/api/internal/pleading-pdf: chromium never comes into this function)
export const quotePleading = createAction(
  {
    name: "pleading.quote",
    schema: pleadingQuoteSchema,
    auth: [UserRole.OWNER] as const,
    rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
  },
  async ({ plid, ...quote }, { user }) => {
    const result = await quotePleadingData({ plid, userId: user.id }, quote);
    if (!result.ok) return result;

    const { documentId } = result.data;
    after(() => requestPleadingPdf(documentId));
    return ok(null);
  },
);

// consultant: an ai draft of the agreement summary from the case brief (3 lines, 300 characters,
// no names, contact details or price). "" when nothing usable came back
export const draftPleadingSummary = createAction(
  {
    name: "pleading.summary",
    schema: z.object({ plid: z.number().int().positive() }),
    auth: [UserRole.OWNER] as const,
    rateLimit: [
      { by: "user", limit: 10, window: "1 m" },
      { by: "user", limit: 100, window: "1 d" },
    ],
  },
  async ({ plid }, { user }) => {
    const brief = await getPleadingBrief({ plid, userId: user.id });
    if (!brief) return fail("not_found");
    return ok({ summary: (await draftSummary(brief)) ?? "" });
  },
);

// consultant: generate the latest agreement version again (after a FAILED render, or one that
// never finished). the route's claim makes a double click harmless
export const retryPleadingDocument = createAction(
  {
    name: "pleading.document.retry",
    schema: z.object({
      plid: z.number().int().positive(),
      documentId: z.string().trim().min(1).max(64),
    }),
    auth: [UserRole.OWNER] as const,
    rateLimit: [{ by: "user", limit: 5, window: "1 m" }],
  },
  async ({ plid, documentId }, { user }) => {
    if (!(await canRetryPleadingDocument({ plid, userId: user.id }, documentId)))
      return fail("invalid_state");
    after(() => requestPleadingPdf(documentId));
    return ok(null);
  },
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

// PayPleading's failure steps → this action's error codes (anything else is a payment failure)
const checkoutErrors = {
  invalid: "invalid_input",
  not_found: "not_found",
  quote_closed: "quote_closed",
  unavailable: "unavailable",
  blocked: "blocked",
  already_paid: "already_paid",
  checkout_in_progress: "checkout_in_progress",
  conflict: "slot_taken",
} as const;

const checkoutError = (step?: string) =>
  checkoutErrors[step as keyof typeof checkoutErrors] ?? "payment_failed";

// public: the client books and pays the open quote (their link token is their identity). only
// the token, date, time, method and terms are accepted; on success PayPleading redirects to the
// gateway, so this only ever returns a failure
export const checkoutPleading = createAction(
  {
    name: "pleading.checkout",
    schema: pleadingCheckoutSchema,
    auth: "public",
    rateLimit: [{ by: "ip", limit: 10, window: "10 m" }],
  },
  async (input) => {
    if (!(await checkHuman("checkoutPleading"))) return fail("bot_detected");

    const result = await PayPleading(input);
    return fail(checkoutError(result?.step));
  },
);
