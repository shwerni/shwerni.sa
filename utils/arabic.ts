// arabic search normalization: one form for the user's query and the sql column
// (data/packages.ts mirrors these rules in postgres, keep both in sync)

// harakat, superscript alef and tatweel
export const ARABIC_MARKS = "[\u064B-\u065F\u0670\u0640]";

// letter folds: alef forms → ا, taa marbuta → ه, alef maqsura → ي
export const ARABIC_FOLD_FROM = "أإآٱةى";
export const ARABIC_FOLD_TO = "ااااهي";

// normalize a search string the same way the sql normalizes names
export function normalizeArabic(value: string) {
  let out = value.replace(new RegExp(ARABIC_MARKS, "g"), "");
  for (let i = 0; i < ARABIC_FOLD_FROM.length; i++)
    out = out.split(ARABIC_FOLD_FROM[i]).join(ARABIC_FOLD_TO[i]);
  return out.toLowerCase().replace(/\s+/g, " ").trim();
}

// escape like wildcards so a typed % or _ matches itself
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
