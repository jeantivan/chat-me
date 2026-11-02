import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSocketSync, chatKeys } from "../src/lib/socket/useSocketSync";
import { useUpdateChatParticipant } from "../src/lib/api/chatQueries";
import { useInAppAlertStore } from "../src/lib/notifications/notificationEngine";
import useStore from "../src/lib/store";
import type { ChatSummary, MessagePayload } from "@chat-me/shared";

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
  useUserId: () => "user-alice",
  useCurrentChatId: () => ({ currentChatId: null, setCurrentChatId: vi.fn() }),
}));

vi.mock("../src/lib/auth/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, token: "mock-token" }),
}));

vi.mock("../src/lib/auth/authClient", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer mock-token" }),
}));

describe("Frontend Socket Sync & Participant Actions Seam", () => {
  let queryClient: QueryClient;
  const currentUserId = "user-alice";
  const otherUserId = "user-bob";
  const archivedChatId = "chat-archived-1";
  const activeChatId = "chat-active-1";

  let mockAudioContextInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketListeners).forEach((k) => delete mockSocketListeners[k]);
    useInAppAlertStore.getState().clearAlerts();

    mockAudioContextInstance = {
      currentTime: 0,
      createOscillator: vi.fn(() => ({
        type: "sine",
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      destination: {},
    };
    (window as any).AudioContext = vi.fn(() => mockAudioContextInstance);

    useStore.setState({
      notifications: {
        all: true,
        sound: true,
        preview: true,
        reactions: true,
      },
    });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const initialChats: ChatSummary[] = [
      {
        id: activeChatId,
        type: "direct",
        title: "Active Chat",
        pictureUrl: null,
        directPairHash: null,
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        unreadCount: 0,
        participants: [
          {
            userId: currentUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-01T10:00:00.000Z",
            user: {
              id: currentUserId,
              name: "Alice",
              email: "alice@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: "2026-11-01T10:00:00.000Z",
            },
          },
          {
            userId: otherUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-01T10:00:00.000Z",
            user: {
              id: otherUserId,
              name: "Bob",
              email: "bob@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: "2026-11-01T10:00:00.000Z",
            },
          },
        ],
      },
      {
        id: archivedChatId,
        type: "direct",
        title: "Archived Chat",
        pictureUrl: null,
        directPairHash: null,
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        unreadCount: 0,
        participants: [
          {
            userId: currentUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: true, // Archived!
            markedUnread: false,
            lastReadAt: "2026-11-01T10:00:00.000Z",
            user: {
              id: currentUserId,
              name: "Alice",
              email: "alice@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: "2026-11-01T10:00:00.000Z",
            },
          },
          {
            userId: otherUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-01T10:00:00.000Z",
            user: {
              id: otherUserId,
              name: "Bob",
              email: "bob@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: "2026-11-01T10:00:00.000Z",
            },
          },
        ],
      },
    ];

    queryClient.setQueryData(chatKeys.lists(), initialChats);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("patches TanStack Query chat list cache on chat:participant_updated", () => {
    renderHook(() => useSocketSync(null, currentUserId), { wrapper });

    const handler = mockSocketListeners["chat:participant_updated"]?.[0];
    expect(handler).toBeDefined();

    act(() => {
      handler({
        chatId: activeChatId,
        userId: currentUserId,
        pinned: true,
        muted: true,
        archived: false,
        markedUnread: true,
        lastReadAt: "2026-11-02T12:00:00.000Z",
      });
    });

    const chats = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists())!;
    const updated = chats.find((c) => c.id === activeChatId)!;
    const participantA = updated.participants.find((p) => p.userId === currentUserId)!;

    expect(participantA.pinned).toBe(true);
    expect(participantA.muted).toBe(true);
    expect(participantA.markedUnread).toBe(true);
    expect(updated.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("keeps archived chats archived when message:new arrives and suppresses notifications", () => {
    renderHook(() => useSocketSync(null, currentUserId), { wrapper });

    const newMsgHandler = mockSocketListeners["message:new"]?.[0];
    expect(newMsgHandler).toBeDefined();

    const inboundMsg: MessagePayload = {
      id: "msg-archived-1",
      chatId: archivedChatId,
      owner: otherUserId,
      body: "Hello in archived chat",
      forwarded: false,
      time: "2026-11-02T12:05:00.000Z",
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      newMsgHandler(inboundMsg);
    });

    // 1. Chat remains archived in queryClient
    const chats = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists())!;
    const archivedChat = chats.find((c) => c.id === archivedChatId)!;
    const participantA = archivedChat.participants.find((p) => p.userId === currentUserId)!;
    expect(participantA.archived).toBe(true);

    // 2. Sound oscillator was NOT started (sound suppressed)
    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();

    // 3. No in-app alert was queued (in-app notification suppressed)
    expect(useInAppAlertStore.getState().alerts.length).toBe(0);
  });

  it("useUpdateChatParticipant performs optimistic update and sends PATCH request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...queryClient.getQueryData<ChatSummary[]>(chatKeys.lists())![0],
      }),
    } as any);

    const { result } = renderHook(() => useUpdateChatParticipant(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        chatId: activeChatId,
        pinned: true,
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/chats/${activeChatId}/participant`),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ pinned: true }),
      })
    );

    fetchSpy.mockRestore();
  });
});
