import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Flower2,
  Leaf,
  Volume2,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import { Rise } from "@/shared/motion/motion";
import { MushafPage } from "@/features/quran/components/MushafPage";
import { HizbDot } from "@/features/quran/components/QuranDecor";
import type { MushafVerse } from "@/features/quran/data/mushafPage1";
import { getSurah } from "@/features/quran/data/surahs";
import { pageForAyah } from "@/features/quran/data/mushafPages";
import { useQuranProgress } from "@/features/quran/state/QuranProgressContext";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import { fill } from "@/features/quran/utils/fill";
import { growthMarkers } from "@/features/quran/utils/plantGrowth";
import { SectionPractice } from "@/features/quran/components/SectionPractice";
import { useSectionData } from "@/features/quran/state/useSectionInfo";
import { STATUS_COLORS } from "@/features/quran/utils/sections";

type Mode = "full" | "half" | "hidden" | "challenge";

const MODES: readonly Mode[] = ["full", "half", "hidden", "challenge"];
/** In challenge mode every word is hidden and you only get a few peeks per verse. */
const MAX_PEEKS = 3;
const PADDING = 20;
const PAPER_PADDING = 14;
const BLOSSOM_COLOR = "#E0708F";
const LEAF_COLOR = "#3F8A63";

function hiddenIndicesFor(
  verses: readonly MushafVerse[],
  mode: Mode,
  currentAyah: number,
): Set<number> {
  const hidden = new Set<number>();

  if (mode === "full") {
    return hidden;
  }

  verses.forEach((verse) => {
    for (let index = verse.from; index < verse.to; index += 1) {
      if (index === verse.markerIndex) {
        continue;
      }

      const offset = index - verse.from;
      // Half mode: later verses are fully hidden, the current verse shows only one word in
      // three, and verses you passed already keep every other word hidden.
      const hide =
        mode === "hidden" ||
        mode === "challenge" ||
        verse.ayah > currentAyah ||
        (verse.ayah === currentAyah && offset % 3 !== 0) ||
        (verse.ayah < currentAyah && offset % 2 === 1);

      if (hide) {
        hidden.add(index);
      }
    }
  });

  return hidden;
}

export default function MemorizeScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const recitingLine = useRef<View>(null);
  const params = useLocalSearchParams<{ ayah?: string }>();
  const { mushaf, currentAyah, remember, needsReview, recordFor, learnedCount } =
    useQuranProgress();
  const { playAyah, target, playing, loading, rangeProgress, toggle } =
    useRecitation();
  const verses = mushaf.verses;
  const TOTAL_VERSES = verses.length;
  const initial = Number(params.ayah);
  const [current, setCurrent] = useState(
    Number.isInteger(initial) && initial >= 1 && initial <= TOTAL_VERSES
      ? initial
      : currentAyah,
  );
  // Stars of the verses that will add a leaf or a blossom to the flower once learned.
  const markers = useMemo(
    () =>
      growthMarkers(
        verses.map((verse) => verse.ayah).filter((ayah) => !recordFor(ayah)),
        learnedCount,
        verses.length,
      ),
    [learnedCount, recordFor, verses],
  );
  const [mode, setMode] = useState<Mode>("half");
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [peeks, setPeeks] = useState(0);
  const number = (value: number) => formatNumber(value, language);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const surah = getSurah(mushaf.surahId);

  // The verse whose audio is playing (single verse or inside a section/range playback).
  const recitingAyah = useMemo(() => {
    if (
      !target ||
      target.surahId !== mushaf.surahId ||
      !(playing || loading)
    ) {
      return undefined;
    }

    if (target.kind === "ayah") {
      return target.ayah;
    }

    return target.kind === "range"
      ? (rangeProgress?.ayah ?? target.from)
      : undefined;
  }, [loading, mushaf.surahId, playing, rangeProgress?.ayah, target]);

  // Show the page of the verse being recited, so it is never off the screen.
  const page = pageForAyah(mushaf, recitingAyah ?? current);

  // Bring the reciting verse into view: the player settings sit far below the page,
  // so without this the user has to scroll up after every verse.
  useEffect(() => {
    if (recitingAyah === undefined) {
      return;
    }

    const timer = setTimeout(() => {
      recitingLine.current?.measureInWindow((_x, y, _width, lineHeight) => {
        const top = insets.top + 72;
        const bottom = windowHeight * 0.55;

        if (y >= top && y + lineHeight <= bottom) {
          return;
        }

        scrollRef.current?.scrollTo({
          y: Math.max(scrollY.current + y - top, 0),
          animated: true,
        });
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [recitingAyah, page.pageNumber, insets.top, windowHeight]);
  const { verseStatus } = useSectionData(mushaf.surahId);

  const hidden = useMemo(() => {
    const base = hiddenIndicesFor(page.verses, mode, current);
    revealed.forEach((index) => base.delete(index));

    return base;
  }, [page, mode, current, revealed]);

  const changeMode = useCallback((next: Mode) => {
    setMode(next);
    setRevealed(new Set());
    setPeeks(0);
  }, []);

  const peeksLeft = Math.max(MAX_PEEKS - peeks, 0);

  const reveal = useCallback(
    (index: number) => {
      if (mode === "challenge") {
        if (peeks >= MAX_PEEKS) {
          return;
        }

        setPeeks((value) => value + 1);
      }

      setRevealed((previous) => new Set(previous).add(index));
    },
    [mode, peeks],
  );

  const busy = useRef(false);
  const isLast = current >= TOTAL_VERSES;

  const goNext = useCallback(() => {
    setRevealed(new Set());
    setPeeks(0);
    setCurrent((value) => Math.min(value + 1, TOTAL_VERSES));
  }, [TOTAL_VERSES]);

  const handleRemembered = useCallback(async () => {
    // Reading the full text is not a test: hide it first, then confirm from memory.
    if (mode === "full") {
      changeMode("challenge");

      return;
    }

    if (busy.current) {
      return;
    }

    busy.current = true;

    try {
      const result = await remember(current);

      if (result.becameLearned || result.stageChanged) {
        router.push({
          pathname: "/moment",
          params: isLast
            ? { ayah: String(current), next: "quiz" }
            : { ayah: String(current) },
        });
      } else if (isLast) {
        router.replace("/quiz");
      }

      goNext();
    } finally {
      busy.current = false;
    }
  }, [changeMode, current, goNext, isLast, mode, remember, router]);

  const handleAgain = useCallback(async () => {
    if (busy.current) {
      return;
    }

    busy.current = true;

    try {
      await needsReview(current);

      if (isLast) {
        router.replace("/");
      } else {
        goNext();
      }
    } finally {
      busy.current = false;
    }
  }, [current, goNext, isLast, needsReview, router]);

  const hintText =
    mode === "full"
      ? t.quran_full_hint
      : mode === "half"
        ? t.quran_half_hint
        : mode === "challenge"
          ? peeksLeft > 0
            ? fill(t.quran_peeks_left, { count: number(peeksLeft) })
            : t.quran_peeks_out
          : t.quran_tap_hint;
  const verseIsPlaying =
    target?.kind === "ayah" &&
    target.surahId === mushaf.surahId &&
    target.ayah === current;

  const listenToVerse = () => {
    if (verseIsPlaying) {
      toggle();
    } else {
      playAyah(mushaf.surahId, current);
    }
  };

  const pageWidth = width - PADDING * 2 - PAPER_PADDING * 2;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingHorizontal: PADDING },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
    >
      <Rise>
        <View style={[styles.header, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_back}
            onPress={() => router.replace("/")}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <BackIcon size={22} color={colors.text} />
          </Pressable>
          <View style={styles.title}>
            <Text
              style={[styles.surahName, { color: colors.text }]}
              allowFontScaling={false}
            >
              {surah?.name}
            </Text>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {fill(t.quran_verses_range, {
                from: number(1),
                to: number(TOTAL_VERSES),
              })}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_exam_open}
            onPress={() => router.push("/exam")}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <ClipboardCheck size={22} color={colors.text} />
          </Pressable>
        </View>
      </Rise>

      <Rise delay={80}>
        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.tintSoft, flexDirection: row },
          ]}
        >
          {MODES.map((item) => {
            const selected = item === mode;

            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => changeMode(item)}
                style={[
                  styles.segment,
                  selected && { backgroundColor: colors.surface },
                ]}
              >
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={{
                    color: colors.text,
                    fontWeight: selected ? "800" : "500",
                  }}
                >
                  {t[`quran_mode_${item}`]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Rise>

      <Rise delay={160}>
        <View style={[styles.paper, { padding: PAPER_PADDING }]}>
          <MushafPage
            key={page.pageNumber}
            page={page}
            width={pageWidth}
            highlightAyah={current}
            recitingAyah={recitingAyah}
            recitingLineRef={recitingLine}
            hiddenIndices={hidden}
            onRevealWord={reveal}
            accessibilityLabel={fill(t.quran_page_label, {
              page: number(page.pageNumber),
              surah: surah?.transliteration ?? "",
            })}
          />
        </View>
      </Rise>

      <Rise delay={220}>
        <View style={styles.hintRow}>
          <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
            <AppText
              variant="caption"
              style={{
                color: colors.text,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {hintText}
            </AppText>
          </View>
        </View>
      </Rise>

      <Rise delay={260}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.quran_listen_verse}
          onPress={listenToVerse}
          style={[
            styles.listenVerse,
            { backgroundColor: colors.tintSoft, flexDirection: row },
          ]}
        >
          <Volume2 size={18} color={colors.onTint} />
          <AppText
            variant="caption"
            style={{ color: colors.onTint, fontWeight: "700" }}
          >
            {verseIsPlaying && playing ? t.quran_pause : t.quran_listen_verse}
          </AppText>
        </Pressable>
      </Rise>

      <View style={styles.progress}>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {fill(t.quran_verse_of, {
            ayah: number(current),
            total: number(TOTAL_VERSES),
          })}
        </AppText>
        <View style={[styles.dotsRow, { flexDirection: row }]}>
          {verses.map((verse) => {
            const isCurrent = verse.ayah === current;
            const marker = markers.get(verse.ayah);

            return (
              <View key={verse.ayah} style={styles.dotCell}>
                {marker === "blossom" ? (
                  <Flower2 size={14} color={BLOSSOM_COLOR} strokeWidth={2.4} />
                ) : marker === "leaf" ? (
                  <Leaf size={12} color={LEAF_COLOR} strokeWidth={2.4} />
                ) : (
                  <View style={styles.markerSpace} />
                )}
                <HizbDot
                  size={isCurrent ? 18 : 14}
                  color={
                    isCurrent
                      ? colors.highlight
                      : STATUS_COLORS[verseStatus(verse.ayah).status]
                  }
                />
              </View>
            );
          })}
        </View>
        {markers.size > 0 ? (
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {t.quran_marker_hint}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.actions, { flexDirection: row }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleAgain()}
          style={[
            styles.secondary,
            { backgroundColor: colors.surface, shadowColor: colors.tint },
          ]}
        >
          <AppText
            variant="bodySmall"
            style={{ color: colors.text, fontWeight: "700" }}
          >
            {t.quran_again}
          </AppText>
        </Pressable>
        <View style={styles.primary}>
          <ChunkyButton
            label={(mode === "full" ? t.quran_test_me : t.quran_knew) ?? ""}
            onPress={() => void handleRemembered()}
          />
        </View>
      </View>

      <SectionPractice
        surahId={mushaf.surahId}
        focusAyah={current}
        onSelectSection={(section) => {
          setRevealed(new Set());
          setPeeks(0);
          setCurrent(section.from);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    alignItems: "center",
    flex: 1,
  },
  surahName: {
    fontFamily: "UthmanicHafs",
    fontSize: 26,
    lineHeight: 44,
    includeFontPadding: false,
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
  paper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
  },
  hintRow: {
    alignItems: "center",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    flexShrink: 1,
  },
  progress: {
    alignItems: "center",
    gap: 8,
  },
  dotCell: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  markerSpace: {
    height: 14,
  },
  dotsRow: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  listenVerse: {
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actions: {
    gap: 12,
    alignItems: "center",
  },
  secondary: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  primary: {
    flex: 1.2,
  },
});
