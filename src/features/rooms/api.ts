import { ApiError, request } from "@/features/auth/api";
import type {
  CreateRoomInput,
  Profile,
  RoomState,
  RoomUnchanged,
} from "@/features/rooms/types";

function needToken(token: string | null): string {
  if (!token) {
    throw new ApiError(401, "unauthorized", "Sign in first.");
  }

  return token;
}

/** Authenticated calls for the profile and the memorization rooms. */
export const roomsApi = {
  getProfile: (token: string | null) =>
    request<{ profile: Profile }>("GET", "/profile", {
      token: needToken(token),
    }),
  saveProfile: (
    token: string | null,
    displayName: string,
    avatar: Record<string, unknown> | null,
  ) =>
    request<{ profile: Profile }>("PUT", "/profile", {
      token: needToken(token),
      body: { displayName, avatar },
    }),
  create: (token: string | null, input: CreateRoomInput) =>
    request<RoomState>("POST", "/rooms", {
      token: needToken(token),
      body: input,
    }),
  join: (token: string | null, code: string) =>
    request<RoomState>("POST", "/rooms/join", {
      token: needToken(token),
      body: { code },
    }),
  state: (token: string | null, code: string, since?: number) =>
    request<RoomState | RoomUnchanged>(
      "GET",
      `/rooms/${code}${since ? `?v=${since}` : ""}`,
      { token: needToken(token) },
    ),
  start: (token: string | null, code: string) =>
    request<RoomState>("POST", `/rooms/${code}/start`, {
      token: needToken(token),
    }),
  leave: (token: string | null, code: string) =>
    request<{ ok: true }>("POST", `/rooms/${code}/leave`, {
      token: needToken(token),
    }),
  turn: (
    token: string | null,
    code: string,
    similarity: number,
    ayah: number,
  ) =>
    request<RoomState>("POST", `/rooms/${code}/turn`, {
      token: needToken(token),
      body: { similarity, ayah },
    }),
};
