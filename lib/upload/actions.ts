"use server";

// constants
import { mainRoute } from "@/constants/links";

// delete image on upload thing
export async function deleteImageAdmin(key: string) {
  // try delete
  try {
    const response = await fetch(`${mainRoute}api/uploadthing/delete`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    // return
    return response.json();
  } catch {
    // error
    return null;
  }
}