import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchChats } from "../src/components/SearchChats";
import { ChatList } from "../src/components/ChatList";
import { Header } from "../src/components/Chat/Header";
import { Chat } from "../src/components/Chat";
import { chatKeys } from "../src/lib/socket/useSocketSync";
import useStore from "../src/lib/store";
import type { ChatSummary, MessagesPageResponse } from "@chat-me/shared";
import type { TChat } from "../src/lib/types";

const mockNavigate = vi.fn();
vi.mock("../src/routes/router", () => ({
  router: {
    navigate: (...args: any[]) => mockNavigate(...args),
  },
}));

let mockCurrentUserId = "user-alice";

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => mockCurrentUserId,
  useCurrentChatId: () => ({ currentChatId: "chat-active", setCurrentChatId: vi.fn() }),
}));

vi.mock("../src/lib/api/chatQueries", async () => {
  const actual = await vi.importActual("../src/lib/api/chatQueries");
  return {
    ...actual,
    useChats: () => ({
      data: mockChatsData,
      isLoading: false,
    }),
    useChatMessages: (chatId: string) => ({
      data: {
        pages: [
          {
            messages: [
              {
                id: "msg-1",
                chatId,
                owner: "user-bob",
                body: "Hello Alice, remember the quarterly roadmap?",
                forwarded: false,
                time: "2026-11-03T10:00:00Z",
                status: "read",
                starred: false,
                deleted: false,
                hasMedia: null,
                reactions: [],
              },
              {
                id: "msg-2",
                chatId,
                owner: "user-alice",
                body: "Yes, I will prepare the presentation slides.",
                forwarded: false,
                time: "2026-11-03T10:05:00Z",
                status: "read",
                starred: false,
                deleted: false,
                hasMedia: null,
                reactions: [],
              },
              {
                id: "msg-3",
                chatId,
                owner: "user-bob",
                body: "Sounds great, see you at lunch!",
                forwarded: false,
                time: "2026-11-03T10:10:00Z",
                status: "read",
                starred: false,
                deleted: false,
                hasMedia: null,
                reactions: [],
              },
            ],
            nextCursor: null,
            hasMore: false,
          },
        ],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    }),
    useBlockedUsers: () => ({ data: [] }),
    useUnblockUser: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateChatParticipant: () => ({ mutate: vi.fn(), isPending: false }),
    useClearChat: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteChat: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

let mockChatsData: ChatSummary[] = [];

describe("Sidebar Chat Filter & In-Chat Search Seams", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useStore.setState({
      chatSearchFilter: "",
      inChatSearchQuery: "",
      isInChatSearchOpen: false,
    } as any);

    mockChatsData = [
      {
        id: "chat-pinned-1",
        type: "direct",
        title: "Project Alpha",
        bio: null,
        pictureUrl: null,
        directPairHash: null,
        unreadCount: 0,
        createdAt: "2026-11-01T10:00:00Z",
        updatedAt: "2026-11-01T10:00:00Z",
        participants: [
          {
            userId: "user-alice",
            role: "member",
            pinned: true,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-01T10:00:00Z",
            clearedAt: null,
            hiddenAt: null,
          },
          {
            userId: "user-bob",
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-01T10:00:00Z",
            clearedAt: null,
            hiddenAt: null,
            user: {
              id: "user-bob",
              name: "Bob Builder",
              bio: "Can we fix it?",
              pictureUrl: null,
            },
          },
        ],
        lastMessage: {
          id: "m-1",
          chatId: "chat-pinned-1",
          owner: "user-bob",
          body: "Budget review meeting",
          forwarded: false,
          time: "2026-11-03T09:00:00Z",
          status: "read",
          starred: false,
          deleted: false,
          hasMedia: null,
          reactions: [],
        },
      },
      {
        id: "chat-unpinned-2",
        type: "group",
        title: "Design System Squad",
        bio: null,
        pictureUrl: null,
        directPairHash: null,
        unreadCount: 0,
        createdAt: "2026-11-02T10:00:00Z",
        updatedAt: "2026-11-02T10:00:00Z",
        participants: [
          {
            userId: "user-alice",
            role: "admin",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-02T10:00:00Z",
            clearedAt: null,
            hiddenAt: null,
          },
          {
            userId: "user-charlie",
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-02T10:00:00Z",
            clearedAt: null,
            hiddenAt: null,
            user: {
              id: "user-charlie",
              name: "Charlie Chaplin",
              bio: "Silent humor",
              pictureUrl: null,
            },
          },
        ],
        lastMessage: {
          id: "m-2",
          chatId: "chat-unpinned-2",
          owner: "user-charlie",
          body: "Token colors updated",
          forwarded: false,
          time: "2026-11-03T08:00:00Z",
          status: "read",
          starred: false,
          deleted: false,
          hasMedia: null,
          reactions: [],
        },
      },
      {
        id: "chat-unpinned-3",
        type: "direct",
        title: "Personal Notes",
        bio: null,
        pictureUrl: null,
        directPairHash: null,
        unreadCount: 0,
        createdAt: "2026-11-02T12:00:00Z",
        updatedAt: "2026-11-02T12:00:00Z",
        participants: [
          {
            userId: "user-alice",
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-02T12:00:00Z",
            clearedAt: null,
            hiddenAt: null,
          },
          {
            userId: "user-dana",
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
            lastReadAt: "2026-11-02T12:00:00Z",
            clearedAt: null,
            hiddenAt: null,
            user: {
              id: "user-dana",
              name: "Dana Scully",
              bio: "The truth is out there",
              pictureUrl: null,
            },
          },
        ],
        lastMessage: {
          id: "m-3",
          chatId: "chat-unpinned-3",
          owner: "user-dana",
          body: "Remember the meeting notes",
          forwarded: false,
          time: "2026-11-03T07:00:00Z",
          status: "read",
          starred: false,
          deleted: false,
          hasMedia: null,
          reactions: [],
        },
      },
    ];
  });

  it("SearchChats updates transient search filter state in Zustand and includes a clear button when query is non-empty", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchChats />
      </QueryClientProvider>
    );

    const input = screen.getByRole("textbox");
    expect(screen.queryByTestId("clear-chat-search")).toBeNull();

    // Type search query
    fireEvent.change(input, { target: { value: "Design" } });
    expect(input).toHaveValue("Design");
    expect((useStore.getState() as any).chatSearchFilter).toBe("Design");

    // Clear button should be visible
    const clearBtn = screen.getByTestId("clear-chat-search");
    expect(clearBtn).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearBtn);
    expect(input).toHaveValue("");
    expect((useStore.getState() as any).chatSearchFilter).toBe("");
    expect(screen.queryByTestId("clear-chat-search")).toBeNull();
  });

  it("ChatList filters displayed chats case-insensitively by title, participant name, or last message body while preserving pinned-first ordering", () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );

    // Initial state: all 3 chats rendered
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("Design System Squad")).toBeInTheDocument();
    expect(screen.getByText("Dana Scully")).toBeInTheDocument();

    // 1. Filter by participant name: "scully"
    act(() => {
      useStore.setState({ chatSearchFilter: "scully" } as any);
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );
    expect(screen.getByText("Dana Scully")).toBeInTheDocument();
    expect(screen.queryByText("Bob Builder")).toBeNull();
    expect(screen.queryByText("Design System Squad")).toBeNull();

    // 2. Filter by chat title: "squad"
    act(() => {
      useStore.setState({ chatSearchFilter: "squad" } as any);
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );
    expect(screen.getByText("Design System Squad")).toBeInTheDocument();
    expect(screen.queryByText("Bob Builder")).toBeNull();
    expect(screen.queryByText("Dana Scully")).toBeNull();

    // 3. Filter by last message body: "budget"
    act(() => {
      useStore.setState({ chatSearchFilter: "budget" } as any);
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.queryByText("Design System Squad")).toBeNull();
    expect(screen.queryByText("Dana Scully")).toBeNull();

    // 4. Preserves pinned-first ordering when multiple match "meeting"
    // (chat-pinned-1 has "Budget review meeting", chat-unpinned-3 has "Remember the meeting notes")
    act(() => {
      useStore.setState({ chatSearchFilter: "meeting" } as any);
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );
    const chatItems = screen.getAllByRole("button");
    // Find matching chat names in rendered order
    const renderedNames = screen
      .getAllByText(/Bob Builder|Dana Scully/)
      .map((el) => el.textContent);
    expect(renderedNames[0]).toBe("Bob Builder");
    expect(renderedNames[1]).toBe("Dana Scully");

    // 5. Searching user's own name does not match direct chats where counterpart is someone else
    act(() => {
      useStore.setState({ chatSearchFilter: "Alice" } as any);
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );
    expect(screen.queryByText("Bob Builder")).toBeNull();
    expect(screen.queryByText("Dana Scully")).toBeNull();
    expect(screen.queryByText("Design System Squad")).toBeNull();

    // 6. Searching raw internal Lexical JSON properties (e.g. "paragraph") produces no false matches
    act(() => {
      useStore.setState({ chatSearchFilter: "paragraph" } as any);
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatList />
      </QueryClientProvider>
    );
    expect(screen.queryByText("Bob Builder")).toBeNull();
    expect(screen.queryByText("Dana Scully")).toBeNull();
  });

  it("Header toggles inline search input bar, typing filters messages, and closing search restores full timeline", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Chat chatId="chat-active" />
      </QueryClientProvider>
    );

    // Initial timeline contains all 3 messages
    expect(screen.getByText(/quarterly roadmap/)).toBeInTheDocument();
    expect(screen.getByText(/presentation slides/)).toBeInTheDocument();
    expect(screen.getByText(/see you at lunch/)).toBeInTheDocument();

    // Search bar is initially hidden
    expect(screen.queryByTestId("in-chat-search-bar")).toBeNull();

    // Toggle search bar via header search icon button
    const searchToggleBtn = screen.getByTestId("toggle-in-chat-search");
    fireEvent.click(searchToggleBtn);

    // Search bar is now visible
    const searchBar = screen.getByTestId("in-chat-search-bar");
    expect(searchBar).toBeInTheDocument();
    const searchInput = screen.getByTestId("in-chat-search-input");

    // Type query "roadmap" to filter messages
    fireEvent.change(searchInput, { target: { value: "roadmap" } });
    expect(screen.getByText(/quarterly/)).toBeInTheDocument();
    expect(screen.getByTestId("search-highlight")).toHaveTextContent("roadmap");
    expect(screen.queryByText(/presentation slides/)).toBeNull();
    expect(screen.queryByText(/see you at lunch/)).toBeNull();

    // Clear search query via clear button
    const clearInChatBtn = screen.getByTestId("clear-in-chat-search");
    fireEvent.click(clearInChatBtn);
    expect(searchInput).toHaveValue("");
    expect(screen.getByText(/presentation slides/)).toBeInTheDocument();

    // Type again and close search bar
    fireEvent.change(searchInput, { target: { value: "roadmap" } });
    const closeBtn = screen.getByTestId("close-in-chat-search");
    fireEvent.click(closeBtn);

    // Full timeline is restored
    expect(screen.queryByTestId("in-chat-search-bar")).toBeNull();
    expect(screen.getByText(/quarterly roadmap/)).toBeInTheDocument();
    expect(screen.getByText(/presentation slides/)).toBeInTheDocument();
    expect(screen.getByText(/see you at lunch/)).toBeInTheDocument();
  });
});
