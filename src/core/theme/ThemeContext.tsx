import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Colors,
  Fonts,
  Typography,
  THEME_ORDER,
  type ThemeColors,
} from "@/core/theme/tokens";
import { ThemeMode } from "@/core/types/index";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  fonts: typeof Fonts;
  typography: typeof Typography;
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "@neurolia_theme";
const LEGACY_THEMES: Record<string, ThemeMode> = {
  light: "mindful",
  dark: "night",
  athlete: "mindful",
};

function parseStoredTheme(value: string | null): ThemeMode | null {
  if (!value) {
    return null;
  }

  if ((THEME_ORDER as readonly string[]).includes(value)) {
    return value as ThemeMode;
  }

  return LEGACY_THEMES[value] ?? null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("restore");

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      const fallback: ThemeMode =
        systemColorScheme === "dark" ? "night" : "restore";

      try {
        const saved = parseStoredTheme(await AsyncStorage.getItem(THEME_KEY));

        if (mounted) {
          setThemeState(saved ?? fallback);
        }
      } catch {
        if (mounted) {
          setThemeState(fallback);
        }
      }
    };

    void loadTheme();

    return () => {
      mounted = false;
    };
  }, [systemColorScheme]);

  const setTheme = useCallback(async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);

    try {
      await AsyncStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      console.error("[THEME] Failed to save theme:", error);
    }
  }, []);

  const colors = useMemo(() => Colors[theme], [theme]);
  const isDark = colors.isDark;

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      isDark,
      colors,
      fonts: Fonts,
      typography: Typography,
      setTheme,
    }),
    [theme, isDark, colors, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
