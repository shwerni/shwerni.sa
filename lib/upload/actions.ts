"use server";
// pacakges
import axios from "axios";

// constants
import { mainRoute } from "@/constants/links";

// delete image on upload thing
export async function deleteImageAdmin(key: string) {
  // try delete
  try {
    const response = await axios.post(`${mainRoute}api/uploadthing/delete`, {
      key,
    });
    // return
    return response;
  } catch {
    // error
    return null;
  }
}
