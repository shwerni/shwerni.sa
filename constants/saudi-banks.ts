// Keyed by the 2-digit SAMA code embedded in the IBAN (chars 5–6).
// Verify against SAMA's current list before release and add new digital banks as they appear.
// Unknown codes are still accepted (checksum is the validity check); see getSaudiBank().
export const SAUDI_BANKS = {
  // local banks
  "05": { ar: "مصرف الإنماء", en: "Alinma Bank" },
  "10": { ar: "البنك الأهلي السعودي", en: "Saudi National Bank" },
  "15": { ar: "بنك البلاد", en: "Bank Albilad" },
  "20": { ar: "بنك الرياض", en: "Riyad Bank" },
  "30": { ar: "البنك العربي الوطني", en: "Arab National Bank" },
  "45": { ar: "البنك السعودي الأول", en: "Saudi Awwal Bank" },
  "55": { ar: "البنك السعودي الفرنسي", en: "Banque Saudi Fransi" },
  "60": { ar: "بنك الجزيرة", en: "Bank AlJazira" },
  "65": { ar: "البنك السعودي للاستثمار", en: "Saudi Investment Bank" },
  "80": { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
  "90": { ar: "بنك الخليج الدولي", en: "Gulf International Bank" },

  // legacy codes of merged banks (old IBANs may still use them)
  "40": {
    ar: "البنك الأهلي السعودي (سامبا سابقاً)",
    en: "Saudi National Bank (ex-Samba)",
  },
  "50": {
    ar: "البنك السعودي الأول (الأول سابقاً)",
    en: "Saudi Awwal Bank (ex-Alawwal)",
  },

  // foreign bank branches
  "71": { ar: "بنك البحرين الوطني", en: "National Bank of Bahrain" },
  "75": { ar: "بنك الكويت الوطني", en: "National Bank of Kuwait" },
  "76": { ar: "بنك مسقط", en: "Bank Muscat" },
  "81": { ar: "دويتشه بنك", en: "Deutsche Bank" },
  "82": { ar: "بنك باكستان الوطني", en: "National Bank of Pakistan" },
  "83": { ar: "بنك الدولة الهندي", en: "State Bank of India" },
  "84": { ar: "بنك زراعات التركي", en: "Ziraat Bankasi" },
  "86": { ar: "جي بي مورغان تشيس", en: "J.P. Morgan Chase" },
  "87": {
    ar: "البنك الصناعي والتجاري الصيني",
    en: "Industrial and Commercial Bank of China",
  },
  "95": { ar: "بنك الإمارات دبي الوطني", en: "Emirates NBD" },
  "98": { ar: "بي إن بي باريبا", en: "BNP Paribas" },

  // digital banks (D360, STC Bank, Vision Bank): codes not yet confirmed from
  // an official source; add here once verified (e.g. "78" is in use by one of them)
} as const;

export type SaudiBankCode = keyof typeof SAUDI_BANKS;

export function isSaudiBankCode(code: string): code is SaudiBankCode {
  return code in SAUDI_BANKS;
}

// fallback for valid IBANs from banks not in the list yet
export const UNKNOWN_SAUDI_BANK = { ar: "بنك آخر", en: "Other bank" } as const;

// display name for any bank code, known or not
export function getSaudiBank(code: string) {
  return isSaudiBankCode(code) ? SAUDI_BANKS[code] : UNKNOWN_SAUDI_BANK;
}
