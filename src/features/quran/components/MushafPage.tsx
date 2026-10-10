import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MUSHAF_FONT_FAMILY,
  MUSHAF_UNITS_PER_EM,
  PAGE1_ADVANCES,
  PAGE1_LINES,
  PAGE1_VERSES,
  glyphChar,
} from '@/features/quran/data/mushafPage1';

const LINE_HEIGHT_RATIO = 1.41;
const GLYPH_LINE_HEIGHT_RATIO = 1.7;
const CENTER_GAP_RATIO = 0.35;
const INK = '#14110D';
const HIGHLIGHT = '#C9302C';
const BLUR = 'rgba(20,40,30,0.5)';

const MARKERS: ReadonlySet<number> = new Set(PAGE1_VERSES.map((verse) => verse.markerIndex));

function verseOf(glyphIndex: number): number {
  return PAGE1_VERSES.find((verse) => glyphIndex >= verse.from && glyphIndex < verse.to)?.ayah ?? 0;
}

interface MushafPageProps {
  width: number;
  highlightAyah: number;
  hiddenIndices: ReadonlySet<number>;
  onRevealWord: (index: number) => void;
  accessibilityLabel: string;
}

export function MushafPage({
  width,
  highlightAyah,
  hiddenIndices,
  onRevealWord,
  accessibilityLabel,
}: MushafPageProps) {
  const fontSize = useMemo(() => {
    const widest = Math.max(
      ...PAGE1_LINES.filter((line) => line.alignment === 'justify').map((line) =>
        PAGE1_ADVANCES.slice(line.from, line.to).reduce((sum, advance) => sum + advance, 0),
      ),
    );

    return (width * MUSHAF_UNITS_PER_EM) / widest;
  }, [width]);

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility="yes"
      style={{ width }}
    >
      {PAGE1_LINES.map((line) => (
        <View
          key={line.from}
          style={[
            styles.line,
            {
              height: lineHeight,
              justifyContent: line.alignment === 'justify' ? 'space-between' : 'center',
              gap: line.alignment === 'center' ? fontSize * CENTER_GAP_RATIO : 0,
            },
          ]}
        >
          {Array.from({ length: line.to - line.from }, (_, offset) => {
            const index = line.from + offset;
            const hidden = hiddenIndices.has(index) && !MARKERS.has(index);
            const highlighted = verseOf(index) === highlightAyah;
            const glyph = (
              <Text
                allowFontScaling={false}
                importantForAccessibility="no"
                style={[
                  styles.glyph,
                  {
                    fontSize,
                    lineHeight: fontSize * GLYPH_LINE_HEIGHT_RATIO,
                    color: highlighted ? HIGHLIGHT : INK,
                  },
                  hidden && {
                    color: 'transparent',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 9,
                    textShadowColor: highlighted ? 'rgba(201,48,44,0.5)' : BLUR,
                  },
                ]}
              >
                {glyphChar(index)}
              </Text>
            );

            return hidden ? (
              <Pressable key={index} onPress={() => onRevealWord(index)} hitSlop={4}>
                {glyph}
              </Pressable>
            ) : (
              <View key={index}>{glyph}</View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  glyph: {
    fontFamily: MUSHAF_FONT_FAMILY,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
