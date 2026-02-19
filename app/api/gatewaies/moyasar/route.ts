"use server";
// React & Next
import { NextResponse } from "next/server";

// handler
import { moyasarPayment } from "@/handlers/gatewaies/moyasar";

// handle incoming webhook requests
export async function POST(request: Request) {
  // data
  const data = await request.json();

  // moyasar webhook data
  const payment = data.payments[0];

  // sending payment handler
  try {
    // moyasar payment handler
    const moyasar = await moyasarPayment(payment);

    // moyasar
    if (moyasar) {
      return NextResponse.json({
        success: true,
        message: "payment handler sent",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "payment handler error",
      });
    }
  } catch {
    return NextResponse.json({
      success: false,
      message: "payment handler error",
    });
  }
}
