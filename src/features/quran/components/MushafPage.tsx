import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  glyphChar,
  type MushafPageData,
} from "@/features/quran/data/mushafPages";

const LINE_HEIGHT_RATIO = 1.41;
const GLYPH_LINE_HEIGHT_RATIO = 1.7;
const CENTER_GAP_RATIO = 0.35;
const INK = "#14110D";
const HIGHLIGHT = "#C9302C";
const BLUR = "rgba(20,40,30,0.5)";

const GOLD = "#B8934A";
const GOLD_DARK = "#8C6B2E";
const GREEN = "#2E6B4E";
const GREEN_DARK = "#1F4D37";
const CREAM = "#FFFBEF";

const FRAME_INSET = 12;
const BISMILLAH_WIDTH_RATIO = 0.46;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]!);
}

interface MushafPageProps {
  page: MushafPageData;
  width: number;
  highlightAyah: number;
  hiddenIndices: ReadonlySet<number>;
  onRevealWord: (index: number) => void;
  accessibilityLabel: string;
}

export function MushafPage({
  page,
  width,
  highlightAyah,
  hiddenIndices,
  onRevealWord,
  accessibilityLabel,
}: MushafPageProps) {
  const { ornament } = page;
  const innerWidth = ornament ? width - FRAME_INSET * 2 : width;

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
    const widest = Math.max(
      ...page.lines
        .filter((line) => line.alignment === "justify")
        .map((line) =>
          page.advances
            .slice(line.from, line.to)
            .reduce((sum, advance) => sum + advance, 0),
        ),
    );

    return (innerWidth * page.unitsPerEm) / widest;
  }, [page, innerWidth]);

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;

  const lines = page.lines.map((line) => (
    <View
      key={line.from}
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
        const hidden = hiddenIndices.has(index) && !markers.has(index);
        const highlighted = verseByIndex[index] === highlightAyah;
        const glyph = (
          <Text
            allowFontScaling={false}
            importantForAccessibility="no"
            style={[
              styles.glyph,
              {
                fontFamily: page.fontFamily,
                fontSize,
                lineHeight: fontSize * GLYPH_LINE_HEIGHT_RATIO,
                color: highlighted ? HIGHLIGHT : INK,
              },
              hidden && {
                color: "transparent",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 9,
                textShadowColor: highlighted ? "rgba(201,48,44,0.5)" : BLUR,
              },
            ]}
          >
            {glyphChar(page, index)}
          </Text>
        );

        return hidden ? (
          <Pressable
            key={index}
            onPress={() => onRevealWord(index)}
            hitSlop={4}
          >
            {glyph}
          </Pressable>
        ) : (
          <View key={index}>{glyph}</View>
        );
      })}
    </View>
  ));

  if (!ornament) {
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

  const bismillahAdvance = ornament.bismillahAdvances.reduce(
    (sum, advance) => sum + advance,
    0,
  );
  const bismillahSize =
    (innerWidth * BISMILLAH_WIDTH_RATIO * page.unitsPerEm) / bismillahAdvance;
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
            {ornament.runningHeader}
          </Text>
          <Text style={styles.runningText} allowFontScaling={false}>
            {ornament.title}
          </Text>
        </View>

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
              {toArabicDigits(ornament.order)}
            </Text>
          </View>
          <View style={styles.cartouche}>
            <Text style={styles.title} allowFontScaling={false}>
              {ornament.title}
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
              {toArabicDigits(ornament.versesCount)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.line,
            { height: lineHeight, justifyContent: "center" },
          ]}
        >
          {ornament.bismillahCodepoints.map((codepoint) => (
            <Text
              key={codepoint}
              allowFontScaling={false}
              style={[
                styles.glyph,
                {
                  fontFamily: ornament.bismillahFont,
                  fontSize: bismillahSize,
                  lineHeight: bismillahSize * GLYPH_LINE_HEIGHT_RATIO,
                  color: INK,
                },
              ]}
            >
              {String.fromCodePoint(codepoint)}
            </Text>
          ))}
        </View>

        {lines}

        <Text style={styles.pageNumber} allowFontScaling={false}>
          {toArabicDigits(page.pageNumber)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  glyph: {
    includeFontPadding: false,
    textAlignVertical: "center",
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
