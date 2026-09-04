// packages
import http2 from "node:http2";
import jwt from "jsonwebtoken";

// utils
import { HttpError } from "@/lib/api/http-error";
import prisma from "@/lib/database/db";
import { messaging } from "@/lib/api/room/firebase-admin";

// shape expected by expo-callkit-telecom's native voip push parsing
interface IncomingCallEvent {
  eventId: string;
  serverCallId: string;
  hasVideo: boolean;
  startedAt: string;
  caller: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

// apns requires a fresh es256 jwt signed with the .p8 auth key, valid up
// to 1hr — cached so we don't resign on every single push
let cachedApnsToken: { token: string; issuedAt: number } | null = null;

const getApnsAuthToken = () => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedApnsToken && now - cachedApnsToken.issuedAt < 1800) {
    return cachedApnsToken.token;
  }

  const token = jwt.sign({}, process.env.APNS_AUTH_KEY!.replace(/\\n/g, "\n"), {
    algorithm: "ES256",
    issuer: process.env.APNS_TEAM_ID,
    header: { alg: "ES256", kid: process.env.APNS_KEY_ID! },
  });

  cachedApnsToken = { token, issuedAt: now };
  return token;
};

// apns' provider api requires http/2 specifically — node's global fetch
// isn't guaranteed to negotiate http/2, so this uses node:http2 directly
// rather than risk a silent protocol downgrade
const sendApnsVoipPush = (deviceToken: string, event: IncomingCallEvent) =>
  new Promise<void>((resolve, reject) => {
    const host =
      process.env.APNS_ENV === "production"
        ? "https://api.push.apple.com"
        : "https://api.sandbox.push.apple.com";

    const client = http2.connect(host);
    client.on("error", reject);

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${getApnsAuthToken()}`,
      "apns-topic": `${process.env.APNS_BUNDLE_ID}.voip`,
      "apns-push-type": "voip",
      "apns-priority": "10",
    });

    let status = 0;
    req.on("response", (headers) => {
      status = Number(headers[":status"]);
    });

    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      client.close();
      if (status >= 200 && status < 300) {
        resolve();
      } else {
        reject(new Error(`apns voip push failed: ${status} ${body}`));
      }
    });
    req.on("error", (err) => {
      client.close();
      reject(err);
    });

    req.end(JSON.stringify({ incomingCall: event }));
  });

// fcm data message — no "notification" key, so it's delivered as a plain
// data payload the module parses natively before js runs. uses the
// shared, pre-initialized messaging instance — a bare getMessaging()
// call has no default app to fall back to unless initializeApp() ran
// somewhere else in this same execution, which it won't in a cron's
// own serverless invocation
const sendFcmVoipPush = async (
  deviceToken: string,
  event: IncomingCallEvent,
) => {
  await messaging.send({
    token: deviceToken,
    data: {
      messageType: "incomingCall",
      incomingCall: JSON.stringify(event),
    },
    android: { priority: "high" },
  });
};

// looks up the callee's latest voip token and sends through whichever
// transport they're registered on — returns false if they have no token
// on file (never opened the app / never granted push) rather than throwing,
// since a caller not being reachable isn't itself an error
export const dispatchIncomingCall = async (
  userId: string,
  event: IncomingCallEvent,
): Promise<boolean> => {
  const push = await prisma.voipPushToken.findUnique({ where: { userId } });
  if (!push) return false;

  try {
    if (push.type === "APNS_VOIP") {
      await sendApnsVoipPush(push.token, event);
    } else {
      await sendFcmVoipPush(push.token, event);
    }
    return true;
  } catch (error) {
    console.error("[voip-push-error]", error);
    throw new HttpError("failed to ring the other participant", 502);
  }
};
