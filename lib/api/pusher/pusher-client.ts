"use client";
import PusherClient from "pusher-js";

let guestClient: PusherClient | null = null;
let consultantClient: PusherClient | null = null;

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export function createPusherClient(userId: string): PusherClient {
  // Guard against SSR — Pusher requires window
  if (typeof window === "undefined") {
    throw new Error("createPusherClient must only be called on the client");
  }

  if (!PUSHER_KEY || !PUSHER_CLUSTER) {
    throw new Error(
      "Missing Pusher env vars: NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER must be set",
    );
  }

  if (userId === "guest") {
    if (!guestClient || guestClient.connection.state === "disconnected") {
      guestClient = new PusherClient(PUSHER_KEY!, {
        cluster: PUSHER_CLUSTER,
      });
    }
    return guestClient;
  }

  if (
    !consultantClient ||
    consultantClient.connection.state === "disconnected"
  ) {
    consultantClient = new PusherClient(PUSHER_KEY!, {
      cluster: PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        params: { userId },
      },
    });
  }

  return consultantClient;
}

export function disconnectConsultantClient() {
  consultantClient?.disconnect();
  consultantClient = null;
}
