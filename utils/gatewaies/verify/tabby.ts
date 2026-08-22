// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

const TABBY_ENDPOINT = process.env.TABBY_ENDPOINT as string;
const TABBY_SECRET = process.env.TABBY_SECRET as string;

interface VerifyResult {
  state: PaymentState;
  failureReason: string | null;
}

/**
 * re-verifies a tabby payment directly against tabby's api
 */
export async function verifyTabbyPayment(
  paymentId: string,
): Promise<VerifyResult> {
  const res = await fetch(`${TABBY_ENDPOINT}payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${TABBY_SECRET}` },
  });

  const tabby = await res.json();

  if (tabby.status === "AUTHORIZED" || tabby.status === "CLOSED") {
    return { state: PaymentState.PAID, failureReason: null };
  }

  if (tabby.status === "REJECTED" || tabby.status === "EXPIRED") {
    return { state: PaymentState.REFUSED, failureReason: null };
  }

  return { state: PaymentState.NEW, failureReason: null };
}
