import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useMemorizationPlan } from "@/features/quran/state/MemorizationPlanContext";
import { surahLabel } from "@/features/quran/plan/export/exportData";
import { formatSegments, sessionOn } from "@/features/quran/plan/planEngine";
import {
  buildReminders,
  cancelReminders,
  configureNotifications,
  loadRemindersEnabled,
  replaceReminders,
  requestNotificationPermission,
  subscribeReminders,
  type ReminderTexts,
} from "@/features/quran/notifications/reminders";

configureNotifications();

/**
 * Headless component: keeps the two daily reminders in sync with the language, the memorization
 * plan and the setting. It re-plans every time the app comes to the foreground, so reminders
 * are never shown on a day the user already opened the app.
 */
export function DailyReminders() {
  const { t, language } = useLanguage();
  const { built } = useMemorizationPlan();
  const latest = useRef({ t, language, built });

  latest.current = { t, language, built };

  useEffect(() => {
    let active = true;
    let enabled = true;

    const sync = async () => {
      if (!active) {
        return;
      }

      if (!enabled || !(await requestNotificationPermission())) {
        await cancelReminders();

        return;
      }

      const { t: strings, language: lang, built: plan } = latest.current;
      const number = (value: number) => formatNumber(value, lang);
      const texts: ReminderTexts = {
        title: strings.quran_app_name ?? "",
        midday: strings.reminder_midday ?? "",
        evening: strings.reminder_evening ?? "",
        middaySession: strings.reminder_midday_session ?? "",
        eveningSession: strings.reminder_evening_session ?? "",
        channelName: strings.quran_reminders ?? "",
      };

      await replaceReminders(
        buildReminders({
          now: new Date(),
          texts,
          portionOn: (day) => {
            const sessions = plan?.sessions ?? [];
            const index = sessionOn(sessions, day);
            const session = index >= 0 ? sessions[index] : undefined;

            return session
              ? formatSegments(session.segments, number, (id) =>
                  surahLabel(id, lang),
                )
              : null;
          },
        }),
        texts.channelName,
      );
    };

    loadRemindersEnabled().then((value) => {
      enabled = value;
      void sync();
    });

    const unsubscribe = subscribeReminders((value) => {
      enabled = value;
      void sync();
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void sync();
      }
    });

    return () => {
      active = false;
      unsubscribe();
      appState.remove();
    };
  }, [language, built]);

  return null;
}
