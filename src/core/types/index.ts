export type ThemeMode = "mindful" | "calm" | "restore" | "night";

export type Language = "fa" | "en";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  streak: number;
}

export interface MenuItem {
  id: string;
  titleKey: string;
  icon: string;
  route: string;
  color: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
