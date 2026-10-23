import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/lib/auth/AuthContext";
import useStore from "../src/lib/store";

describe("Frontend AuthContext Seam", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Tester",
    bio: "Hello",
    pictureUrl: "",
    createdAt: new Date().toISOString(),
  };

  const mockSettings = {
    userId: "user-123",
    themeMode: "dark",
    themeColor: "slate-indigo",
    notifyAll: true,
    notifySound: true,
    notifyPreview: true,
    notifyReactions: true,
    privacyLastSeen: "all",
    privacyPicture: "all",
    privacyBio: "all",
    privacyGroups: "all",
    privacyReadReceipt: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("attempts to restore session on mount and sets user on success", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/api/v1/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: "access-token-123",
            user: mockUser,
            settings: mockSettings,
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe(mockUser.email);
    expect(result.current.token).toBe("access-token-123");
  });

  it("handles unauthenticated state gracefully when session restore returns 401", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/api/v1/auth/refresh")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized" }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("logs in successfully and updates state", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      const u = String(url);
      if (u.endsWith("/api/v1/auth/refresh")) {
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      }
      if (u.endsWith("/api/v1/auth/login")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: "new-access-token",
            user: mockUser,
            settings: mockSettings,
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe(mockUser.id);
    expect(result.current.token).toBe("new-access-token");
  });

  it("logs out and clears authenticated state", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith("/api/v1/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: "token",
            user: mockUser,
            settings: mockSettings,
          }),
        } as Response;
      }
      if (u.endsWith("/api/v1/auth/logout")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(useStore.getState().user.id).toBe("348441f8-c083-4cd1-9af3-59ca8cab0917");
  });
});
