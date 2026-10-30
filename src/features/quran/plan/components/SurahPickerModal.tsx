import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { JUZ30_SURAHS, type SurahInfo } from "@/features/quran/data/surahs";
import { fill } from "@/features/quran/utils/fill";

interface SurahPickerModalProps {
  visible: boolean;
  /** Surah ids that are checked when the dialog opens. */
  selected: readonly number[];
  onConfirm: (ids: number[]) => void;
  onClose: () => void;
}

export function SurahPickerModal({
  visible,
  selected,
  onConfirm,
  onClose,
}: SurahPickerModalProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set(selected));
  const number = (value: number) => formatNumber(value, language);

  useEffect(() => {
    if (visible) {
      setChecked(new Set(selected));
      setQuery("");
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const data = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return JUZ30_SURAHS;
    }

    return JUZ30_SURAHS.filter(
      (surah) =>
        surah.name.includes(normalized) ||
        surah.transliteration.toLowerCase().includes(normalized) ||
        String(surah.id) === normalized,
    );
  }, [query]);

  const toggle = (id: number) =>
    setChecked((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

  const confirm = () =>
    onConfirm([...checked].sort((a, b) => a - b));

  const renderItem = ({ item }: ListRenderItemInfo<SurahInfo>) => {
    const isChecked = checked.has(item.id);

    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        accessibilityLabel={`${item.name} ${item.transliteration}`}
        onPress={() => toggle(item.id)}
        style={[
          styles.rowItem,
          {
            backgroundColor: isChecked ? colors.tintSoft : colors.surface,
            flexDirection: row,
          },
        ]}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: colors.primary,
              backgroundColor: isChecked ? colors.primary : "transparent",
            },
          ]}
        >
          {isChecked ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
        </View>
        <View style={styles.rowText}>
          <Text
            allowFontScaling={false}
            style={[styles.arabicName, { color: colors.text, textAlign }]}
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
        <AppText
          variant="caption"
          style={{ color: colors.textSecondary, fontWeight: "700" }}
        >
          {number(item.id)}
        </AppText>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.screen,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={[styles.header, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.quran_close}
            onPress={onClose}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <X size={22} color={colors.text} />
          </Pressable>
          <AppText
            variant="h3"
            style={{ color: colors.text, fontWeight: "800", flex: 1, textAlign }}
          >
            {t.plan_pick_surahs}
          </AppText>
        </View>

        <View
          style={[
            styles.search,
            { backgroundColor: colors.surface, flexDirection: row },
          ]}
        >
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.quran_search}
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.searchInput,
              { color: colors.text, textAlign: isRTL ? "right" : "left" },
            ]}
            accessibilityLabel={t.quran_search}
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={14}
          contentContainerStyle={styles.list}
        />

        <Pressable
          accessibilityRole="button"
          onPress={confirm}
          style={[styles.confirm, { backgroundColor: colors.primary }]}
        >
          <AppText
            variant="button"
            style={{ color: colors.onPrimary, fontWeight: "800" }}
          >
            {checked.size > 0
              ? fill(t.plan_surahs_selected, { count: number(checked.size) })
              : t.plan_none_selected}
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    alignItems: "center",
    gap: 8,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontFamily: "EstedadMedium",
    fontSize: 15,
    paddingVertical: 8,
  },
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  rowItem: {
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 0,
  },
  arabicName: {
    fontFamily: "UthmanicHafs",
    fontSize: 24,
    lineHeight: 42,
    includeFontPadding: false,
  },
  confirm: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
