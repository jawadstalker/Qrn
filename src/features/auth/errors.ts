import { ApiError } from "@/features/auth/api";

const KNOWN = new Set([
  "invalid_email",
  "weak_password",
  "email_taken",
  "bad_credentials",
  "rate_limited",
  "network",
  "not_configured",
  "bad_password",
  "unauthorized",
  "email_not_verified",
  "bad_code",
  "code_expired",
  "mail_failed",
]);

/** Translation key for an error thrown by the API layer. */
export function errorKey(error: unknown): string {
  if (error instanceof ApiError && KNOWN.has(error.code)) {
    return `auth_err_${error.code}`;
  }

  return "auth_err_generic";
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Keeps only the digits of a typed code (Persian and Arabic digits are converted) and caps the length. */
export function normalizeCode(value: string, length: number): string {
  let out = "";

  for (const char of value) {
    const p = PERSIAN_DIGITS.indexOf(char);
    const a = ARABIC_DIGITS.indexOf(char);

    if (p >= 0) {
      out += String(p);
    } else if (a >= 0) {
      out += String(a);
    } else if (char >= "0" && char <= "9") {
      out += char;
    }
  }

  return out.slice(0, length);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim()) && value.trim().length <= 190;
}
