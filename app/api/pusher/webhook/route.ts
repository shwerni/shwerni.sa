import { handlePresenceWebhook } from "@/data/online";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Loop through the events sent by Pusher
    for (const event of body.events) {
      if (event.channel === "presence-consultants") {
        
        if (event.name === "member_added") {
          await handlePresenceWebhook(event.user_id, true);
        } 
        else if (event.name === "member_removed") {
          await handlePresenceWebhook(event.user_id, false);
        }

      }
    }

    // Acknowledge receipt to Pusher
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("Pusher Webhook Error:", error);
    return new Response("Error", { status: 500 });
  }
}