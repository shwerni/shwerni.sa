// Keyed by the 2-digit SAMA code embedded in the IBAN (chars 5–6).
// Verify against SAMA's current list before release and add new digital banks as they appear.
export const SAUDI_BANKS = {
  "10": { ar: "البنك الأهلي السعودي", en: "Saudi National Bank" },
  "15": { ar: "بنك البلاد", en: "Bank Albilad" },
  "20": { ar: "بنك الرياض", en: "Riyad Bank" },
  "30": { ar: "البنك العربي الوطني", en: "Arab National Bank" },
  "45": { ar: "البنك السعودي الأول", en: "Saudi Awwal Bank" },
  "55": { ar: "البنك السعودي الفرنسي", en: "Banque Saudi Fransi" },
  "60": { ar: "بنك الجزيرة", en: "Bank AlJazira" },
  "65": { ar: "البنك السعودي للاستثمار", en: "Saudi Investment Bank" },
  "80": { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
  "05": { ar: "مصرف الإنماء", en: "Alinma Bank" },
  "90": { ar: "بنك الخليج الدولي", en: "Gulf International Bank" },
} as const;

export type SaudiBankCode = keyof typeof SAUDI_BANKS;

export function isSaudiBankCode(code: string): code is SaudiBankCode {
  return code in SAUDI_BANKS;
}
