import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  CircleAlert,
  CircleCheck,
  Download,
  X,
} from "lucide-react-native";
import { useDownload } from "@/features/quran/audio/DownloadContext";
import { getSurah } from "@/features/quran/data/surahs";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { fill } from "@/features/quran/utils/fill";
import { confirmAction } from "@/features/quran/utils/confirm";

interface DownloadButtonProps {
  surahId: number;
  reciterId: string;
  /** Icon size; the touch circle is 18 larger. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const DONE = "#10B981";
const BUSY = "#3B82F6";
const FAILED = "#EF4444";
const RING_STROKE = 2.5;

/**
 * One tap on the audio of a surah:
 *   idle        -> starts the download
 *   downloading -> a progress ring; tapping cancels
 *   downloaded  -> a green check; tapping asks before removing the file
 *   error       -> a red mark; tapping tries again
 */
export function DownloadButton({
  surahId,
  reciterId,
  size = 20,
  style,
}: DownloadButtonProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const {
    getDownloadStatus,
    downloadSurah,
    cancelDownload,
    deleteDownload,
    clearDownloadError,
  } = useDownload();
  const status = getDownloadStatus(surahId, reciterId);
  const circle = size + 18;
  const radius = (circle - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const handlePress = useCallback(async () => {
    if (status.state === "downloading") {
      await cancelDownload(surahId, reciterId);

      return;
    }

    if (status.state === "downloaded") {
      const surah = getSurah(surahId);
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
        await deleteDownload(surahId, reciterId);
      }

      return;
    }

    if (status.state === "error") {
      clearDownloadError(surahId, reciterId);
    }

    await downloadSurah(surahId, reciterId);
  }, [
    cancelDownload,
    clearDownloadError,
    deleteDownload,
    downloadSurah,
    language,
    reciterId,
    status.state,
    surahId,
    t,
  ]);

  const label =
    status.state === "downloading"
      ? `${t.dl_a11y_cancel} (${Math.round(status.progress * 100)}%)`
      : status.state === "downloaded"
        ? t.dl_a11y_downloaded
        : status.state === "error"
          ? t.dl_a11y_retry
          : t.dl_a11y_download;
  const background =
    status.state === "downloaded"
      ? "rgba(16, 185, 129, 0.14)"
      : status.state === "downloading"
        ? "rgba(59, 130, 246, 0.12)"
        : status.state === "error"
          ? "rgba(239, 68, 68, 0.12)"
          : colors.tintSoft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: status.state === "downloading" }}
      hitSlop={6}
      onPress={(event) => {
        event.stopPropagation();
        void handlePress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: background,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {status.state === "downloading" ? (
        <View style={[styles.center, { width: circle, height: circle }]}>
          <Svg
            width={circle}
            height={circle}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Circle
              cx={circle / 2}
              cy={circle / 2}
              r={radius}
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            {status.progress > 0 ? (
              <Circle
                cx={circle / 2}
                cy={circle / 2}
                r={radius}
                stroke={BUSY}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - status.progress)}
                transform={`rotate(-90 ${circle / 2} ${circle / 2})`}
              />
            ) : null}
          </Svg>
          {status.progress > 0 ? (
            <X size={size - 4} color={BUSY} />
          ) : (
            <ActivityIndicator size="small" color={BUSY} />
          )}
        </View>
      ) : status.state === "downloaded" ? (
        <CircleCheck size={size} color={DONE} />
      ) : status.state === "error" ? (
        <CircleAlert size={size} color={FAILED} />
      ) : (
        <Download size={size} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
