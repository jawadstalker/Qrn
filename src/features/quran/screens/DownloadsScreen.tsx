import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CloudDownload,
  HardDrive,
  Pause,
  Play,
  Square,
  Trash2,
} from "lucide-react-native";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { useDownload } from "@/features/quran/audio/DownloadContext";
import {
  formatBytes,
  type AudioDownloadRecord,
} from "@/features/quran/audio/downloadManager";
import { FavoriteButton } from "@/features/quran/components/FavoriteButton";
import { ScreenHeader } from "@/features/quran/components/ScreenHeader";
import { SurahListRow } from "@/features/quran/components/SurahListRow";
import { getReciter } from "@/features/quran/data/reciters";
import { JUZ30_SURAHS, getSurah } from "@/features/quran/data/surahs";
import { useRecitation } from "@/features/quran/state/RecitationContext";
import { confirmAction } from "@/features/quran/utils/confirm";
import { fill } from "@/features/quran/utils/fill";

interface BatchState {
  done: number;
  total: number;
}

export default function DownloadsScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    downloads,
    totalDownloadSize,
    downloadSurah,
    deleteDownload,
    deleteAllDownloads,
    cancelDownload,
  } = useDownload();
  const { playSurah, toggle, target, playing, reciterId } = useRecitation();
  const number = (value: number) => formatNumber(value, language);
  const playingSurahId = target?.kind === "surah" ? target.surahId : undefined;

  const [batch, setBatch] = useState<BatchState | null>(null);
  const [batchFailed, setBatchFailed] = useState(false);
  const stopBatch = useRef(false);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
      stopBatch.current = true;
    },
    [],
  );

  const sorted = useMemo(
    () => [...downloads].sort((a, b) => a.surahId - b.surahId),
    [downloads],
  );

  /** Downloads the surahs of Juz 30 one after another, skipping what is already saved. */
  const startBatch = useCallback(async () => {
    const have = new Set(
      downloads
        .filter((item) => item.reciterId === reciterId)
        .map((item) => item.surahId),
    );
    const queue = JUZ30_SURAHS.filter((surah) => !have.has(surah.id));

    if (queue.length === 0) {
      return;
    }

    stopBatch.current = false;
    setBatchFailed(false);
    setBatch({ done: 0, total: queue.length });

    let failed = false;

    for (let index = 0; index < queue.length; index += 1) {
      if (stopBatch.current) {
        break;
      }

      const ok = await downloadSurah(queue[index]!.id, reciterId);

      if (!ok && !stopBatch.current) {
        failed = true;
      }

      if (mounted.current) {
        setBatch({ done: index + 1, total: queue.length });
      }
    }

    if (mounted.current) {
      setBatch(null);
      setBatchFailed(failed);
    }
  }, [downloads, downloadSurah, reciterId]);

  const stopBatchDownload = useCallback(async () => {
    stopBatch.current = true;

    // The surah being downloaded right now is cancelled too, so stopping feels immediate.
    await Promise.all(
      JUZ30_SURAHS.map((surah) => cancelDownload(surah.id, reciterId)),
    );
  }, [cancelDownload, reciterId]);

  const removeOne = useCallback(
    async (record: AudioDownloadRecord) => {
      const surah = getSurah(record.surahId);
      const confirmed = await confirmAction({
        title: t.dl_delete_title,
        message: fill(t.dl_delete_body, {
          surah: (language === "fa" ? surah?.name : surah?.transliteration) ?? "",
        }),
        confirmLabel: t.dl_delete_confirm,
        cancelLabel: t.dl_cancel,
        destructive: true,
      });

      if (confirmed) {
        await deleteDownload(record.surahId, record.reciterId);
      }
    },
    [deleteDownload, language, t],
  );

  const removeAll = useCallback(async () => {
    const confirmed = await confirmAction({
      title: t.dl_delete_all_title,
      message: t.dl_delete_all_body,
      confirmLabel: t.dl_delete_confirm,
      cancelLabel: t.dl_cancel,
      destructive: true,
    });

    if (confirmed) {
      await deleteAllDownloads();
    }
  }, [deleteAllDownloads, t]);

  const allJuz30Saved = JUZ30_SURAHS.every((surah) =>
    downloads.some(
      (item) => item.surahId === surah.id && item.reciterId === reciterId,
    ),
  );

  const renderItem = ({ item }: { item: AudioDownloadRecord }) => {
    const surah = getSurah(item.surahId);

    if (!surah) {
      return null;
    }

    const reciter = getReciter(item.reciterId);
    const isCurrent = playingSurahId === item.surahId;
    const isPlaying = isCurrent && playing;

    return (
      <SurahListRow
        surah={surah}
        subtitle={`${language === "fa" ? reciter.fa : reciter.en} · ${formatBytes(item.fileSize)}`}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t.dl_pause : t.dl_play}
          onPress={() => (isCurrent ? toggle() : playSurah(item.surahId))}
          hitSlop={6}
          style={[
            styles.iconButton,
            { backgroundColor: isPlaying ? colors.primary : colors.tintSoft },
          ]}
        >
          {isPlaying ? (
            <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={18} color={colors.primary} />
          )}
        </Pressable>

        <FavoriteButton surahId={item.surahId} size={18} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.dl_delete_confirm}
          onPress={() => void removeOne(item)}
          hitSlop={6}
          style={[styles.iconButton, { backgroundColor: "rgba(239,68,68,0.12)" }]}
        >
          <Trash2 size={17} color="#EF4444" />
        </Pressable>
      </SurahListRow>
    );
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={[styles.summary, { backgroundColor: colors.surface }]}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.tintSoft }]}>
          <HardDrive size={22} color={colors.primary} />
        </View>
        <View style={styles.summaryText}>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            {t.dl_total_size}
          </AppText>
          <AppText variant="h3" style={{ color: colors.text, fontWeight: "800" }}>
            {formatBytes(totalDownloadSize)}
          </AppText>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            {fill(t.dl_count_saved, { count: number(downloads.length) })}
          </AppText>
        </View>
        {downloads.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void removeAll()}
            hitSlop={8}
            style={styles.removeAll}
          >
            <Trash2 size={16} color="#EF4444" />
            <AppText variant="caption" style={{ color: "#EF4444", fontWeight: "700" }}>
              {t.dl_delete_all}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {batch ? (
        <View style={[styles.batch, { backgroundColor: colors.surface }]}>
          <View style={styles.batchTop}>
            <AppText variant="body" style={{ color: colors.text, fontWeight: "700" }}>
              {fill(t.dl_batch_progress, {
                done: number(batch.done),
                total: number(batch.total),
              })}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void stopBatchDownload()}
              hitSlop={8}
              style={styles.stop}
            >
              <Square size={13} color="#EF4444" fill="#EF4444" />
              <AppText variant="caption" style={{ color: "#EF4444", fontWeight: "700" }}>
                {t.dl_batch_stop}
              </AppText>
            </Pressable>
          </View>
          <View style={[styles.track, { backgroundColor: colors.tintSoft }]}>
            <View
              style={[
                styles.fillBar,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.round((batch.done / batch.total) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={allJuz30Saved}
          onPress={() => void startBatch()}
          style={({ pressed }) => [
            styles.batchButton,
            {
              backgroundColor: allJuz30Saved ? colors.tintSoft : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <CloudDownload
            size={18}
            color={allJuz30Saved ? colors.textSecondary : "#FFFFFF"}
          />
          <AppText
            variant="body"
            style={{
              color: allJuz30Saved ? colors.textSecondary : "#FFFFFF",
              fontWeight: "800",
            }}
          >
            {allJuz30Saved ? t.dl_batch_done : t.dl_batch_juz30}
          </AppText>
        </Pressable>
      )}

      {batchFailed ? (
        <AppText variant="caption" style={styles.error}>
          {t.dl_failed}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScreenHeader title={t.dl_title} />

      <FlatList
        contentContainerStyle={styles.content}
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surface }]}>
            <CloudDownload size={44} color={colors.primary} opacity={0.7} />
            <AppText
              variant="body"
              style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}
            >
              {t.dl_empty_title}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t.dl_empty_body}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/library")}
              style={[styles.emptyButton, { backgroundColor: colors.tintSoft }]}
            >
              <AppText
                variant="caption"
                style={{ color: colors.primary, fontWeight: "800" }}
              >
                {t.fav_go_library}
              </AppText>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          downloads.length > 0 ? (
            <AppText
              variant="caption"
              style={[styles.hint, { color: colors.textSecondary }]}
            >
              {t.dl_offline_hint}
            </AppText>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 10,
  },
  headerBlock: {
    gap: 10,
    marginBottom: 4,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
    gap: 1,
  },
  removeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  batchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
  },
  batch: {
    padding: 14,
    borderRadius: 18,
    gap: 10,
  },
  batchTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  stop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fillBar: {
    height: 8,
    borderRadius: 4,
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    marginTop: 10,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  hint: {
    textAlign: "center",
    marginTop: 8,
  },
});
