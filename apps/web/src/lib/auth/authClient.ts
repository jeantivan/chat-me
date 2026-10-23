import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  SessionResponse,
} from "@chat-me/shared";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) {
        errorMsg = data.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function getAuthHeaders(): Record<string, string> {
  return currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {};
}

export const authClient = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    return handleResponse<AuthResponse>(res);
  },

  async refresh(): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<AuthResponse>(res);
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    await handleResponse<{ success: boolean }>(res);
  },

  async getMe(token: string): Promise<SessionResponse> {
    const res = await fetch(`${API_BASE}/api/v1/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    return handleResponse<SessionResponse>(res);
  },
};
