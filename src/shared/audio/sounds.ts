export type SoundName = "tap" | "select" | "soft" | "success";

export const SOUND_SOURCES: Record<SoundName, number> = {
  tap: require("../../../assets/sounds/ui/tap.wav"),
  select: require("../../../assets/sounds/ui/select.wav"),
  soft: require("../../../assets/sounds/ui/soft.wav"),
  success: require("../../../assets/sounds/ui/success.wav"),
};

export const SOUND_VOLUMES: Record<SoundName, number> = {
  tap: 0.6,
  select: 0.6,
  soft: 0.5,
  success: 0.7,
};

export const SOUND_NAMES = Object.keys(SOUND_SOURCES) as SoundName[];
