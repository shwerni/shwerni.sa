"use server";

import { v2 } from "@google-apps/meet";

const { SpacesServiceClient } = v2;

// The client initializes auth lazily and synchronously, 
// so you no longer need this to be an async function.
function createMeetClient() {
  return new SpacesServiceClient({
    // 1. Pass credentials directly to avoid module version mismatches
    credentials: {
      client_email: process.env.MEET_CLIENT_EMAIL,
      private_key: process.env.MEET_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/meetings.space.created"],
    // 2. Use clientOptions to pass the Domain-Wide Delegation subject
    clientOptions: {
      subject: process.env.MEET_SERVICE_EMAIL,
    },
    // 3. Force REST over HTTP/1.1 instead of gRPC (Crucial for Next.js)
    fallback: true,
  });
}

export async function createMeeting() {
  const meetClient = createMeetClient();
  const response = await meetClient.createSpace({
    space: { config: { accessType: 1 } },
  });
  return response[0].meetingUri;
}

export async function endMeeting(name: string) {
  const meetClient = createMeetClient();
  return await meetClient.endActiveConference({ name });
}

export async function adminCreateMeeting() {
  const meetClient = createMeetClient();
  const response = await meetClient.createSpace({
    space: { config: { accessType: 1 } },
  });
  return response[0].meetingUri;
}