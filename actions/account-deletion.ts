"use server";

// packages
import { z } from "zod";

// lib
import { HttpError } from "@/lib/api/http-error";
import { checkHuman } from "@/lib/bot-protection";
import { createAction, fail, ok } from "@/lib/safe-action";

// handlers
import {
  checkAccountDeletion,
  checkAccountDeletionByPhone,
  deleteAccount,
  deleteAccountByPhone,
  requestAccountDeletionCode,
  requestAccountDeletionCodeByPhone,
} from "@/handlers/clients/account-deletion";

// prisma data
import type { DeletionBlocker } from "@/data/account-deletion";

// schemas
import { schemas } from "@/schemas/schemas";

// utils
import { phoneNumber } from "@/utils";

// the website's /account/delete page (public: Google Play's web link, reachable without the app).
// signed in: the session's account, its own phone. signed out: the phone and the code sent to it
// identify the account. the same handlers as the app's routes (handlers/clients/account-deletion.ts)

const phoneSchema = schemas.phone.transform(phoneNumber);
const codeSchema = z.string().regex(/^\d{5}$/);

// the handlers' http errors as this page's error codes
const deletionError = (err: unknown) => {
  if (err instanceof HttpError) {
    if (err.status === 400) return fail("wrong_code");
    if (err.status === 403) return fail("not_self_service");
    if (err.status === 409) return fail("blocked");
    if (err.status === 429) return fail("rate_limited");
  }
  throw err;
};

type DeletionStart =
  | { signedIn: false }
  | { signedIn: true; selfService: boolean; blockers: DeletionBlocker[] };

// the page's first state: signed in → the check of the session's account; signed out → the phone step
export const startAccountDeletion = createAction(
  { name: "account-delete.start", schema: z.object({}), auth: "public" },
  async (_input, { user }) => {
    if (!user) return ok<DeletionStart>({ signedIn: false });
    try {
      const { blockers } = await checkAccountDeletion(user.id);
      return ok<DeletionStart>({ signedIn: true, selfService: true, blockers });
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        return ok<DeletionStart>({ signedIn: true, selfService: false, blockers: [] });
      }
      throw err;
    }
  },
);

// the code: signed in → the account's own phone (any phone sent is ignored); signed out → the
// phone's account, the same answer whether it exists or not
export const sendAccountDeletionCode = createAction(
  {
    name: "account-delete.code",
    schema: z.object({ phone: phoneSchema.optional() }),
    auth: "public",
    rateLimit: [{ by: "ip", limit: 10, window: "10 m" }],
  },
  async (input, { user }) => {
    if (!(await checkHuman("sendAccountDeletionCode"))) return fail("bot_detected");
    try {
      if (user) return ok(await requestAccountDeletionCode(user.id));
      if (!input.phone) return fail("invalid_input");
      return ok(await requestAccountDeletionCodeByPhone(input.phone));
    } catch (err) {
      return deletionError(err);
    }
  },
);

// signed out: the phone's code proves the account; then its check (the code stays for the deletion)
export const verifyAccountDeletionCode = createAction(
  {
    name: "account-delete.verify",
    schema: z.object({ phone: phoneSchema, code: codeSchema }),
    auth: "public",
    rateLimit: [{ by: "ip", limit: 20, window: "10 m" }],
  },
  async (input) => {
    if (!(await checkHuman("verifyAccountDeletionCode"))) return fail("bot_detected");
    try {
      return ok(await checkAccountDeletionByPhone(input.phone, input.code));
    } catch (err) {
      return deletionError(err);
    }
  },
);

// the deletion (anonymization): signed in → the session's account; signed out → the phone's
export const confirmAccountDeletion = createAction(
  {
    name: "account-delete.confirm",
    schema: z.object({ phone: phoneSchema.optional(), code: codeSchema }),
    auth: "public",
    rateLimit: [{ by: "ip", limit: 20, window: "10 m" }],
  },
  async (input, { user }) => {
    if (!(await checkHuman("confirmAccountDeletion"))) return fail("bot_detected");
    try {
      if (user) return ok(await deleteAccount(user.id, input.code));
      if (!input.phone) return fail("invalid_input");
      return ok(await deleteAccountByPhone(input.phone, input.code));
    } catch (err) {
      return deletionError(err);
    }
  },
);
