import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import {
  Check,
  CheckCircle2,
  CloudDownload,
  Download,
  HardDrive,
  Trash2,
  X,
  Zap,
} from "lucide-react-native";
import { useDownload } from "@/features/quran/audio/DownloadContext";
import {
  formatBytes,
  type AudioQuality,
} from "@/features/quran/audio/downloadManager";
import { getSurah } from "@/features/quran/data/surahs";
import { getReciter } from "@/features/quran/data/reciters";
import { useTheme } from "@/core/theme/ThemeContext";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { AppText } from "@/shared/components/ui/AppText";

interface DownloadButtonProps {
  surahId: number;
  reciterId: string;
  size?: number;
  style?: ViewStyle;
  showText?: boolean;
}

export function DownloadButton({
  surahId,
  reciterId,
  size = 20,
  style,
  showText = false,
}: DownloadButtonProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { getDownloadStatus, downloadSurah, deleteDownload } = useDownload();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<AudioQuality>("128k");
  const [loadingAction, setLoadingAction] = useState(false);

  const status128 = getDownloadStatus(surahId, reciterId, "128k");
  const status64 = getDownloadStatus(surahId, reciterId, "64k");
  const activeStatus = selectedQuality === "128k" ? status128 : status64;
  const isAnyDownloaded = status128.isDownloaded || status64.isDownloaded;
  const isAnyDownloading = status128.isDownloading || status64.isDownloading;
  const currentProgress = status128.isDownloading
    ? status128.progress
    : status64.isDownloading
      ? status64.progress
      : 0;

  const surah = getSurah(surahId);
  const reciter = getReciter(reciterId);

  const handleStartDownload = async (quality: AudioQuality) => {
    try {
      setLoadingAction(true);
      await downloadSurah(surahId, reciterId, quality);
    } catch {
      // Error handled in state
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (quality: AudioQuality) => {
    try {
      setLoadingAction(true);
      await deleteDownload(surahId, reciterId, quality);
    } catch {
      // Error
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="دانلود فایل صوتی سوره"
        onPress={(e) => {
          e.stopPropagation();
          setModalVisible(true);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          styles.triggerBtn,
          {
            backgroundColor: isAnyDownloaded
              ? "rgba(16, 185, 129, 0.12)"
              : isAnyDownloading
                ? "rgba(59, 130, 246, 0.12)"
                : "rgba(0, 0, 0, 0.04)",
            opacity: pressed ? 0.7 : 1,
          },
          style,
        ]}
      >
        {isAnyDownloading ? (
          <View style={styles.downloadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            {showText ? (
              <AppText variant="caption" style={{ color: "#3B82F6", fontWeight: "700" }}>
                {Math.round(currentProgress * 100)}%
              </AppText>
            ) : null}
          </View>
        ) : isAnyDownloaded ? (
          <View style={styles.rowCentered}>
            <CheckCircle2 size={size} color="#10B981" />
            {showText ? (
              <AppText variant="caption" style={{ color: "#10B981", fontWeight: "700" }}>
                دانلود شد
              </AppText>
            ) : null}
          </View>
        ) : (
          <View style={styles.rowCentered}>
            <Download size={size} color={colors.textSecondary} />
            {showText ? (
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                دانلود
              </AppText>
            ) : null}
          </View>
        )}
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.headerTexts}>
                <AppText
                  variant="body"
                  style={{
                    color: colors.text,
                    fontWeight: "800",
                    textAlign: "right",
                  }}
                >
                  دانلود سوره {surah?.name ?? ""}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: colors.textSecondary, textAlign: "right" }}
                >
                  قاری: {language === "fa" ? reciter.fa : reciter.en}
                </AppText>
              </View>
            </View>

            {/* Quality Options */}
            <View style={styles.optionsList}>
              {/* 128 kbps */}
              <View
                style={[
                  styles.optionCard,
                  {
                    borderColor:
                      selectedQuality === "128k"
                        ? colors.primary
                        : colors.border,
                    backgroundColor:
                      selectedQuality === "128k"
                        ? colors.tintSoft
                        : colors.background,
                  },
                ]}
              >
                <Pressable
                  style={styles.optionContent}
                  onPress={() => setSelectedQuality("128k")}
                >
                  <View style={styles.optionBadge}>
                    <Zap
                      size={18}
                      color={
                        selectedQuality === "128k"
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.optionInfo}>
                    <View style={styles.rowBetween}>
                      <AppText
                        variant="bodySmall"
                        style={{
                          color: colors.text,
                          fontWeight: "800",
                          textAlign: "right",
                        }}
                      >
                        کیفیت عالی (128 kbps)
                      </AppText>
                      {status128.isDownloaded ? (
                        <View style={styles.downloadedTag}>
                          <Check size={12} color="#10B981" />
                          <AppText
                            variant="caption"
                            style={{ color: "#10B981", fontWeight: "700" }}
                          >
                            موجود آفلاین
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText
                      variant="caption"
                      style={{ color: colors.textSecondary, textAlign: "right" }}
                    >
                      صدای شفاف و باکیفیت استودیویی •{" "}
                      {status128.record
                        ? formatBytes(status128.record.fileSize)
                        : `تقریباً ${(surah?.verses ?? 10) > 40 ? "8-15" : "2-5"} مگابایت`}
                    </AppText>
                  </View>
                </Pressable>

                {status128.isDownloading ? (
                  <View style={styles.progressRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <AppText
                      variant="caption"
                      style={{ color: colors.primary, fontWeight: "700" }}
                    >
                      در حال دریافت: {Math.round(status128.progress * 100)}%
                    </AppText>
                  </View>
                ) : status128.isDownloaded ? (
                  <Pressable
                    onPress={() => handleDelete("128k")}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <AppText
                      variant="caption"
                      style={{ color: "#EF4444", fontWeight: "700" }}
                    >
                      حذف فایل و آزادسازی حافظه
                    </AppText>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleStartDownload("128k")}
                    disabled={loadingAction}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Download size={16} color={colors.onPrimary} />
                    <AppText
                      variant="caption"
                      style={{ color: colors.onPrimary, fontWeight: "800" }}
                    >
                      دانلود کیفیت 128k
                    </AppText>
                  </Pressable>
                )}
              </View>

              {/* 64 kbps */}
              <View
                style={[
                  styles.optionCard,
                  {
                    borderColor:
                      selectedQuality === "64k" ? colors.primary : colors.border,
                    backgroundColor:
                      selectedQuality === "64k"
                        ? colors.tintSoft
                        : colors.background,
                  },
                ]}
              >
                <Pressable
                  style={styles.optionContent}
                  onPress={() => setSelectedQuality("64k")}
                >
                  <View style={styles.optionBadge}>
                    <HardDrive
                      size={18}
                      color={
                        selectedQuality === "64k"
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.optionInfo}>
                    <View style={styles.rowBetween}>
                      <AppText
                        variant="bodySmall"
                        style={{
                          color: colors.text,
                          fontWeight: "800",
                          textAlign: "right",
                        }}
                      >
                        کیفیت فشرده (64 kbps)
                      </AppText>
                      {status64.isDownloaded ? (
                        <View style={styles.downloadedTag}>
                          <Check size={12} color="#10B981" />
                          <AppText
                            variant="caption"
                            style={{ color: "#10B981", fontWeight: "700" }}
                          >
                            موجود آفلاین
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText
                      variant="caption"
                      style={{ color: colors.textSecondary, textAlign: "right" }}
                    >
                      حجم اقتصادی برای مصرف کمتر نت •{" "}
                      {status64.record
                        ? formatBytes(status64.record.fileSize)
                        : `تقریباً ${(surah?.verses ?? 10) > 40 ? "4-8" : "1-3"} مگابایت`}
                    </AppText>
                  </View>
                </Pressable>

                {status64.isDownloading ? (
                  <View style={styles.progressRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <AppText
                      variant="caption"
                      style={{ color: colors.primary, fontWeight: "700" }}
                    >
                      در حال دریافت: {Math.round(status64.progress * 100)}%
                    </AppText>
                  </View>
                ) : status64.isDownloaded ? (
                  <Pressable
                    onPress={() => handleDelete("64k")}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <AppText
                      variant="caption"
                      style={{ color: "#EF4444", fontWeight: "700" }}
                    >
                      حذف فایل و آزادسازی حافظه
                    </AppText>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleStartDownload("64k")}
                    disabled={loadingAction}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Download size={16} color={colors.onPrimary} />
                    <AppText
                      variant="caption"
                      style={{ color: colors.onPrimary, fontWeight: "800" }}
                    >
                      دانلود کیفیت 64k
                    </AppText>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Hint */}
            <View style={styles.modalFooter}>
              <CloudDownload size={16} color={colors.textSecondary} />
              <AppText
                variant="caption"
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  flex: 1,
                }}
              >
                فایل‌های دانلود شده بدون نیاز به اینترنت در بخش تلاوت پخش خواهند
                شد.
              </AppText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  rowCentered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
  },
  headerTexts: {
    alignItems: "flex-end",
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  optionContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  optionBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
    gap: 3,
  },
  rowBetween: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  downloadedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    padding: 8,
    borderRadius: 10,
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  modalFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
    justifyContent: "center",
  },
});
