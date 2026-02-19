export const sTemplateNewOrderOwner = (
  oid: string,
  name: string,
  duration: string,
  meeting: string,
  url: string
) => {
  return `مستشارنا الكريم\nلديكم حجز جديد\nبيانات الحجز\nاسم العميل: ${name}\nرقم الطلب: ${oid}\nالمدة: ${duration}\nموعد الاستشارة: ${meeting}\nرابط الاجتماع: ${url}`;
};

export const sTemplateOtp = (otp: string | number) => {
  return `${otp}\n كود التحقق الخاص بتفعيل حسابك علي منصة شاورني`;
};
