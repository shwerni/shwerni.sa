"use server";
// packages
import { GoogleAuth } from "google-auth-library";
import { v2 } from "@google-apps/meet";

// google space service
const { SpacesServiceClient } = v2;

// utils
import { meetingSchedule } from "@/utils/schedule/google";

// google scopes
const scopes = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/admin.directory.user",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.addons.execute",
];

// google auth
async function authenticate() {
  // create google auth
  return new GoogleAuth({
    credentials: {
      client_email: process.env.MEET_CLIENT_EMAIL,
      private_key: process.env.MEET_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes,
  });
}

// create meet
export async function createMeeting(duration: number) {
  // authenticat
  // meeting client
  const meetClient = new SpacesServiceClient({
    credentials: {
      client_email: process.env.MEET_CLIENT_EMAIL,
      private_key: process.env.MEET_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
  });
  // request body
  const request = {
    space: {
      config: {
        accessType: 1,
      },
    },
  };
  // create space (meeting)
  const response = await meetClient.createSpace(request);
  // end meeting schedule
  // meetingSchedule(duration, response[0].name);
  // return
  return response[0].meetingUri;
}

export async function endMeeting(name: string) {
  // authenticat
  const auth = await authenticate();

  // meeting client
  const meetClient = new SpacesServiceClient({
    credentials: {
      client_email: process.env.MEET_CLIENT_EMAIL,
      private_key: process.env.MEET_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
  });

  // request body
  const request = {
    name,
  };
  // create space (meeting)
  const response = await meetClient.endActiveConference(request);
  // return
  return response;
}

// create meet
export async function adminCreateMeeting(duration?: number) {
  // authentica
  const auth = await authenticate();

  // meeting client
  const meetClient = new SpacesServiceClient({
    credentials: {
      client_email: process.env.MEET_CLIENT_EMAIL,
      private_key: process.env.MEET_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
  });
  // request body
  const request = {
    space: {
      config: {
        accessType: 1,
      },
    },
  };
  // create space (meeting)
  const response = await meetClient.createSpace(request);
  // end meeting schedule
  if (duration) meetingSchedule(duration, response[0].name || "");
  // return
  return response[0].meetingUri;
}
