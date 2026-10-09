import "server-only";

// packages
import { randomBytes } from "node:crypto";

// the client's identity for one pleading case: 32 random bytes, base64url (43 characters).
// it travels only in the client's whatsapp link and in their own requests; never log it and
// never send it to the consultant
export const newClientToken = () => randomBytes(32).toString("base64url");
