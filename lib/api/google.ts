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

// youtube props
type Video = {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
};

export async function getYouTubeVideos(count: number = 5): Promise<Video[]> {
  // security
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  // get 5 videos from the channel
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${count}&type=video&videoDuration=short`;
  try {
    const res = await fetch(url, {
      // revalidate every 1 hour (3600 seconds) so you don't waste API quota
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();

    // transform data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&"),
      thumbnail: item.snippet.thumbnails.medium.url,
      date: new Date(item.snippet.publishedAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }));
  } catch {
    return [];
  }
}
