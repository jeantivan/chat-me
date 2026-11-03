import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "../src/components/Chat/Header";
import { ContactInfo } from "../src/components/Chat/ContactInfo";
import { GroupInfoDrawer } from "../src/components/Chat/GroupInfoDrawer";
import { SharedContent } from "../src/components/Chat/SharedContent";
import { Message } from "../src/components/Message";
import useStore from "../src/lib/store";
import type { MessagePayload, ChatSummary } from "@chat-me/shared";
import type { TChat } from "../src/lib/types";

const mockNavigate = vi.fn();
vi.mock("../src/routes/router", () => ({
  router: {
    navigate: (...args: any[]) => mockNavigate(...args),
  },
}));

const mockPhotoMsg: MessagePayload = {
  id: "msg-photo-1",
  chatId: "chat-1",
  owner: "user-1",
  body: "A nice photo",
  forwarded: false,
  time: "2026-11-03T10:00:00.000Z",
  status: "read",
  starred: false,
  reactions: [],
  hasMedia: {
    id: "media-img-1",
    type: "image",
    src: "https://minio/photos/beach.jpg",
    orientation: "landscape",
    duration: null,
    filename: "beach.jpg",
    sizeBytes: 250000,
    mimeType: "image/jpeg",
    createdAt: "2026-11-03T10:00:00.000Z",
  },
};

const mockVideoMsg: MessagePayload = {
  id: "msg-vid-1",
  chatId: "chat-1",
  owner: "user-1",
  body: "A nice video",
  forwarded: false,
  time: "2026-11-03T10:05:00.000Z",
  status: "read",
  starred: false,
  reactions: [],
  hasMedia: {
    id: "media-vid-1",
    type: "video",
    src: "https://minio/videos/clip.mp4",
    orientation: "landscape",
    duration: 15000,
    filename: "clip.mp4",
    sizeBytes: 15000000,
    mimeType: "video/mp4",
    createdAt: "2026-11-03T10:05:00.000Z",
  },
};

const mockDocMsg: MessagePayload = {
  id: "msg-doc-1",
  chatId: "chat-1",
  owner: "user-1",
  body: "Financial report",
  forwarded: false,
  time: "2026-11-03T10:10:00.000Z",
  status: "read",
  starred: false,
  reactions: [],
  hasMedia: {
    id: "media-doc-1",
    type: "document",
    src: "https://minio/docs/report-q3.pdf",
    orientation: "square",
    duration: null,
    filename: "report-q3.pdf",
    sizeBytes: 2097152,
    mimeType: "application/pdf",
    createdAt: "2026-11-03T10:10:00.000Z",
  },
};

const mockAudioMsg: MessagePayload = {
  id: "msg-aud-1",
  chatId: "chat-1",
  owner: "user-1",
  body: "Voice memo",
  forwarded: false,
  time: "2026-11-03T10:15:00.000Z",
  status: "read",
  starred: false,
  reactions: [],
  hasMedia: {
    id: "media-aud-1",
    type: "audio",
    src: "https://minio/audio/voice-note.ogg",
    orientation: "square",
    duration: 42000,
    filename: "voice-note.ogg",
    sizeBytes: 512000,
    mimeType: "audio/ogg",
    createdAt: "2026-11-03T10:15:00.000Z",
  },
};

const allMockMedia = [mockAudioMsg, mockDocMsg, mockVideoMsg, mockPhotoMsg];

vi.mock("../src/lib/api/chatQueries", async () => {
  const actual = await vi.importActual("../src/lib/api/chatQueries");
  return {
    ...actual,
    useChatMedia: (chatId: string, type?: string) => {
      if (!type) {
        return { data: allMockMedia, isLoading: false };
      }
      if (type === "visual") {
        return {
          data: allMockMedia.filter(
            (m) => m.hasMedia?.type === "image" || m.hasMedia?.type === "video"
          ),
          isLoading: false,
        };
      }
      return {
        data: allMockMedia.filter((m) => m.hasMedia?.type === type),
        isLoading: false,
      };
    },
    useChats: () => ({
      data: [
        {
          id: "chat-1",
          type: "direct",
          title: null,
          bio: "Direct chat bio",
          pictureUrl: null,
          directPairHash: "u1:u2",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          participants: [
            {
              userId: "user-1",
              role: "member",
              pinned: false,
              muted: false,
              archived: false,
              markedUnread: false,
              user: {
                id: "user-1",
                name: "Alice",
                email: "alice@example.com",
                bio: "Alice bio",
                pictureUrl: "",
                createdAt: new Date().toISOString(),
              },
            },
            {
              userId: "user-2",
              role: "member",
              pinned: false,
              muted: false,
              archived: false,
              markedUnread: false,
              user: {
                id: "user-2",
                name: "Bob",
                email: "bob@example.com",
                bio: "Bob bio",
                pictureUrl: "",
                createdAt: new Date().toISOString(),
              },
            },
          ],
        },
      ],
    }),
    useBlockedUsers: () => ({ data: [] }),
    useUpdateChatParticipant: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

describe("Shared Media Browser & Timeline Seam", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useStore.setState({
      user: {
        id: "user-1",
        name: "Alice",
        picture: "",
        email: "alice@example.com",
        bio: "",
        phone: "",
        contacts: [],
      },
      currentChatId: "chat-1",
      rightDrawer: null,
      rdHistory: [],
    });
  });

  it("ContactInfo renders real shared media count and preview thumbnails, navigating to SHARED_CONTENT", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ContactInfo chatId="chat-1" />
      </QueryClientProvider>
    );

    // Verify shared media count displays total media count (4)
    expect(screen.getByText("4")).toBeInTheDocument();

    // Verify visual preview thumbnails are rendered (beach.jpg, clip.mp4)
    const previewImgs = screen.getAllByRole("img");
    expect(previewImgs.some((img) => img.getAttribute("src") === "https://minio/photos/beach.jpg")).toBe(true);

    // Clicking shared content navigates right drawer to SHARED_CONTENT
    const sharedSectionBtn = screen.getByTestId("contact-shared-content-button");
    fireEvent.click(sharedSectionBtn);
    expect(useStore.getState().rightDrawer).toBe("SHARED_CONTENT");
  });

  it("GroupInfoDrawer renders real shared media count and preview thumbnails, navigating to SHARED_CONTENT", async () => {
    const groupSummary: ChatSummary = {
      id: "group-1",
      type: "group",
      title: "Project Alpha",
      bio: "Group for Alpha",
      pictureUrl: "",
      directPairHash: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        {
          userId: "user-1",
          role: "admin",
          pinned: false,
          muted: false,
          archived: false,
          markedUnread: false,
        },
      ],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <GroupInfoDrawer chatSummary={groupSummary} />
      </QueryClientProvider>
    );

    expect(screen.getByText("4")).toBeInTheDocument();
    const sharedSectionBtn = screen.getByTestId("group-shared-content-button");
    fireEvent.click(sharedSectionBtn);
    expect(useStore.getState().rightDrawer).toBe("SHARED_CONTENT");
  });

  it("Header menu 'Archivos' is enabled and navigates to SHARED_CONTENT", async () => {
    const dummyChat: TChat = {
      id: "chat-1",
      type: "direct",
      name: "Bob",
      phone: "",
      bio: "",
      picture: "",
      muted: false,
      pinned: false,
      archived: false,
      markedUnread: false,
      messages: [],
      participants: [
        { id: "user-1", name: "Alice", phone: "", bio: "", picture: "" },
        { id: "user-2", name: "Bob", phone: "", bio: "", picture: "" },
      ],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Header chat={dummyChat} />
      </QueryClientProvider>
    );

    // Open menu
    const menuBtn = screen.getByRole("button", { name: /abrir menu del chat/i });
    fireEvent.pointerDown(menuBtn, { pointerType: "mouse" });
    fireEvent.click(menuBtn);

    const archivosItem = await screen.findByText("Archivos");
    expect(archivosItem).toBeInTheDocument();
    expect(archivosItem).not.toBeDisabled();

    fireEvent.click(archivosItem);
    expect(useStore.getState().rightDrawer).toBe("SHARED_CONTENT");
  });

  it("SharedContent tabs display Multimedia, Documentos, and Audio with proper interactions", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SharedContent />
      </QueryClientProvider>
    );

    // Tab buttons exist
    expect(screen.getByRole("tab", { name: /multimedia/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /documentos/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /audio/i })).toBeInTheDocument();

    // Default tab is Multimedia -> shows beach.jpg and clip.mp4
    const photoThumbnail = screen.getByAltText("beach.jpg");
    expect(photoThumbnail).toBeInTheDocument();

    // Clicking photo opens lightbox via openMediaMessage
    fireEvent.click(photoThumbnail);
    expect(useStore.getState().mediaMessage?.id).toBe("msg-photo-1");

    // Switch to Documentos tab
    const docTab = screen.getByRole("tab", { name: /documentos/i });
    fireEvent.pointerDown(docTab);
    fireEvent.click(docTab);
    fireEvent.keyDown(docTab, { key: "Enter" });

    // Verify document card rendered with filename, size, and download link
    expect(screen.getByText("report-q3.pdf")).toBeInTheDocument();
    expect(screen.getByText(/2(\.0)? MB/i)).toBeInTheDocument();
    const downloadLink = screen.getByRole("link", { name: /descargar report-q3\.pdf/i });
    expect(downloadLink).toHaveAttribute("href", "https://minio/docs/report-q3.pdf");

    // Switch to Audio tab
    const audioTab = screen.getByRole("tab", { name: /audio/i });
    fireEvent.pointerDown(audioTab);
    fireEvent.click(audioTab);
    fireEvent.keyDown(audioTab, { key: "Enter" });

    // Verify audio player rendered
    const audioPlayer = document.querySelector("audio");
    expect(audioPlayer).toBeInTheDocument();
    expect(audioPlayer).toHaveAttribute("src", "https://minio/audio/voice-note.ogg");
  });

  it("renders audio and document attachments directly in the chat timeline", async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Message
          isOwnMsg={false}
          hasTail={false}
          message={{
            ...mockAudioMsg,
            reactions: [],
          } as any}
        />
      </QueryClientProvider>
    );

    // Timeline message with audio attachment renders an inline audio element
    const audioEl = document.querySelector("audio");
    expect(audioEl).toBeInTheDocument();
    expect(audioEl).toHaveAttribute("src", "https://minio/audio/voice-note.ogg");

    // Timeline message with document attachment renders document card with download link
    rerender(
      <QueryClientProvider client={queryClient}>
        <Message
          isOwnMsg={false}
          hasTail={false}
          message={{
            ...mockDocMsg,
            reactions: [],
          } as any}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("report-q3.pdf")).toBeInTheDocument();
    const docDownloadLink = screen.getByRole("link", { name: /descargar report-q3\.pdf/i });
    expect(docDownloadLink).toHaveAttribute("href", "https://minio/docs/report-q3.pdf");
  });
});
