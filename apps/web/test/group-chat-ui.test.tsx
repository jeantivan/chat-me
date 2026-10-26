import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toUiChat } from "../src/lib/utils/chatAdapter";
import { Header } from "../src/components/Chat/Header";
import { ContactInfo } from "../src/components/Chat/ContactInfo";
import { NewGroup } from "../src/components/NewGroup";
import { Messages } from "../src/components/Chat/Messages";
import type { ChatSummary, TMessage } from "@chat-me/shared";

vi.mock("../src/routes/router", () => ({
  router: {
    navigate: vi.fn(),
  },
}));

let mockCurrentUserId = "user-alice-1";

vi.mock("../src/lib/hooks", () => ({
  useUserId: () => mockCurrentUserId,
  useCurrentChatId: () => ({ currentChatId: "group-chat-1", setCurrentChatId: vi.fn() }),
  useChatActions: () => ({
    muteChat: vi.fn(),
    deleteChat: vi.fn(),
    closeChat: vi.fn(),
  }),
}));

const mockGroupSummary: ChatSummary = {
  id: "group-chat-1",
  type: "group",
  title: "Frontend Guild",
  bio: "Frontend engineers guild",
  pictureUrl: "https://example.com/guild.png",
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
        name: "Alice Admin",
        bio: "Guild lead",
        pictureUrl: "https://example.com/alice.png",
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
        name: "Bob Dev",
        bio: "TypeScript enthusiast",
        pictureUrl: "https://example.com/bob.png",
        createdAt: "2026-10-02T00:00:00.000Z",
      },
    },
    {
      userId: "user-charlie-3",
      role: "member",
      pinned: false,
      muted: false,
      archived: false,
      lastReadAt: "2026-10-26T10:00:00.000Z",
      user: {
        id: "user-charlie-3",
        email: "charlie@example.com",
        name: "Charlie Designer",
        bio: "UI & UX",
        pictureUrl: "https://example.com/charlie.png",
        createdAt: "2026-10-03T00:00:00.000Z",
      },
    },
  ],
  lastMessage: {
    id: "msg-1",
    chatId: "group-chat-1",
    owner: "user-alice-1",
    body: "Welcome to Frontend Guild!",
    forwarded: false,
    time: "2026-10-26T10:05:00.000Z",
    status: "received",
    starred: false,
    hasMedia: null,
    reactions: [],
  },
  unreadCount: 0,
};

vi.mock("../src/lib/api/chatQueries", () => ({
  useChats: () => ({
    data: [mockGroupSummary],
  }),
  useContacts: () => ({
    data: [
      {
        userId: "user-alice-1",
        contactUserId: "user-bob-2",
        nickname: "Bob Dev",
        createdAt: "2026-10-01T00:00:00.000Z",
        contact: {
          id: "user-bob-2",
          email: "bob@example.com",
          name: "Bob Dev",
          bio: "TypeScript enthusiast",
          pictureUrl: "https://example.com/bob.png",
          createdAt: "2026-10-02T00:00:00.000Z",
        },
      },
      {
        userId: "user-alice-1",
        contactUserId: "user-charlie-3",
        nickname: "Charlie Designer",
        createdAt: "2026-10-01T00:00:00.000Z",
        contact: {
          id: "user-charlie-3",
          email: "charlie@example.com",
          name: "Charlie Designer",
          bio: "UI & UX",
          pictureUrl: "https://example.com/charlie.png",
          createdAt: "2026-10-03T00:00:00.000Z",
        },
      },
    ],
  }),
}));

describe("Frontend Group Chat UI & Participant Management Seam", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockCurrentUserId = "user-alice-1";
  });

  it("toUiChat maps group metadata and participant roles accurately", () => {
    const uiChat = toUiChat(mockGroupSummary, "user-alice-1");
    expect(uiChat.id).toBe("group-chat-1");
    expect(uiChat.type).toBe("group");
    expect(uiChat.title).toBe("Frontend Guild");
    expect(uiChat.pictureUrl).toBe("https://example.com/guild.png");
    expect(uiChat.participants.length).toBe(3);

    const admin = uiChat.participants.find((p) => p.id === "user-alice-1");
    expect(admin?.role).toBe("admin");
    const bob = uiChat.participants.find((p) => p.id === "user-bob-2");
    expect(bob?.role).toBe("member");
  });

  it("Header renders group title and participant names for group chats", () => {
    const uiChat = toUiChat(mockGroupSummary, "user-alice-1");
    render(
      <QueryClientProvider client={queryClient}>
        <Header chat={uiChat} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Frontend Guild")).toBeInTheDocument();
    expect(screen.getByTestId("header-participant-summary")).toHaveTextContent(
      "Alice Admin, Bob Dev, Charlie Designer"
    );
  });

  it("ContactInfo renders group details, member roles, and admin controls", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ContactInfo />
      </QueryClientProvider>
    );

    expect(screen.getByText("Frontend Guild")).toBeInTheDocument();
    expect(screen.getByTestId("group-bio-text")).toHaveTextContent("Frontend engineers guild");
    expect(screen.getAllByText(/3 participantes/i).length).toBeGreaterThanOrEqual(1);

    // Check member names
    expect(screen.getByText("Alice Admin")).toBeInTheDocument();
    expect(screen.getByText("Bob Dev")).toBeInTheDocument();
    expect(screen.getByText("Charlie Designer")).toBeInTheDocument();

    // Check role badges
    expect(screen.getAllByText("Admin").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("member-badge").length).toBeGreaterThanOrEqual(1);

    // Admin Alice should see participant management options
    expect(screen.getByTestId("add-participant-button")).toBeInTheDocument();
  });

  it("Messages displays sender name attribution above incoming group chat bubbles", () => {
    const groupIncomingMsg: any = {
      id: "msg-bob-1",
      chatId: "group-chat-1",
      owner: "user-bob-2",
      body: JSON.stringify({
        root: {
          children: [
            {
              children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "Hey team!", type: "text", version: 1 }],
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
      time: "2026-10-26T10:10:00.000Z",
      status: "received",
      starred: false,
      hasMedia: null,
      reactions: [],
    };

    const uiChat = toUiChat(mockGroupSummary, "user-alice-1");
    render(
      <QueryClientProvider client={queryClient}>
        <Messages
          messages={[groupIncomingMsg]}
          isGroup={true}
          participants={uiChat.participants}
        />
      </QueryClientProvider>
    );

    const senderAttribution = screen.getByTestId("message-sender-name");
    expect(senderAttribution).toHaveTextContent("Bob Dev");
  });

  it("NewGroup allows creating a group chat with custom title and selected contacts", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "new-group-123", ...mockGroupSummary }),
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <NewGroup />
      </QueryClientProvider>
    );

    const titleInput = screen.getByPlaceholderText(/Nombre del grupo/i);
    fireEvent.change(titleInput, { target: { value: "New Design Team" } });

    // Select Bob
    const bobCheckbox = screen.getByTestId("checkbox-contact-user-bob-2");
    fireEvent.click(bobCheckbox);

    // Click create group button
    const createButton = screen.getByRole("button", { name: /Crear grupo/i });
    expect(createButton).not.toBeDisabled();
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const calledBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(calledBody.type).toBe("group");
    expect(calledBody.title).toBe("New Design Team");
    expect(calledBody.participantIds).toContain("user-bob-2");

    fetchSpy.mockRestore();
  });
});
