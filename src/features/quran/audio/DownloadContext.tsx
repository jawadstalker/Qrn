import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as Haptics from "expo-haptics";
import {
  DownloadCancelledError,
  downloadManager,
  getDownloadId,
  type ActiveDownloadProgress,
  type AudioDownloadRecord,
} from "./downloadManager";

export type DownloadState = "idle" | "downloading" | "downloaded" | "error";

export interface DownloadStatus {
  state: DownloadState;
  /** 0..1, only meaningful while downloading. */
  progress: number;
  record: AudioDownloadRecord | null;
}

interface DownloadContextValue {
  downloads: AudioDownloadRecord[];
  activeDownloads: Record<string, ActiveDownloadProgress>;
  totalDownloadSize: number;
  /** Resolves true when the file is saved, false when it failed or was cancelled. Never throws. */
  downloadSurah: (surahId: number, reciterId: string) => Promise<boolean>;
  cancelDownload: (surahId: number, reciterId: string) => Promise<void>;
  deleteDownload: (surahId: number, reciterId: string) => Promise<void>;
  deleteAllDownloads: () => Promise<void>;
  clearDownloadError: (surahId: number, reciterId: string) => void;
  getDownloadStatus: (surahId: number, reciterId: string) => DownloadStatus;
}

const DownloadContext = createContext<DownloadContextValue | undefined>(
  undefined,
);

function haptic(kind: "tap" | "success" | "error") {
  try {
    if (kind === "tap") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      void Haptics.notificationAsync(
        kind === "success"
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }
  } catch {
    // Haptics are a bonus.
  }
}

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<AudioDownloadRecord[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<
    Record<string, ActiveDownloadProgress>
  >({});

  useEffect(
    () =>
      downloadManager.subscribe((snapshot) => {
        setDownloads(snapshot.records);
        setActiveDownloads(snapshot.active);
      }),
    [],
  );

  const totalDownloadSize = useMemo(
    () => downloads.reduce((sum, item) => sum + (item.fileSize || 0), 0),
    [downloads],
  );

  const downloadSurah = useCallback(
    async (surahId: number, reciterId: string): Promise<boolean> => {
      haptic("tap");

      try {
        await downloadManager.startDownload(surahId, reciterId);
        haptic("success");

        return true;
      } catch (error) {
        if (!(error instanceof DownloadCancelledError)) {
          haptic("error");
        }

        return false;
      }
    },
    [],
  );

  const cancelDownload = useCallback(
    (surahId: number, reciterId: string) =>
      downloadManager.cancelDownload(surahId, reciterId),
    [],
  );

  const deleteDownload = useCallback(
    (surahId: number, reciterId: string) =>
      downloadManager.deleteRecord(surahId, reciterId),
    [],
  );

  const deleteAllDownloads = useCallback(
    () => downloadManager.deleteAllDownloads(),
    [],
  );

  const clearDownloadError = useCallback(
    (surahId: number, reciterId: string) =>
      downloadManager.clearError(surahId, reciterId),
    [],
  );

  const getDownloadStatus = useCallback(
    (surahId: number, reciterId: string): DownloadStatus => {
      const id = getDownloadId(surahId, reciterId);
      const active = activeDownloads[id];
      const record = downloads.find((item) => item.id === id) ?? null;

      if (active?.status === "downloading") {
        return { state: "downloading", progress: active.progress, record };
      }

      if (record) {
        return { state: "downloaded", progress: 1, record };
      }

      if (active?.status === "error") {
        return { state: "error", progress: 0, record: null };
      }

      return { state: "idle", progress: 0, record: null };
    },
    [activeDownloads, downloads],
  );

  const value = useMemo(
    () => ({
      downloads,
      activeDownloads,
      totalDownloadSize,
      downloadSurah,
      cancelDownload,
      deleteDownload,
      deleteAllDownloads,
      clearDownloadError,
      getDownloadStatus,
    }),
    [
      downloads,
      activeDownloads,
      totalDownloadSize,
      downloadSurah,
      cancelDownload,
      deleteDownload,
      deleteAllDownloads,
      clearDownloadError,
      getDownloadStatus,
    ],
  );

  return (
    <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>
  );
}

export function useDownload(): DownloadContextValue {
  const context = useContext(DownloadContext);

  if (!context) {
    throw new Error("useDownload must be used within DownloadProvider");
  }

  return context;
}
