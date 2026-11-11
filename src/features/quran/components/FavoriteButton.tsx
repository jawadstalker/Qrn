import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Heart } from "lucide-react-native";
import { useFavorites } from "@/features/quran/state/FavoritesContext";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";

interface FavoriteButtonProps {
  surahId: number;
  /** Icon size; the touch circle is 18 larger, the same as the download button. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const RED = "#EF4444";

export function FavoriteButton({ surahId, size = 20, style }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const active = isFavorite(surahId);
  const circle = size + 18;
  const scale = useSharedValue(1);
  const first = useRef(true);

  // The heart pops when it is switched on or off (not when the list first appears).
  useEffect(() => {
    if (first.current) {
      first.current = false;

      return;
    }

    scale.value = withSequence(
      withTiming(active ? 1.3 : 0.85, { duration: 110 }),
      withTiming(1, { duration: 140 }),
    );
  }, [active, scale]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? t.fav_remove : t.fav_add}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={(event) => {
        event.stopPropagation();
        void toggleFavorite(surahId);
      }}
      style={({ pressed }) => [
        styles.button,
        {
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: active ? "rgba(239, 68, 68, 0.14)" : colors.tintSoft,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Animated.View style={popStyle}>
        <Heart
          size={size}
          color={active ? RED : colors.textSecondary}
          fill={active ? RED : "none"}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
