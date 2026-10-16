import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
} from "react-native";
import {
  Loader,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Search,
  SkipBack,
  SkipForward,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import {
  GOLD,
  GOLD_DARK,
  PageBanner,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import { RECITERS, getReciter } from "@/features/quran/data/reciters";
import { SURAHS, getSurah, type SurahInfo } from "@/features/quran/data/surahs";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { useRecitation } from "@/features/quran/state/RecitationContext";

const PADDING = 20;
const SKIP_SECONDS = 10;

function clock(seconds: number, language: "fa" | "en"): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;

  return formatNumber(
    `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`,
    language,
  );
}

export default function ListenScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { surahId: activeSurah } = useQuranProgress();
  const {
    reciterId,
    setReciterId,
    target,
    playing,
    loading,
    failed,
    position,
    duration,
    repeat,
    setRepeat,
    autoNext,
    setAutoNext,
    playSurah,
    toggle,
    seekBy,
    seekToRatio,
    playRelativeSurah,
  } = useRecitation();
  const [query, setQuery] = useState("");
  const [barWidth, setBarWidth] = useState(1);
  const number = (value: number) => formatNumber(value, language);
  const playingSurahId = target?.kind === "surah" ? target.surahId : undefined;
  const current = playingSurahId ? getSurah(playingSurahId) : undefined;
  const reciter = getReciter(reciterId);
  const ratio = duration > 0 ? Math.min(position / duration, 1) : 0;
  const MainIcon = loading ? Loader : playing ? Pause : Play;
  const learning = getSurah(activeSurah);

  const data = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return SURAHS.filter(
      (surah) =>
        !normalized ||
        surah.name.includes(normalized) ||
        surah.transliteration.toLowerCase().includes(normalized) ||
        String(surah.id) === normalized,
    );
  }, [query]);

  const onBarLayout = (event: LayoutChangeEvent) =>
    setBarWidth(Math.max(event.nativeEvent.layout.width, 1));

  const renderItem = ({ item }: ListRenderItemInfo<SurahInfo>) => {
    const isCurrent = playingSurahId === item.id;
    const isPlayingNow = isCurrent && playing;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.transliteration} ${isPlayingNow ? t.quran_pause : t.quran_play}`}
        onPress={() => (isCurrent ? toggle() : playSurah(item.id))}
        style={[
          styles.rowItem,
          {
            backgroundColor: isCurrent ? colors.tint : colors.surface,
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
        <View
          style={[
            styles.playBadge,
            { backgroundColor: isCurrent ? colors.primary : colors.tintSoft },
          ]}
        >
          {isPlayingNow ? (
            <Pause size={18} color={colors.onPrimary} />
          ) : (
            <Play
              size={18}
              color={isCurrent ? colors.onPrimary : colors.onTint}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingHorizontal: PADDING },
      ]}
      data={data}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      ListHeaderComponent={
        <View style={styles.header}>
          <PageBanner
            width={width - PADDING * 2}
            background={colors.primary}
            arabicTitle="التلاوة"
            title={t.quran_listen_title ?? ""}
            subtitle={t.quran_listen_sub ?? ""}
            illustration="crescent"
            isRTL={isRTL}
          />

          <View style={styles.section}>
            <AppText
              variant="bodySmall"
              style={{ color: colors.text, fontWeight: "800", textAlign }}
            >
              {t.quran_reciter}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {RECITERS.map((item) => {
                const selected = item.id === reciterId;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setReciterId(item.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="bodySmall"
                      style={{
                        color: selected ? colors.onPrimary : colors.text,
                        fontWeight: selected ? "800" : "500",
                      }}
                    >
                      {isRTL ? item.fa : item.en}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.player, { backgroundColor: colors.surface }]}>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign }}
            >
              {t.quran_now_playing}
            </AppText>
            {current ? (
              <>
                <Text
                  allowFontScaling={false}
                  style={[styles.nowName, { color: colors.text }]}
                >
                  {current.name}
                </Text>
                <AppText
                  variant="caption"
                  style={{
                    color: failed ? colors.error : colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  {failed
                    ? t.quran_audio_error
                    : loading
                      ? t.quran_audio_loading
                      : isRTL
                        ? reciter.fa
                        : reciter.en}
                </AppText>

                <Pressable
                  accessibilityRole="adjustable"
                  onLayout={onBarLayout}
                  onPress={(event) =>
                    seekToRatio(event.nativeEvent.locationX / barWidth)
                  }
                  style={styles.barHit}
                >
                  <View style={[styles.bar, { backgroundColor: colors.track }]}>
                    <View
                      style={[
                        styles.barFill,
                        { backgroundColor: GOLD, width: `${Math.round(ratio * 100)}%` },
                      ]}
                    />
                  </View>
                </Pressable>
                <View style={styles.times}>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    {clock(position, language)}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    {clock(duration, language)}
                  </AppText>
                </View>

                <View style={styles.controls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.quran_prev_surah}
                    onPress={() => playRelativeSurah(-1)}
                    style={styles.control}
                  >
                    <SkipBack size={24} color={colors.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.quran_backward}
                    onPress={() => seekBy(-SKIP_SECONDS)}
                    style={styles.control}
                  >
                    <RotateCcw size={24} color={colors.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={playing ? t.quran_pause : t.quran_play}
                    onPress={toggle}
                    style={[styles.mainButton, { backgroundColor: colors.primary }]}
                  >
                    <MainIcon size={30} color={colors.onPrimary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.quran_forward}
                    onPress={() => seekBy(SKIP_SECONDS)}
                    style={styles.control}
                  >
                    <RotateCw size={24} color={colors.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.quran_next_surah}
                    onPress={() => playRelativeSurah(1)}
                    style={styles.control}
                  >
                    <SkipForward size={24} color={colors.text} />
                  </Pressable>
                </View>

                <View style={[styles.toggles, { flexDirection: row }]}>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: repeat }}
                    onPress={() => setRepeat(!repeat)}
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: repeat ? colors.tint : colors.tintSoft,
                        flexDirection: row,
                      },
                    ]}
                  >
                    <Repeat size={16} color={colors.onTint} />
                    <AppText
                      variant="caption"
                      style={{
                        color: colors.onTint,
                        fontWeight: repeat ? "800" : "500",
                      }}
                    >
                      {t.quran_repeat}
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: autoNext }}
                    onPress={() => setAutoNext(!autoNext)}
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: autoNext ? colors.tint : colors.tintSoft,
                        flexDirection: row,
                      },
                    ]}
                  >
                    <SkipForward size={16} color={colors.onTint} />
                    <AppText
                      variant="caption"
                      style={{
                        color: colors.onTint,
                        fontWeight: autoNext ? "800" : "500",
                      }}
                    >
                      {t.quran_auto_next}
                    </AppText>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.empty}>
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, textAlign: "center" }}
                >
                  {t.quran_nothing_playing}
                </AppText>
                {learning ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => playSurah(learning.id)}
                    style={[
                      styles.learning,
                      { backgroundColor: colors.primary, flexDirection: row },
                    ]}
                  >
                    <Play size={18} color={colors.onPrimary} />
                    <AppText
                      variant="bodySmall"
                      style={{ color: colors.onPrimary, fontWeight: "800" }}
                    >
                      {`${t.quran_listen_current}: ${isRTL ? learning.name : learning.transliteration}`}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            )}
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.quran_audio_online_note}
            </AppText>
          </View>

          <View
            style={[
              styles.search,
              { backgroundColor: colors.surface, flexDirection: row },
            ]}
          >
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.quran_search}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.quran_search}
              style={[styles.input, { color: colors.text, textAlign }]}
            />
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    gap: 10,
  },
  header: {
    gap: 14,
    marginBottom: 4,
  },
  section: {
    gap: 8,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  player: {
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  nowName: {
    fontFamily: "UthmanicHafs",
    fontSize: 38,
    lineHeight: 64,
    textAlign: "center",
    includeFontPadding: false,
  },
  barHit: {
    height: 28,
    justifyContent: "center",
  },
  bar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  control: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  toggles: {
    justifyContent: "center",
    gap: 10,
  },
  toggle: {
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  learning: {
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  search: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  rowItem: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  arabicName: {
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 42,
    includeFontPadding: false,
  },
  playBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
