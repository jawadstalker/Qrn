import React, { useMemo, type RefObject } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  cellText,
  type MushafPageData,
} from "@/features/quran/data/mushafPages";
import { useMushafFont } from "@/features/quran/utils/qcf4Fonts";

const LINE_HEIGHT_RATIO = 1.41;
const GLYPH_LINE_HEIGHT_RATIO = 1.7;
const CENTER_GAP_RATIO = 0.35;
const INK = "#14110D";
const HIGHLIGHT = "#C9302C";
/** The verse being recited right now: clearly different from ink and from the red study highlight. */
const RECITING = "#1565C0";
const BLUR = "rgba(20,40,30,0.5)";

const GOLD = "#B8934A";
const GOLD_DARK = "#8C6B2E";
const GREEN = "#2E6B4E";
const GREEN_DARK = "#1F4D37";
const CREAM = "#FFFBEF";

const FRAME_INSET = 12;
const BISMILLAH_WIDTH_RATIO = 0.46;
/** The bismillah glyphs always come from the QCF_BSML font (2048 units per em). */
const BISMILLAH_UNITS_PER_EM = 2048;
/**
 * The three bismillah glyphs are drawn as one calligraphic line: their ink reaches far outside
 * their own advance box (the first glyph extends 3073 font units to the left of it, the second
 * 1865; the third 987 to the right). A phone clips text to the bounds of its view, so each glyph
 * gets this much room on both sides (in em) or its joining strokes are cut off and the words
 * look far apart. Browsers do not clip, which is why the web version looked right.
 */
const BISMILLAH_INK_SLACK_EM = 3200 / BISMILLAH_UNITS_PER_EM;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]!);
}

interface MushafPageProps {
  page: MushafPageData;
  width: number;
  highlightAyah: number;
  /** The verse currently being recited (audio), shown in its own color. */
  recitingAyah?: number;
  /** Receives the first line of the reciting verse so the screen can scroll to it. */
  recitingLineRef?: RefObject<View | null>;
  hiddenIndices: ReadonlySet<number>;
  hideVerseMarkers?: boolean;
  onRevealWord: (index: number) => void;
  accessibilityLabel: string;
}

export function MushafPage({
  page,
  width,
  highlightAyah,
  recitingAyah,
  recitingLineRef,
  hiddenIndices,
  hideVerseMarkers = false,
  onRevealWord,
  accessibilityLabel,
}: MushafPageProps) {
  const { frame, surahHeader } = page;
  const fontReady = useMushafFont(page.fontFamily);
  const innerWidth = frame ? width - FRAME_INSET * 2 : width;

  const { markers, verseByIndex } = useMemo(() => {
    const byIndex: number[] = [];

    page.verses.forEach((verse) => {
      for (let index = verse.from; index < verse.to; index += 1) {
        byIndex[index] = verse.ayah;
      }
    });

    return {
      markers: new Set(page.verses.map((verse) => verse.markerIndex)),
      verseByIndex: byIndex,
    };
  }, [page]);

  const fontSize = useMemo(() => {
    const widestShown = Math.max(
      ...page.lines
        .filter((line) => line.alignment === "justify")
        .map((line) =>
          page.advances
            .slice(line.from, line.to)
            .reduce((sum, advance) => sum + advance, 0),
        ),
    );
    const widest =
      page.referenceWidth ??
      (Number.isFinite(widestShown) && widestShown > 0
        ? widestShown
        : page.advances.reduce((sum, advance) => sum + advance, 0));

    return (innerWidth * page.unitsPerEm) / widest;
  }, [page, innerWidth]);

  const lineRatio = page.lineHeightRatio ?? LINE_HEIGHT_RATIO;
  const lineHeight = fontSize * lineRatio;
  const glyphLineHeight =
    fontSize * lineRatio * (GLYPH_LINE_HEIGHT_RATIO / LINE_HEIGHT_RATIO);

  // The first line that holds a word of the reciting verse.
  const recitingLineFrom =
    recitingAyah === undefined
      ? undefined
      : page.lines.find((line) => {
          for (let index = line.from; index < line.to; index += 1) {
            if (verseByIndex[index] === recitingAyah) {
              return true;
            }
          }

          return false;
        })?.from;

  const lineViews = page.lines.map((line) => (
    <View
      key={line.from}
      ref={line.from === recitingLineFrom ? recitingLineRef : undefined}
      collapsable={false}
      style={[
        styles.line,
        {
          height: lineHeight,
          justifyContent:
            line.alignment === "justify" ? "space-between" : "center",
          gap: line.alignment === "center" ? fontSize * CENTER_GAP_RATIO : 0,
        },
      ]}
    >
      {Array.from({ length: line.to - line.from }, (_, offset) => {
        const index = line.from + offset;
        const hidden = hiddenIndices.has(index) &&  (!markers.has(index) || hideVerseMarkers);
        const reciting =
          recitingAyah !== undefined && verseByIndex[index] === recitingAyah;
        const highlighted = verseByIndex[index] === highlightAyah;
        // The box of a word has the exact width the font gives it, so the line never depends on
        // how a phone measures the text (it differs a little between iOS, Android and browsers).
        const cellWidth =
          ((page.advances[index] ?? 0) * fontSize) / page.unitsPerEm;
        // The glyph is only created once the page font is loaded. On a phone, text laid out before
        // that is measured with a replacement font and is not measured again when the font arrives.
        const glyph = fontReady ? (
          <Text
            allowFontScaling={false}
            importantForAccessibility="no"
            numberOfLines={1}
            ellipsizeMode="clip"
            style={[
              styles.glyph,
              {
                fontFamily: page.fontFamily,
                fontSize,
                lineHeight: glyphLineHeight,
                // Wider than the box (and centered in it), so a word is never wrapped or cut when
                // the phone measures it a pixel wider than the font says.
                ...(cellWidth > 0 ? { width: cellWidth + fontSize } : null),
                color: reciting ? RECITING : highlighted ? HIGHLIGHT : INK,
              },
              hidden && {
                color: "transparent",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 30,
                textShadowColor: reciting
                  ? "rgba(21,101,192,0.5)"
                  : highlighted
                    ? "rgba(201,48,44,0.5)"
                    : BLUR,
              },
            ]}
          >
            {cellText(page, index)}
          </Text>
        ) : null;
        const cell = (
          <View
            style={[styles.cell, cellWidth > 0 ? { width: cellWidth } : null]}
          >
            {glyph}
          </View>
        );

        return hidden ? (
          <Pressable
            key={index}
            onPress={() => onRevealWord(index)}
            hitSlop={4}
          >
            {cell}
          </Pressable>
        ) : (
          <View key={index}>{cell}</View>
        );
      })}
    </View>
  ));

  // Page fonts load on demand; keep the layout stable and show a spinner until the glyphs exist.
  const lines = (
    <View>
      <View key={page.fontFamily}>{lineViews}</View>
      {fontReady ? null : (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={GOLD_DARK} />
        </View>
      )}
    </View>
  );

  if (!frame) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        importantForAccessibility="yes"
        style={{ width }}
      >
        {lines}
      </View>
    );
  }

  const bismillahAdvance =
    surahHeader?.bismillahAdvances?.reduce(
      (sum, advance) => sum + advance,
      0,
    ) ?? 1;
  const bismillahSize =
    (innerWidth * BISMILLAH_WIDTH_RATIO * BISMILLAH_UNITS_PER_EM) /
    bismillahAdvance;
  const medallion = Math.max(innerWidth * 0.17, 44);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility="yes"
      style={[styles.outerFrame, { width }]}
    >
      <View style={styles.innerFrame}>
        <View style={styles.runningHeader}>
          <Text style={styles.runningText} allowFontScaling={false}>
            {frame.runningHeader}
          </Text>
          <Text style={styles.runningText} allowFontScaling={false}>
            {frame.runningTitle}
          </Text>
        </View>

        {surahHeader ? (
          <>
            <View style={styles.banner}>
              <View
                style={[
                  styles.medallion,
                  {
                    width: medallion,
                    height: medallion,
                    borderRadius: medallion / 2,
                  },
                ]}
              >
                <Text style={styles.medallionLabel} allowFontScaling={false}>
                  ترتيبها
                </Text>
                <Text style={styles.medallionValue} allowFontScaling={false}>
                  {toArabicDigits(surahHeader!.order)}
                </Text>
              </View>
              <View style={styles.cartouche}>
                <Text style={styles.title} allowFontScaling={false}>
                  {surahHeader!.title}
                </Text>
              </View>
              <View
                style={[
                  styles.medallion,
                  {
                    width: medallion,
                    height: medallion,
                    borderRadius: medallion / 2,
                  },
                ]}
              >
                <Text style={styles.medallionLabel} allowFontScaling={false}>
                  آياتها
                </Text>
                <Text style={styles.medallionValue} allowFontScaling={false}>
                  {toArabicDigits(surahHeader!.versesCount)}
                </Text>
              </View>
            </View>

            {surahHeader.bismillahCodepoints ? (
              <View
                style={[
                  styles.line,
                  { height: lineHeight, justifyContent: "center" },
                ]}
              >
                {surahHeader.bismillahCodepoints.map((codepoint, index) => {
                  // Same idea as the words of the page: the box has exactly the width the font
                  // gives the glyph, and the text is wider than the box so nothing is clipped.
                  const cellWidth =
                    ((surahHeader!.bismillahAdvances?.[index] ?? 0) *
                      bismillahSize) /
                    BISMILLAH_UNITS_PER_EM;

                  return (
                    <View
                      key={codepoint}
                      style={[
                        styles.bismillahCell,
                        cellWidth > 0 ? { width: cellWidth } : null,
                      ]}
                    >
                      <Text
                        allowFontScaling={false}
                        numberOfLines={1}
                        ellipsizeMode="clip"
                        style={[
                          styles.glyph,
                          {
                            fontFamily: surahHeader!.bismillahFont,
                            fontSize: bismillahSize,
                            lineHeight: bismillahSize * GLYPH_LINE_HEIGHT_RATIO,
                            color: INK,
                            ...(cellWidth > 0
                              ? {
                                  width:
                                    cellWidth +
                                    bismillahSize * BISMILLAH_INK_SLACK_EM * 2,
                                }
                              : null),
                          },
                        ]}
                      >
                        {String.fromCodePoint(codepoint)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        ) : null}

        {lines}

        <Text style={styles.pageNumber} allowFontScaling={false}>
          {toArabicDigits(page.pageNumber)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  glyph: {
    includeFontPadding: false,
    textAlignVertical: "center",
    textAlign: "center",
  },
  bismillahCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    // Rounding to whole pixels can make a full line a pixel too wide; the words then shrink
    // together instead of leaving the frame.
    flexShrink: 1,
  },
  outerFrame: {
    backgroundColor: CREAM,
    borderWidth: 3,
    borderColor: GOLD_DARK,
    borderRadius: 6,
    padding: 3,
  },
  innerFrame: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 3,
    paddingHorizontal: FRAME_INSET - 7.5,
    paddingVertical: 8,
    gap: 4,
  },
  runningHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  runningText: {
    fontFamily: "UthmanicHafs",
    fontSize: 13,
    lineHeight: 24,
    color: GOLD_DARK,
    includeFontPadding: false,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4,
  },
  medallion: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN_DARK,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  medallionLabel: {
    fontFamily: "UthmanicHafs",
    fontSize: 10,
    lineHeight: 16,
    color: "#F3E3B3",
    includeFontPadding: false,
  },
  medallionValue: {
    fontFamily: "UthmanicHafs",
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  cartouche: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CREAM,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 6,
    paddingVertical: 2,
  },
  title: {
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 42,
    color: INK,
    includeFontPadding: false,
  },
  pageNumber: {
    alignSelf: "center",
    fontFamily: "UthmanicHafs",
    fontSize: 14,
    lineHeight: 24,
    color: GOLD_DARK,
    includeFontPadding: false,
    marginTop: 4,
  },
});
