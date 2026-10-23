import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatItem } from "../src/components/ChatItem";
import { Header } from "../src/components/Chat/Header";
import { usePresenceStore } from "../src/lib/store/presenceStore";
import type { TChat } from "../src/lib/types";

vi.mock("../src/routes/router", () => ({
  router: {
    navigate: vi.fn(),
  },
}));

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => "current-user-1",
  useCurrentChatId: () => ({ currentChatId: "chat-1", setCurrentChatId: vi.fn() }),
  useChatActions: () => ({
    muteChat: vi.fn(),
    deleteChat: vi.fn(),
    closeChat: vi.fn(),
  }),
}));

const mockChatWithUnread: TChat = {
  id: "chat-1",
  participants: [
    {
      id: "user-bob-2",
      name: "Bob Builder",
      bio: "Can we fix it?",
      phone: "+123456789",
      picture: "https://example.com/bob.jpg",
    },
  ],
  pinned: false,
  muted: false,
  archived: false,
  hasUnreadMsg: 4,
  messages: [
    {
      id: "msg-101",
      chatId: "chat-1",
      owner: "user-bob-2",
      body: JSON.stringify({
        root: {
          children: [
            {
              children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "Hey there!", type: "text", version: 1 }],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      }),
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    },
  ],
};

describe("Frontend Chat Navigation, Unread Badges & Presence Seam", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    usePresenceStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders unread count badge in ChatItem when hasUnreadMsg > 0", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatItem chat={mockChatWithUnread} />
      </QueryClientProvider>
    );

    const badge = screen.getByTestId("unread-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("4");
  });

  it("does not render unread count badge when hasUnreadMsg is 0", () => {
    const chatZeroUnread: TChat = {
      ...mockChatWithUnread,
      id: "chat-zero",
      hasUnreadMsg: 0,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ChatItem chat={chatZeroUnread} />
      </QueryClientProvider>
    );

    expect(screen.queryByTestId("unread-badge")).toBeNull();
  });

  it("displays typing... in ChatItem and Header when active, clearing after 3 seconds of inactivity", () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ChatItem chat={mockChatWithUnread} />
        <Header chat={mockChatWithUnread} />
      </QueryClientProvider>
    );

    // Initially not typing
    expect(screen.queryByTestId("chat-typing-indicator")).toBeNull();
    expect(screen.queryByTestId("header-typing-indicator")).toBeNull();

    // Trigger typing event
    act(() => {
      usePresenceStore.getState().setTyping("chat-1", true);
    });

    expect(screen.getByTestId("chat-typing-indicator")).toBeDefined();
    expect(screen.getByTestId("chat-typing-indicator").textContent).toContain("typing...");
    expect(screen.getByTestId("header-typing-indicator")).toBeDefined();
    expect(screen.getByTestId("header-typing-indicator").textContent).toContain("typing...");

    // Advance timers by 2 seconds: still typing
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("chat-typing-indicator")).toBeDefined();

    // Advance timers by another 1.1 seconds (total > 3 seconds of inactivity): cleared!
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.queryByTestId("chat-typing-indicator")).toBeNull();
    expect(screen.queryByTestId("header-typing-indicator")).toBeNull();
  });

  it("reflects online and formatted last seen presence state in Header", () => {
    // 1. Online state
    act(() => {
      usePresenceStore.getState().setPresence("user-bob-2", { status: "online" });
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Header chat={mockChatWithUnread} />
      </QueryClientProvider>
    );

    const presenceEl = screen.getByTestId("presence-indicator");
    expect(presenceEl.textContent).toContain("online");

    // 2. Offline state with last seen
    const pastTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    act(() => {
      usePresenceStore.getState().setPresence("user-bob-2", {
        status: "offline",
        lastSeenAt: pastTime,
      });
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <Header chat={mockChatWithUnread} />
      </QueryClientProvider>
    );

    const offlineEl = screen.getByTestId("presence-indicator");
    expect(offlineEl.textContent).toContain("last seen");
  });
});
