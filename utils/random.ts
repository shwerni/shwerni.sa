import "server-only";

// packages
import { randomBytes } from "node:crypto";

// server only: kept out of utils/index.ts, which client components import, because any
// client import of "crypto" ships a ~440 KB browser polyfill (crypto, stream, buffer)

// create random id
export const randomId = (length: number = 10) =>
  randomBytes(length / 2).toString("hex");
