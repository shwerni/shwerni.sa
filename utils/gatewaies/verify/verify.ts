// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";
import {
  isMoyasarDefinitiveFailure,
  isMoyasarSettledPaid,
} from "@/utils/gatewaies";

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET!;

interface VerifyResult {
  state: PaymentState;
  failureReason: string | null;
}

/**
 * re-verifies a moyasar payment directly against moyasar's api - never
 * trusts the client-reported sdk result alone
 */
export async function verifyMoyasarPayment(
  paymentId: string,
  expectedTotal: number,
  expectedOid: number,
): Promise<VerifyResult> {
  const res = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${MOYASAR_SECRET_KEY}:`).toString("base64")}`,
    },
  });

  const moyasar = await res.json();

  const amountMatches = moyasar.amount === Math.round(expectedTotal * 100);
  const oidMatches = moyasar.metadata?.oid === expectedOid;

  if (isMoyasarSettledPaid(moyasar.status) && amountMatches && oidMatches) {
    return { state: PaymentState.PAID, failureReason: null };
  }

  if (isMoyasarDefinitiveFailure(moyasar.status)) {
    return {
      state: PaymentState.REFUSED,
      failureReason: moyasar.source?.message ?? null,
    };
  }

  return { state: PaymentState.NEW, failureReason: null };
}
