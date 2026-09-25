import { isSaudiBankCode, type SaudiBankCode } from "@/constants/saudi-banks";

const SA_IBAN_REGEX = /^SA\d{22}$/;

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits → ASCII, since Arabic keyboards produce them
function toAsciiDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function normalizeIban(input: string): string {
  return toAsciiDigits(input).replace(/[\s-]/g, "").toUpperCase();
}

// ISO 13616 mod-97 check; processed digit-by-digit to avoid BigInt
export function hasValidIbanChecksum(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export function getBankCodeFromIban(iban: string): SaudiBankCode | null {
  const code = iban.slice(4, 6);
  return isSaudiBankCode(code) ? code : null;
}

export type IbanCheck =
  | { ok: true; iban: string; bankCode: SaudiBankCode }
  | { ok: false; reason: "format" | "checksum" | "unknown_bank" };

export function checkSaudiIban(input: string): IbanCheck {
  const iban = normalizeIban(input);
  if (!SA_IBAN_REGEX.test(iban)) return { ok: false, reason: "format" };
  if (!hasValidIbanChecksum(iban)) return { ok: false, reason: "checksum" };
  const bankCode = getBankCodeFromIban(iban);
  if (!bankCode) return { ok: false, reason: "unknown_bank" };
  return { ok: true, iban, bankCode };
}

// Display: "SA46 8000 0543 6080 1125 8781"
export function formatIban(iban: string): string {
  return normalizeIban(iban)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

// For the input's onChange: keeps "SA" fixed, digits only after it, caps at 24, groups by 4
export function formatIbanInput(raw: string): string {
  const digits = normalizeIban(raw)
    .replace(/^SA/, "")
    .replace(/\D/g, "")
    .slice(0, 22);
  return formatIban(`SA${digits}`);
}
