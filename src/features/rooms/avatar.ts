/**
 * Parameters of a player's 3D character (the app mascot, made customisable).
 * They are stored on the server as a small flat JSON object: numbers are indexes into the palettes below.
 */

/** Index 0 is the mascot's pale lavender face; the rest are natural skin tones. */
export const FACE_TONES = [
  "#E8E3F8",
  "#F6D5B8",
  "#EBC09A",
  "#D9A173",
  "#B97C4F",
  "#8D5A36",
] as const;

/** Index 0 is the mascot's violet "cloud" hair. */
export const HAIR_COLORS = [
  "#6B5CE0",
  "#4A7BE8",
  "#2C2A4A",
  "#D96BA0",
  "#2FB59A",
  "#E0A33A",
  "#C9CEDA",
  "#7A4B25",
] as const;

/** The little lights that glow on the hair. */
export const GLOW_COLORS = [
  "#5CE1FF",
  "#FF7AC8",
  "#8CFF9E",
  "#FFD76A",
  "#FFFFFF",
] as const;

/** Colours for the top (hoodie, jacket, robe, t-shirt). Index 0 is the mascot's purple. */
export const OUTFIT_COLORS = [
  "#5B3FD6",
  "#2F7D5B",
  "#3B82C4",
  "#D1664A",
  "#C99A2E",
  "#37474F",
  "#E6E6EE",
  "#C2468B",
] as const;

export const PANTS_COLORS = [
  "#5A3FD0",
  "#2B3A67",
  "#37474F",
  "#6B4F3A",
  "#1E1E24",
  "#8E9AAF",
] as const;

/** Trim colour: cuffs, hem, stripes, shoe details. Index 0 is the mascot's cyan. */
export const ACCENT_COLORS = [
  "#35D0E8",
  "#FF8A5B",
  "#7CE3A1",
  "#FFD166",
  "#FF7AC8",
  "#FFFFFF",
] as const;

export const HAT_COLORS = [
  "#F2EEE4",
  "#1E1E24",
  "#5B3FD6",
  "#2F7D5B",
  "#D1664A",
  "#3B82C4",
  "#C99A2E",
  "#C2468B",
] as const;

export const HAIR_STYLES = ["cloud", "short", "long", "none"] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HATS = [
  "none",
  "beanie",
  "cap",
  "kufi",
  "hijab",
  "grad",
  "crown",
] as const;
export type Hat = (typeof HATS)[number];

export const OUTFIT_STYLES = ["hoodie", "jacket", "robe", "tee"] as const;
export type OutfitStyle = (typeof OUTFIT_STYLES)[number];

export interface AvatarParams {
  face: number;
  hairStyle: HairStyle;
  hairColor: number;
  glow: number;
  hat: Hat;
  hatColor: number;
  outfitStyle: OutfitStyle;
  outfit: number;
  pants: number;
  accent: number;
  glasses: boolean;
}

export const DEFAULT_AVATAR: AvatarParams = {
  face: 0,
  hairStyle: "cloud",
  hairColor: 0,
  glow: 0,
  hat: "none",
  hatColor: 0,
  outfitStyle: "hoodie",
  outfit: 0,
  pants: 0,
  accent: 0,
  glasses: false,
};

function index(value: unknown, length: number, fallback: number): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < length
    ? value
    : fallback;
}

function oneOf<T extends string>(
  list: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return list.find((item) => item === value) ?? fallback;
}

/**
 * Turns whatever the server sent into safe parameters. Unknown or broken values fall back to the defaults,
 * and avatars saved by the first version of the character editor (skin/head/outfit) still load.
 */
export function sanitizeAvatar(raw: unknown): AvatarParams {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const legacyHead = source.head;
  const legacyHat: Hat | null =
    legacyHead === "cap" ? "kufi" : legacyHead === "scarf" ? "hijab" : null;
  const legacyHair: HairStyle | null =
    legacyHead === "short" || legacyHead === "long" ? legacyHead : null;
  const legacySkin =
    typeof source.skin === "number" && Number.isInteger(source.skin)
      ? Math.min(FACE_TONES.length - 1, Math.max(0, source.skin + 1))
      : DEFAULT_AVATAR.face;

  return {
    face: index(source.face, FACE_TONES.length, legacySkin),
    hairStyle: oneOf(
      HAIR_STYLES,
      source.hairStyle,
      legacyHair ?? DEFAULT_AVATAR.hairStyle,
    ),
    hairColor: index(
      source.hairColor,
      HAIR_COLORS.length,
      DEFAULT_AVATAR.hairColor,
    ),
    glow: index(source.glow, GLOW_COLORS.length, DEFAULT_AVATAR.glow),
    hat: oneOf(HATS, source.hat, legacyHat ?? DEFAULT_AVATAR.hat),
    hatColor: index(
      source.hatColor,
      HAT_COLORS.length,
      DEFAULT_AVATAR.hatColor,
    ),
    outfitStyle: oneOf(
      OUTFIT_STYLES,
      source.outfitStyle,
      DEFAULT_AVATAR.outfitStyle,
    ),
    outfit: index(source.outfit, OUTFIT_COLORS.length, DEFAULT_AVATAR.outfit),
    pants: index(source.pants, PANTS_COLORS.length, DEFAULT_AVATAR.pants),
    accent: index(source.accent, ACCENT_COLORS.length, DEFAULT_AVATAR.accent),
    glasses: source.glasses === true,
  };
}

function pick(length: number): number {
  return Math.floor(Math.random() * length);
}

function pickOf<T>(list: readonly T[]): T {
  return list[pick(list.length)] ?? list[0]!;
}

export function randomAvatar(): AvatarParams {
  return {
    face: pick(FACE_TONES.length),
    hairStyle: pickOf(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS.length),
    glow: pick(GLOW_COLORS.length),
    hat: Math.random() < 0.5 ? "none" : pickOf(HATS),
    hatColor: pick(HAT_COLORS.length),
    outfitStyle: pickOf(OUTFIT_STYLES),
    outfit: pick(OUTFIT_COLORS.length),
    pants: pick(PANTS_COLORS.length),
    accent: pick(ACCENT_COLORS.length),
    glasses: Math.random() < 0.25,
  };
}
