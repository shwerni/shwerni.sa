// account deletion (anonymization): the value that replaces a deleted client's name and phone
export const DELETED_USER_LABEL = "مستخدم محذوف";

// the deletion code: 5 digits, valid 5 minutes, at most 3 sends per 10 minutes, 5 wrong tries
export const DELETION_CODE_LENGTH = 5;
export const DELETION_CODE_TTL_SECONDS = 5 * 60;
export const DELETION_CODE_SENDS = 3;
export const DELETION_CODE_WINDOW = "10 m";
export const DELETION_CODE_MAX_TRIES = 5;

// the blockers' messages (the app's spec, shown as is)
export const DELETION_BLOCKERS = {
  upcoming_sessions:
    "لديك جلسات قادمة مدفوعة. تواصل مع الدعم لإلغائها قبل حذف الحساب.",
  wallet_balance:
    "لديك رصيد في المحفظة. استخدمه في حجز أو تواصل مع الدعم لاسترداده قبل حذف الحساب.",
} as const;

export type DeletionBlockerCode = keyof typeof DELETION_BLOCKERS;
