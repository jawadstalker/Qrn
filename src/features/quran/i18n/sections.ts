import { useCallback } from "react";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import type { Language } from "@/core/types/index";

type Dict = Record<string, string>;

const fa: Dict = {
  sec_title: "بخش‌های کوتاه",
  sec_sub: "سوره به بخش‌های کوتاه تقسیم شده؛ رنگ هر بخش با میزان تمرین عوض می‌شود",
  sec_label: "بخش {n}",
  sec_range: "آیات {from} تا {to}",
  sec_size: "اندازهٔ هر بخش",
  sec_size_verses: "{n} آیه",
  sec_status_new: "شروع نشده",
  sec_status_learning: "در حال یادگیری",
  sec_status_fair: "نیمه‌محکم",
  sec_status_good: "خوب",
  sec_status_mastered: "مسلط",
  sec_due: "نیاز به مرور",
  sec_legend_hint: "قرمز: تازه‌کار · نارنجی: نیمه‌محکم · سبز روشن: خوب · سبز: مسلط",
  sec_units: "تمرین: {n} واحد برای هر آیه",
  sec_how: "هر بار «یادم بود» = ۳ واحد، هر بار شنیدن کامل آیه = ۱ واحد",
  sec_repeat_title: "تکرار صوت",
  sec_repeat_scope: "چه چیزی تکرار شود",
  sec_scope_ayah: "آیهٔ فعلی",
  sec_scope_section: "کل بخش",
  sec_ayah_repeats: "تکرار هر آیه",
  sec_times: "{n} بار",
  sec_loops: "تکرار بخش",
  sec_loops_endless: "تا وقتی نگه دارم",
  sec_gap: "مکث بین تکرارها",
  sec_gap_none: "بدون مکث",
  sec_seconds: "{n} ثانیه",
  sec_play: "پخش با تکرار",
  sec_pause: "مکث",
  sec_resume: "ادامه",
  sec_stop: "توقف",
  sec_now: "آیهٔ {ayah} · بار {rep} از {reps}",
  sec_now_loop: "دور {loop} از {loops}",
  sec_now_loop_endless: "دور {loop}",
  sec_audio_error: "صوت بارگذاری نشد. اینترنت را بررسی کن.",
  sec_garden_title: "وضعیت بخش‌ها",
  sec_garden_weak: "این بخش بیشتر تمرین می‌خواهد",
  sec_garden_cta: "تمرین بخش {n}",
  sec_mini_range: "{surah} · آیات {from} تا {to}",
  sec_mini_progress: "آیهٔ {ayah} · بار {rep} از {reps}",
};

const en: Dict = {
  sec_title: "Short sections",
  sec_sub: "The surah is split into short sections; each changes color as you practice",
  sec_label: "Section {n}",
  sec_range: "Verses {from}–{to}",
  sec_size: "Section size",
  sec_size_verses: "{n} verses",
  sec_status_new: "Not started",
  sec_status_learning: "Learning",
  sec_status_fair: "Getting there",
  sec_status_good: "Good",
  sec_status_mastered: "Mastered",
  sec_due: "Needs review",
  sec_legend_hint: "Red: new · Amber: getting there · Light green: good · Green: mastered",
  sec_units: "Practice: {n} units per verse",
  sec_how: "Each \"I remembered\" = 3 units, each full listen of a verse = 1 unit",
  sec_repeat_title: "Audio repeat",
  sec_repeat_scope: "What to repeat",
  sec_scope_ayah: "Current verse",
  sec_scope_section: "Whole section",
  sec_ayah_repeats: "Repeat each verse",
  sec_times: "{n}×",
  sec_loops: "Repeat the section",
  sec_loops_endless: "Until I stop",
  sec_gap: "Pause between repeats",
  sec_gap_none: "No pause",
  sec_seconds: "{n} s",
  sec_play: "Play with repeat",
  sec_pause: "Pause",
  sec_resume: "Resume",
  sec_stop: "Stop",
  sec_now: "Verse {ayah} · {rep} of {reps}",
  sec_now_loop: "Round {loop} of {loops}",
  sec_now_loop_endless: "Round {loop}",
  sec_audio_error: "Audio did not load. Check your internet connection.",
  sec_garden_title: "Section status",
  sec_garden_weak: "This section needs more practice",
  sec_garden_cta: "Practice section {n}",
  sec_mini_range: "{surah} · verses {from}–{to}",
  sec_mini_progress: "Verse {ayah} · {rep} of {reps}",
};

const DICTS: Record<Language, Dict> = { fa, en };

export type SectionText = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** Localized strings for the sections feature. Numbers in `values` are formatted for the language. */
export function useST(): SectionText {
  const { language } = useLanguage();

  return useCallback(
    (key, values) => {
      const template = DICTS[language][key] ?? en[key] ?? key;

      if (!values) {
        return template;
      }

      return Object.entries(values).reduce(
        (text, [name, value]) =>
          text
            .split(`{${name}}`)
            .join(
              typeof value === "number"
                ? formatNumber(value, language)
                : String(value),
            ),
        template,
      );
    },
    [language],
  );
}
