import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "@/core/i18n/LanguageContext";
import {
  api,
  ApiError,
  type AuthResult,
  type AuthUser,
  type MailLang,
} from "@/features/auth/api";
import { STORAGE } from "@/features/auth/config";
import { reloadStores } from "@/features/auth/reloadStores";
import {
  forgetSyncState,
  syncNow,
  wipeLocalData,
} from "@/features/auth/syncEngine";

export type AuthStatus = "loading" | "out" | "in";
export type SyncStatus = "idle" | "syncing" | "ok" | "error";

interface AuthValue {
  status: AuthStatus;
  user: AuthUser | null;
  syncStatus: SyncStatus;
  /** Epoch ms of the last successful sync, or null. */
  lastSyncAt: number | null;
  /** Changes whenever data from the server replaced local data; the app remounts on it. */
  dataEpoch: number;
  /** Creates the account and emails a code. There is no session until the code is verified. */
  register: (email: string, password: string) => Promise<void>;
  /** Throws an ApiError with code "email_not_verified" when the email still needs its code. */
  login: (email: string, password: string) => Promise<void>;
  /** The current login token, or null when signed out. For authenticated calls outside the sync engine. */
  getToken: () => string | null;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  sync: () => Promise<boolean>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);
const RESUME_SYNC_GAP_MS = 30000;

function deviceName(): string {
  return `${Platform.OS} ${String(Platform.Version)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const mailLang: MailLang = language === "en" ? "en" : "fa";
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [dataEpoch, setDataEpoch] = useState(0);
  const tokenRef = useRef<string | null>(null);
  const lastRunRef = useRef(0);

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    setStatus("out");
    setSyncStatus("idle");
    setLastSyncAt(null);
    await AsyncStorage.multiRemove([STORAGE.token, STORAGE.user]);
    await forgetSyncState();
  }, []);

  const sync = useCallback(async (): Promise<boolean> => {
    const token = tokenRef.current;

    if (!token) {
      return false;
    }

    setSyncStatus("syncing");
    lastRunRef.current = Date.now();

    try {
      const outcome = await syncNow(token);

      setSyncStatus("ok");
      setLastSyncAt(Date.now());

      if (outcome.localChanged) {
        await reloadStores();
        setDataEpoch((value) => value + 1);
      }

      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearSession();
        return false;
      }

      setSyncStatus("error");
      return false;
    }
  }, [clearSession]);

  const startSession = useCallback(
    async (result: AuthResult) => {
      const owner = await AsyncStorage.getItem(STORAGE.syncOwner);

      if (owner && owner !== String(result.user.id)) {
        await wipeLocalData();
        await reloadStores();
        setDataEpoch((value) => value + 1);
      }

      tokenRef.current = result.token;
      await AsyncStorage.multiSet([
        [STORAGE.token, result.token],
        [STORAGE.user, JSON.stringify(result.user)],
        [STORAGE.syncOwner, String(result.user.id)],
      ]);
      setUser(result.user);
      setStatus("in");
      await sync();
    },
    [sync],
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [token, rawUser, rawLast] = await Promise.all([
          AsyncStorage.getItem(STORAGE.token),
          AsyncStorage.getItem(STORAGE.user),
          AsyncStorage.getItem(STORAGE.lastSync),
        ]);

        if (!active) {
          return;
        }

        if (token && rawUser) {
          tokenRef.current = token;
          setUser(JSON.parse(rawUser) as AuthUser);
          setStatus("in");

          if (rawLast) {
            setLastSyncAt(Number(rawLast));
          }

          void sync();
        } else {
          setStatus("out");
        }
      } catch {
        if (active) {
          setStatus("out");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [sync]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (!tokenRef.current) {
        return;
      }

      if (next === "background") {
        void sync();
      } else if (
        next === "active" &&
        Date.now() - lastRunRef.current > RESUME_SYNC_GAP_MS
      ) {
        void sync();
      }
    });

    return () => subscription.remove();
  }, [sync]);

  const register = useCallback(
    async (email: string, password: string) => {
      await api.register(email, password, mailLang);
    },
    [mailLang],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await startSession(
        await api.login(email, password, deviceName(), mailLang),
      );
    },
    [startSession, mailLang],
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      await startSession(await api.verifyEmail(email, code, deviceName()));
    },
    [startSession],
  );

  const getToken = useCallback(() => tokenRef.current, []);

  const resendCode = useCallback(
    async (email: string) => {
      await api.resendCode(email, mailLang);
    },
    [mailLang],
  );

  const forgotPassword = useCallback(
    async (email: string) => {
      await api.forgotPassword(email, mailLang);
    },
    [mailLang],
  );

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await api.resetPassword(email, code, newPassword);
    },
    [],
  );

  const logout = useCallback(async () => {
    const token = tokenRef.current;

    if (token) {
      // Send the latest changes first; a failure must not block signing out.
      await syncNow(token).catch(() => undefined);
      await api.logout(token).catch(() => undefined);
    }

    await clearSession();
  }, [clearSession]);

  const changePassword = useCallback(async (current: string, next: string) => {
    const token = tokenRef.current;

    if (!token) {
      throw new ApiError(401, "unauthorized", "Login required.");
    }

    await api.changePassword(token, current, next);
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      const token = tokenRef.current;

      if (!token) {
        throw new ApiError(401, "unauthorized", "Login required.");
      }

      await api.deleteAccount(token, password);
      await AsyncStorage.removeItem(STORAGE.syncOwner);
      await clearSession();
    },
    [clearSession],
  );

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      syncStatus,
      lastSyncAt,
      dataEpoch,
      register,
      login,
      getToken,
      verifyEmail,
      resendCode,
      forgotPassword,
      resetPassword,
      logout,
      changePassword,
      deleteAccount,
      sync,
    }),
    [
      status,
      user,
      syncStatus,
      lastSyncAt,
      dataEpoch,
      register,
      login,
      getToken,
      verifyEmail,
      resendCode,
      forgotPassword,
      resetPassword,
      logout,
      changePassword,
      deleteAccount,
      sync,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
