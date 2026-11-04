import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatList } from "../src/components/ChatList";
import { ArchivedChats } from "../src/components/ArchivedChats";
import { ChatItemMenu } from "../src/components/ChatItemMenu";
import { Header } from "../src/components/Chat/Header";
import { ContactInfo } from "../src/components/Chat/ContactInfo";
import { GroupInfoDrawer } from "../src/components/Chat/GroupInfoDrawer";
import { chatKeys } from "../src/lib/socket/useSocketSync";
import useStore from "../src/lib/store";
import type { ChatSummary } from "@chat-me/shared";
import type { TChat } from "../src/lib/types";

const mockNavigate = vi.fn();
vi.mock("../src/routes/router", () => ({
  router: {
    navigate: (...args: any[]) => mockNavigate(...args),
  },
}));

const mockMutate = vi.fn();
vi.mock("../src/lib/api/chatQueries", async () => {
  const actual = await vi.importActual("../src/lib/api/chatQueries");
  return {
    ...actual,
    useUpdateChatParticipant: () => ({
      mutate: mockMutate,
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

let mockCurrentUserId = "user-alice-1";

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => mockCurrentUserId,
  useCurrentChatId: () => ({ currentChatId: "chat-1", setCurrentChatId: vi.fn() }),
}));

describe("Chat Actions & UI Seams (Pin, Mute, Archive, Mark Read/Unread)", () => {
  let queryClient: QueryClient;

  const mockChats: ChatSummary[] = [
    {
      id: "chat-older-pinned",
      type: "direct",
      title: "Older Pinned",
      bio: null,
      pictureUrl: null,
      directPairHash: null,
      createdAt: "2026-11-01T08:00:00.000Z",
      updatedAt: "2026-11-01T08:00:00.000Z",
      unreadCount: 0,
      participants: [
        {
          userId: "user-alice-1",
          role: "member",
          pinned: true,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T08:00:00.000Z",
          user: {
            id: "user-alice-1",
            name: "Alice",
            email: "alice@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
        {
          userId: "user-bob",
          role: "member",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T08:00:00.000Z",
          user: {
            id: "user-bob",
            name: "Older Pinned",
            email: "bob@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
      ],
      lastMessage: {
        id: "msg-1",
        chatId: "chat-older-pinned",
        owner: "user-bob",
        body: "Older pinned message",
        forwarded: false,
        time: "2026-11-01T08:00:00.000Z",
        status: "received",
        starred: false,
        hasMedia: null,
        reactions: [],
      },
    },
    {
      id: "chat-newer-pinned",
      type: "direct",
      title: "Newer Pinned",
      bio: null,
      pictureUrl: null,
      directPairHash: null,
      createdAt: "2026-11-01T09:00:00.000Z",
      updatedAt: "2026-11-01T09:00:00.000Z",
      unreadCount: 0,
      participants: [
        {
          userId: "user-alice-1",
          role: "member",
          pinned: true,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T09:00:00.000Z",
          user: {
            id: "user-alice-1",
            name: "Alice",
            email: "alice@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
        {
          userId: "user-charlie",
          role: "member",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T09:00:00.000Z",
          user: {
            id: "user-charlie",
            name: "Newer Pinned",
            email: "charlie@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
      ],
      lastMessage: {
        id: "msg-2",
        chatId: "chat-newer-pinned",
        owner: "user-charlie",
        body: "Newer pinned message",
        forwarded: false,
        time: "2026-11-01T09:00:00.000Z",
        status: "received",
        starred: false,
        hasMedia: null,
        reactions: [],
      },
    },
    {
      id: "chat-unpinned",
      type: "direct",
      title: "Unpinned Chat",
      bio: null,
      pictureUrl: null,
      directPairHash: null,
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-01T10:00:00.000Z",
      unreadCount: 0,
      participants: [
        {
          userId: "user-alice-1",
          role: "member",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T10:00:00.000Z",
          user: {
            id: "user-alice-1",
            name: "Alice",
            email: "alice@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
        {
          userId: "user-david",
          role: "member",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T10:00:00.000Z",
          user: {
            id: "user-david",
            name: "Unpinned Chat",
            email: "david@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
      ],
      lastMessage: {
        id: "msg-3",
        chatId: "chat-unpinned",
        owner: "user-david",
        body: "Unpinned message",
        forwarded: false,
        time: "2026-11-01T10:00:00.000Z",
        status: "received",
        starred: false,
        hasMedia: null,
        reactions: [],
      },
    },
    {
      id: "chat-archived",
      type: "direct",
      title: "Archived Chat",
      bio: null,
      pictureUrl: null,
      directPairHash: null,
      createdAt: "2026-11-01T11:00:00.000Z",
      updatedAt: "2026-11-01T11:00:00.000Z",
      unreadCount: 3,
      participants: [
        {
          userId: "user-alice-1",
          role: "member",
          pinned: false,
          muted: false,
          archived: true,
          markedUnread: false,
          lastReadAt: "2026-11-01T10:00:00.000Z",
          user: {
            id: "user-alice-1",
            name: "Alice",
            email: "alice@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
        {
          userId: "user-eve",
          role: "member",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T11:00:00.000Z",
          user: {
            id: "user-eve",
            name: "Archived Chat",
            email: "eve@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
      ],
      lastMessage: {
        id: "msg-4",
        chatId: "chat-archived",
        owner: "user-eve",
        body: "Archived message",
        forwarded: false,
        time: "2026-11-01T11:00:00.000Z",
        status: "received",
        starred: false,
        hasMedia: null,
        reactions: [],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(chatKeys.lists(), mockChats);
  });

  const renderWithClient = (ui: React.ReactElement) =>
    render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  it("renders an Archived banner button at the top of ChatList with unread count and opens drawer", () => {
    const leftDrawerGoToSpy = vi.spyOn(useStore.getState(), "leftDrawerGoTo");

    renderWithClient(<ChatList />);

    // 1. "Archived" button appears at the top
    const archivedBtn = screen.getByRole("button", { name: /archived/i });
    expect(archivedBtn).toBeDefined();

    // 2. Shows total unread messages across archived chats (3)
    expect(screen.getByText("3")).toBeDefined();

    // 3. Clicking opens ARCHIVED_CHATS left drawer
    fireEvent.click(archivedBtn);
    expect(leftDrawerGoToSpy).toHaveBeenCalledWith("ARCHIVED_CHATS");
  });

  it("orders pinned chats at the top by latest message timestamp descending", () => {
    renderWithClient(<ChatList />);

    const chatItems = screen.getAllByTestId(/chat-item-/);
    // Pinned chats appear first, ordered by latest message desc:
    // chat-newer-pinned (09:00) before chat-older-pinned (08:00), followed by chat-unpinned (10:00)
    expect(chatItems[0].getAttribute("data-testid")).toBe("chat-item-chat-newer-pinned");
    expect(chatItems[1].getAttribute("data-testid")).toBe("chat-item-chat-older-pinned");
    expect(chatItems[2].getAttribute("data-testid")).toBe("chat-item-chat-unpinned");
  });

  it("ArchivedChats renders archived chats from useChats", () => {
    renderWithClient(<ArchivedChats />);

    expect(screen.getByTestId("chat-item-chat-archived")).toBeDefined();
    expect(screen.queryByTestId("chat-item-chat-unpinned")).toBeNull();
  });

  it("ChatItemMenu invokes mutation for pinning, muting, archiving, and marking read/unread", async () => {
    renderWithClient(
      <ChatItemMenu
        chatId="chat-unpinned"
        isMuted={false}
        isPinned={false}
        isArchived={false}
        isUnread={false}
      />
    );

    const trigger = screen.getByRole("button", { name: /menu del chat/i });
    fireEvent.pointerDown(trigger, { pointerType: "mouse" });
    fireEvent.click(trigger);

    // Pin option
    const pinOption = screen.getByText(/fijar chat/i);
    fireEvent.click(pinOption);
    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      pinned: true,
    });

    // Mute option
    fireEvent.pointerDown(trigger, { pointerType: "mouse" });
    fireEvent.click(trigger);
    const muteOption = screen.getByText(/silenciar notificaciones/i);
    fireEvent.click(muteOption);
    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      muted: true,
    });

    // Archive option
    fireEvent.pointerDown(trigger, { pointerType: "mouse" });
    fireEvent.click(trigger);
    const archiveOption = screen.getByText(/archivar chat/i);
    fireEvent.click(archiveOption);
    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      archived: true,
    });

    // Mark as unread option
    fireEvent.pointerDown(trigger, { pointerType: "mouse" });
    fireEvent.click(trigger);
    const markUnreadOption = screen.getByText(/marcar como no leído/i);
    fireEvent.click(markUnreadOption);
    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      markedUnread: true,
    });
  });

  it("Header menu invokes mutation for muting", () => {
    const dummyChat: TChat = {
      id: "chat-unpinned",
      title: "Unpinned Chat",
      pinned: false,
      muted: false,
      archived: false,
      hasUnreadMsg: 0,
      participants: [
        { id: "user-david", name: "David", bio: "", phone: "", picture: "" },
      ],
      messages: [],
    };

    renderWithClient(<Header chat={dummyChat} />);

    const menuTrigger = screen.getByRole("button", { name: /abrir menu del chat/i });
    fireEvent.pointerDown(menuTrigger, { pointerType: "mouse" });
    fireEvent.click(menuTrigger);

    const muteOption = screen.getByText(/silenciar notificaciones/i);
    fireEvent.click(muteOption);

    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      muted: true,
    });
  });

  it("ContactInfo drawer invokes mutation for muting and archiving", () => {
    renderWithClient(<ContactInfo chatId="chat-unpinned" />);

    // Mute switch
    const muteSwitch = screen.getByRole("switch");
    fireEvent.click(muteSwitch);

    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      muted: true,
    });

    // Archive item
    const archiveItem = screen.getByText(/archivar chat/i);
    fireEvent.click(archiveItem);

    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "chat-unpinned",
      archived: true,
    });
  });

  it("GroupInfoDrawer invokes mutation for muting and archiving", () => {
    const groupSummary: ChatSummary = {
      id: "group-1",
      type: "group",
      title: "Developers",
      bio: "Tech chat",
      pictureUrl: null,
      directPairHash: null,
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
      unreadCount: 0,
      participants: [
        {
          userId: "user-alice-1",
          role: "member",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: "2026-11-01T00:00:00.000Z",
          user: {
            id: "user-alice-1",
            name: "Alice",
            email: "alice@example.com",
            bio: "",
            pictureUrl: "",
            createdAt: "2026-11-01T00:00:00.000Z",
          },
        },
      ],
      lastMessage: null,
    };

    renderWithClient(<GroupInfoDrawer chatSummary={groupSummary} />);

    // Mute switch in group drawer
    const muteSwitch = screen.getByRole("switch");
    fireEvent.click(muteSwitch);

    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "group-1",
      muted: true,
    });

    // Archive item in group drawer
    const archiveItem = screen.getByText(/archivar chat/i);
    fireEvent.click(archiveItem);

    expect(mockMutate).toHaveBeenCalledWith({
      chatId: "group-1",
      archived: true,
    });
  });
});
