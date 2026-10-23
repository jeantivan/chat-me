import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Messages } from "../src/components/Chat/Messages";
import { useSocketSync, chatKeys } from "../src/lib/socket/useSocketSync";
import type { MessagePayload, MessagesPageResponse } from "@chat-me/shared";

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
  useCurrentChatId: () => ({ currentChatId: "chat-123", setCurrentChatId: vi.fn() }),
}));

function SocketSyncWrapper({ children }: { children: React.ReactNode }) {
  useSocketSync("chat-123");
  return <>{children}</>;
}

describe("Frontend Real-Time Data & Timeline Seam", () => {
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
  });

  it("updates message status progressively from idle -> send -> received -> read in cache and UI", async () => {
    const testMsgId = "msg-001";
    const initialPage: MessagesPageResponse = {
      messages: [
        {
          id: testMsgId,
          chatId: "chat-123",
          owner: "user-alice-1",
          body: "Hello Bob!",
          forwarded: false,
          time: new Date().toISOString(),
          status: "idle",
          starred: false,
          hasMedia: null,
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
          <Messages messages={initialPage.messages} />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );

    // 1. Initial status: idle (Enviando mensaje)
    expect(screen.getByText(/Enviando mensaje/i)).toBeDefined();

    // 2. Transition to "send" upon server ACK
    act(() => {
      queryClient.setQueryData(
        chatKeys.messages("chat-123"),
        (oldData: { pages: MessagesPageResponse[] } | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) =>
                m.id === testMsgId ? { ...m, status: "send" as const } : m
              ),
            })),
          };
        }
      );
    });

    const updatedDataSend = queryClient.getQueryData<{ pages: MessagesPageResponse[] }>(
      chatKeys.messages("chat-123")
    );
    rerender(
      <QueryClientProvider client={queryClient}>
        <SocketSyncWrapper>
          <Messages messages={updatedDataSend!.pages[0].messages} />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Mensaje enviado/i)).toBeDefined();

    // 3. Socket event "message:status_changed" with received
    act(() => {
      const handlers = mockSocketListeners["message:status_changed"] || [];
      for (const handler of handlers) {
        handler({
          messageId: testMsgId,
          chatId: "chat-123",
          status: "received",
          userId: "user-bob-2",
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const updatedDataReceived = queryClient.getQueryData<{ pages: MessagesPageResponse[] }>(
      chatKeys.messages("chat-123")
    );
    expect(updatedDataReceived!.pages[0].messages[0].status).toBe("received");

    rerender(
      <QueryClientProvider client={queryClient}>
        <SocketSyncWrapper>
          <Messages messages={updatedDataReceived!.pages[0].messages} />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Mensaje recibido/i)).toBeDefined();

    // 4. Socket event "message:status_changed" with read
    act(() => {
      const handlers = mockSocketListeners["message:status_changed"] || [];
      for (const handler of handlers) {
        handler({
          messageId: testMsgId,
          chatId: "chat-123",
          status: "read",
          userId: "user-bob-2",
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const updatedDataRead = queryClient.getQueryData<{ pages: MessagesPageResponse[] }>(
      chatKeys.messages("chat-123")
    );
    expect(updatedDataRead!.pages[0].messages[0].status).toBe("read");

    rerender(
      <QueryClientProvider client={queryClient}>
        <SocketSyncWrapper>
          <Messages messages={updatedDataRead!.pages[0].messages} />
        </SocketSyncWrapper>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Mensaje leído/i)).toBeDefined();
  });
});
