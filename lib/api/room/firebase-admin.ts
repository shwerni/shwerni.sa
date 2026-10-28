// packages
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let client: Messaging | null = null;

// built on the first call, once, never at import: a missing or invalid
// service account throws here, inside the caller's own error handling.
// reuses an already-initialized app if one exists (e.g. hot reload in
// dev), otherwise initializes from env vars — never from a committed
// json file
export function messaging(): Messaging {
  if (client) return client;

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

  client = getMessaging(app);
  return client;
}
