import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";

interface SwatchRowProps {
  label: string;
  colors: readonly string[];
  selected: number;
  onSelect: (index: number) => void;
}

/** A row of round colour choices. */
export function SwatchRow({
  label,
  colors: swatches,
  selected,
  onSelect,
}: SwatchRowProps) {
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();

  return (
    <View style={styles.group}>
      <AppText
        variant="bodySmall"
        style={{ color: colors.textSecondary, textAlign }}
      >
        {label}
      </AppText>
      <View style={[styles.wrap, { flexDirection: row }]}>
        {swatches.map((color, index) => (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected: index === selected }}
            onPress={() => onSelect(index)}
            style={[
              styles.swatch,
              {
                backgroundColor: color,
                borderColor:
                  index === selected ? colors.primary : "transparent",
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

interface ChipRowProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

/** A row of text choices (one can be selected). */
export function ChipRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: ChipRowProps<T>) {
  const { colors } = useTheme();
  const { row, textAlign } = useDirection();

  return (
    <View style={styles.group}>
      <AppText
        variant="bodySmall"
        style={{ color: colors.textSecondary, textAlign }}
      >
        {label}
      </AppText>
      <View style={[styles.wrap, { flexDirection: row }]}>
        {options.map((option) => {
          const active = option.value === selected;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option.value)}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.primary : colors.surface },
              ]}
            >
              <AppText
                variant="bodySmall"
                style={{ color: active ? colors.onPrimary : colors.text }}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface TabStripProps<T extends string> {
  tabs: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Tabs that switch between groups of options. */
export function TabStrip<T extends string>({
  tabs,
  selected,
  onSelect,
}: TabStripProps<T>) {
  const { colors } = useTheme();
  const { row } = useDirection();

  return (
    <View
      style={[
        styles.tabStrip,
        { backgroundColor: colors.surface, flexDirection: row },
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.value === selected;

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(tab.value)}
            style={[styles.tab, active && { backgroundColor: colors.primary }]}
          >
            <AppText
              variant="bodySmall"
              style={{
                color: active ? colors.onPrimary : colors.textSecondary,
                fontWeight: active ? "700" : "500",
              }}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** A number with minus and plus buttons. */
export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const { colors } = useTheme();
  const { row } = useDirection();

  const button = (delta: number, Icon: typeof Plus, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={[
        styles.stepButton,
        { backgroundColor: colors.tintSoft, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Icon size={18} color={colors.onTint} />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.stepper,
        { backgroundColor: colors.surface, flexDirection: row },
      ]}
    >
      <AppText
        variant="body"
        style={[styles.stepLabel, { color: colors.text }]}
      >
        {label}
      </AppText>
      {button(-1, Minus, value <= min)}
      <AppText variant="h3" style={[styles.stepValue, { color: colors.text }]}>
        {value}
      </AppText>
      {button(1, Plus, value >= max)}
    </View>
  );
}

const styles = StyleSheet.create({
  tabStrip: {
    padding: 4,
    borderRadius: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 12,
  },
  group: {
    gap: 8,
  },
  wrap: {
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  stepper: {
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 16,
  },
  stepLabel: {
    flex: 1,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 36,
    textAlign: "center",
  },
});
