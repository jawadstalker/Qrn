import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudDownload,
  Download,
  HardDrive,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react-native";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { ChunkyButton } from "@/shared/components/ui/ChunkyButton";
import {
  GOLD,
  GOLD_DARK,
  PageBanner,
  StarBadge,
} from "@/features/quran/components/QuranDecor";
import { useDownload } from "@/features/quran/audio/DownloadContext";
import {
  formatBytes,
  type AudioDownloadRecord,
  type AudioQuality,
} from "@/features/quran/audio/downloadManager";
import {
  JUZ30_SURAHS,
  SURAHS,
  getSurah,
  type SurahInfo,
} from "@/features/quran/data/surahs";
import { getReciter, RECITERS } from "@/features/quran/data/reciters";
import { useRecitation } from "@/features/quran/state/RecitationContext";

const PADDING = 20;

export default function DownloadsScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    downloads,
    totalDownloadSize,
    deleteDownload,
    deleteAllDownloads,
    downloadSurah,
  } = useDownload();
  const { playSurah, toggle, target, playing } = useRecitation();

  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedSurahs, setSelectedSurahs] = useState<number[]>([]);
  const [batchQuality, setBatchQuality] = useState<AudioQuality>("128k");
  const [batchReciter, setBatchReciter] = useState(RECITERS[0]!.id);
  const [batchDownloading, setBatchDownloading] = useState(false);

  const number = (val: number) => formatNumber(val, language);

  const playingSurahId = target?.kind === "surah" ? target.surahId : undefined;

  const handleToggleSurahSelection = (surahId: number) => {
    setSelectedSurahs((prev) =>
      prev.includes(surahId)
        ? prev.filter((id) => id !== surahId)
        : [...prev, surahId],
    );
  };

  const handleSelectAllJuz30 = () => {
    setSelectedSurahs(JUZ30_SURAHS.map((s) => s.id));
  };

  const handleStartBatchDownload = async () => {
    if (selectedSurahs.length === 0) return;
    setBatchDownloading(true);
    for (const sId of selectedSurahs) {
      try {
        await downloadSurah(sId, batchReciter, batchQuality);
      } catch {
        // Continue next
      }
    }
    setBatchDownloading(false);
    setBatchModalVisible(false);
    setSelectedSurahs([]);
  };

  const renderItem = ({ item }: { item: AudioDownloadRecord }) => {
    const surah = getSurah(item.surahId);
    const reciter = getReciter(item.reciterId);
    const isCurrentPlaying = playingSurahId === item.surahId && playing;

    return (
      <View
        style={[
          styles.rowItem,
          {
            backgroundColor: colors.surface,
            flexDirection: row,
          },
        ]}
      >
        <StarBadge
          size={40}
          label={number(item.surahId)}
          color={GOLD}
          labelColor={GOLD_DARK}
        />

        <View style={styles.rowText}>
          <Text
            allowFontScaling={false}
            style={[
              styles.arabicName,
              { color: colors.text, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {surah?.name ?? ""}
          </Text>
          <AppText
            variant="caption"
            style={{ color: colors.textSecondary, textAlign }}
          >
            {isRTL ? reciter.fa : reciter.en} • {item.quality} •{" "}
            {formatBytes(item.fileSize)}
          </AppText>
        </View>

        <View style={[styles.actionRow, { flexDirection: row }]}>
          <Pressable
            onPress={() => {
              if (playingSurahId === item.surahId) {
                toggle();
              } else {
                playSurah(item.surahId);
              }
            }}
            hitSlop={8}
            style={[
              styles.playBtn,
              {
                backgroundColor: isCurrentPlaying
                  ? colors.primary
                  : colors.tintSoft,
              },
            ]}
          >
            {isCurrentPlaying ? (
              <Pause size={18} color={colors.onPrimary} />
            ) : (
              <Play size={18} color={colors.primary} />
            )}
          </Pressable>

          <Pressable
            onPress={() => deleteDownload(item.surahId, item.reciterId, item.quality)}
            hitSlop={8}
            style={styles.deleteBtn}
          >
            <Trash2 size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { flexDirection: row }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
        >
          {isRTL ? (
            <ArrowRight size={22} color={colors.text} />
          ) : (
            <ArrowLeft size={22} color={colors.text} />
          )}
        </Pressable>

        <AppText variant="h2" style={{ color: colors.text, fontWeight: "800" }}>
          دانلودهای من
        </AppText>

        <Pressable
          onPress={() => setBatchModalVisible(true)}
          style={[styles.batchTrigger, { backgroundColor: colors.tintSoft }]}
        >
          <Plus size={18} color={colors.primary} />
          <AppText
            variant="caption"
            style={{ color: colors.primary, fontWeight: "700" }}
          >
            دانلود گروهی
          </AppText>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={[styles.content, { paddingHorizontal: PADDING }]}
        data={downloads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.storageCard,
                { backgroundColor: colors.surface, flexDirection: row },
              ]}
            >
              <View style={styles.storageIconWrap}>
                <HardDrive size={24} color={colors.primary} />
              </View>
              <View style={styles.storageTexts}>
                <AppText
                  variant="body"
                  style={{ color: colors.text, fontWeight: "800", textAlign }}
                >
                  حجم کل فایلهای آفلاین
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign }}
                >
                  {downloads.length} سوره ذخیره شده • {formatBytes(totalDownloadSize)}
                </AppText>
              </View>
              {downloads.length > 0 ? (
                <Pressable
                  onPress={() => void deleteAllDownloads()}
                  style={styles.clearAllBtn}
                >
                  <AppText
                    variant="caption"
                    style={{ color: "#EF4444", fontWeight: "700" }}
                  >
                    حذف همه
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            {downloads.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
                <CloudDownload size={48} color={colors.textSecondary} />
                <AppText
                  variant="body"
                  style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}
                >
                  هنوز فایلی دانلود نشده است
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign: "center" }}
                >
                  می‌توانی از لیست سوره‌ها یا دکمه «دانلود گروهی» بالا، سوره‌های دلخواهت را برای پخش آفلاین ذخیره کنی.
                </AppText>
              </View>
            ) : null}
          </View>
        }
      />

      {/* Batch Download Modal */}
      <Modal
        visible={batchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.batchModalCard, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.batchHeader, { flexDirection: row }]}>
              <Pressable
                onPress={() => setBatchModalVisible(false)}
                hitSlop={10}
              >
                <X size={22} color={colors.textSecondary} />
              </Pressable>
              <AppText
                variant="body"
                style={{ color: colors.text, fontWeight: "800" }}
              >
                دانلود گروهی سوره‌ها
              </AppText>
              <Pressable onPress={handleSelectAllJuz30}>
                <AppText
                  variant="caption"
                  style={{ color: colors.primary, fontWeight: "700" }}
                >
                  انتخاب جزء ۳۰
                </AppText>
              </Pressable>
            </View>

            {/* Quality Selector */}
            <View style={styles.batchSection}>
              <AppText
                variant="caption"
                style={{ color: colors.textSecondary, textAlign }}
              >
                کیفیت دانلود:
              </AppText>
              <View style={[styles.chipsRow, { flexDirection: row }]}>
                <Pressable
                  onPress={() => setBatchQuality("128k")}
                  style={[
                    styles.qualityChip,
                    {
                      backgroundColor:
                        batchQuality === "128k"
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        batchQuality === "128k"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color:
                        batchQuality === "128k"
                          ? colors.onPrimary
                          : colors.text,
                      fontWeight: "700",
                    }}
                  >
                    128 kbps (کیفیت عالی)
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => setBatchQuality("64k")}
                  style={[
                    styles.qualityChip,
                    {
                      backgroundColor:
                        batchQuality === "64k"
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        batchQuality === "64k"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color:
                        batchQuality === "64k" ? colors.onPrimary : colors.text,
                      fontWeight: "700",
                    }}
                  >
                    64 kbps (کم‌حجم)
                  </AppText>
                </Pressable>
              </View>
            </View>

            {/* Surah List for selection */}
            <FlatList
              style={styles.batchList}
              data={JUZ30_SURAHS}
              keyExtractor={(s) => String(s.id)}
              renderItem={({ item }) => {
                const selected = selectedSurahs.includes(item.id);
                return (
                  <Pressable
                    onPress={() => handleToggleSurahSelection(item.id)}
                    style={[
                      styles.batchSurahRow,
                      {
                        backgroundColor: selected
                          ? colors.tintSoft
                          : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        flexDirection: row,
                      },
                    ]}
                  >
                    <CheckCircle2
                      size={18}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.arabicNameSmall,
                        {
                          color: selected ? colors.primary : colors.text,
                          flex: 1,
                          textAlign: isRTL ? "right" : "left",
                        },
                      ]}
                    >
                      {item.name} ({item.transliteration})
                    </Text>
                  </Pressable>
                );
              }}
            />

            <ChunkyButton
              label={
                batchDownloading
                  ? "در حال دانلود..."
                  : `دانلود ${selectedSurahs.length} سوره انتخابی`
              }
              onPress={() => {
                if (!batchDownloading && selectedSurahs.length > 0) {
                  void handleStartBatchDownload();
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  batchTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  content: {
    paddingBottom: 40,
    gap: 10,
  },
  header: {
    gap: 14,
    marginVertical: 8,
  },
  storageCard: {
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  storageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  storageTexts: {
    flex: 1,
    gap: 2,
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  emptyBox: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  rowItem: {
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  arabicName: {
    fontFamily: "UthmanicHafs",
    fontSize: 22,
    lineHeight: 34,
    includeFontPadding: false,
  },
  arabicNameSmall: {
    fontFamily: "UthmanicHafs",
    fontSize: 18,
    lineHeight: 28,
    includeFontPadding: false,
  },
  actionRow: {
    alignItems: "center",
    gap: 8,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  batchModalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "80%",
    gap: 16,
  },
  batchHeader: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  batchSection: {
    gap: 8,
  },
  chipsRow: {
    gap: 8,
  },
  qualityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  batchList: {
    maxHeight: 280,
  },
  batchSurahRow: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
});
