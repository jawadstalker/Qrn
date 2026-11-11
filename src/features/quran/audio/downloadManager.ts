import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReciter } from "@/features/quran/data/reciters";

export interface AudioDownloadRecord {
  id: string; // `${reciterId}_${surahId}`
  surahId: number;
  reciterId: string;
  localUri: string;
  fileSize: number; // bytes
  downloadedAt: number; // timestamp
}

export interface ActiveDownloadProgress {
  id: string;
  surahId: number;
  reciterId: string;
  progress: number; // 0..1
  totalBytes: number;
  downloadedBytes: number;
  status: "downloading" | "error";
}

export interface DownloadSnapshot {
  records: AudioDownloadRecord[];
  active: Record<string, ActiveDownloadProgress>;
}

/** Thrown by startDownload when the person cancelled it. It is not a failure. */
export class DownloadCancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "DownloadCancelledError";
  }
}

const METADATA_KEY = "@quran_audio_downloads_v2";
/** Older builds (feature-task) stored records here, with a quality suffix in the id. */
const LEGACY_METADATA_KEY = "@quran_audio_downloads_v1";
/** A real surah recording is never smaller than this; smaller means an error page was saved. */
const MIN_VALID_BYTES = 20 * 1024;
/** Progress updates reach the UI at most this often (ms). */
const EMIT_INTERVAL = 120;

export function getDownloadId(surahId: number, reciterId: string): string {
  return `${reciterId}_${surahId}`;
}

export function getAudioDownloadUrl(surahId: number, reciterId: string): string {
  return getReciter(reciterId).surahUrl(surahId);
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) {
    return "0 MB";
  }

  const megabytes = bytes / (1024 * 1024);

  if (megabytes < 1) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${megabytes.toFixed(1)} MB`;
}

const isNative = () => Platform.OS !== "web" && !!FileSystem.documentDirectory;

class DownloadManager {
  private records: AudioDownloadRecord[] = [];
  private progress: Record<string, ActiveDownloadProgress> = {};
  private resumables = new Map<string, FileSystem.DownloadResumable>();
  private inFlight = new Map<string, Promise<AudioDownloadRecord>>();
  private cancelled = new Set<string>();
  private listeners = new Set<(snapshot: DownloadSnapshot) => void>();
  private initPromise: Promise<void> | null = null;
  private lastEmit = 0;

  private audioDir(): string {
    return `${FileSystem.documentDirectory ?? ""}quran_audio/`;
  }

  /** Loads the saved list once. Safe to call from anywhere, any number of times. */
  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.load();
    }

    return this.initPromise;
  }

  private async load(): Promise<void> {
    try {
      if (isNative()) {
        const info = await FileSystem.getInfoAsync(this.audioDir());

        if (!info.exists) {
          await FileSystem.makeDirectoryAsync(this.audioDir(), {
            intermediates: true,
          });
        }
      }

      const stored =
        (await AsyncStorage.getItem(METADATA_KEY)) ??
        (await AsyncStorage.getItem(LEGACY_METADATA_KEY));
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const valid: AudioDownloadRecord[] = [];

      if (Array.isArray(parsed)) {
        for (const item of parsed as Partial<AudioDownloadRecord>[]) {
          if (
            typeof item?.surahId !== "number" ||
            typeof item.reciterId !== "string" ||
            typeof item.localUri !== "string"
          ) {
            continue;
          }

          // Browser object URLs die with the page, so they cannot be kept across launches.
          if (item.localUri.startsWith("blob:")) {
            continue;
          }

          if (isNative()) {
            const info = await FileSystem.getInfoAsync(item.localUri);

            if (!info.exists) {
              continue;
            }
          }

          const id = getDownloadId(item.surahId, item.reciterId);

          if (!valid.some((record) => record.id === id)) {
            valid.push({
              id,
              surahId: item.surahId,
              reciterId: item.reciterId,
              localUri: item.localUri,
              fileSize: typeof item.fileSize === "number" ? item.fileSize : 0,
              downloadedAt:
                typeof item.downloadedAt === "number" ? item.downloadedAt : 0,
            });
          }
        }
      }

      this.records = valid;
    } catch {
      this.records = [];
    }

    this.emit(true);
  }

  private async persist(): Promise<void> {
    try {
      const keep = this.records.filter(
        (record) => !record.localUri.startsWith("blob:"),
      );

      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(keep));
    } catch {
      // The files are still on disk; the list is rebuilt from what was saved last.
    }
  }

  private snapshot(): DownloadSnapshot {
    return { records: [...this.records], active: { ...this.progress } };
  }

  private emit(force = false): void {
    const now = Date.now();

    if (!force && now - this.lastEmit < EMIT_INTERVAL) {
      return;
    }

    this.lastEmit = now;

    const snapshot = this.snapshot();

    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // One broken listener must not stop the others.
      }
    });
  }

  subscribe(listener: (snapshot: DownloadSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    void this.init();

    return () => {
      this.listeners.delete(listener);
    };
  }

  getRecords(): AudioDownloadRecord[] {
    return [...this.records];
  }

  /** The playable local file of a surah, or null. Used by the player; synchronous on purpose. */
  getCachedUriSync(surahId: number, reciterId?: string): string | null {
    const match = this.records.find(
      (record) =>
        record.surahId === surahId &&
        (reciterId === undefined || record.reciterId === reciterId),
    );

    return match ? match.localUri : null;
  }

  isDownloading(surahId: number, reciterId: string): boolean {
    return this.inFlight.has(getDownloadId(surahId, reciterId));
  }

  startDownload(
    surahId: number,
    reciterId: string,
  ): Promise<AudioDownloadRecord> {
    const id = getDownloadId(surahId, reciterId);
    const running = this.inFlight.get(id);

    // A second tap while the first is running joins it instead of starting a second copy.
    if (running) {
      return running;
    }

    const job = this.run(surahId, reciterId).finally(() => {
      this.inFlight.delete(id);
      this.resumables.delete(id);
      this.cancelled.delete(id);
    });

    this.inFlight.set(id, job);

    return job;
  }

  private fail(id: string, surahId: number, reciterId: string): void {
    this.progress[id] = {
      id,
      surahId,
      reciterId,
      progress: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      status: "error",
    };
    this.emit(true);
  }

  private async run(
    surahId: number,
    reciterId: string,
  ): Promise<AudioDownloadRecord> {
    await this.init();

    const id = getDownloadId(surahId, reciterId);
    const existing = this.records.find((record) => record.id === id);

    if (existing) {
      return existing;
    }

    const url = getAudioDownloadUrl(surahId, reciterId);

    this.progress[id] = {
      id,
      surahId,
      reciterId,
      progress: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      status: "downloading",
    };
    this.emit(true);

    try {
      const record = isNative()
        ? await this.downloadNative(id, surahId, reciterId, url)
        : await this.downloadWeb(id, surahId, reciterId, url);

      if (this.cancelled.has(id)) {
        throw new DownloadCancelledError();
      }

      this.records = [...this.records.filter((item) => item.id !== id), record];
      delete this.progress[id];
      this.emit(true);
      void this.persist();

      return record;
    } catch (error) {
      if (this.cancelled.has(id) || error instanceof DownloadCancelledError) {
        delete this.progress[id];
        this.emit(true);

        throw new DownloadCancelledError();
      }

      this.fail(id, surahId, reciterId);

      throw error;
    }
  }

  private async downloadNative(
    id: string,
    surahId: number,
    reciterId: string,
    url: string,
  ): Promise<AudioDownloadRecord> {
    const finalUri = `${this.audioDir()}${id}.mp3`;
    // Downloaded under a temporary name, so a half-finished file is never mistaken for a good one.
    const partUri = `${finalUri}.part`;

    await FileSystem.deleteAsync(partUri, { idempotent: true });

    const resumable = FileSystem.createDownloadResumable(
      url,
      partUri,
      {},
      (event) => {
        const total = event.totalBytesExpectedToWrite;
        const written = event.totalBytesWritten;

        this.progress[id] = {
          id,
          surahId,
          reciterId,
          progress: total > 0 ? Math.min(written / total, 0.99) : 0,
          totalBytes: total,
          downloadedBytes: written,
          status: "downloading",
        };
        this.emit();
      },
    );

    this.resumables.set(id, resumable);

    let result: FileSystem.FileSystemDownloadResult | undefined;

    try {
      result = await resumable.downloadAsync();
    } catch (error) {
      await FileSystem.deleteAsync(partUri, { idempotent: true });

      throw error;
    }

    // Paused (cancelled) downloads resolve with nothing.
    if (this.cancelled.has(id) || !result) {
      await FileSystem.deleteAsync(partUri, { idempotent: true });

      throw new DownloadCancelledError();
    }

    // The server answered, but with an error page (404, 500...) that expo saved as if it was audio.
    if (result.status < 200 || result.status >= 300) {
      await FileSystem.deleteAsync(partUri, { idempotent: true });

      throw new Error(`HTTP ${result.status}`);
    }

    const info = await FileSystem.getInfoAsync(partUri);
    const size = info.exists && "size" in info ? (info.size ?? 0) : 0;

    if (size < MIN_VALID_BYTES) {
      await FileSystem.deleteAsync(partUri, { idempotent: true });

      throw new Error("file too small");
    }

    await FileSystem.deleteAsync(finalUri, { idempotent: true });
    await FileSystem.moveAsync({ from: partUri, to: finalUri });

    return {
      id,
      surahId,
      reciterId,
      localUri: finalUri,
      fileSize: size,
      downloadedAt: Date.now(),
    };
  }

  /** Browsers have no document folder: keep the file as an in-memory object URL for this visit. */
  private async downloadWeb(
    id: string,
    surahId: number,
    reciterId: string,
    url: string,
  ): Promise<AudioDownloadRecord> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();

    if (blob.size < MIN_VALID_BYTES) {
      throw new Error("file too small");
    }

    return {
      id,
      surahId,
      reciterId,
      localUri: URL.createObjectURL(blob),
      fileSize: blob.size,
      downloadedAt: Date.now(),
    };
  }

  async cancelDownload(surahId: number, reciterId: string): Promise<void> {
    const id = getDownloadId(surahId, reciterId);
    const resumable = this.resumables.get(id);

    if (!this.inFlight.has(id)) {
      // A failed download only leaves its error flag behind; cancelling clears it.
      delete this.progress[id];
      this.emit(true);

      return;
    }

    this.cancelled.add(id);

    try {
      await resumable?.pauseAsync();
    } catch {
      // The download may have just finished; the cancelled flag decides what happens next.
    }
  }

  clearError(surahId: number, reciterId: string): void {
    const id = getDownloadId(surahId, reciterId);

    if (this.progress[id]?.status === "error") {
      delete this.progress[id];
      this.emit(true);
    }
  }

  async deleteRecord(surahId: number, reciterId: string): Promise<void> {
    await this.init();

    const id = getDownloadId(surahId, reciterId);
    const target = this.records.find((record) => record.id === id);

    if (!target) {
      return;
    }

    await this.removeFile(target);
    this.records = this.records.filter((record) => record.id !== id);
    this.emit(true);
    await this.persist();
  }

  async deleteAllDownloads(): Promise<void> {
    await this.init();

    const all = [...this.records];

    this.records = [];
    this.emit(true);
    await Promise.all(all.map((record) => this.removeFile(record)));
    await this.persist();
  }

  private async removeFile(record: AudioDownloadRecord): Promise<void> {
    try {
      if (record.localUri.startsWith("blob:")) {
        URL.revokeObjectURL(record.localUri);
      } else if (isNative()) {
        await FileSystem.deleteAsync(record.localUri, { idempotent: true });
      }
    } catch {
      // A file that is already gone is the goal anyway.
    }
  }
}

export const downloadManager = new DownloadManager();

// Start reading the saved list as soon as the app loads, so offline files are found when playing.
void downloadManager.init();
