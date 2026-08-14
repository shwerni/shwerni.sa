// packages
import { toNextJsHandler } from "better-auth/next-js";

// utils
import { mobileAuth } from "@/lib/auth/mobile-auth";

export const { GET, POST } = toNextJsHandler(mobileAuth);