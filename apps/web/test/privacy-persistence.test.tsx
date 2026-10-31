import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Privacy } from "../src/components/Configuration/Privacy";
import useStore from "../src/lib/store";

describe("Privacy Drawer Persistence Seam", () => {
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
      privacy: {
        lastTimeOnline: "all",
        picture: "all",
        bio: "all",
        groups: "all",
        readReceipt: true,
      },
    });

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        userId: "user-123",
        privacyLastSeen: "contacts",
        privacyPicture: "contacts",
        privacyBio: "none",
        privacyGroups: "contacts",
        privacyReadReceipt: false,
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

  it("renders privacy drawer with current store preferences", () => {
    renderWithProviders(<Privacy />);

    expect(screen.getByText("Quién puede ver mi información personal")).toBeInTheDocument();
    expect(screen.getByText("Última vez en linea.")).toBeInTheDocument();
    expect(screen.getByText("Foto de perfil.")).toBeInTheDocument();
    expect(screen.getByText("Info.")).toBeInTheDocument();
    expect(screen.getByText("Confirmaciones de lectura.")).toBeInTheDocument();
    expect(screen.getByText("Grupos")).toBeInTheDocument();

    const readReceiptCheckbox = screen.getByRole("checkbox", {
      name: /confirmaciones de lectura/i,
    });
    expect(readReceiptCheckbox).toBeChecked();
  });

  it("changing privacyLastSeen optimistically updates store and calls PATCH /me/settings", async () => {
    renderWithProviders(<Privacy />);

    const select = screen.getByRole("combobox", { name: /última vez en linea/i });
    expect(select).toHaveValue("all");

    fireEvent.change(select, { target: { value: "none" } });

    expect(useStore.getState().privacy.lastTimeOnline).toBe("none");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/settings"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ privacyLastSeen: "none" }),
        })
      );
    });
  });

  it("changing privacyPicture optimistically updates store and calls PATCH /me/settings", async () => {
    renderWithProviders(<Privacy />);

    const select = screen.getByRole("combobox", { name: /foto de perfil/i });
    fireEvent.change(select, { target: { value: "contacts" } });

    expect(useStore.getState().privacy.picture).toBe("contacts");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/settings"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ privacyPicture: "contacts" }),
        })
      );
    });
  });

  it("changing privacyBio optimistically updates store and calls PATCH /me/settings", async () => {
    renderWithProviders(<Privacy />);

    const select = screen.getByRole("combobox", { name: /info\./i });
    fireEvent.change(select, { target: { value: "none" } });

    expect(useStore.getState().privacy.bio).toBe("none");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/settings"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ privacyBio: "none" }),
        })
      );
    });
  });

  it("changing privacyGroups optimistically updates store and calls PATCH /me/settings", async () => {
    renderWithProviders(<Privacy />);

    const select = screen.getByRole("combobox", { name: /grupos/i });
    fireEvent.change(select, { target: { value: "contacts" } });

    expect(useStore.getState().privacy.groups).toBe("contacts");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/settings"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ privacyGroups: "contacts" }),
        })
      );
    });
  });

  it("toggling privacyReadReceipt optimistically updates checkbox and calls PATCH /me/settings", async () => {
    renderWithProviders(<Privacy />);

    const checkbox = screen.getByRole("checkbox", { name: /confirmaciones de lectura/i });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    expect(useStore.getState().privacy.readReceipt).toBe(false);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/settings"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ privacyReadReceipt: false }),
        })
      );
    });
  });
});
