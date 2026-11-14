export type RoomMode = "chain" | "elimination";
export type RoomStatus = "lobby" | "playing" | "finished";
export type PlayerStatus = "active" | "out" | "left";

export interface RoomPlayer {
  userId: number;
  name: string;
  avatar: Record<string, unknown> | null;
  seat: number;
  lives: number;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
}

export interface RoomTurn {
  userId: number;
  ayah: number;
  ok: boolean;
  similarity: number | null;
  kind: "answer" | "timeout";
  at: number;
}

export interface RoomState {
  changed: true;
  version: number;
  serverTime: number;
  code: string;
  mode: RoomMode;
  status: RoomStatus;
  surah: number;
  startAyah: number;
  endAyah: number;
  maxPlayers: number;
  lives: number;
  hostId: number;
  turnSeconds: number;
  currentAyah: number | null;
  /** The ayah the bot plays before this turn, or null when there is nothing to play. */
  promptAyah: number | null;
  attempt: number;
  turnUserId: number | null;
  turnDeadline: number | null;
  winnerId: number | null;
  players: RoomPlayer[];
  turns: RoomTurn[];
}

export interface RoomUnchanged {
  changed: false;
  version: number;
  serverTime: number;
}

export interface Profile {
  displayName: string;
  avatar: Record<string, unknown> | null;
  hasProfile: boolean;
}

export interface CreateRoomInput {
  mode: RoomMode;
  surah: number;
  startAyah: number;
  endAyah: number;
  maxPlayers: number;
  lives?: number;
}
