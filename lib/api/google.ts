"use server";
import { google } from "googleapis";

// get meetings
function getMeetClient() {
  if (!process.env.MEET_PRIVATE_KEY || !process.env.MEET_CLIENT_EMAIL) {
    throw new Error("Google Meet API environment variables are missing!");
  }

  // google.auth.JWT flawlessly handles Domain-Wide Delegation ("subject")
  const authClient = new google.auth.JWT({
    email: process.env.MEET_CLIENT_EMAIL,
    key: process.env.MEET_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/meetings.space.created"],
    subject: process.env.MEET_SERVICE_EMAIL,
  });

  // Returns a pure REST client — no 'fallback' tricks needed!
  return google.meet({
    version: "v2",
    auth: authClient,
  });
}

export async function createGoogleMeeting() {
  const meet = getMeetClient();

  const response = await meet.spaces.create({
    requestBody: {
      config: {
        accessType: "OPEN",
      },
    },
  });
  return response.data.meetingUri;
}

export async function endMeeting(name: string) {
  const meet = getMeetClient();

  const response = await meet.spaces.endActiveConference({
    name,
    requestBody: {},
  });

  return response.data;
}

export async function adminCreateMeeting() {
  const meet = getMeetClient();

  const response = await meet.spaces.create({
    requestBody: {
      config: {
        accessType: "OPEN",
      },
    },
  });
  return response.data.meetingUri;
}
