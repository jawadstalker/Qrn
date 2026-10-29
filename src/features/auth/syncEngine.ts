import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, type SyncItem } from "@/features/auth/api";
import { STORAGE, SYNC_KEYS } from "@/features/auth/config";

/**
 * Keeps the app's local data and the account copy equal.
 *
 * The stores write to AsyncStorage on their own, so instead of hooking every write the engine
 * fingerprints each key. A key whose fingerprint changed since the last sync counts as edited now.
 * When both sides changed, the newer edit wins and the losing local value is kept in a backup key.
 */

interface KeyMeta {
  /** Fingerprint of the local value at the last check. */
  hash: string;
  /** When the local value last changed (ms). */
  updatedAt: number;
  /** The server's updatedAt for this key at the last sync, 0 if never synced. */
  serverAt: number;
}

type MetaMap = Record<string, KeyMeta>;

export interface SyncOutcome {
  /** True when values from the server replaced local ones, so the app must reload its data. */
  localChanged: boolean;
  pushed: number;
  pulled: number;
}

function fingerprint(value: string): string {
  let h = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return `${value.length}:${h.toString(16)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function saveBackup(key: string, value: string) {
  const backup = await readJson<Record<string, { value: string; at: number }>>(
    STORAGE.syncBackup,
    {},
  );

  backup[key] = { value, at: Date.now() };
  await AsyncStorage.setItem(STORAGE.syncBackup, JSON.stringify(backup));
}

let running: Promise<SyncOutcome> | null = null;

/** Runs one sync round. Calls made while a round is running share that round. */
export function syncNow(token: string): Promise<SyncOutcome> {
  if (!running) {
    running = runSync(token).finally(() => {
      running = null;
    });
  }

  return running;
}

async function runSync(token: string): Promise<SyncOutcome> {
  const meta = await readJson<MetaMap>(STORAGE.syncMeta, {});
  const previous = new Set(Object.keys(meta));
  const pairs = await AsyncStorage.multiGet([...SYNC_KEYS]);
  const local: Record<string, string> = {};
  const now = Date.now();

  pairs.forEach(([key, value]) => {
    if (value === null) {
      return;
    }

    local[key] = value;
    const hash = fingerprint(value);
    const entry = meta[key];

    if (!entry) {
      meta[key] = { hash, updatedAt: now, serverAt: 0 };
    } else if (entry.hash !== hash) {
      meta[key] = { ...entry, hash, updatedAt: now };
    }
  });

  const { items: remote } = await api.getSync(token);
  const toPush: Record<string, SyncItem> = {};
  const toPull: Record<string, SyncItem> = {};

  for (const key of SYNC_KEYS) {
    const mine = local[key];
    const theirs = remote[key];
    const entry = meta[key];

    if (mine !== undefined && !theirs) {
      toPush[key] = { value: mine, updatedAt: entry.updatedAt };
    } else if (mine === undefined && theirs) {
      toPull[key] = theirs;
    } else if (mine !== undefined && theirs) {
      const firstTime = !previous.has(key);
      const localEdited = entry.updatedAt > entry.serverAt;
      const serverEdited = theirs.updatedAt !== entry.serverAt;

      if (mine === theirs.value) {
        meta[key] = { ...entry, updatedAt: theirs.updatedAt, serverAt: theirs.updatedAt };
      } else if (firstTime) {
        // First contact on this device: the account copy is the one to restore.
        await saveBackup(key, mine);
        toPull[key] = theirs;
      } else if (localEdited && !serverEdited) {
        toPush[key] = { value: mine, updatedAt: entry.updatedAt };
      } else if (!localEdited && serverEdited) {
        toPull[key] = theirs;
      } else if (localEdited && serverEdited) {
        if (theirs.updatedAt > entry.updatedAt) {
          await saveBackup(key, mine);
          toPull[key] = theirs;
        } else {
          toPush[key] = { value: mine, updatedAt: entry.updatedAt };
        }
      }
    }
  }

  let pushed = 0;

  if (Object.keys(toPush).length > 0) {
    const result = await api.putSync(token, toPush);

    result.accepted.forEach((key) => {
      meta[key] = { ...meta[key], serverAt: toPush[key].updatedAt };
      pushed += 1;
    });
    // The server held a newer value than we thought: take it.
    Object.entries(result.newer).forEach(([key, item]) => {
      toPull[key] = item;
    });
  }

  let pulled = 0;

  for (const [key, item] of Object.entries(toPull)) {
    await AsyncStorage.setItem(key, item.value);
    meta[key] = {
      hash: fingerprint(item.value),
      updatedAt: item.updatedAt,
      serverAt: item.updatedAt,
    };
    pulled += 1;
  }

  await AsyncStorage.setItem(STORAGE.syncMeta, JSON.stringify(meta));
  await AsyncStorage.setItem(STORAGE.lastSync, String(Date.now()));

  return { localChanged: pulled > 0, pushed, pulled };
}

/** Clears the sync bookkeeping (keeps the app's own data). */
export async function forgetSyncState() {
  await AsyncStorage.multiRemove([STORAGE.syncMeta, STORAGE.lastSync]);
}

/**
 * Called when a different account signs in on this device: the previous account's data is
 * backed up and removed, so it can never be copied into the new account.
 */
export async function wipeLocalData() {
  const pairs = await AsyncStorage.multiGet([...SYNC_KEYS]);
  const backup: Record<string, { value: string; at: number }> = {};

  pairs.forEach(([key, value]) => {
    if (value !== null) {
      backup[key] = { value, at: Date.now() };
    }
  });

  await AsyncStorage.setItem(STORAGE.syncBackup, JSON.stringify(backup));
  await AsyncStorage.multiRemove([...SYNC_KEYS]);
  await forgetSyncState();
}
