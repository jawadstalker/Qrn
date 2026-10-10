import { useLanguage } from "@/core/i18n/LanguageContext";

export function useDirection() {
  const { isRTL } = useLanguage();

  return {
    isRTL,
    row: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    textAlign: (isRTL ? "right" : "left") as "right" | "left",
    alignStart: (isRTL ? "flex-end" : "flex-start") as
      "flex-end" | "flex-start",
  };
}
