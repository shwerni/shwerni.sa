// types
import type { BaseActionError } from "@/types/action";

// arabic messages for the codes every action can return
export const baseActionErrors = {
  invalid_input: "تأكد من صحة البيانات المدخلة",
  unauthorized: "يجب تسجيل الدخول أولاً",
  forbidden: "ليس لديك صلاحية للقيام بهذا الإجراء",
  rate_limited: "محاولات كثيرة، حاول مرة أخرى بعد قليل",
  bot_detected: "تعذر التحقق من الطلب، حدّث الصفحة وحاول مرة أخرى",
  server_error: "حدث خطأ غير متوقع، حاول مرة أخرى",
} satisfies Record<BaseActionError, string>;

// the action never answered: blocked by the firewall (429) or the connection dropped
export const networkError =
  "محاولات كثيرة أو مشكلة في الاتصال، حاول مرة أخرى بعد قليل";
