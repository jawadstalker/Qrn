import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
  Heart,
} from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import {
  GOLD,
  GOLD_DARK,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import { useFavorites } from "@/features/quran/state/FavoritesContext";
import { FavoriteButton } from "@/features/quran/components/FavoriteButton";
import { DownloadButton } from "@/features/quran/components/DownloadButton";
import { type SurahInfo } from "@/features/quran/data/surahs";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { useRecitation } from "@/features/quran/state/RecitationContext";

const PADDING = 20;

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { getFavoriteSurahs, favoriteCount } = useFavorites();
  const { setSurah } = useQuranProgress();
  const { playSurah, reciterId } = useRecitation();

  const favoriteSurahs = getFavoriteSurahs();
  const number = (val: number) => formatNumber(val, language);

  const renderItem = ({ item }: { item: SurahInfo }) => {
    return (
      <View
        style={[
          styles.rowItem,
          {
            backgroundColor: colors.surface,
            flexDirection: row,
          },
        ]}
      >
        <StarBadge
          size={40}
          label={number(item.id)}
          color={GOLD}
          labelColor={GOLD_DARK}
        />

        <View style={styles.rowText}>
          <Text
            allowFontScaling={false}
            style={[
              styles.arabicName,
              { color: colors.text, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {item.name}
          </Text>
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {`${item.transliteration} · ${number(item.verses)} ${t.quran_verses_word}`}
          </AppText>
        </View>

        <View style={[styles.actionsRow, { flexDirection: row }]}>
          <Pressable
            onPress={() => {
              setSurah(item.id);
              router.push("/memorize");
            }}
            hitSlop={6}
            style={[styles.actionIconBtn, { backgroundColor: colors.tintSoft }]}
          >
            <BookOpen size={17} color={colors.primary} />
          </Pressable>

          <Pressable
            onPress={() => playSurah(item.id)}
            hitSlop={6}
            style={[styles.actionIconBtn, { backgroundColor: colors.tintSoft }]}
          >
            <Headphones size={17} color={colors.primary} />
          </Pressable>

          <DownloadButton surahId={item.id} reciterId={reciterId} size={18} />

          <FavoriteButton surahId={item.id} size={18} />
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.topBar, { flexDirection: row }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
        >
          {isRTL ? (
            <ArrowRight size={22} color={colors.text} />
          ) : (
            <ArrowLeft size={22} color={colors.text} />
          )}
        </Pressable>

        <AppText variant="h2" style={{ color: colors.text, fontWeight: "800" }}>
          علاقه‌مندی‌های من
        </AppText>

        <View style={styles.countBadge}>
          <AppText
            variant="caption"
            style={{ color: colors.primary, fontWeight: "800" }}
          >
            {number(favoriteCount)}
          </AppText>
        </View>
      </View>

      <FlatList
        contentContainerStyle={[styles.content, { paddingHorizontal: PADDING }]}
        data={favoriteSurahs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
            <Heart size={48} color="#EF4444" opacity={0.6} />
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}
            >
              هنوز سوره‌ای به علاقه‌مندی‌ها اضافه نشده است
            </AppText>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              با زدن آیکون قلب در کنار هر سوره، می‌توانید آن را به این بخش اضافه کنید.
            </AppText>
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
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  content: {
    paddingBottom: 40,
    gap: 10,
    paddingTop: 10,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  rowItem: {
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  arabicName: {
    fontFamily: "UthmanicHafs",
    fontSize: 22,
    lineHeight: 34,
    includeFontPadding: false,
  },
  actionsRow: {
    alignItems: "center",
    gap: 6,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
