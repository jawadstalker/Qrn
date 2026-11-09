import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  BRAND_COLOR,
  type PlannedReminder,
} from "@/features/quran/notifications/reminderPlan";

export * from "@/features/quran/notifications/reminderPlan";

const CHANNEL_ID = "daily-reminders";
const ENABLED_KEY = "@quran_garden_reminders_enabled";

/**
 * Two reminders a day (midday and evening), only on days the user has not opened the app.
 *
 * Every time the app is opened (or its data changes) all pending reminders are replaced by
 * one-off reminders for the next days, and today's are left out because the user is here.
 * If the user stays away, the already scheduled reminders fire; opening the app again
 * moves the schedule forward.
 */

// ---- enabled setting (tiny shared store so Settings and the scheduler agree) ----

let enabledValue = true;
let enabledLoaded = false;
const listeners = new Set<(value: boolean) => void>();

export async function loadRemindersEnabled(): Promise<boolean> {
  if (enabledLoaded) {
    return enabledValue;
  }

  try {
    const raw = await AsyncStorage.getItem(ENABLED_KEY);

    enabledValue = raw === null ? true : raw === "1";
  } catch {
    enabledValue = true;
  }

  enabledLoaded = true;

  return enabledValue;
}

export function getRemindersEnabled(): boolean {
  return enabledValue;
}

export async function setRemindersEnabled(value: boolean): Promise<void> {
  enabledValue = value;
  enabledLoaded = true;
  listeners.forEach((listener) => listener(value));

  try {
    await AsyncStorage.setItem(ENABLED_KEY, value ? "1" : "0");
  } catch (error) {
    console.error("[REMINDERS] Failed to save the setting:", error);
  }
}

export function subscribeReminders(
  listener: (value: boolean) => void,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

// ---- notifications ----

const isSupported = Platform.OS === "android" || Platform.OS === "ios";

export function configureNotifications(): void {
  if (!isSupported) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!isSupported) {
    return false;
  }

  try {
    const current = await Notifications.getPermissionsAsync();

    return current.granted;
  } catch {
    return false;
  }
}

/** Asks for permission when it was never asked; returns whether reminders may be shown. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isSupported) {
    return false;
  }

  try {
    const current = await Notifications.getPermissionsAsync();

    if (current.granted) {
      return true;
    }

    if (!current.canAskAgain) {
      return false;
    }

    const asked = await Notifications.requestPermissionsAsync();

    return asked.granted;
  } catch {
    return false;
  }
}

async function ensureChannel(name: string): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND_COLOR,
  });
}

export async function cancelReminders(): Promise<void> {
  if (!isSupported) {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("[REMINDERS] Could not cancel reminders:", error);
  }
}

/** Replaces all pending reminders with `reminders`. Calls never overlap. */
let queue: Promise<void> = Promise.resolve();

export function replaceReminders(
  reminders: readonly PlannedReminder[],
  channelName: string,
): Promise<void> {
  queue = queue.then(async () => {
    if (!isSupported) {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await ensureChannel(channelName);

      for (const reminder of reminders) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
            color: BRAND_COLOR,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminder.date,
            channelId: CHANNEL_ID,
          },
        });
      }
    } catch (error) {
      console.warn("[REMINDERS] Could not schedule reminders:", error);
    }
  });

  return queue;
}
