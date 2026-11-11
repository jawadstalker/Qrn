import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Heart, Pause, Play } from "lucide-react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { DownloadButton } from "@/features/quran/components/DownloadButton";
import { FavoriteButton } from "@/features/quran/components/FavoriteButton";
import { ScreenHeader } from "@/features/quran/components/ScreenHeader";
import { SurahListRow } from "@/features/quran/components/SurahListRow";
import { type SurahInfo } from "@/features/quran/data/surahs";
import { useFavorites } from "@/features/quran/state/FavoritesContext";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { useRecitation } from "@/features/quran/state/RecitationContext";

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getFavoriteSurahs, favoriteCount } = useFavorites();
  const { setSurah } = useQuranProgress();
  const { playSurah, toggle, target, playing, reciterId } = useRecitation();
  const favoriteSurahs = getFavoriteSurahs();
  const playingSurahId = target?.kind === "surah" ? target.surahId : undefined;

  const renderItem = ({ item }: { item: SurahInfo }) => {
    const isCurrent = playingSurahId === item.id;
    const isPlaying = isCurrent && playing;

    return (
      <SurahListRow surah={item}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.fav_memorize}
          onPress={() => {
            setSurah(item.id);
            router.push("/memorize");
          }}
          hitSlop={6}
          style={[styles.iconButton, { backgroundColor: colors.tintSoft }]}
        >
          <BookOpen size={18} color={colors.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t.dl_pause : t.fav_listen}
          onPress={() => (isCurrent ? toggle() : playSurah(item.id))}
          hitSlop={6}
          style={[
            styles.iconButton,
            { backgroundColor: isPlaying ? colors.primary : colors.tintSoft },
          ]}
        >
          {isPlaying ? (
            <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={18} color={colors.primary} />
          )}
        </Pressable>

        <DownloadButton surahId={item.id} reciterId={reciterId} size={18} />
        <FavoriteButton surahId={item.id} size={18} />
      </SurahListRow>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScreenHeader
        title={t.fav_title}
        trailing={
          favoriteCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.tintSoft }]}>
              <AppText
                variant="caption"
                style={{ color: colors.primary, fontWeight: "800" }}
              >
                {formatNumber(favoriteCount, language)}
              </AppText>
            </View>
          ) : null
        }
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={favoriteSurahs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surface }]}>
            <Heart size={44} color="#EF4444" opacity={0.7} />
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}
            >
              {t.fav_empty_title}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.fav_empty_body}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/library")}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <AppText
                variant="caption"
                style={{ color: "#FFFFFF", fontWeight: "800" }}
              >
                {t.fav_go_library}
              </AppText>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    marginTop: 20,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
});
