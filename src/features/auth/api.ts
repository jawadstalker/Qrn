import { API_BASE_URL } from "@/features/auth/config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface RegisterResult {
  verificationRequired: true;
  email: string;
}

export type MailLang = "fa" | "en";

export interface SyncItem {
  value: string;
  updatedAt: number;
}

const TIMEOUT_MS = 20000;

export async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string | null } = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(0, "not_configured", "Server address is not set.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = (data as { error?: { code?: string; message?: string } })
        ?.error;

      throw new ApiError(
        response.status,
        error?.code ?? "server_error",
        error?.message ?? `Request failed (${response.status}).`,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(0, "network", "Could not reach the server.");
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  register: (email: string, password: string, lang: MailLang) =>
    request<RegisterResult>("POST", "/auth/register", {
      body: { email, password, lang },
    }),
  verifyEmail: (email: string, code: string, device: string) =>
    request<AuthResult>("POST", "/auth/verify", {
      body: { email, code, device },
    }),
  resendCode: (email: string, lang: MailLang) =>
    request<{ ok: true }>("POST", "/auth/resend", { body: { email, lang } }),
  forgotPassword: (email: string, lang: MailLang) =>
    request<{ ok: true }>("POST", "/auth/forgot", { body: { email, lang } }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ ok: true }>("POST", "/auth/reset", {
      body: { email, code, newPassword },
    }),
  login: (email: string, password: string, device: string, lang: MailLang) =>
    request<AuthResult>("POST", "/auth/login", {
      body: { email, password, device, lang },
    }),
  logout: (token: string) =>
    request<{ ok: true }>("POST", "/auth/logout", { token }),
  me: (token: string) =>
    request<{ user: AuthUser }>("GET", "/me", { token }),
  changePassword: (
    token: string,
    currentPassword: string,
    newPassword: string,
  ) =>
    request<{ ok: true }>("POST", "/me/password", {
      token,
      body: { currentPassword, newPassword },
    }),
  deleteAccount: (token: string, password: string) =>
    request<{ ok: true }>("DELETE", "/me", { token, body: { password } }),
  getSync: (token: string) =>
    request<{ items: Record<string, SyncItem> }>("GET", "/sync", { token }),
  putSync: (token: string, items: Record<string, SyncItem>) =>
    request<{ accepted: string[]; newer: Record<string, SyncItem> }>(
      "PUT",
      "/sync",
      { token, body: { items } },
    ),
};
