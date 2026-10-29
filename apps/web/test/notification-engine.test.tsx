import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSocketSync, chatKeys } from "../src/lib/socket/useSocketSync";
import {
  useInAppAlertStore,
  playNotificationSound,
  isChatActivelyFocused,
} from "../src/lib/notifications/notificationEngine";
import { InAppNotificationBanner } from "../src/components/InAppNotificationBanner";
import useStore from "../src/lib/store";
import type {
  ChatSummary,
  InfiniteData,
  MessagePayload,
  MessagesPageResponse,
} from "@chat-me/shared";

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

describe("Active Client Notification Engine Seam", () => {
  let queryClient: QueryClient;
  const currentUserId = "user-alice";
  const otherUserId = "user-bob";
  const unmutedChatId = "chat-1";
  const mutedChatId = "chat-muted";

  // AudioContext mock
  let mockOscillator: any;
  let mockGain: any;
  let mockAudioContextInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketListeners).forEach((k) => delete mockSocketListeners[k]);
    useInAppAlertStore.getState().clearAlerts();

    mockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContextInstance = {
      currentTime: 0,
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
    };

    (window as any).AudioContext = vi.fn(() => mockAudioContextInstance);

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Populate initial chat list with unmuted and muted chats
    const initialChats: ChatSummary[] = [
      {
        id: unmutedChatId,
        type: "direct",
        title: "Bob",
        pictureUrl: null,
        directPairHash: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
        participants: [
          {
            userId: currentUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            lastReadAt: new Date().toISOString(),
            user: {
              id: currentUserId,
              name: "Alice",
              email: "alice@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: new Date().toISOString(),
            },
          },
          {
            userId: otherUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            lastReadAt: new Date().toISOString(),
            user: {
              id: otherUserId,
              name: "Bob",
              email: "bob@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: new Date().toISOString(),
            },
          },
        ],
      },
      {
        id: mutedChatId,
        type: "direct",
        title: "Muted Chat",
        pictureUrl: null,
        directPairHash: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
        participants: [
          {
            userId: currentUserId,
            role: "member",
            pinned: false,
            muted: true, // Muted!
            archived: false,
            lastReadAt: new Date().toISOString(),
            user: {
              id: currentUserId,
              name: "Alice",
              email: "alice@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: new Date().toISOString(),
            },
          },
          {
            userId: otherUserId,
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            lastReadAt: new Date().toISOString(),
            user: {
              id: otherUserId,
              name: "Bob",
              email: "bob@example.com",
              bio: "",
              pictureUrl: "",
              createdAt: new Date().toISOString(),
            },
          },
        ],
      },
    ];

    queryClient.setQueryData(chatKeys.lists(), initialChats);

    // Initial store notifications config
    useStore.setState({
      notifications: {
        all: true,
        sound: true,
        preview: true,
        reactions: true,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("plays Web Audio API chime and displays notification preview on inbound message:new when chat is unfocused", () => {
    // Current chat is null (user is in list view, not inside unmutedChatId)
    renderHook(() => useSocketSync(null, currentUserId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const inboundMsg: MessagePayload = {
      id: "msg-101",
      chatId: unmutedChatId,
      owner: otherUserId,
      body: "Hello Alice! Secret project details here.",
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      const handlers = mockSocketListeners["message:new"] || [];
      handlers.forEach((h) => h(inboundMsg));
    });

    // Web Audio chime played
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();

    // In-app alert created with message text preview
    const alerts = useInAppAlertStore.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toBe("New message");
    expect(alerts[0].body).toBe("Hello Alice! Secret project details here.");
  });

  it("redacts message preview to generic placeholder when notifyPreview is false", () => {
    useStore.setState({
      notifications: {
        all: true,
        sound: true,
        preview: false, // Redact preview!
        reactions: true,
      },
    });

    renderHook(() => useSocketSync(null, currentUserId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const inboundMsg: MessagePayload = {
      id: "msg-102",
      chatId: unmutedChatId,
      owner: otherUserId,
      body: "Confidential credentials",
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      const handlers = mockSocketListeners["message:new"] || [];
      handlers.forEach((h) => h(inboundMsg));
    });

    // Alert body must be redacted to generic "New message"
    const alerts = useInAppAlertStore.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].body).toBe("New message");
  });

  it("suppresses Web Audio API chime when notifySound is false", () => {
    useStore.setState({
      notifications: {
        all: true,
        sound: false, // Sound disabled
        preview: true,
        reactions: true,
      },
    });

    renderHook(() => useSocketSync(null, currentUserId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const inboundMsg: MessagePayload = {
      id: "msg-103",
      chatId: unmutedChatId,
      owner: otherUserId,
      body: "Quiet message",
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      const handlers = mockSocketListeners["message:new"] || [];
      handlers.forEach((h) => h(inboundMsg));
    });

    // No audio played
    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();

    // Alert still created
    const alerts = useInAppAlertStore.getState().alerts;
    expect(alerts).toHaveLength(1);
  });

  it("suppresses all notifications and audio when chat is muted or message is sent by current user", () => {
    renderHook(() => useSocketSync(null, currentUserId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // 1. Inbound message on muted chat
    const mutedMsg: MessagePayload = {
      id: "msg-muted",
      chatId: mutedChatId,
      owner: otherUserId,
      body: "Message in muted chat",
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      const handlers = mockSocketListeners["message:new"] || [];
      handlers.forEach((h) => h(mutedMsg));
    });

    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();
    expect(useInAppAlertStore.getState().alerts).toHaveLength(0);

    // 2. Message sent by current user
    const selfMsg: MessagePayload = {
      id: "msg-self",
      chatId: unmutedChatId,
      owner: currentUserId,
      body: "My own message",
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      const handlers = mockSocketListeners["message:new"] || [];
      handlers.forEach((h) => h(selfMsg));
    });

    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();
    expect(useInAppAlertStore.getState().alerts).toHaveLength(0);
  });

  it("suppresses all notifications and audio when notifyAll is false", () => {
    useStore.setState({
      notifications: {
        all: false,
        sound: true,
        preview: true,
        reactions: true,
      },
    });

    renderHook(() => useSocketSync(null, currentUserId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const inboundMsg: MessagePayload = {
      id: "msg-104",
      chatId: unmutedChatId,
      owner: otherUserId,
      body: "Should not notify",
      forwarded: false,
      time: new Date().toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    act(() => {
      const handlers = mockSocketListeners["message:new"] || [];
      handlers.forEach((h) => h(inboundMsg));
    });

    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();
    expect(useInAppAlertStore.getState().alerts).toHaveLength(0);
  });

  it("handles inbound reaction on current user's message and respects notifyReactions", () => {
    // Populate messages cache with Alice's message
    const aliceMsg: MessagePayload = {
      id: "alice-msg-1",
      chatId: unmutedChatId,
      owner: currentUserId, // Alice's message
      body: "My awesome photo",
      forwarded: false,
      time: new Date().toISOString(),
      status: "received",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
      chatKeys.messages(unmutedChatId),
      {
        pages: [
          {
            messages: [aliceMsg],
            nextCursor: null,
          },
        ],
        pageParams: [null],
      }
    );

    renderHook(() => useSocketSync(null, currentUserId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // 1. Inbound reaction from Bob on Alice's message
    act(() => {
      const handlers = mockSocketListeners["message:reaction_updated"] || [];
      handlers.forEach((h) =>
        h({
          messageId: "alice-msg-1",
          chatId: unmutedChatId,
          reactions: [{ owner: otherUserId, type: ":thumbs-up:" }],
        })
      );
    });

    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
    const alerts = useInAppAlertStore.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toBe("New reaction");

    // 2. When notifyReactions is false, reaction notifications are suppressed
    useInAppAlertStore.getState().clearAlerts();
    mockAudioContextInstance.createOscillator.mockClear();

    useStore.setState({
      notifications: {
        all: true,
        sound: true,
        preview: true,
        reactions: false, // Disabled
      },
    });

    act(() => {
      const handlers = mockSocketListeners["message:reaction_updated"] || [];
      handlers.forEach((h) =>
        h({
          messageId: "alice-msg-1",
          chatId: unmutedChatId,
          reactions: [
            { owner: otherUserId, type: ":thumbs-up:" },
            { owner: otherUserId, type: ":heart:" },
          ],
        })
      );
    });

    expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();
    expect(useInAppAlertStore.getState().alerts).toHaveLength(0);
  });
});
