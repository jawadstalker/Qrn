import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import {
  MiniPlant,
  type MiniPlantState,
} from "@/features/quran/components/MiniPlant";
import { hasMushafPage } from "@/features/quran/data/mushafPages";
import { SURAHS, type SurahInfo } from "@/features/quran/data/surahs";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";

type Filter = "all" | "learning" | "done";

const FILTERS: readonly Filter[] = ["all", "learning", "done"];
const ORNAMENT_SIZE = 40;
const ORNAMENT_COLOR = "#C9B27A";
const ORNAMENT_TEXT = "#7A5F22";

interface RowState {
  plant: MiniPlantState;
  labelKey: string;
  isLearning: boolean;
  isDone: boolean;
}

export default function QuranLibraryScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { statsFor, setSurah } = useQuranProgress();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const number = (value: number) => formatNumber(value, language);

  const rowStates = useMemo(() => {
    const map = new Map<number, RowState & { startAyah: number }>();

    SURAHS.forEach((surah) => {
      const stats = statsFor(surah.id);

      if (!stats) {
        return;
      }

      const done = stats.learned === stats.total;
      const miniState: MiniPlantState =
        stats.plant.flowers > 0 || done
          ? "flower"
          : stats.learned >= 3
            ? "leafy"
            : stats.learned >= 1
              ? "sprout"
              : "seed";
      const labelKey = {
        flower: "quran_state_flower",
        leafy: "quran_state_leaf",
        sprout: "quran_state_sprout",
        seed: "quran_state_seed",
      }[miniState];

      map.set(surah.id, {
        plant: miniState,
        labelKey,
        isLearning: stats.learned > 0 && !done,
        isDone: done,
        startAyah: stats.startAyah,
      });
    });

    return map;
  }, [statsFor]);

  const data = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return SURAHS.filter((surah) => {
      const matchesQuery =
        !normalized ||
        surah.name.includes(normalized) ||
        surah.transliteration.toLowerCase().includes(normalized) ||
        String(surah.id) === normalized;
      const state = rowStates.get(surah.id);
      const matchesFilter =
        filter === "all" ||
        (state !== undefined &&
          ((filter === "learning" && state.isLearning) ||
            (filter === "done" && state.isDone)));

      return matchesQuery && matchesFilter;
    }).sort(
      (a, b) => Number(hasMushafPage(b.id)) - Number(hasMushafPage(a.id)),
    );
  }, [query, filter, rowStates]);

  const renderItem = ({ item }: ListRenderItemInfo<SurahInfo>) => {
    const rowState = rowStates.get(item.id);
    const available = rowState !== undefined;
    const state: RowState = rowState
      ? rowState
      : {
          plant: "seed",
          labelKey: "quran_soon",
          isLearning: false,
          isDone: false,
        };

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !available }}
        disabled={!available}
        onPress={() => {
          if (!rowState) {
            return;
          }

          setSurah(item.id);
          router.push({
            pathname: "/memorize",
            params: { ayah: String(rowState.startAyah) },
          });
        }}
        style={[
          styles.rowItem,
          {
            backgroundColor: colors.surface,
            flexDirection: row,
            opacity: available ? 1 : 0.6,
          },
        ]}
      >
        <View style={[styles.ornament, { borderColor: ORNAMENT_COLOR }]}>
          <AppText
            variant="caption"
            style={{ color: ORNAMENT_TEXT, fontWeight: "700" }}
          >
            {number(item.id)}
          </AppText>
        </View>
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
        <View style={styles.plantState}>
          <MiniPlant state={state.plant} />
          <AppText
            variant="caption"
            style={{ color: colors.onTint, fontWeight: "700" }}
          >
            {t[state.labelKey]}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      data={data}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText
            variant="h1"
            style={{ color: colors.text, textAlign, fontWeight: "800" }}
          >
            {t.quran_library}
          </AppText>
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
          <View
            style={[
              styles.segmented,
              { backgroundColor: colors.tintSoft, flexDirection: row },
            ]}
          >
            {FILTERS.map((item) => {
              const selected = item === filter;

              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.segment,
                    selected && { backgroundColor: colors.surface },
                  ]}
                >
                  <AppText
                    variant="bodySmall"
                    style={{
                      color: colors.text,
                      fontWeight: selected ? "800" : "500",
                    }}
                  >
                    {t[`quran_filter_${item}`]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  header: {
    gap: 12,
    marginBottom: 4,
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
  segmented: {
    borderRadius: 22,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowItem: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 12,
  },
  ornament: {
    width: ORNAMENT_SIZE,
    height: ORNAMENT_SIZE,
    borderRadius: ORNAMENT_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
  plantState: {
    alignItems: "center",
  },
});
