"use server";
import { createRoom, getRoom } from "@/data/room";
// packages
import * as HMS from "@100mslive/server-sdk";

// hms
const hms = new HMS.SDK(process.env.MS100_KEY, process.env.MS100_SECRET);

// 100ms credentials
const templateId = process.env.MS100_TEMPLATEID;

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

      // create room
      room = await createRoom(newRoom.id, meetingId, orderId, session);
    }

    // validate
    if (!room) return;

    // remove duplicates
    try {
      // peers
      const peers = await hms.activeRooms.retrieveActivePeers(room?.roomId);

      // duplicates peers
      const duplicates = Object.values(peers)
        .filter((p: HMS.ActiveRoom.Peer) => p.user_id === userId)
        .map((p: HMS.ActiveRoom.Peer) => p.id);

      // remove duplicates
      if (duplicates.length > 0)
        await Promise.all(
          duplicates.map((peerId) =>
            hms.activeRooms.removePeer(room.roomId, {
              peer_id: peerId,
            }),
          ),
        );
    } catch {
      // 404 = no active session, room is empty, nothing to clean up
    }

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

// retrieve room
// const room = await hms.rooms.retrieveByName(name);
