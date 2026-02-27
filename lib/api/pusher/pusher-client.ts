"use client";
import PusherClient from "pusher-js";

let guestClient: PusherClient | null = null;
let consultantClient: PusherClient | null = null;

export function createPusherClient(userId: string): PusherClient {
  // Guard against SSR — Pusher requires window
  if (typeof window === "undefined") {
    throw new Error("createPusherClient must only be called on the client");
  }

  if (userId === "guest") {
    if (!guestClient || guestClient.connection.state === "disconnected") {
      guestClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
    }
    return guestClient;
  }

  if (
    !consultantClient ||
    consultantClient.connection.state === "disconnected"
  ) {
    consultantClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
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
