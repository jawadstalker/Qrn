/** Replaces {name} placeholders in a translated string. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export const LAST_ROOM_KEY = "@quran_garden_last_room";

/** Keeps only letters and digits, upper-cased, at most 6 characters (a room code). */
export function normalizeRoomCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}
