import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AuthResponse, UserProfile, UserSettingsData } from "@chat-me/shared";
import { authClient } from "./authClient.js";
import useStore from "@/lib/store/index.js";

export interface AuthContextType {
  user: UserProfile | null;
  settings: UserSettingsData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setUserProfile = useStore((state) => state.setUserProfile);
  const resetUserProfile = useStore((state) => state.resetUserProfile);

  const applyAuthSuccess = useCallback(
    (authData: AuthResponse) => {
      setUser(authData.user);
      setSettings(authData.settings);
      setToken(authData.accessToken);
      setError(null);
      setUserProfile(
        {
          id: authData.user.id,
          name: authData.user.name,
          bio: authData.user.bio,
          picture: authData.user.pictureUrl,
          phone: authData.user.phone || "",
        },
        authData.settings
      );
    },
    [setUserProfile]
  );

  // Restore session on mount via refresh endpoint
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await authClient.refresh();
        if (isMounted) {
          applyAuthSuccess(response);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setSettings(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [applyAuthSuccess]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const res = await authClient.login({ email, password });
        applyAuthSuccess(res);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to login";
        setError(msg);
        throw err;
      }
    },
    [applyAuthSuccess]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null);
      try {
        const res = await authClient.register({ email, password, name });
        applyAuthSuccess(res);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to register";
        setError(msg);
        throw err;
      }
    },
    [applyAuthSuccess]
  );

  const logout = useCallback(async () => {
    try {
      await authClient.logout();
    } catch {
      // Continue cleanup on client
    } finally {
      setUser(null);
      setSettings(null);
      setToken(null);
      setError(null);
      resetUserProfile();
    }
  }, [resetUserProfile]);

  const value: AuthContextType = {
    user,
    settings,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
