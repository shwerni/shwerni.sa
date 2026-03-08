"use server";
import { createRoom, getRoom } from "@/data/room";
// packages
import * as HMS from "@100mslive/server-sdk";

// hms
const hms = new HMS.SDK(process.env.MS100_KEY, process.env.MS100_SECRET);

// 100ms credentials
const templateId = process.env.MS100_TEMPLATEID;

// sleep function
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function CreateHMSToken(
  meetingId: string,
  orderId: number,
  roomName: string,
  userId: string,
  session: boolean = false,
  role: "speaker" | "listener" = "speaker",
) {
  try {
    // check if room exist
    let room = await getRoom(roomName);

    // validate
    if (!room) {
      // create room
      const newRoom = await hms.rooms.create({
        name: roomName,
        description: `Room for order #${roomName}`,
        template_id: templateId,
      });

      // create room code
      const url = await createRoomUrl(newRoom.id, role);

      // create room
      room = await createRoom(newRoom.id, meetingId, orderId, url, session);
    }

    // validate
    if (!room) return;

    // remove duplicates
    let removedCount = 0;
    try {
      // peers
      const peers = await hms.activeRooms.retrieveActivePeers(room?.roomId);

      // duplicates peers
      const duplicates = Object.values(peers)
        .filter(
          (p: HMS.ActiveRoom.Peer) => String(p.user_id) === String(userId),
        )
        .map((p: HMS.ActiveRoom.Peer) => p.id);

      // remove duplicates
      if (duplicates.length > 0) {
        await Promise.all(
          duplicates.map((peerId) =>
            hms.activeRooms.removePeer(room.roomId, { peer_id: peerId }),
          ),
        );
        removedCount = duplicates.length;
      }
    } catch {
      // 404 = no active session, room is empty, nothing to clean up
    }

    if (removedCount > 0) await sleep(800);

    // get auth token
    const token = await hms.auth.getAuthToken({
      roomId: room.roomId,
      userId,
      role,
    });

    // return token
    return token.token;
  } catch {
    // return
    return null;
  }
}

async function createRoomUrl(roomId: string, role: string) {
  // create room code
  const response = await hms.roomCodes.create(roomId);
  try {
    const codes = Array.isArray(response) ? response : [response];
    const code = codes.find((c) => c.role === role);

    return `https://shwerni-audioroom-1832.app.100ms.live/meeting/${code?.code}`;
  } catch {
    return null;
  }
}
