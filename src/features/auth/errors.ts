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
]);

/** Translation key for an error thrown by the API layer. */
export function errorKey(error: unknown): string {
  if (error instanceof ApiError && KNOWN.has(error.code)) {
    return `auth_err_${error.code}`;
  }

  return "auth_err_generic";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim()) && value.trim().length <= 190;
}
