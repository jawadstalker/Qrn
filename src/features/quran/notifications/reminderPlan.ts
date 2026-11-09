import {
  addDays,
  todayISO,
  type ISODate,
} from "@/features/quran/plan/calendar";

export const BRAND_COLOR = "#2F6B4F";

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** Change these two to move the reminders (24-hour clock, device time). */
export const REMINDER_TIMES: readonly [ReminderTime, ReminderTime] = [
  { hour: 12, minute: 0 },
  { hour: 20, minute: 0 },
];

/** One-off reminders are scheduled this many days ahead (2 per day, iOS keeps 64 at most). */
export const REMINDER_DAYS_AHEAD = 14;

export interface ReminderTexts {
  title: string;
  midday: string;
  evening: string;
  /** Contains `{portion}`. */
  middaySession: string;
  /** Contains `{portion}`. */
  eveningSession: string;
  channelName: string;
}

export interface PlannedReminder {
  date: Date;
  title: string;
  body: string;
}

export interface BuildInput {
  now: Date;
  texts: ReminderTexts;
  /** Text describing the planned session of that day, or null when there is none. */
  portionOn: (date: ISODate) => string | null;
}

function dateAt(day: ISODate, time: ReminderTime): Date {
  const [year, month, date] = day.split("-").map(Number) as [
    number,
    number,
    number,
  ];

  return new Date(year, month - 1, date, time.hour, time.minute, 0, 0);
}

function withPortion(template: string, portion: string): string {
  return template.split("{portion}").join(portion);
}

/** Pure: the reminders that should be pending right now. */
export function buildReminders({
  now,
  texts,
  portionOn,
}: BuildInput): PlannedReminder[] {
  const today = todayISO(now);
  const result: PlannedReminder[] = [];

  // Starts tomorrow: the user is in the app today, so today needs no reminder.
  for (let offset = 1; offset <= REMINDER_DAYS_AHEAD; offset += 1) {
    const day = addDays(today, offset);
    const portion = portionOn(day);

    REMINDER_TIMES.forEach((time, slot) => {
      const date = dateAt(day, time);

      if (date.getTime() <= now.getTime()) {
        return;
      }

      const body =
        slot === 0
          ? portion
            ? withPortion(texts.middaySession, portion)
            : texts.midday
          : portion
            ? withPortion(texts.eveningSession, portion)
            : texts.evening;

      result.push({ date, title: texts.title, body });
    });
  }

  return result;
}
