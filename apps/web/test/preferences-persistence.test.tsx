import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "../src/components/Configuration/Theme";
import { Notifications } from "../src/components/Configuration/Notifications";
import useStore from "../src/lib/store";

describe("User Preferences Persistence & Drawers Seam", () => {
  let queryClient: QueryClient;
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useStore.setState({
      theme: {
        mode: "light",
        colors: "slate-indigo",
      },
      notifications: {
        all: true,
        sound: true,
        preview: false,
        reactions: true,
      },
    });

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        userId: "user-123",
        themeMode: "dark",
        themeColor: "mauve-violet",
        notifyAll: true,
        notifySound: true,
        notifyPreview: false,
        notifyReactions: true,
      }),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithProviders(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  }

  describe("Theme Drawer", () => {
    it("changing color palette immediately updates store, syncs to localStorage, and calls PATCH /me/settings", async () => {
      renderWithProviders(<Theme />);

      const violetOption = screen.getByText("Violet");
      fireEvent.click(violetOption);

      // Verify immediate UI / store update
      expect(useStore.getState().theme.colors).toBe("mauve-violet");

      // Verify localStorage sync for zero-FOUC
      const stored = JSON.parse(localStorage.getItem("zustand-chat-me") || "{}");
      expect(stored?.state?.theme?.colors).toBe("mauve-violet");

      // Verify PATCH /api/v1/users/me/settings was called
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/users/me/settings"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ themeColor: "mauve-violet" }),
          })
        );
      });
    });

    it("changing theme mode immediately updates store, syncs to localStorage, and calls PATCH /me/settings", async () => {
      renderWithProviders(<Theme />);

      const darkModeOption = screen.getByText(/Oscuro/i);
      fireEvent.click(darkModeOption);

      expect(useStore.getState().theme.mode).toBe("dark");

      const stored = JSON.parse(localStorage.getItem("zustand-chat-me") || "{}");
      expect(stored?.state?.theme?.mode).toBe("dark");

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/users/me/settings"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ themeMode: "dark" }),
          })
        );
      });
    });
  });

  describe("Notifications Drawer", () => {
    it("toggling notifyAll updates store and calls PATCH /me/settings", async () => {
      renderWithProviders(<Notifications />);

      const notifyAllCheckbox = screen.getByRole("checkbox", { name: /Notificaciones de mensajes/i });
      expect(notifyAllCheckbox).toBeChecked();

      fireEvent.click(notifyAllCheckbox);

      expect(useStore.getState().notifications.all).toBe(false);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/users/me/settings"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ notifyAll: false }),
          })
        );
      });
    });

    it("disables dependent toggles (preview, reactions, sound) when notifyAll is false", () => {
      useStore.setState({
        notifications: {
          all: false,
          sound: true,
          preview: true,
          reactions: true,
        },
      });

      renderWithProviders(<Notifications />);

      const previewCheckbox = screen.getByRole("checkbox", { name: /Vista previa de los mensajes/i });
      const reactionsCheckbox = screen.getByRole("checkbox", { name: /Mostrar notificaciones de reacciones/i });
      const soundCheckbox = screen.getByRole("checkbox", { name: /Sonido/i });

      expect(previewCheckbox).toBeDisabled();
      expect(reactionsCheckbox).toBeDisabled();
      expect(soundCheckbox).toBeDisabled();
    });

    it("toggles sound, preview, and reactions optimistically and calls PATCH /me/settings", async () => {
      renderWithProviders(<Notifications />);

      const soundCheckbox = screen.getByRole("checkbox", { name: /Sonido/i });
      expect(soundCheckbox).not.toBeDisabled();
      fireEvent.click(soundCheckbox);

      expect(useStore.getState().notifications.sound).toBe(false);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/users/me/settings"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ notifySound: false }),
          })
        );
      });

      const previewCheckbox = screen.getByRole("checkbox", { name: /Vista previa de los mensajes/i });
      fireEvent.click(previewCheckbox);

      expect(useStore.getState().notifications.preview).toBe(true);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/users/me/settings"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ notifyPreview: true }),
          })
        );
      });

      const reactionsCheckbox = screen.getByRole("checkbox", { name: /Mostrar notificaciones de reacciones/i });
      fireEvent.click(reactionsCheckbox);

      expect(useStore.getState().notifications.reactions).toBe(false);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/users/me/settings"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ notifyReactions: false }),
          })
        );
      });
    });
  });
});
