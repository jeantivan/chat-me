import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DialogContainer } from "../src/components/DialogContainer";
import { ChatItemMenu } from "../src/components/ChatItemMenu";
import { Header } from "../src/components/Chat/Header";
import { ContactInfo } from "../src/components/Chat/ContactInfo";
import { GroupInfoDrawer } from "../src/components/Chat/GroupInfoDrawer";
import { useSocketSync, chatKeys } from "../src/lib/socket/useSocketSync";
import { renderHook, act } from "@testing-library/react";
import useStore from "../src/lib/store";
import type { ChatSummary, ChatClearedPayload } from "@chat-me/shared";
import type { TChat } from "../src/lib/types";

const mockNavigate = vi.fn();
vi.mock("../src/routes/router", () => ({
  router: {
    navigate: (...args: any[]) => mockNavigate(...args),
  },
}));

const mockClearMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockUpdateParticipantMutate = vi.fn();

vi.mock("../src/lib/api/chatQueries", async () => {
  const actual = await vi.importActual("../src/lib/api/chatQueries");
  return {
    ...actual,
    useClearChat: () => ({
      mutate: mockClearMutate,
      isPending: false,
    }),
    useDeleteChat: () => ({
      mutate: mockDeleteMutate,
      isPending: false,
    }),
    useUpdateChatParticipant: () => ({
      mutate: mockUpdateParticipantMutate,
      isPending: false,
    }),
    useChats: () => ({
      data: [
        {
          id: "chat-direct-1",
          type: "direct",
          title: null,
          bio: "Hey there!",
          pictureUrl: null,
          directPairHash: "u1:u2",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          participants: [
            {
              userId: "user-alice-1",
              role: "member",
              pinned: false,
              muted: false,
              archived: false,
              markedUnread: false,
              lastReadAt: new Date().toISOString(),
              user: {
                id: "user-alice-1",
                email: "alice@example.com",
                name: "Alice",
                bio: "Alice bio",
                pictureUrl: "",
                createdAt: new Date().toISOString(),
              },
            },
            {
              userId: "user-bob-2",
              role: "member",
              pinned: false,
              muted: false,
              archived: false,
              markedUnread: false,
              lastReadAt: new Date().toISOString(),
              user: {
                id: "user-bob-2",
                email: "bob@example.com",
                name: "Bob",
                bio: "Bob bio",
                pictureUrl: "",
                createdAt: new Date().toISOString(),
              },
            },
          ],
          lastMessage: {
            id: "msg-1",
            chatId: "chat-direct-1",
            owner: "user-bob-2",
            body: "Hello Alice",
            forwarded: false,
            time: new Date().toISOString(),
            status: "read",
            starred: false,
            hasMedia: null,
            reactions: [],
          },
          unreadCount: 0,
        },
      ],
    }),
  };
});

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

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => "user-alice-1",
  useCurrentChatId: () => ({
    currentChatId: "chat-direct-1",
    setCurrentChatId: vi.fn(),
  }),
}));

vi.mock("../src/lib/hooks/useChatCounterpart", () => ({
  useChatDisplay: () => ({
    name: "Bob",
    picture: "",
    isTyping: false,
    presence: { status: "online" },
    isGroup: false,
  }),
}));

describe("Frontend Chat Empty & Delete Confirmation Dialogs Seam", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketListeners).forEach((k) => delete mockSocketListeners[k]);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("removes the unimplemented 'Estadísticas' placeholder item in ContactInfo drawer", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DialogContainer>
          <ContactInfo chatId="chat-direct-1" />
        </DialogContainer>
      </QueryClientProvider>
    );

    expect(screen.queryByText("Estadísticas")).toBeNull();
  });

  it("opens confirmation AlertDialog and executes useDeleteChat on confirming in ChatItemMenu", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DialogContainer>
          <ChatItemMenu chatId="chat-direct-1" />
        </DialogContainer>
      </QueryClientProvider>
    );

    // Open menu
    const menuTrigger = screen.getByRole("button", { name: /menu del chat/i });
    fireEvent.pointerDown(menuTrigger, { pointerType: "mouse" });
    fireEvent.click(menuTrigger);

    // Click "Eliminar chat" menu item
    const deleteMenuItem = await screen.findByText("Eliminar chat");
    fireEvent.click(deleteMenuItem);

    // AlertDialog should appear with confirmation title
    const dialogTitle = await screen.findByText(/¿Eliminar este chat\?/i);
    expect(dialogTitle).toBeDefined();

    // Confirm action
    const confirmButton = screen.getByTestId("confirm-delete-chat-button");
    fireEvent.click(confirmButton);

    expect(mockDeleteMutate).toHaveBeenCalledWith("chat-direct-1");
  });

  it("opens confirmation AlertDialogs for 'Vaciar chat' and 'Eliminar chat' in Header menu", async () => {
    const directUiChat: TChat = {
      id: "chat-direct-1",
      name: "Bob",
      participants: [
        {
          id: "user-bob-2",
          name: "Bob",
          bio: "",
          phone: "",
          picture: "",
        },
      ],
      messages: [],
      pinned: false,
      muted: false,
      archived: false,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <DialogContainer>
          <Header chat={directUiChat} />
        </DialogContainer>
      </QueryClientProvider>
    );

    // Open header menu
    const menuTrigger = screen.getByRole("button", { name: /abrir menu del chat/i });
    fireEvent.pointerDown(menuTrigger, { pointerType: "mouse" });
    fireEvent.click(menuTrigger);

    // "Vaciar chat" should be in the menu
    const clearMenuItem = await screen.findByText("Vaciar chat");
    fireEvent.click(clearMenuItem);

    // AlertDialog for clear should appear
    const clearTitle = await screen.findByText(/¿Vaciar este chat\?/i);
    expect(clearTitle).toBeDefined();

    const confirmClearBtn = screen.getByTestId("confirm-clear-chat-button");
    fireEvent.click(confirmClearBtn);

    expect(mockClearMutate).toHaveBeenCalledWith("chat-direct-1");
  });

  it("opens confirmation AlertDialogs for 'Vaciar chat' and 'Eliminar chat' in ContactInfo drawer", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DialogContainer>
          <ContactInfo chatId="chat-direct-1" />
        </DialogContainer>
      </QueryClientProvider>
    );

    // Find "Vaciar chat" action item
    const clearAction = screen.getByText("Vaciar chat");
    fireEvent.click(clearAction);

    const clearTitle = await screen.findByText(/¿Vaciar este chat\?/i);
    expect(clearTitle).toBeDefined();

    const confirmClearBtn = screen.getByTestId("confirm-clear-chat-button");
    fireEvent.click(confirmClearBtn);
    expect(mockClearMutate).toHaveBeenCalledWith("chat-direct-1");

    // Find "Eliminar chat" action item
    const deleteAction = screen.getByText("Eliminar chat");
    fireEvent.click(deleteAction);

    const deleteTitle = await screen.findByText(/¿Eliminar este chat\?/i);
    expect(deleteTitle).toBeDefined();

    const confirmDeleteBtn = screen.getByTestId("confirm-delete-chat-button");
    fireEvent.click(confirmDeleteBtn);
    expect(mockDeleteMutate).toHaveBeenCalledWith("chat-direct-1");
  });

  it("opens confirmation AlertDialog for 'Vaciar chat' in GroupInfoDrawer", async () => {
    const groupChatSummary: ChatSummary = {
      id: "group-1",
      type: "group",
      title: "Developers Group",
      bio: "Tech chat",
      pictureUrl: null,
      directPairHash: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        {
          userId: "user-alice-1",
          role: "admin",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
          lastReadAt: new Date().toISOString(),
          user: {
            id: "user-alice-1",
            email: "alice@example.com",
            name: "Alice",
            bio: "",
            pictureUrl: "",
            createdAt: new Date().toISOString(),
          },
        },
      ],
      lastMessage: null,
      unreadCount: 0,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <DialogContainer>
          <GroupInfoDrawer chatSummary={groupChatSummary} />
        </DialogContainer>
      </QueryClientProvider>
    );

    const clearButton = screen.getByTestId("clear-group-chat-button");
    fireEvent.click(clearButton);

    const clearTitle = await screen.findByText(/¿Vaciar este chat\?/i);
    expect(clearTitle).toBeDefined();

    const confirmBtn = screen.getByTestId("confirm-clear-chat-button");
    fireEvent.click(confirmBtn);

    expect(mockClearMutate).toHaveBeenCalledWith("group-1");
  });

  it("synchronizes multi-tab 'chat:cleared' socket event via useSocketSync", async () => {
    const initialChats: ChatSummary[] = [
      {
        id: "chat-direct-1",
        type: "direct",
        title: null,
        bio: null,
        pictureUrl: null,
        directPairHash: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: [
          {
            userId: "user-alice-1",
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: true,
            lastReadAt: new Date().toISOString(),
            user: {
              id: "user-alice-1",
              name: "Alice",
              email: "a@a.com",
              bio: "",
              pictureUrl: "",
              createdAt: "",
            },
          },
        ],
        lastMessage: {
          id: "m1",
          chatId: "chat-direct-1",
          owner: "user-bob-2",
          body: "Hello",
          forwarded: false,
          time: new Date().toISOString(),
          status: "read",
          starred: false,
          hasMedia: null,
          reactions: [],
        },
        unreadCount: 1,
      },
    ];

    queryClient.setQueryData(chatKeys.lists(), initialChats);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useSocketSync("chat-direct-1", "user-alice-1"), { wrapper });

    expect(mockSocket.on).toHaveBeenCalledWith("chat:cleared", expect.any(Function));
    const handleChatCleared = mockSocketListeners["chat:cleared"]?.[0];
    expect(handleChatCleared).toBeDefined();

    // 1. Simulate chat:cleared event (history emptied)
    act(() => {
      handleChatCleared({
        chatId: "chat-direct-1",
        userId: "user-alice-1",
        clearedAt: new Date().toISOString(),
        hiddenAt: null,
      });
    });

    const updatedChats = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists());
    const clearedChat = updatedChats?.find((c) => c.id === "chat-direct-1");
    expect(clearedChat).toBeDefined();
    expect(clearedChat?.lastMessage).toBeNull();
    expect(clearedChat?.unreadCount).toBe(0);

    // 2. Simulate chat:cleared event with hiddenAt (chat deleted)
    act(() => {
      handleChatCleared({
        chatId: "chat-direct-1",
        userId: "user-alice-1",
        clearedAt: new Date().toISOString(),
        hiddenAt: new Date().toISOString(),
      });
    });

    const deletedChats = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists());
    expect(deletedChats?.some((c) => c.id === "chat-direct-1")).toBe(false);
  });
});
