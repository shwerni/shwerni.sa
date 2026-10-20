// dates for documents (the pleading agreement pdf and, later, its checkout dialog). no imports on
// purpose: importing date-fns here made the bundler stop inlining date-fns into utils/date.ts and
// grew the chunk most server functions share (docs/progress.md, phase 2). client-safe

// riyadh is UTC+3 all year (no daylight saving)
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

// the gregorian month names in arabic, as date-fns' ar locale writes them
const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

// the riyadh calendar day of an instant
const riyadhDay = (date: Date) => {
  const riyadh = new Date(date.getTime() + RIYADH_OFFSET_MS);
  return { year: riyadh.getUTCFullYear(), month: riyadh.getUTCMonth(), day: riyadh.getUTCDate() };
};

const pad = (n: number) => String(n).padStart(2, "0");

// the riyadh day of an instant with the arabic gregorian month name and latin digits, e.g.
// "20 أكتوبر 2026". never the hijri calendar
export const riyadhArabicDate = (date: Date): string => {
  const { year, month, day } = riyadhDay(date);
  return `${day} ${ARABIC_MONTHS[month]} ${year}`;
};

// the riyadh day of an instant as "yyyy/MM/dd", e.g. "2026/10/20" (the agreement's signatures)
export const riyadhSlashDate = (date: Date): string => {
  const { year, month, day } = riyadhDay(date);
  return `${year}/${pad(month + 1)}/${pad(day)}`;
};
