import Pusher from "pusher-js";

export const createPusherClient = (userId: string) =>
  new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
    auth: {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      params: { userId },
    },
  });
