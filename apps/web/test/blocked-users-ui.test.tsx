import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Privacy } from "../src/components/Configuration/Privacy";
import { BlockedContacts } from "../src/components/Configuration/BlockedContacts";
import useStore from "../src/lib/store";
import { chatKeys } from "../src/lib/socket/useSocketSync";

describe("Blocked Contacts UI Seam", () => {
  let queryClient: QueryClient;
  let fetchMock: any;

  const mockBlockedUsers = [
    {
      id: "blocked-1",
      userId: "blocked-1",
      blockedUserId: "blocked-1",
      name: "Bad Guy",
      email: "bad@example.com",
      bio: "Spammer",
      pictureUrl: "",
      createdAt: new Date().toISOString(),
      user: {
        id: "blocked-1",
        name: "Bad Guy",
        email: "bad@example.com",
        bio: "Spammer",
        pictureUrl: "",
        createdAt: new Date().toISOString(),
      },
    },
    {
      id: "blocked-2",
      userId: "blocked-2",
      blockedUserId: "blocked-2",
      name: "Troll User",
      email: "troll@example.com",
      bio: "Troll",
      pictureUrl: "",
      createdAt: new Date().toISOString(),
      user: {
        id: "blocked-2",
        name: "Troll User",
        email: "troll@example.com",
        bio: "Troll",
        pictureUrl: "",
        createdAt: new Date().toISOString(),
      },
    },
  ];

  const mockContacts = [
    {
      userId: "me",
      contactUserId: "contact-1",
      nickname: null,
      createdAt: new Date().toISOString(),
      contact: {
        id: "contact-1",
        name: "Friendly Contact",
        email: "friend@example.com",
        bio: "Hello",
        pictureUrl: "",
        createdAt: new Date().toISOString(),
      },
    },
    {
      userId: "me",
      contactUserId: "blocked-1",
      nickname: null,
      createdAt: new Date().toISOString(),
      contact: {
        id: "blocked-1",
        name: "Bad Guy",
        email: "bad@example.com",
        bio: "Spammer",
        pictureUrl: "",
        createdAt: new Date().toISOString(),
      },
    },
  ];

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
      leftDrawer: "PRIVACY",
      ldHistory: ["OPTIONS", "PRIVACY"],
      privacy: {
        lastTimeOnline: "all",
        picture: "all",
        bio: "all",
        groups: "all",
        readReceipt: true,
      },
    });

    fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("/api/v1/users/me/blocked")) {
        if (options?.method === "DELETE") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        if (options?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockBlockedUsers,
        });
      }

      if (url.includes("/api/v1/contacts")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockContacts,
        });
      }

      if (url.includes("/api/v1/users/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: { id: "me", name: "Me", email: "me@example.com" },
            settings: {
              privacyLastSeen: "all",
              privacyPicture: "all",
              privacyBio: "all",
              privacyGroups: "all",
              privacyReadReceipt: true,
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
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

  it("Privacy view displays real blocked contacts count instead of hardcoded 15", async () => {
    queryClient.setQueryData(chatKeys.blocked, mockBlockedUsers);

    renderWithProviders(<Privacy />);

    const countElem = await screen.findByTestId("blocked-contacts-count");
    expect(countElem.textContent).toBe("2");
  });

  it("clicking Contactos bloqueados navigates to BLOCKED_USERS in store", async () => {
    queryClient.setQueryData(chatKeys.blocked, mockBlockedUsers);

    renderWithProviders(<Privacy />);

    const entry = screen.getByTestId("blocked-contacts-entry");
    fireEvent.click(entry);

    expect(useStore.getState().leftDrawer).toBe("BLOCKED_USERS");
  });

  it("BlockedContacts sub-view lists blocked users with Unblock buttons", async () => {
    queryClient.setQueryData(chatKeys.blocked, mockBlockedUsers);
    queryClient.setQueryData(chatKeys.contacts, mockContacts);

    renderWithProviders(<BlockedContacts />);

    expect(await screen.findByText("Bad Guy")).toBeInTheDocument();
    expect(screen.getByText("Troll User")).toBeInTheDocument();

    const unblockButtons = screen.getAllByTestId("unblock-btn");
    expect(unblockButtons.length).toBe(2);

    // Click unblock on first user
    fireEvent.click(unblockButtons[0]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/blocked/blocked-1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("BlockedContacts allows blocking a contact from contact list", async () => {
    queryClient.setQueryData(chatKeys.blocked, [mockBlockedUsers[0]]);
    queryClient.setQueryData(chatKeys.contacts, mockContacts);

    renderWithProviders(<BlockedContacts />);

    // Click block contact trigger
    const addBlockBtn = screen.getByTestId("add-block-btn");
    fireEvent.click(addBlockBtn);

    // Should list unblocked contact: Friendly Contact
    const contactItem = await screen.findByText("Friendly Contact");
    fireEvent.click(contactItem);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/blocked/contact-1"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("BlockedContacts shows empty state when no users are blocked", async () => {
    queryClient.setQueryData(chatKeys.blocked, []);
    queryClient.setQueryData(chatKeys.contacts, mockContacts);

    renderWithProviders(<BlockedContacts />);

    expect(await screen.findByTestId("no-blocked-users")).toBeInTheDocument();
  });
});
