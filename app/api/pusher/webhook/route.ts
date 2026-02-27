import { createHmac } from "crypto";
import { handlePresenceWebhook } from "@/data/online";

export async function POST(req: Request) {
  try {
    const body = await req.text();

    // Verify signature
    const signature = req.headers.get("x-pusher-signature") ?? "";
    const expectedSignature = createHmac("sha256", process.env.PUSHER_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid Pusher webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(body);

    const presenceEvents = payload.events.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) =>
        e.channel === "presence-consultants" &&
        (e.name === "member_added" || e.name === "member_removed"),
    );

    if (presenceEvents.length === 0) return new Response("OK", { status: 200 });

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      presenceEvents.map((event: any) =>
        handlePresenceWebhook(event.user_id, event.name === "member_added"),
      ),
    );

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
