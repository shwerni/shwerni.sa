// prisma types
import { Categories } from "@/lib/generated/prisma/enums";

// acceptance requirements shown under the category picker
export const CATEGORY_QUALIFICATIONS: Partial<Record<Categories, string>> = {
  [Categories.FAMILY]:
    "بكالوريوس كحد أدنى من جامعة داخل المملكة أو خارجها معترف بها من وزارة التعليم، في أحد التخصصات: الإرشاد الأسري، الإرشاد النفسي، العلاج الأسري، الإرشاد الاجتماعي، علم الاجتماع، علم النفس، أو الخدمة الاجتماعية.",
  [Categories.PSYCHIC]:
    "شهادة جامعية في علم النفس أو مجال ذي صلة، مع ترخيص من الهيئة السعودية للتخصصات الصحية (SCHS) لمزاولة مهنة أخصائي نفسي في المملكة العربية السعودية.",
  [Categories.LAW]:
    "شهادة من كلية الشريعة أو بكالوريوس في الأنظمة، أو دبلوم دراسات الأنظمة من معهد الإدارة العامة بعد الشهادة الجامعية، مع ترخيص من الهيئة السعودية للمحامين.",
};
