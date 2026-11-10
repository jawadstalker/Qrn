import React from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { Heart } from "lucide-react-native";
import { useFavorites } from "@/features/quran/state/FavoritesContext";
import { useTheme } from "@/core/theme/ThemeContext";

interface FavoriteButtonProps {
  surahId: number;
  size?: number;
  style?: ViewStyle;
}

export function FavoriteButton({
  surahId,
  size = 20,
  style,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { colors } = useTheme();
  const active = isFavorite(surahId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
      }
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={(e) => {
        e.stopPropagation();
        void toggleFavorite(surahId);
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: active
            ? "rgba(239, 68, 68, 0.12)"
            : "rgba(0, 0, 0, 0.04)",
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Heart
        size={size}
        color={active ? "#EF4444" : colors.textSecondary}
        fill={active ? "#EF4444" : "none"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
