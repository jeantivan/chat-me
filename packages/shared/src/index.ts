export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  services: {
    postgres: boolean;
    redis: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string;
  phone?: string | null;
  pictureUrl: string;
  createdAt: string;
}

export type ThemeMode = "light" | "dark";
export type PrivacyAudience = "all" | "contacts" | "none";

export interface UserSettingsData {
  userId: string;
  themeMode: ThemeMode;
  themeColor: string;
  notifyAll: boolean;
  notifySound: boolean;
  notifyPreview: boolean;
  notifyReactions: boolean;
  privacyLastSeen: PrivacyAudience;
  privacyPicture: PrivacyAudience;
  privacyBio: PrivacyAudience;
  privacyGroups: PrivacyAudience;
  privacyReadReceipt: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
  settings: UserSettingsData;
}

export interface SessionResponse {
  user: UserProfile;
  settings: UserSettingsData;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
