/**
 * Address of the backend (the `server/` folder), without a trailing slash.
 * Example: "https://example.ir/api"
 *
 * Set it here, or at build time with the EXPO_PUBLIC_API_URL environment variable.
 * While it is empty the app still works offline; the login pages explain that the server is not set up.
 */
const DEFAULT_API_URL = "https://iliyacore.ir/quran";

export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

export const MIN_PASSWORD_LENGTH = 8;

/** Length of the code emailed for verification and password recovery (must match the server). */
export const CODE_LENGTH = 6;

/** Seconds before the "resend code" action unlocks (the server enforces its own cooldown too). */
export const RESEND_SECONDS = 60;

/** AsyncStorage keys that are copied to the account. Same names the stores already use. */
export const SYNC_KEYS: readonly string[] = [
  "@quran_garden_plan_v1",
  "@quran_garden_progress",
  "@quran_garden_quiz",
  "@quran_garden_exams",
  "@quran_garden_practice_v1",
  "@quran_garden_sections_v1",
  "@quran_garden_scope_v1",
];

export const STORAGE = {
  token: "@quran_garden_auth_token",
  user: "@quran_garden_auth_user",
  syncMeta: "@quran_garden_sync_meta",
  syncOwner: "@quran_garden_sync_owner",
  syncBackup: "@quran_garden_sync_backup",
  lastSync: "@quran_garden_last_sync",
} as const;