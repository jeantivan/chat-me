import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chat } from "../src/components/Chat";
import { ContactInfo } from "../src/components/Chat/ContactInfo";
import { chatKeys } from "../src/lib/socket/useSocketSync";
import type { ChatSummary, BlockedUserSummary } from "@chat-me/shared";

// Mock socket
const mockSocketListeners: Record<string, Function[]> = {};
const mockSocket = {
  on: vi.fn((event: string, cb: Function) => {
    mockSocketListeners[event] = mockSocketListeners[event] || [];
    mockSocketListeners[event].push(cb);
    return mockSocket;
  }),
  off: vi.fn((event: string, cb: Function) => {
    if (mockSocketListeners[event]) {
      mockSocketListeners[event] = mockSocketListeners[event].filter((fn) => fn !== cb);
    }
    return mockSocket;
  }),
  emit: vi.fn(),
};

vi.mock("../src/lib/socket/socketClient", () => ({
  getSocket: () => mockSocket,
}));

vi.mock("../src/routes/router", () => ({
  router: {
    navigate: vi.fn(),
  },
}));

vi.mock("../src/lib/auth/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "mock-jwt-token",
    user: { id: "user-alice-1", name: "Alice", email: "alice@example.com" },
    logout: vi.fn(),
  }),
}));

let currentActiveChatId = "chat-direct-1";

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => "user-alice-1",
  useCurrentChatId: () => ({
    currentChatId: currentActiveChatId,
    setCurrentChatId: vi.fn((id: string) => {
      currentActiveChatId = id;
    }),
  }),
  useChatActions: () => ({
    muteChat: vi.fn(),
    deleteChat: vi.fn(),
    closeChat: vi.fn(),
  }),
}));

describe("Direct Chat Block / Unblock Interaction & Composer Banner Seam", () => {
  let queryClient: QueryClient;
  let fetchMock: any;

  const mockDirectChat: ChatSummary = {
    id: "chat-direct-1",
    type: "direct",
    title: "Bob Smith",
    bio: "Hey there!",
    pictureUrl: "https://example.com/bob.png",
    directPairHash: "hash-123",
    createdAt: "2026-10-26T10:00:00.000Z",
    updatedAt: "2026-10-26T10:00:00.000Z",
    participants: [
      {
        userId: "user-alice-1",
        role: "member",
        pinned: false,
        muted: false,
        archived: false,
        lastReadAt: "2026-10-26T10:00:00.000Z",
        user: {
          id: "user-alice-1",
          email: "alice@example.com",
          name: "Alice",
          bio: "Alice bio",
          pictureUrl: "",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      },
      {
        userId: "user-bob-2",
        role: "member",
        pinned: false,
        muted: false,
        archived: false,
        lastReadAt: "2026-10-26T10:00:00.000Z",
        user: {
          id: "user-bob-2",
          email: "bob@example.com",
          name: "Bob Smith",
          bio: "Hey there!",
          pictureUrl: "https://example.com/bob.png",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      },
    ],
  };

  const mockGroupChat: ChatSummary = {
    id: "chat-group-1",
    type: "group",
    title: "Project Alpha",
    bio: "Alpha team discussion",
    pictureUrl: "",
    directPairHash: null,
    createdAt: "2026-10-26T10:00:00.000Z",
    updatedAt: "2026-10-26T10:00:00.000Z",
    participants: [
      {
        userId: "user-alice-1",
        role: "admin",
        pinned: false,
        muted: false,
        archived: false,
        lastReadAt: "2026-10-26T10:00:00.000Z",
        user: {
          id: "user-alice-1",
          email: "alice@example.com",
          name: "Alice",
          bio: "Alice bio",
          pictureUrl: "",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      },
      {
        userId: "user-bob-2",
        role: "member",
        pinned: false,
        muted: false,
        archived: false,
        lastReadAt: "2026-10-26T10:00:00.000Z",
        user: {
          id: "user-bob-2",
          email: "bob@example.com",
          name: "Bob Smith",
          bio: "Hey there!",
          pictureUrl: "https://example.com/bob.png",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      },
    ],
  };

  const mockBlockedBob: BlockedUserSummary = {
    id: "user-bob-2",
    name: "Bob Smith",
    email: "bob@example.com",
    bio: "Hey there!",
    pictureUrl: "https://example.com/bob.png",
    createdAt: "2026-10-26T10:00:00.000Z",
    user: {
      id: "user-bob-2",
      name: "Bob Smith",
      email: "bob@example.com",
      bio: "Hey there!",
      pictureUrl: "https://example.com/bob.png",
      createdAt: "2026-10-01T00:00:00.000Z",
    },
  };

  let currentBlockedList: BlockedUserSummary[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentActiveChatId = "chat-direct-1";
    currentBlockedList = [];

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(chatKeys.lists(), [mockDirectChat, mockGroupChat]);
    queryClient.setQueryData(chatKeys.messages("chat-direct-1"), {
      pages: [{ messages: [], nextCursor: null, hasMore: false }],
      pageParams: [null],
    });
    queryClient.setQueryData(chatKeys.messages("chat-group-1"), {
      pages: [{ messages: [], nextCursor: null, hasMore: false }],
      pageParams: [null],
    });

    fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("/api/v1/chats")) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockDirectChat, mockGroupChat],
        });
      }

      if (url.includes("/api/v1/users/me/blocked")) {
        if (options?.method === "DELETE") {
          const targetId = url.split("/").pop();
          currentBlockedList = currentBlockedList.filter((b) => b.id !== targetId);
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        if (options?.method === "POST") {
          const targetId = url.split("/").pop();
          if (targetId === "user-bob-2" && !currentBlockedList.some((b) => b.id === targetId)) {
            currentBlockedList = [...currentBlockedList, mockBlockedBob];
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => currentBlockedList,
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

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it("ContactInfo renders block action for unblocked counterpart and triggers block mutation on click", async () => {
    queryClient.setQueryData(chatKeys.blocked, []);

    renderWithProviders(<ContactInfo chatId="chat-direct-1" />);

    const blockAction = await screen.findByTestId("block-unblock-contact-action");
    expect(blockAction).toBeInTheDocument();
    expect(blockAction.textContent).toMatch(/Bloquear a Bob Smith|Block/i);

    fireEvent.click(blockAction);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/blocked/user-bob-2"),
        expect.objectContaining({ method: "POST" })
      );
    });

    // Immediate UI state update to unblock action
    await waitFor(() => {
      expect(screen.getByTestId("block-unblock-contact-action").textContent).toMatch(
        /Desbloquear a Bob Smith|Unblock/i
      );
    });
  });

  it("ContactInfo renders unblock action for blocked counterpart and triggers unblock mutation on click", async () => {
    currentBlockedList = [mockBlockedBob];
    queryClient.setQueryData(chatKeys.blocked, [mockBlockedBob]);

    renderWithProviders(<ContactInfo chatId="chat-direct-1" />);

    const blockAction = await screen.findByTestId("block-unblock-contact-action");
    expect(blockAction).toBeInTheDocument();
    expect(blockAction.textContent).toMatch(/Desbloquear a Bob Smith|Unblock/i);

    fireEvent.click(blockAction);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/blocked/user-bob-2"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    // Immediate UI state update to block action
    await waitFor(() => {
      expect(screen.getByTestId("block-unblock-contact-action").textContent).toMatch(
        /Bloquear a Bob Smith|Block/i
      );
    });
  });

  it("Chat replaces message composer with blocked banner when counterpart is blocked", async () => {
    currentBlockedList = [mockBlockedBob];
    queryClient.setQueryData(chatKeys.blocked, [mockBlockedBob]);

    renderWithProviders(<Chat chatId="chat-direct-1" />);

    // Message input composer should NOT be present
    expect(screen.queryByTestId("message-input")).not.toBeInTheDocument();

    // Blocked composer banner should be present with accessible banner text
    const banner = await screen.findByTestId("blocked-composer-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner.textContent).toContain("You blocked this contact. Click to unblock");

    const unblockBtn = screen.getByTestId("composer-unblock-btn");
    expect(unblockBtn).toBeInTheDocument();
    expect(unblockBtn.textContent).toContain("Click to unblock");
  });

  it("Unblocking from composer banner triggers unblock mutation and immediately restores message composer", async () => {
    currentBlockedList = [mockBlockedBob];
    queryClient.setQueryData(chatKeys.blocked, [mockBlockedBob]);

    renderWithProviders(<Chat chatId="chat-direct-1" />);

    const unblockBtn = await screen.findByTestId("composer-unblock-btn");
    fireEvent.click(unblockBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/blocked/user-bob-2"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    // Banner is removed and composer input is restored immediately
    await waitFor(() => {
      expect(screen.queryByTestId("blocked-composer-banner")).not.toBeInTheDocument();
      expect(screen.getByTestId("message-input")).toBeInTheDocument();
    });
  });

  it("Group Chat retains message composer even if a participant is in the blocked list", async () => {
    currentBlockedList = [mockBlockedBob];
    queryClient.setQueryData(chatKeys.blocked, [mockBlockedBob]);

    renderWithProviders(<Chat chatId="chat-group-1" />);

    expect(await screen.findByTestId("message-input")).toBeInTheDocument();
    expect(screen.queryByTestId("blocked-composer-banner")).not.toBeInTheDocument();
  });
});
