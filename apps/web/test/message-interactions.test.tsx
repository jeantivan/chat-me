import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Messages } from "../src/components/Chat/Messages";
import { StarredMessages } from "../src/components/Chat/StarredMessages";
import { ForwardMessages } from "../src/components/ForwardMessages";
import { useSocketSync, chatKeys } from "../src/lib/socket/useSocketSync";
import useStore from "../src/lib/store";
import type { MessagePayload, MessagesPageResponse } from "@chat-me/shared";
import type { TMessage } from "../src/lib/types";

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

vi.mock("../src/lib/auth/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "mock-jwt-token",
    user: { id: "user-alice-1", name: "Alice", email: "alice@example.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => "user-alice-1",
  useCurrentChatId: () => ({ currentChatId: "chat-123", setCurrentChatId: vi.fn() }),
  useChatActions: () => ({
    muteChat: vi.fn(),
    deleteChat: vi.fn(),
    closeChat: vi.fn(),
  }),
}));

function SocketSyncWrapper({ children }: { children: React.ReactNode }) {
  useSocketSync("chat-123", "user-alice-1");
  return <>{children}</>;
}

describe("Frontend Message Reactions, Starred Messages, Deletion & Forwarding Seam", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    for (const key of Object.keys(mockSocketListeners)) {
      delete mockSocketListeners[key];
    }
    useStore.setState({
      user: {
        id: "user-alice-1",
        name: "Alice",
        bio: "",
        phone: "",
        picture: "",
      },
    });
  });

  it("patches reaction updates and tombstone deletions in TanStack Query cache and renders tombstone state", async () => {
    const msgId = "msg-react-del-1";
    const initialPage: MessagesPageResponse = {
      messages: [
        {
          id: msgId,
          chatId: "chat-123",
          owner: "user-alice-1",
          body: "Original interactive text",
          forwarded: false,
          time: new Date().toISOString(),
          status: "read",
          starred: false,
          hasMedia: {
            id: "media-1",
            type: "image",
            src: "https://example.com/pic.jpg",
            orientation: "square",
            duration: null,
          },
          reactions: [],
        },
      ],
      nextCursor: null,
      hasMore: false,
    };

    queryClient.setQueryData(chatKeys.messages("chat-123"), {
      pages: [initialPage],
      pageParams: [null],
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <SocketSyncWrapper>
          <Messages messages={initialPage.messages as unknown as TMessage[]} />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );

    expect(screen.getByText("Original interactive text")).toBeInTheDocument();

    // 1. Trigger message:reaction_updated via socket
    act(() => {
      const handlers = mockSocketListeners["message:reaction_updated"] || [];
      for (const h of handlers) {
        h({
          messageId: msgId,
          chatId: "chat-123",
          reactions: [{ owner: "user-bob-2", type: ":sparkling_heart:" }],
        });
      }
    });

    const afterReactionData = queryClient.getQueryData<{ pages: MessagesPageResponse[] }>(
      chatKeys.messages("chat-123")
    );
    expect(afterReactionData).toBeDefined();
    expect(afterReactionData!.pages[0].messages[0].reactions).toEqual([
      { owner: "user-bob-2", type: ":sparkling_heart:" },
    ]);

    rerender(
      <QueryClientProvider client={queryClient}>
        <SocketSyncWrapper>
          <Messages
            messages={afterReactionData!.pages[0].messages as unknown as TMessage[]}
          />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );

    expect(screen.getByAltText("💖")).toBeInTheDocument();

    // 2. Trigger message:deleted via socket
    act(() => {
      const handlers = mockSocketListeners["message:deleted"] || [];
      for (const h of handlers) {
        h({
          messageId: msgId,
          chatId: "chat-123",
        });
      }
    });

    const afterDeleteData = queryClient.getQueryData<{ pages: MessagesPageResponse[] }>(
      chatKeys.messages("chat-123")
    );
    expect(afterDeleteData!.pages[0].messages[0].body).toBe("This message was deleted");
    expect(afterDeleteData!.pages[0].messages[0].hasMedia).toBeNull();

    rerender(
      <QueryClientProvider client={queryClient}>
        <SocketSyncWrapper>
          <Messages
            messages={afterDeleteData!.pages[0].messages as unknown as TMessage[]}
          />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );

    expect(screen.getByText("This message was deleted")).toBeInTheDocument();
    expect(screen.getByTestId("tombstone-message")).toBeInTheDocument();
  });

  it("renders starred messages inside the StarredMessages drawer panel", async () => {
    const starredItems: MessagePayload[] = [
      {
        id: "star-msg-1",
        chatId: "chat-123",
        owner: "user-bob-2",
        body: "Bookmarked architecture decision",
        forwarded: false,
        time: "2026-10-26T15:00:00.000Z",
        status: "read",
        starred: true,
        hasMedia: null,
        reactions: [],
      },
    ];

    queryClient.setQueryData(chatKeys.starred("chat-123"), starredItems);

    render(
      <QueryClientProvider client={queryClient}>
        <StarredMessages />
      </QueryClientProvider>
    );

    expect(screen.getByText("Mensajes destacados")).toBeInTheDocument();
    expect(screen.getByText("Bookmarked architecture decision")).toBeInTheDocument();
  });

  it("forwards a selected message to a contact or group chat via REST endpoint", async () => {
    queryClient.setQueryData(chatKeys.contacts, [
      {
        userId: "user-alice-1",
        contactUserId: "user-bob-2",
        nickname: "Bob Builder",
        createdAt: "2026-10-26T00:00:00.000Z",
        contact: {
          id: "user-bob-2",
          email: "bob@example.com",
          name: "Bob Builder",
          bio: "Builder",
          pictureUrl: "https://example.com/bob.png",
          createdAt: "2026-10-26T00:00:00.000Z",
        },
      },
    ]);

    queryClient.setQueryData(chatKeys.lists(), [
      {
        id: "group-chat-99",
        type: "group",
        title: "Core Platform Team",
        pictureUrl: null,
        directPairHash: null,
        createdAt: "2026-10-26T00:00:00.000Z",
        updatedAt: "2026-10-26T00:00:00.000Z",
        participants: [],
      },
    ]);

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    } as any);

    const msgToForward: TMessage = {
      id: "msg-fwd-1",
      chatId: "chat-123",
      owner: "user-alice-1",
      body: "Forward this update",
      forwarded: false,
      time: new Date().toISOString(),
      status: "read",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    const openChange = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ForwardMessages
          messages={[msgToForward]}
          open={true}
          openChange={openChange}
        />
      </QueryClientProvider>
    );

    // Select Bob Builder and Core Platform Team
    const bobCheckbox = screen.getByTestId("checkbox-contact-user-bob-2");
    fireEvent.click(bobCheckbox);

    const groupCheckbox = screen.getByTestId("checkbox-contact-group-chat-99");
    fireEvent.click(groupCheckbox);

    const sendBtn = screen.getByRole("button", { name: /Enviar mensajes/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/chats/forward"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    const forwardCall = fetchSpy.mock.calls.find((c) =>
      String(c[0]).includes("/api/v1/chats/forward")
    );
    expect(forwardCall).toBeDefined();
    const reqBody = JSON.parse(forwardCall![1]?.body as string);
    expect(reqBody.messageIds).toEqual(["msg-fwd-1"]);
    expect(reqBody.targetUserIds).toContain("user-bob-2");
    expect(reqBody.targetChatIds).toContain("group-chat-99");

    fetchSpy.mockRestore();
  });
});
