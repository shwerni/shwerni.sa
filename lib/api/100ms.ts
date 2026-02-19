"use server";
// packages
import * as HMS from "@100mslive/server-sdk";

// 100ms credentials
const accessKey = process.env.MS100_KEY;
const secret = process.env.MS100_SECRET;
const templateId = process.env.MS100_TEMPLATEID;

// hms
const hms = new HMS.SDK(accessKey, secret);

export async function CreateHMSToken(id: string, oid: number, author: string) {
  try {
    // roomId
    const roomName = oid + id;

    // check if room exist
    const room = await retrieveRoomByName(roomName);

    // validate
    if (!room) {
      // create room
      const newRoom = await hms.rooms.create({
        name: roomName,
        description: `Room for order #${roomName}`,
        template_id: templateId,
      });

      // get auth token
      const token = await hms.auth.getAuthToken({
        roomId: newRoom.id,
        userId: author,
        role: "speaker",
      });

      // return token
      return token.token;
    }

    // get auth token
    const token = await hms.auth.getAuthToken({
      roomId: room,
      userId: author,
      role: "speaker",
    });

    // return token
    return token.token;
  } catch {
    // return
    return null;
  }
}

async function retrieveRoomByName(name: string) {
  try {
    // check if room exist
    const room = await hms.rooms.retrieveByName(name);

    // exist
    return room.id;
  } catch {
    return null;
  }
}
