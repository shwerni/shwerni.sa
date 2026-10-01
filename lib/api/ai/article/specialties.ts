"use server";
import prisma from "@/lib/database/db";
import { GoogleGenAI } from "@google/genai";

const SPECIALTIES = [
  {
    id: 1001,
    name: "إدارة التغيير",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1002,
    name: "إدارة الضغوط",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1003,
    name: "إدارة الوقت",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1004,
    name: "اتخاذ القرارات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1005,
    name: "اضطراب المزاج",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1006,
    name: "اضطراب الهوية الجنسية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1007,
    name: "اضطراب ثنائي القطب",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1008,
    name: "اضطراب مابعد الصدمة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1009,
    name: "اضطرابات الاكل",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1010,
    name: "اضطرابات الشخصية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1011,
    name: "اضطرابات النوم",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1012,
    name: "اكتشاف الذات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1013,
    name: "الأرق ومشاكل النوم",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1014,
    name: "الإحتراق الوظيفي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1015,
    name: "الاكتئاب",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1016,
    name: "الانتقال الوظيفي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1017,
    name: "البحث عن الوظائف",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1018,
    name: "التدريب على المقابلات الوظيفية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1019,
    name: "التعامل مع الزملاء",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1020,
    name: "التعامل مع الغضب",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1021,
    name: "التعامل مع المدير",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1022,
    name: "التعامل مع تأنيب الضمير",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1023,
    name: "التعامل مع لوم الذات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1024,
    name: "التفكير الزائد",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1025,
    name: "التفكير بالانتحار",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1026,
    name: "التميز في العلاقات الاجتماعية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1027,
    name: "التميز في العمل",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1028,
    name: "الثقة بالنفس",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1029,
    name: "الخوف",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1030,
    name: "الخوف من الظلام",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1031,
    name: "الخوف من الموت",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1032,
    name: "الذكاء العاطفي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1033,
    name: "الرهاب الاجتماعي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1034,
    name: "الشخصية التجنبية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1035,
    name: "الشخصية الحدية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1036,
    name: "الشخصية النرجسية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1037,
    name: "الشك والغيرة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1038,
    name: "الصحة الجنسية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1039,
    name: "الضغوط النفسية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1040,
    name: "العزلة والانطواء",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1041,
    name: "الفراغ العاطفي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1042,
    name: "الفصام",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1043,
    name: "القلق والتوتر",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1044,
    name: "القيادة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1045,
    name: "القيم",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1046,
    name: "الكذب",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1047,
    name: "المرونة النفسية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1048,
    name: "المسار المهني",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1049,
    name: "المهارات الناعمة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1050,
    name: "الهلع",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1051,
    name: "الوسواس القهري",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1052,
    name: "بناء العادات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1053,
    name: "تحديات العمل",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1054,
    name: "تحديد الأهداف",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1055,
    name: "تحسين الأداء الرياضي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1056,
    name: "ترتيب الأولويات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1057,
    name: "تطوير الأداء",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1058,
    name: "تطوير المسار المهني",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1059,
    name: "تطوير مهارات القيادة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1060,
    name: "تعزيز التفكير الإيجابي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1061,
    name: "تغيير الوظيفة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1062,
    name: "تكوين العلاقات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1063,
    name: "توهم المرض",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1064,
    name: "ضعف تقدير الذات",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1065,
    name: "علاج الإدمان",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1066,
    name: "قضم الاظافر",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1067,
    name: "كتابة السيرة الذاتية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1068,
    name: "مشاكل عاطفية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1069,
    name: "مشاهدة الأفلام الإباحية",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1070,
    name: "مهارات التخطيط",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1071,
    name: "مهارات التواصل الاجتماعي",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1072,
    name: "مهارات الخطابة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1073,
    name: "مهارات العرض والتقديم",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1074,
    name: "مهارة التفاوض",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1075,
    name: "مهارة التواصل",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1076,
    name: "مهارة صنع واتخاذ القرار",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1077,
    name: "نتف الشعر",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1078,
    name: "نقاط القوة",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 1079,
    name: "وضع الخطط قصيرة وطويلة المدى",
    category: "PSYCHIC",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2001,
    name: "احتواء زوجي",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2002,
    name: "اضطرابات المراهقين",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2003,
    name: "الانفصال والطلاق",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2004,
    name: "الاضطرابات النمائية",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2005,
    name: "التعامل مع الاحتياجات الخاصة",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2006,
    name: "التعامل مع المدمن",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2007,
    name: "التعامل مع المراهقين",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2008,
    name: "التعامل مع كبار السن",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2009,
    name: "التوحد",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2010,
    name: "الخيانة الزوجية",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2011,
    name: "الطلاق العاطفي",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2012,
    name: "العلاقات",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2013,
    name: "العلاقات الحميمية",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2014,
    name: "العلاقة بين الوالدين والابناء",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2015,
    name: "العناد",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2016,
    name: "تحسين العلاقات",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2017,
    name: "تربية الأطفال",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2018,
    name: "تعديل السلوك",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2019,
    name: "صمت الزوج",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2020,
    name: "عدم الاهتمام والتقدير",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2021,
    name: "عدم التفهم بين الطرفين",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2022,
    name: "مشاكل العلاقات",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 2023,
    name: "مشاكل ما قبل الزواج",
    category: "FAMILY",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3001,
    name: "بناء الثقة بالنفس وتقدير الذات",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3002,
    name: "الوعي الذاتي وتحليل نقاط القوة والضعف",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3003,
    name: "إدارة الغضب والتعامل مع لوم الذات وتأنيب الضمير",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3004,
    name: "الذكاء العاطفي والمرونة النفسية",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3005,
    name: "مهارات التواصل الفعّال (الشفوي والمكتوب)",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3006,
    name: "مهارات الخطابة والعرض والتقديم (Public Speaking)",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3007,
    name: "مهارات التفاوض والإقناع",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3008,
    name: "التفكير النقدي والإبداعي (Lateral Thinking)",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3009,
    name: "فن بناء العلاقات الاجتماعية والمهنية",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3010,
    name: "تطوير مهارات القيادة والإدارة",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3011,
    name: "إدارة الوقت وتحديد الأولويات",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3012,
    name: "التنظيم الذاتي وجدولة المهام",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3013,
    name: "اتخاذ القرارات وحل المشكلات",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3014,
    name: "إدارة الضغوط والإجهاد في العمل",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3015,
    name: "التخطيط الاستراتيجي (قصير وطويل المدى)",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3016,
    name: "تحسين الأداء الوظيفي والإنتاجية",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3017,
    name: "التميز في العمل والانتقال الوظيفي",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3018,
    name: "إدارة التغيير والتكيف مع تحديات العمل",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3019,
    name: "مهارات البحث عن وظيفة وكتابة السيرة الذاتية",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3020,
    name: "التدريب على المقابلات الوظيفية",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3021,
    name: "التعلم واكتساب المهارات التقنية الجديدة",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 3022,
    name: "تحقيق التوازن بين العمل والحياة",
    category: "PERSONAL",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4001,
    name: "القانون الدستوري",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4002,
    name: "القانون الإداري والقضاء الإداري",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4003,
    name: "القانون الجنائي والعلوم الجنائية (Criminal Law)",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4004,
    name: "قانون البيئة",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4005,
    name: "المنظمات الإقليمية والدولية",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4006,
    name: "القانون الجزائي العام والخاص (Penal Law)",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4007,
    name: "القانون الخاص (Private Law)",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4008,
    name: "القانون المدني (Civil Law) والمسؤولية المدنية",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4009,
    name: "القانون التجاري (Commercial Law) وعمليات البنوك",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4010,
    name: "قانون العمل والتأمينات الاجتماعية",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4011,
    name: "قانون الأسرة والأحوال الشخصية والمواريث والوصايا والوقف",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4012,
    name: "الملكية الفكرية (Intellectual Property)",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4013,
    name: "قانون التنفيذ والإثبات",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4014,
    name: "الأنظمة والإجراءات",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4015,
    name: "صياغة العقود والأنظمة",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4016,
    name: "إجراءات التقاضي",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4017,
    name: "الزكاة والضرائب",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4018,
    name: "القانون الدولي الخاص",
    category: "LAW",
    createdAt: "2024-01-01 12:00:00",
  },
  {
    id: 4019,
    name: "دعم الامهات",
    category: "FAMILY",
    createdAt: "2026-02-24 16:40:31",
  },
  {
    id: 4020,
    name: "مشكلات الامومة",
    category: "FAMILY",
    createdAt: "2026-02-24 16:40:53",
  },
  {
    id: 4021,
    name: "مشكلات ما بعد الولادة",
    category: "FAMILY",
    createdAt: "2026-02-24 16:41:07",
  },
  {
    id: 4022,
    name: "الأسر الحاضنة",
    category: "FAMILY",
    createdAt: "2026-02-24 16:41:25",
  },
  {
    id: 4023,
    name: "احتضان الأيتام",
    category: "FAMILY",
    createdAt: "2026-02-24 16:41:38",
  },
];

const SPECIALTY_MAP = new Map(
  SPECIALTIES.map((s) => [String(s.id), { id: String(s.id), name: s.name }]),
);
const VALID_IDS = new Set(SPECIALTY_MAP.keys()); // Set<string>

type LogEntry = {
  aid: number;
  articleId: string;
  title: string;
  assignedSpecialties: { id: string; name: string }[];
  skipped: boolean;
  reason?: string;
  error?: string;
};

type BulkResult = {
  success: boolean;
  logs: LogEntry[];
  totalAssigned: number;
  totalSkipped: number;
  totalErrors: number;
};

// ─── Gemini helper ────────────────────────────────────────────────────────────
async function detectSpecialties(
  title: string,
  article: string,
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_APIKEY! });
  const prompt = `
    You are a content classification assistant for an Arabic platform.

Given the article title and content below, return a JSON array of specialty IDs
that are relevant to this article. Only choose IDs from the provided list.
Return at most 5 IDs. Return an empty array [] if none fit.

### Available Specialties (id is a number)
${JSON.stringify(
  SPECIALTIES.map((s) => ({ id: s.id, name: s.name })),
  null,
  2,
)}

### Article Title
${title}

### Article Content (first 1500 chars)
${article.slice(0, 1500)}

IMPORTANT: Respond ONLY with a valid JSON array of numbers, e.g. [1001, 1003].
No explanation, no markdown, just the JSON array.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text?.trim() ?? "[]";
  const parsed: (string | number)[] = JSON.parse(raw);

  // ✅ FIX: normalise whatever Gemini returns (numbers or strings) → string
  // then validate against our Set<string>
  return parsed.map((id) => String(id)).filter((id) => VALID_IDS.has(id));
}

// ─── Main bulk action ─────────────────────────────────────────────────────────
export async function bulkAddArticleSpecialties(
  aids: number[],
): Promise<BulkResult> {
  const logs: LogEntry[] = [];
  let totalAssigned = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // 1. Fetch all requested articles in one query
  const articles = await prisma.article.findMany({
    where: { aid: { in: aids } },
    select: {
      id: true,
      aid: true,
      title: true,
      article: true,
      specialties: { select: { specialtyId: true } },
    },
  });

  // 2. Report any aids that weren't found
  const foundAids = new Set(articles.map((a) => a.aid));
  for (const aid of aids) {
    if (!foundAids.has(aid)) {
      logs.push({
        aid,
        articleId: "",
        title: "—",
        assignedSpecialties: [],
        skipped: true,
        reason: "Article not found in database",
      });
      totalSkipped++;
    }
  }

  // 3. Process each found article
  for (const art of articles) {
    // specialtyId in DB is already a string — no conversion needed
    const existingIds = new Set(art.specialties.map((s) => s.specialtyId));

    try {
      const detectedIds = await detectSpecialties(art.title, art.article);

      // Only insert IDs not already linked
      const newIds = detectedIds.filter((id) => !existingIds.has(id));

      if (newIds.length === 0) {
        logs.push({
          aid: art.aid,
          articleId: art.id,
          title: art.title,
          assignedSpecialties: [],
          skipped: true,
          reason:
            detectedIds.length === 0
              ? "Gemini found no matching specialties"
              : "All detected specialties already assigned",
        });
        totalSkipped++;
        continue;
      }

      // Bulk insert — specialtyId is string in schema, newIds are strings ✅
      await prisma.articleSpecialty.createMany({
        data: newIds.map((specialtyId) => ({
          articleId: art.id,
          specialtyId,
        })),
        skipDuplicates: true,
      });

      const assigned = newIds
        .map((id) => SPECIALTY_MAP.get(id))
        .filter((s): s is { id: string; name: string } => s !== undefined);

      logs.push({
        aid: art.aid,
        articleId: art.id,
        title: art.title,
        assignedSpecialties: assigned,
        skipped: false,
      });

      totalAssigned += newIds.length;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logs.push({
        aid: art.aid,
        articleId: art.id,
        title: art.title,
        assignedSpecialties: [],
        skipped: false,
        error: message,
      });
      totalErrors++;
    }
  }

  return {
    success: totalErrors === 0,
    logs,
    totalAssigned,
    totalSkipped,
    totalErrors,
  };
}
