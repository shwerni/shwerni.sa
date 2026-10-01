import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { moyasarPayment } from "@/handlers/gatewaies/moyasar";
import {
  moyasarRefundWebhook,
  moyasarSettlementWebhook,
} from "@/handlers/gatewaies/moyasar-webhook";

// the secret_token set in the moyasar dashboard; no fallback, an unset secret rejects every webhook
function isMoyasarWebhook(token: unknown) {
  const expected = Buffer.from(process.env.MOYASAR_WEBHOOK_SECRET ?? "");
  const provided = Buffer.from(typeof token === "string" ? token : "");

  if (!expected.length || provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  const body = await request.json();

  // enveloped merchant webhook: { id, type, created_at, secret_token, data, ... }
  // this is how payment_refunded, balance_transferred and every other event you
  // configured in the dashboard arrive — distinct from the raw invoice callback below
  if (typeof body.type === "string" && body.data) {
    // secret check before anything is read from the event
    if (!isMoyasarWebhook(body.secret_token)) {
      return NextResponse.json(
        { success: false, message: "unauthorized" },
        { status: 401 },
      );
    }

    try {
      switch (body.type) {
        case "payment_refunded": {
          const handled = await moyasarRefundWebhook(body.data);
          return NextResponse.json({
            success: handled,
            message: handled ? "refund handler sent" : "refund handler error",
          });
        }
        case "balance_transferred": {
          const handled = await moyasarSettlementWebhook(body.data);
          return NextResponse.json({
            success: handled,
            message: handled
              ? "settlement handler sent"
              : "settlement handler error",
          });
        }
        default:
          // payment_paid (duplicate delivery), payouts, etc. — acknowledged, no action
          return NextResponse.json({
            success: true,
            message: "event acknowledged",
          });
      }
    } catch {
      return NextResponse.json({
        success: false,
        message: "webhook handler error",
      });
    }
  }

  // raw invoice payload, posted directly to the invoice's own callback_url
  if (!body.payments)
    return NextResponse.json({
      success: false,
      message: "payment handler error: no payment data",
    });

  // only the invoice id is taken from the body; the handler re-fetches everything else
  const invoiceId = body.payments[0]?.invoice_id;
  if (typeof invoiceId !== "string" || !invoiceId)
    return NextResponse.json({
      success: false,
      message: "payment handler error: no payment data",
    });

  try {
    const moyasar = await moyasarPayment({ invoice_id: invoiceId });
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
