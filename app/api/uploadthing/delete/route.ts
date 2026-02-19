"use server";
// React & Next
import { NextResponse } from "next/server";

// packages
import { UTApi } from "uploadthing/server";

// delete files
export async function POST(request: Request) {
  // data
  const data = await request.json();
  // key
  const key = data.key;
  // upload thing api
  const utapi = new UTApi();
  // deleting files
  try {
    // delete image
    await utapi.deleteFiles(key);
    // return
    return NextResponse.json({
      success: true,
      message: "success",
    });
  } catch (error) {
    // error
    return NextResponse.json({
      success: false,
      message: "error",
    });
  }
}
