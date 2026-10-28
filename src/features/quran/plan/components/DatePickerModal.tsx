import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { MonthCalendar } from "@/features/quran/plan/components/MonthCalendar";
import {
  calendarFor,
  todayISO,
  toCalendarDate,
  type ISODate,
} from "@/features/quran/plan/calendar";

interface DatePickerModalProps {
  visible: boolean;
  value: ISODate | null;
  /** Earlier days are shown dimmed and cannot be picked. */
  minDate?: ISODate;
  onSelect: (iso: ISODate) => void;
  onClose: () => void;
}

export function DatePickerModal({
  visible,
  value,
  minDate,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row } = useDirection();
  const kind = calendarFor(language);
  const [view, setView] = useState(() => {
    const start = toCalendarDate(value ?? todayISO(), kind);

    return { y: start.y, m: start.m };
  });

  // Every time the dialog opens, show the month of the current value.
  useEffect(() => {
    if (visible) {
      const start = toCalendarDate(value ?? minDate ?? todayISO(), kind);

      setView({ y: start.y, m: start.m });
    }
    // Only re-center when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const today = todayISO();
  const todayAllowed = !minDate || today >= minDate;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.quran_close}
        style={styles.backdrop}
        onPress={onClose}
      >
        {/* The inner Pressable keeps taps on the card from closing the dialog. */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={() => undefined}
        >
          <AppText
            variant="body"
            style={{ color: colors.text, fontWeight: "800", textAlign: "center" }}
          >
            {t.plan_pick_date_title}
          </AppText>
          <MonthCalendar
            year={view.y}
            month={view.m}
            onChangeMonth={(y, m) => setView({ y, m })}
            onSelect={(iso) => {
              onSelect(iso);
              onClose();
            }}
            stateOf={(iso) => ({
              selected: iso === value,
              disabled: Boolean(minDate && iso < minDate),
            })}
          />
          <View style={[styles.actions, { flexDirection: row }]}>
            <Pressable
              accessibilityRole="button"
              disabled={!todayAllowed}
              onPress={() => {
                onSelect(today);
                onClose();
              }}
              style={[
                styles.action,
                { backgroundColor: colors.tintSoft, opacity: todayAllowed ? 1 : 0.4 },
              ]}
            >
              <AppText
                variant="bodySmall"
                style={{ color: colors.onTint, fontWeight: "700" }}
              >
                {t.plan_pick_today}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.action, { backgroundColor: colors.track }]}
            >
              <AppText
                variant="bodySmall"
                style={{ color: colors.text, fontWeight: "700" }}
              >
                {t.plan_cancel}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
