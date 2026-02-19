// React & Next
import { NextResponse } from "next/server";

// prisma data

export async function POST(request: Request) {
  try {    
    // return
    return NextResponse.json({ success: false });
  } catch (error) {
    // return
    return NextResponse.json({ success: false });
  }
}
