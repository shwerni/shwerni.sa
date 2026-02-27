import { handlePresenceWebhook } from "@/data/online";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const presenceEvents = body.events.filter(
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
