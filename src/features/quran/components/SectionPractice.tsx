import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Pause, Play, Square } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { useST } from "@/features/quran/i18n/sections";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import {
  AYAH_REPEAT_OPTIONS,
  GAP_OPTIONS,
  LOOP_OPTIONS,
  setSectionSize,
  updateRepeatSettings,
  useSections,
} from "@/features/quran/state/sectionStore";
import { useSectionData } from "@/features/quran/state/useSectionInfo";
import {
  SECTION_SIZES,
  STATUS_COLORS,
  STATUS_ORDER,
  statusCounts,
  withAlpha,
  type SectionInfo,
  type SectionStatus,
} from "@/features/quran/utils/sections";

interface SectionStripProps {
  sections: readonly SectionInfo[];
  selectedIndex?: number;
  onSelect?: (section: SectionInfo) => void;
}

/** One colored chip per section; the color shows how well the section is practiced. */
export function SectionStrip({
  sections,
  selectedIndex,
  onSelect,
}: SectionStripProps) {
  const { colors } = useTheme();
  const { row } = useDirection();
  const st = useST();
  const { language } = useLanguage();
  const number = (value: number) => formatNumber(value, language);

  return (
    <View style={[styles.strip, { flexDirection: row }]}>
      {sections.map((section) => {
        const selected = section.index === selectedIndex;
        const color = STATUS_COLORS[section.status];
        const label = `${st("sec_label", { n: section.index + 1 })}, ${st("sec_range", { from: section.from, to: section.to })}, ${st(`sec_status_${section.status}`)}${section.due ? `, ${st("sec_due")}` : ""}`;

        return (
          <Pressable
            key={section.index}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            disabled={!onSelect}
            onPress={() => onSelect?.(section)}
            style={[
              styles.chip,
              {
                backgroundColor: withAlpha(color, selected ? 0.95 : 0.78),
                borderColor: selected ? colors.text : "transparent",
              },
            ]}
          >
            <AppText
              variant="caption"
              style={styles.chipText}
              numberOfLines={1}
            >
              {section.from === section.to
                ? number(section.from)
                : `${number(section.from)}–${number(section.to)}`}
            </AppText>
            {section.due ? <View style={styles.dueDot} /> : null}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(section.progress * 100)}%` },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatusLegend({
  counts,
}: {
  counts?: Record<SectionStatus, number>;
}) {
  const { colors } = useTheme();
  const { row } = useDirection();
  const st = useST();
  const { language } = useLanguage();

  return (
    <View style={[styles.legend, { flexDirection: row }]}>
      {STATUS_ORDER.map((status) => (
        <View key={status} style={[styles.legendItem, { flexDirection: row }]}>
          <View
            style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]}
          />
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            {counts
              ? `${st(`sec_status_${status}`)} (${formatNumber(counts[status], language)})`
              : st(`sec_status_${status}`)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

interface OptionRowProps {
  label: string;
  options: readonly { key: string; text: string; selected: boolean; onPress: () => void }[];
}

function OptionRow({ label, options }: OptionRowProps) {
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();

  return (
    <View style={styles.optionBlock}>
      <AppText
        variant="caption"
        style={{ color: colors.textSecondary, textAlign, fontWeight: "700" }}
      >
        {label}
      </AppText>
      <View style={[styles.options, { flexDirection: row }]}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: option.selected }}
            onPress={option.onPress}
            style={[
              styles.option,
              {
                backgroundColor: option.selected ? colors.primary : colors.tintSoft,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={{
                color: option.selected ? colors.onPrimary : colors.onTint,
                fontWeight: option.selected ? "800" : "500",
              }}
            >
              {option.text}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface SectionPracticeProps {
  surahId?: number;
  /** The verse being studied. Enables the "current verse" repeat scope and picks the section. */
  focusAyah?: number;
  /** Used when `focusAyah` is not given. */
  selectedIndex?: number;
  onSelectSection?: (section: SectionInfo) => void;
  /** Hide the repeat controls (only the colored strip is shown). */
  compact?: boolean;
}

export function SectionPractice({
  surahId,
  focusAyah,
  selectedIndex,
  onSelectSection,
  compact = false,
}: SectionPracticeProps) {
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();
  const st = useST();
  const data = useSectionData(surahId);
  const store = useSections();
  const { repeat, sectionSize } = store;
  const { target, playing, loading, failed, rangeProgress, playRange, toggle, stop } =
    useRecitation();

  const sections = data.sections;
  const counts = useMemo(() => statusCounts(sections), [sections]);
  const focusSection =
    focusAyah !== undefined
      ? sections.find((item) => focusAyah >= item.from && focusAyah <= item.to)
      : undefined;
  const selected =
    focusSection ?? sections[selectedIndex ?? 0] ?? sections[0];
  const canRepeatAyah = focusAyah !== undefined;
  const scope = canRepeatAyah ? repeat.scope : "section";

  if (!selected) {
    return null;
  }

  const range =
    scope === "ayah" && focusAyah !== undefined
      ? { from: focusAyah, to: focusAyah }
      : { from: selected.from, to: selected.to };
  const active =
    target?.kind === "range" &&
    target.surahId === data.surahId &&
    target.from === range.from &&
    target.to === range.to;
  const PlayIcon = active && playing ? Pause : Play;

  const start = () => {
    if (active) {
      toggle();

      return;
    }

    playRange(data.surahId, range.from, range.to, {
      ayahRepeats: repeat.ayahRepeats,
      loops: scope === "ayah" ? 1 : repeat.loops,
      gapSeconds: repeat.gapSeconds,
    });
  };

  const units = Math.round(selected.units * 10) / 10;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <AppText
        variant="bodySmall"
        style={{ color: colors.text, fontWeight: "800", textAlign }}
      >
        {st("sec_title")}
      </AppText>
      <SectionStrip
        sections={sections}
        selectedIndex={selected.index}
        onSelect={onSelectSection}
      />
      <StatusLegend />

      <View style={[styles.summary, { flexDirection: row }]}>
        <View
          style={[styles.summaryDot, { backgroundColor: STATUS_COLORS[selected.status] }]}
        />
        <AppText
          variant="caption"
          style={{ color: colors.text, fontWeight: "700", flex: 1, textAlign }}
        >
          {`${st("sec_label", { n: selected.index + 1 })} · ${st("sec_range", { from: selected.from, to: selected.to })} · ${st(`sec_status_${selected.status}`)}${selected.due ? ` · ${st("sec_due")}` : ""}`}
        </AppText>
      </View>
      <AppText variant="caption" style={{ color: colors.textSecondary, textAlign }}>
        {`${st("sec_units", { n: units })}. ${st("sec_how")}`}
      </AppText>

      {compact ? null : (
        <>
          <OptionRow
            label={st("sec_size")}
            options={SECTION_SIZES.map((size) => ({
              key: String(size),
              text: st("sec_size_verses", { n: size }),
              selected: size === sectionSize,
              onPress: () => void setSectionSize(size),
            }))}
          />

          <AppText
            variant="bodySmall"
            style={{ color: colors.text, fontWeight: "800", textAlign }}
          >
            {st("sec_repeat_title")}
          </AppText>

          {canRepeatAyah ? (
            <OptionRow
              label={st("sec_repeat_scope")}
              options={(["ayah", "section"] as const).map((item) => ({
                key: item,
                text: st(`sec_scope_${item}`),
                selected: item === scope,
                onPress: () => void updateRepeatSettings({ scope: item }),
              }))}
            />
          ) : null}

          <OptionRow
            label={st("sec_ayah_repeats")}
            options={AYAH_REPEAT_OPTIONS.map((count) => ({
              key: String(count),
              text: st("sec_times", { n: count }),
              selected: count === repeat.ayahRepeats,
              onPress: () => void updateRepeatSettings({ ayahRepeats: count }),
            }))}
          />

          {scope === "section" ? (
            <OptionRow
              label={st("sec_loops")}
              options={LOOP_OPTIONS.map((count) => ({
                key: String(count),
                text: count === 0 ? st("sec_loops_endless") : st("sec_times", { n: count }),
                selected: count === repeat.loops,
                onPress: () => void updateRepeatSettings({ loops: count }),
              }))}
            />
          ) : null}

          <OptionRow
            label={st("sec_gap")}
            options={GAP_OPTIONS.map((seconds) => ({
              key: String(seconds),
              text:
                seconds === 0
                  ? st("sec_gap_none")
                  : st("sec_seconds", { n: seconds }),
              selected: seconds === repeat.gapSeconds,
              onPress: () => void updateRepeatSettings({ gapSeconds: seconds }),
            }))}
          />

          <View style={[styles.controls, { flexDirection: row }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={active && playing ? st("sec_pause") : st("sec_play")}
              onPress={start}
              style={[
                styles.play,
                { backgroundColor: colors.primary, flexDirection: row },
              ]}
            >
              <PlayIcon size={20} color={colors.onPrimary} />
              <AppText
                variant="bodySmall"
                style={{ color: colors.onPrimary, fontWeight: "800" }}
              >
                {active
                  ? playing
                    ? st("sec_pause")
                    : st("sec_resume")
                  : st("sec_play")}
              </AppText>
            </Pressable>
            {active ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={st("sec_stop")}
                onPress={stop}
                style={[styles.stop, { backgroundColor: colors.tintSoft }]}
              >
                <Square size={18} color={colors.onTint} />
              </Pressable>
            ) : null}
          </View>

          {active && rangeProgress ? (
            <AppText
              variant="caption"
              style={{
                color: failed ? colors.error : colors.textSecondary,
                textAlign: "center",
              }}
            >
              {failed
                ? st("sec_audio_error")
                : `${loading ? "… " : ""}${st("sec_now", {
                    ayah: rangeProgress.ayah,
                    rep: rangeProgress.rep,
                    reps: rangeProgress.ayahRepeats,
                  })}${
                    rangeProgress.ayahRepeats > 0 && range.from !== range.to
                      ? ` · ${
                          rangeProgress.loops === 0
                            ? st("sec_now_loop_endless", { loop: rangeProgress.loop })
                            : st("sec_now_loop", {
                                loop: rangeProgress.loop,
                                loops: rangeProgress.loops,
                              })
                        }`
                      : ""
                  }`}
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  strip: {
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minWidth: 56,
    height: 44,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chipText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dueDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#14110D",
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  progressFill: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  legend: {
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summary: {
    alignItems: "center",
    gap: 8,
  },
  summaryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  optionBlock: {
    gap: 6,
  },
  options: {
    flexWrap: "wrap",
    gap: 6,
  },
  option: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    alignItems: "center",
    gap: 10,
  },
  play: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stop: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
