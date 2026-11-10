import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReciter, RECITERS } from "@/features/quran/data/reciters";

export type AudioQuality = "128k" | "64k";

export interface AudioDownloadRecord {
  id: string; // `${reciterId}_${surahId}_${quality}`
  surahId: number;
  reciterId: string;
  quality: AudioQuality;
  localUri: string;
  fileSize: number; // bytes
  downloadedAt: number; // timestamp
}

export interface ActiveDownloadProgress {
  id: string;
  surahId: number;
  reciterId: string;
  quality: AudioQuality;
  progress: number; // 0 to 1
  totalBytes: number;
  downloadedBytes: number;
  status: "downloading" | "error";
  error?: string;
}

const METADATA_KEY = "@quran_audio_downloads_v1";

function pad3(value: number): string {
  return String(value).padStart(3, "0");
}

export function getAudioDownloadUrl(
  surahId: number,
  reciterId: string,
  quality: AudioQuality = "128k",
): string {
  const reciter = getReciter(reciterId);
  const base128 = reciter.surahUrl(surahId);

  if (quality === "64k") {
    // For 64k, if standard server provides, use alternative or fallback to stream
    if (reciterId === "alafasy") {
      return `https://server8.mp3quran.net/afs/${pad3(surahId)}.mp3`;
    }
  }

  return base128;
}

export function getDownloadId(
  surahId: number,
  reciterId: string,
  quality: AudioQuality = "128k",
): string {
  return `${reciterId}_${surahId}_${quality}`;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) {
    return "0 MB";
  }
  const megabytes = bytes / (1024 * 1024);
  if (megabytes < 1) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${megabytes.toFixed(1)} MB`;
}

class DownloadManager {
  private activeDownloads = new Map<string, FileSystem.DownloadResumable>();
  private progressListeners = new Set<
    (state: Record<string, ActiveDownloadProgress>) => void
  >();
  private progressMap: Record<string, ActiveDownloadProgress> = {};
  private recordsCache: AudioDownloadRecord[] | null = null;
  private isInitialized = false;

  private getAudioDir(): string {
    return `${FileSystem.documentDirectory ?? ""}quran_audio/`;
  }

  private getLocalFilePath(id: string): string {
    return `${this.getAudioDir()}${id}.mp3`;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (Platform.OS !== "web" && FileSystem.documentDirectory) {
        const dir = this.getAudioDir();
        const info = await FileSystem.getInfoAsync(dir);
        if (!info.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }
      }
      await this.loadRecords();
    } catch {
      // Ignore directory check error
    }
  }

  private async loadRecords(): Promise<AudioDownloadRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(METADATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.recordsCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    this.recordsCache = [];
    return [];
  }

  private async saveRecords(records: AudioDownloadRecord[]): Promise<void> {
    this.recordsCache = records;
    try {
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(records));
    } catch {
      // Storage error
    }
  }

  async getDownloadedRecords(): Promise<AudioDownloadRecord[]> {
    if (!this.recordsCache) {
      await this.loadRecords();
    }
    return this.recordsCache || [];
  }

  getCachedUriSync(surahId: number, reciterId?: string): string | null {
    if (!this.recordsCache) return null;
    if (reciterId) {
      const match = this.recordsCache.find(
        (r) => r.surahId === surahId && r.reciterId === reciterId,
      );
      return match ? match.localUri : null;
    }
    const anyMatch = this.recordsCache.find((r) => r.surahId === surahId);
    return anyMatch ? anyMatch.localUri : null;
  }

  async getRecord(
    surahId: number,
    reciterId: string,
    quality: AudioQuality = "128k",
  ): Promise<AudioDownloadRecord | null> {
    const records = await this.getDownloadedRecords();
    const id = getDownloadId(surahId, reciterId, quality);
    const match = records.find((item) => item.id === id);
    if (!match) return null;

    // Verify file still exists on disk for native platforms
    if (Platform.OS !== "web" && FileSystem.documentDirectory) {
      try {
        const info = await FileSystem.getInfoAsync(match.localUri);
        if (!info.exists) {
          await this.deleteRecord(surahId, reciterId, quality);
          return null;
        }
      } catch {
        return null;
      }
    }

    return match;
  }

  async isSurahDownloaded(
    surahId: number,
    reciterId?: string,
  ): Promise<AudioDownloadRecord | null> {
    const records = await this.getDownloadedRecords();
    if (reciterId) {
      return (
        records.find(
          (item) => item.surahId === surahId && item.reciterId === reciterId,
        ) ?? null
      );
    }
    return records.find((item) => item.surahId === surahId) ?? null;
  }

  subscribeProgress(
    listener: (progress: Record<string, ActiveDownloadProgress>) => void,
  ): () => void {
    this.progressListeners.add(listener);
    listener({ ...this.progressMap });
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  private emitProgress(): void {
    const copy = { ...this.progressMap };
    this.progressListeners.forEach((listener) => {
      try {
        listener(copy);
      } catch {
        // Listener error
      }
    });
  }

  async startDownload(
    surahId: number,
    reciterId: string,
    quality: AudioQuality = "128k",
  ): Promise<AudioDownloadRecord> {
    await this.init();
    const id = getDownloadId(surahId, reciterId, quality);
    const url = getAudioDownloadUrl(surahId, reciterId, quality);
    const localUri = this.getLocalFilePath(id);

    // If already downloaded, return existing
    const existing = await this.getRecord(surahId, reciterId, quality);
    if (existing) {
      return existing;
    }

    // Set initial progress
    this.progressMap[id] = {
      id,
      surahId,
      reciterId,
      quality,
      progress: 0.05,
      totalBytes: 0,
      downloadedBytes: 0,
      status: "downloading",
    };
    this.emitProgress();

    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      // In web environment, cache via fetch and Blob or audio buffer
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const size = blob.size;
        const objectUrl = URL.createObjectURL(blob);

        const record: AudioDownloadRecord = {
          id,
          surahId,
          reciterId,
          quality,
          localUri: objectUrl,
          fileSize: size,
          downloadedAt: Date.now(),
        };

        delete this.progressMap[id];
        this.emitProgress();

        const currentRecords = await this.getDownloadedRecords();
        await this.saveRecords([
          ...currentRecords.filter((r) => r.id !== id),
          record,
        ]);
        return record;
      } catch (err: any) {
        this.progressMap[id] = {
          id,
          surahId,
          reciterId,
          quality,
          progress: 0,
          totalBytes: 0,
          downloadedBytes: 0,
          status: "error",
          error: err?.message ?? "خطای دانلود",
        };
        this.emitProgress();
        throw err;
      }
    }

    // Native platform download with resume & progress support
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {},
        (downloadProgress) => {
          const total = downloadProgress.totalBytesExpectedToWrite;
          const written = downloadProgress.totalBytesWritten;
          const ratio = total > 0 ? Math.min(written / total, 0.99) : 0.5;

          this.progressMap[id] = {
            id,
            surahId,
            reciterId,
            quality,
            progress: Math.max(0.05, ratio),
            totalBytes: total,
            downloadedBytes: written,
            status: "downloading",
          };
          this.emitProgress();
        },
      );

      this.activeDownloads.set(id, downloadResumable);

      const result = await downloadResumable.downloadAsync();
      this.activeDownloads.delete(id);

      if (!result || !result.uri) {
        throw new Error("دانلود ناموفق بود");
      }

      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const size = (fileInfo as any).size ?? 0;

      const record: AudioDownloadRecord = {
        id,
        surahId,
        reciterId,
        quality,
        localUri: result.uri,
        fileSize: size,
        downloadedAt: Date.now(),
      };

      delete this.progressMap[id];
      this.emitProgress();

      const currentRecords = await this.getDownloadedRecords();
      await this.saveRecords([
        ...currentRecords.filter((r) => r.id !== id),
        record,
      ]);
      return record;
    } catch (err: any) {
      this.activeDownloads.delete(id);
      this.progressMap[id] = {
        id,
        surahId,
        reciterId,
        quality,
        progress: 0,
        totalBytes: 0,
        downloadedBytes: 0,
        status: "error",
        error: err?.message ?? "خطا در اتصال یا ذخیره‌سازی",
      };
      this.emitProgress();
      throw err;
    }
  }

  async cancelDownload(id: string): Promise<void> {
    const download = this.activeDownloads.get(id);
    if (download) {
      try {
        await download.pauseAsync();
      } catch {
        // Ignore
      }
      this.activeDownloads.delete(id);
    }
    delete this.progressMap[id];
    this.emitProgress();
  }

  async deleteRecord(
    surahId: number,
    reciterId: string,
    quality: AudioQuality = "128k",
  ): Promise<void> {
    const id = getDownloadId(surahId, reciterId, quality);
    const records = await this.getDownloadedRecords();
    const target = records.find((r) => r.id === id);

    if (target) {
      if (Platform.OS !== "web" && FileSystem.documentDirectory) {
        try {
          await FileSystem.deleteAsync(target.localUri, { idempotent: true });
        } catch {
          // Ignore
        }
      }
      const updated = records.filter((r) => r.id !== id);
      await this.saveRecords(updated);
    }
  }

  async deleteAllDownloads(): Promise<void> {
    const records = await this.getDownloadedRecords();
    for (const record of records) {
      if (Platform.OS !== "web" && FileSystem.documentDirectory) {
        try {
          await FileSystem.deleteAsync(record.localUri, { idempotent: true });
        } catch {
          // Ignore
        }
      }
    }
    await this.saveRecords([]);
  }
}

export const downloadManager = new DownloadManager();
