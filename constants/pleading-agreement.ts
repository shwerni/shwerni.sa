// the pleading agreement's small constants: its version, the "المادة …" ordinals and the quote
// form's limits. no legal text here (that is constants/pleading-terms.ts), so the quote form and
// data/pleading.ts can import these without bundling the articles. client-safe

// the version of the static text in constants/pleading-terms.ts; bump it on any change. the version
// accepted at payment is stored on the case's FINAL PleadingDocument
export const TERMS_VERSION = "2026-10-v1";

// "المادة …" ordinals 1–22: the 12 static articles, then the consultant's special terms
export const ARTICLE_ORDINALS = [
  "الأولى",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
  "الثامنة",
  "التاسعة",
  "العاشرة",
  "الحادية عشرة",
  "الثانية عشرة",
  "الثالثة عشرة",
  "الرابعة عشرة",
  "الخامسة عشرة",
  "السادسة عشرة",
  "السابعة عشرة",
  "الثامنة عشرة",
  "التاسعة عشرة",
  "العشرون",
  "الحادية والعشرون",
  "الثانية والعشرون",
] as const;

// the consultant's special terms continue after the static articles. a literal, so this file
// needs no import of the articles; buildPleadingAgreement checks it equals PLEADING_ARTICLES.length
export const PLEADING_STATIC_ARTICLE_COUNT = 12;

// the quote form's limits for the agreement's dynamic blocks
export const PLEADING_CONSULTANT_TERMS_MAX = 10;
export const PLEADING_CONSULTANT_TERM_MAX_CHARS = 500;
export const PLEADING_NOTES_MAX_CHARS = 1000;
export const PLEADING_CASE_TYPE_MAX_CHARS = 100;
export const PLEADING_SUMMARY_MAX_CHARS = 300;
export const PLEADING_SUMMARY_MAX_LINES = 3;

// "المادة الأولى" … "المادة الثانية والعشرون"; null past the table
export const articleHeading = (n: number) => {
  const ordinal = ARTICLE_ORDINALS[n - 1];
  return ordinal ? `المادة ${ordinal}` : null;
};
