import type { Language } from "@/core/types/index";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function formatNumber(
  value: number | string,
  language: Language,
): string {
  const text = String(value);

  if (language !== "fa") {
    return text;
  }

  return text.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}
