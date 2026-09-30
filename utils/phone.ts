/**
 * Validates and normalizes phone numbers for Gulf countries (GCC):
 * Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman.
 *
 * Expects numbers in international format WITHOUT a leading "+" or "00"
 * (e.g. as stored after stripping by your order/consultant forms), but
 * normalize() will strip those if present too.
 */

type GulfRule = {
  country: string;
  code: string; // country calling code, no plus
  // total expected length INCLUDING the country code
  totalLength: number;
  // allowed leading digit(s) of the subscriber number (right after country code)
  mobilePrefixes: string[];
};

const GULF_RULES: GulfRule[] = [
  // Saudi Arabia: 966 5XXXXXXXX (9 digits after code, starts with 5)
  { country: "SA", code: "966", totalLength: 12, mobilePrefixes: ["5"] },
  // UAE: 971 5XXXXXXXX (9 digits after code, starts with 5)
  { country: "AE", code: "971", totalLength: 12, mobilePrefixes: ["5"] },
  // Kuwait: 965 [569]XXXXXXX (8 digits after code)
  { country: "KW", code: "965", totalLength: 11, mobilePrefixes: ["5", "6", "9"] },
  // Qatar: 974 [3567]XXXXXXX (8 digits after code)
  { country: "QA", code: "974", totalLength: 11, mobilePrefixes: ["3", "5", "6", "7"] },
  // Bahrain: 973 [36]XXXXXXX (8 digits after code)
  { country: "BH", code: "973", totalLength: 11, mobilePrefixes: ["3", "6"] },
  // Oman: 968 [79]XXXXXXX (8 digits after code)
  { country: "OM", code: "968", totalLength: 11, mobilePrefixes: ["7", "9"] },
];

/** Strip spaces, dashes, parens, leading + or 00 */
function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/[\s\-()]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("00")) p = p.slice(2);
  return p;
}

type PhoneCheck = {
  valid: boolean;
  normalized: string;
  country?: string;
  reason?: string;
};

/** Validate a single phone number against Gulf country rules */
function checkGulfPhone(raw: string): PhoneCheck {
  const normalized = normalizePhone(raw);

  if (!/^\d+$/.test(normalized)) {
    return { valid: false, normalized, reason: "non-numeric characters" };
  }

  const rule = GULF_RULES.find((r) => normalized.startsWith(r.code));

  if (!rule) {
    return { valid: false, normalized, reason: "not a recognized Gulf country code" };
  }

  if (normalized.length !== rule.totalLength) {
    return {
      valid: false,
      normalized,
      country: rule.country,
      reason: `expected ${rule.totalLength} digits for ${rule.country}, got ${normalized.length}`,
    };
  }

  const subscriberStart = normalized.slice(rule.code.length, rule.code.length + 1);
  if (!rule.mobilePrefixes.includes(subscriberStart)) {
    return {
      valid: false,
      normalized,
      country: rule.country,
      reason: `mobile number must start with ${rule.mobilePrefixes.join("/")} after country code`,
    };
  }

  return { valid: true, normalized, country: rule.country };
}

// keeps the first 3 and last 4 digits so a token holder can't read the full number
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return "•".repeat(phone.length);
  return phone.slice(0, 3) + "•".repeat(phone.length - 7) + phone.slice(-4);
}