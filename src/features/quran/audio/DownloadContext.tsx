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
  downloadManager,
  type ActiveDownloadProgress,
  type AudioDownloadRecord,
  type AudioQuality,
  getDownloadId,
} from "./downloadManager";

interface DownloadContextValue {
  downloads: AudioDownloadRecord[];
  activeDownloads: Record<string, ActiveDownloadProgress>;
  totalDownloadSize: number;
  downloadSurah: (
    surahId: number,
    reciterId: string,
    quality?: AudioQuality,
  ) => Promise<AudioDownloadRecord>;
  cancelDownload: (
    surahId: number,
    reciterId: string,
    quality?: AudioQuality,
  ) => Promise<void>;
  deleteDownload: (
    surahId: number,
    reciterId: string,
    quality?: AudioQuality,
  ) => Promise<void>;
  deleteAllDownloads: () => Promise<void>;
  getDownloadStatus: (
    surahId: number,
    reciterId: string,
    quality?: AudioQuality,
  ) => {
    isDownloaded: boolean;
    isDownloading: boolean;
    progress: number;
    record: AudioDownloadRecord | null;
    error?: string;
  };
  getAnyDownloadedRecord: (
    surahId: number,
    reciterId?: string,
  ) => AudioDownloadRecord | null;
  refreshDownloads: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextValue | undefined>(
  undefined,
);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<AudioDownloadRecord[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<
    Record<string, ActiveDownloadProgress>
  >({});

  const refreshDownloads = useCallback(async () => {
    const list = await downloadManager.getDownloadedRecords();
    setDownloads([...list]);
  }, []);

  useEffect(() => {
    void downloadManager.init().then(() => {
      void refreshDownloads();
    });

    const unsubscribe = downloadManager.subscribeProgress((active) => {
      setActiveDownloads(active);
    });

    return unsubscribe;
  }, [refreshDownloads]);

  const totalDownloadSize = useMemo(() => {
    return downloads.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  }, [downloads]);

  const downloadSurah = useCallback(
    async (
      surahId: number,
      reciterId: string,
      quality: AudioQuality = "128k",
    ): Promise<AudioDownloadRecord> => {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics optional
      }
      try {
        const record = await downloadManager.startDownload(
          surahId,
          reciterId,
          quality,
        );
        await refreshDownloads();
        try {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } catch {
          // Haptics optional
        }
        return record;
      } catch (error) {
        try {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {
          // Haptics optional
        }
        throw error;
      }
    },
    [refreshDownloads],
  );

  const cancelDownload = useCallback(
    async (
      surahId: number,
      reciterId: string,
      quality: AudioQuality = "128k",
    ): Promise<void> => {
      const id = getDownloadId(surahId, reciterId, quality);
      await downloadManager.cancelDownload(id);
    },
    [],
  );

  const deleteDownload = useCallback(
    async (
      surahId: number,
      reciterId: string,
      quality: AudioQuality = "128k",
    ): Promise<void> => {
      await downloadManager.deleteRecord(surahId, reciterId, quality);
      await refreshDownloads();
    },
    [refreshDownloads],
  );

  const deleteAllDownloads = useCallback(async (): Promise<void> => {
    await downloadManager.deleteAllDownloads();
    await refreshDownloads();
  }, [refreshDownloads]);

  const getDownloadStatus = useCallback(
    (surahId: number, reciterId: string, quality: AudioQuality = "128k") => {
      const id = getDownloadId(surahId, reciterId, quality);
      const active = activeDownloads[id];
      const record = downloads.find((d) => d.id === id) ?? null;

      return {
        isDownloaded: record !== null,
        isDownloading: active !== undefined && active.status === "downloading",
        progress: active ? active.progress : record ? 1 : 0,
        record,
        error: active?.status === "error" ? active.error : undefined,
      };
    },
    [activeDownloads, downloads],
  );

  const getAnyDownloadedRecord = useCallback(
    (surahId: number, reciterId?: string): AudioDownloadRecord | null => {
      if (reciterId) {
        return (
          downloads.find(
            (d) => d.surahId === surahId && d.reciterId === reciterId,
          ) ?? null
        );
      }
      return downloads.find((d) => d.surahId === surahId) ?? null;
    },
    [downloads],
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
      getDownloadStatus,
      getAnyDownloadedRecord,
      refreshDownloads,
    }),
    [
      downloads,
      activeDownloads,
      totalDownloadSize,
      downloadSurah,
      cancelDownload,
      deleteDownload,
      deleteAllDownloads,
      getDownloadStatus,
      getAnyDownloadedRecord,
      refreshDownloads,
    ],
  );

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload(): DownloadContextValue {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownload must be used within DownloadProvider");
  }
  return context;
}
