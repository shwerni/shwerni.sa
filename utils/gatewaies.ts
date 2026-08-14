export const Status = {
  initiated: "initiated",
  paid: "paid",
  failed: "failed",
  authorized: "authorized",
  captured: "captured",
  refunded: "refunded",
  voided: "voided",
  verified: "verified",
} as const;

export type Status = (typeof Status)[keyof typeof Status];

// moyasar reports 8 possible statuses — this maps each to how the app
// should treat it, since "not paid" isn't the same as "failed"
export function isMoyasarSettledPaid(status: Status) {
  // captured means the auto-capture completed — functionally the same
  // as paid under this app's manual:false config
  return status === Status.paid || status === Status.captured;
}

export function isMoyasarDefinitiveFailure(status: Status) {
  return status === Status.failed || status === Status.voided;
}