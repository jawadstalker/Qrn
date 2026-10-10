import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  BookOpen,
  ListOrdered,
  Settings,
  Sprout,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { normalizeRoute } from "@/core/navigation/routes";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";

const BAR_HEIGHT = 72;
const HIDDEN_ROUTES = ["/moment"];

interface TabSpec {
  route: "/" | "/memorize" | "/library" | "/settings";
  labelKey: string;
  icon: LucideIcon;
}

const TABS: readonly TabSpec[] = [
  { route: "/", labelKey: "quran_garden", icon: Sprout },
  { route: "/memorize", labelKey: "quran_memorize", icon: BookOpen },
  { route: "/library", labelKey: "quran_library", icon: ListOrdered },
  { route: "/settings", labelKey: "quran_settings", icon: Settings },
];

export function QuranTabBar() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { row } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = normalizeRoute(usePathname() || "/");

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          flexDirection: row,
          shadowColor: colors.primary,
        },
      ]}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.route;
        const color = active ? colors.primary : colors.textSecondary;
        const Icon = tab.icon;

        return (
          <Pressable
            key={tab.route}
            accessibilityRole="tab"
            accessibilityLabel={t[tab.labelKey]}
            accessibilityState={{ selected: active }}
            style={styles.tab}
            onPress={() => {
              void Haptics.selectionAsync();

              if (!active) {
                router.replace(tab.route);
              }
            }}
          >
            <Icon size={25} color={color} strokeWidth={active ? 2.3 : 1.8} />
            <AppText
              variant="caption"
              style={[styles.label, { color }, active && styles.active]}
            >
              {t[tab.labelKey]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 48,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
  },
  active: {
    fontWeight: "700",
  },
});
