import type { ThemeMode } from "@/core/types/index";

interface PaletteSeed {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSecondary: string;
  primary: string;
  primaryLight: string;
  primaryShadow: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  tint: string;
  tintSoft: string;
  onTint: string;
  highlight: string;
  highlightShadow: string;
  highlightTint: string;
  mintTint: string;
  track: string;
  ink: string;
  accentIcon: string;
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createPalette(seed: PaletteSeed) {
  return {
    isDark: seed.isDark,
    background: seed.background,
    surface: seed.surface,
    surfaceSecondary: seed.surfaceSecondary,
    primary: seed.primary,
    primaryLight: seed.primaryLight,
    primaryDark: seed.primaryShadow,
    primaryShadow: seed.primaryShadow,
    onPrimary: "#FFFFFF",
    accent: seed.tint,
    iconAccent: seed.accentIcon,
    progressAccent: seed.accentIcon,
    text: seed.text,
    textSecondary: seed.textSecondary,
    textTertiary: seed.textTertiary,
    border: withAlpha(seed.primary, 0.16),
    success: "#2FB38A",
    warning: "#E8A33D",
    error: "#D64545",
    tint: seed.tint,
    tintSoft: seed.tintSoft,
    onTint: seed.onTint,
    highlight: seed.highlight,
    highlightShadow: seed.highlightShadow,
    highlightTint: seed.highlightTint,
    mintTint: seed.mintTint,
    track: seed.track,
    ink: seed.ink,
    cardShadow: withAlpha(seed.primary, 0.12),
    gradientPrimary: [seed.background, seed.surfaceSecondary, seed.background],
    gradientCard: [
      withAlpha(seed.surface, 0.98),
      withAlpha(seed.surface, 0.88),
    ],
    gradientCardSolid: [seed.surface, seed.surfaceSecondary],
    gradientButton: [seed.primary, seed.primary, seed.primaryShadow],
    gradientHeader: [seed.primary, seed.primaryShadow],
    glassBackground: withAlpha(seed.surface, 0.92),
    glassHover: withAlpha(seed.surface, 0.98),
    glassBorder: withAlpha(seed.primary, 0.14),
    glassBorderHover: withAlpha(seed.primary, 0.3),
    glow: withAlpha(seed.primary, 0.14),
    glowStrong: withAlpha(seed.primary, 0.24),
    iconFilter: seed.isDark
      ? "brightness(0) invert(1)"
      : "brightness(0) saturate(100%)",
  };
}

export const Colors = {
  mindful: createPalette({
    isDark: false,
    background: "#F5F3FF",
    surface: "#FFFFFF",
    surfaceSecondary: "#ECE8FF",
    primary: "#5B3FE0",
    primaryLight: "#8F7BFF",
    primaryShadow: "#3A27A8",
    text: "#18162F",
    textSecondary: "#5E5A7D",
    textTertiary: "#6B6690",
    tint: "#DCD5FF",
    tintSoft: "#ECE8FF",
    onTint: "#3B2BA0",
    highlight: "#FFB36B",
    highlightShadow: "#D98A3D",
    highlightTint: "#FFE2C2",
    mintTint: "#C8F0E5",
    track: "#E4E0F7",
    ink: "#18162F",
    accentIcon: "#5B3FE0",
  }),
  calm: createPalette({
    isDark: false,
    background: "#EEF6F8",
    surface: "#FFFFFF",
    surfaceSecondary: "#DCEDF2",
    primary: "#1F6F8B",
    primaryLight: "#5AA3BD",
    primaryShadow: "#14516A",
    text: "#0F2A33",
    textSecondary: "#456570",
    textTertiary: "#5F7A84",
    tint: "#C9E4EC",
    tintSoft: "#DCEDF2",
    onTint: "#174F63",
    highlight: "#F2B880",
    highlightShadow: "#C98D4F",
    highlightTint: "#FBE3C8",
    mintTint: "#D6EFE6",
    track: "#D3E6EC",
    ink: "#0F2A33",
    accentIcon: "#1F6F8B",
  }),
  restore: createPalette({
    isDark: false,
    background: "#F1F6EF",
    surface: "#FFFFFF",
    surfaceSecondary: "#DDEBE0",
    primary: "#2F6B4F",
    primaryLight: "#6AA588",
    primaryShadow: "#1F4D37",
    text: "#14281E",
    textSecondary: "#4F6558",
    textTertiary: "#66796D",
    tint: "#CFE5D6",
    tintSoft: "#DDEBE0",
    onTint: "#1F4D37",
    highlight: "#E8B96A",
    highlightShadow: "#BE9140",
    highlightTint: "#F6E4BE",
    mintTint: "#DCEBC4",
    track: "#D2E4D8",
    ink: "#14281E",
    accentIcon: "#2F6B4F",
  }),
  night: createPalette({
    isDark: true,
    background: "#14131F",
    surface: "#1F1D30",
    surfaceSecondary: "#2D2A4D",
    primary: "#5B47E8",
    primaryLight: "#A99BFF",
    primaryShadow: "#3A2BB0",
    text: "#ECE9FF",
    textSecondary: "#A9A5C9",
    textTertiary: "#8985AD",
    tint: "#3A3466",
    tintSoft: "#2D2A4D",
    onTint: "#CFC7FF",
    highlight: "#FFB36B",
    highlightShadow: "#D98A3D",
    highlightTint: "#4A3A2A",
    mintTint: "#1F4A44",
    track: "#2D2A4D",
    ink: "#2B2850",
    accentIcon: "#A99BFF",
  }),
};

export const THEME_ORDER: readonly ThemeMode[] = [
  "mindful",
  "calm",
  "restore",
  "night",
];

export const Fonts = {
  persian: "EstedadMedium",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const Typography = {
  display: {
    fontFamily: Fonts.persian,
    fontSize: 32,
    lineHeight: 42,
    fontWeight: "500" as const,
  },
  h1: {
    fontFamily: Fonts.persian,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: "500" as const,
  },
  h2: {
    fontFamily: Fonts.persian,
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "500" as const,
  },
  h3: {
    fontFamily: Fonts.persian,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "500" as const,
  },
  body: {
    fontFamily: Fonts.persian,
    fontSize: 16,
    lineHeight: 27,
    fontWeight: "500" as const,
  },
  bodySmall: {
    fontFamily: Fonts.persian,
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "500" as const,
  },
  caption: {
    fontFamily: Fonts.persian,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  button: {
    fontFamily: Fonts.persian,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  english: {
    regular: { fontFamily: Fonts.regular, fontWeight: "400" as const },
    medium: { fontFamily: Fonts.medium, fontWeight: "500" as const },
    semiBold: { fontFamily: Fonts.semiBold, fontWeight: "600" as const },
    bold: { fontFamily: Fonts.bold, fontWeight: "700" as const },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export type ThemeName = ThemeMode;
export type ThemeColors = (typeof Colors)[ThemeMode];

export default Colors;
