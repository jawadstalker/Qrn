import React from "react";
import { StyleSheet, View } from "react-native";
import { useSectionData } from "@/features/quran/state/useSectionInfo";
import { STATUS_COLORS } from "@/features/quran/utils/sections";

/** Thin bar with one colored segment per section, for list rows. */
export function SectionMiniBar({ surahId }: { surahId: number }) {
  const { sections } = useSectionData(surahId);

  if (sections.length === 0) {
    return null;
  }

  return (
    <View style={styles.bar} accessibilityElementsHidden>
      {sections.map((section) => (
        <View
          key={section.index}
          style={[
            styles.segment,
            { backgroundColor: STATUS_COLORS[section.status] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 2,
    height: 6,
    marginTop: 4,
  },
  segment: {
    flex: 1,
    maxWidth: 28,
    borderRadius: 3,
  },
});
