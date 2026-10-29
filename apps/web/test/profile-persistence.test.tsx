import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Profile } from "../src/components/Configuration/Profile";
import { ChangeUserImage } from "../src/components/ChangeUserImage";
import { useSocketSync, chatKeys } from "../src/lib/socket/useSocketSync";
import useStore from "../src/lib/store";
import type { ChatSummary, ContactSummary, UserProfile } from "@chat-me/shared";

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

vi.mock("../src/components/UserImage", () => ({
  UserImage: () => <div data-testid="user-image-stub">UserImageStub</div>,
}));

describe("User Profile Persistence, S3 Avatar Pipeline & Socket Sync Seam", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketListeners).forEach((k) => delete mockSocketListeners[k]);

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useStore.setState({
      user: {
        id: "user-123",
        name: "Alice Developer",
        bio: "Full-stack engineer",
        phone: "+1234567890",
        picture: "https://example.com/alice.jpg",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithProviders(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  }

  it("Profile drawer renders display name and bio, and saves edits via PATCH with optimistic sync", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "user-123",
        name: "Alice Updated",
        bio: "Updated bio",
        pictureUrl: "https://example.com/alice.jpg",
      }),
    });
    global.fetch = fetchMock;

    queryClient.setQueryData(chatKeys.user, {
      id: "user-123",
      name: "Alice Developer",
      bio: "Full-stack engineer",
      pictureUrl: "https://example.com/alice.jpg",
    });

    renderWithProviders(<Profile />);

    expect(screen.getByText("Alice Developer")).toBeInTheDocument();
    expect(screen.getByText("Full-stack engineer")).toBeInTheDocument();

    // Edit Name
    const editButtons = screen.getAllByTitle(/Editar/i);
    fireEvent.click(editButtons[0]);

    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Alice Updated" } });

    const saveButtons = screen.getAllByTitle(/Guardar cambios/i);
    fireEvent.click(saveButtons[0]);

    // Check fetch was called with PATCH /api/v1/users/me/profile
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/profile"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "Alice Updated" }),
        })
      );
    });

    // Check optimistic / updated Zustand store
    expect(useStore.getState().user.name).toBe("Alice Updated");
  });

  it("avatar menu supports View photo (lightbox), Upload photo (presigned S3 pipeline), and Remove photo", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("/api/v1/users/me/avatar/presign")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            uploadUrl: "https://storage.example.com/upload-avatar",
            publicUrl: "https://storage.example.com/avatars/user-123/new-photo.png",
          }),
        });
      }
      if (url.includes("storage.example.com/upload-avatar")) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes("/api/v1/users/me/profile")) {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "user-123",
            name: "Alice Developer",
            bio: "Full-stack engineer",
            pictureUrl: body.pictureUrl,
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
    global.fetch = fetchMock;

    renderWithProviders(<ChangeUserImage />);

    // Trigger avatar menu
    const menuTrigger = screen.getByRole("button", { name: /foto de perfil|opciones de foto/i });
    fireEvent.pointerDown(menuTrigger, { pointerType: "mouse" });
    fireEvent.click(menuTrigger);

    // Menu options should be visible
    expect(screen.getByText(/ver foto/i)).toBeInTheDocument();
    expect(screen.getByText(/subir foto|cambiar foto/i)).toBeInTheDocument();
    expect(screen.getByText(/eliminar foto/i)).toBeInTheDocument();

    // 1. View photo opens lightbox
    fireEvent.click(screen.getByText(/ver foto/i));
    expect(screen.getByTestId("avatar-lightbox")).toBeInTheDocument();

    // Close lightbox
    const closeBtn = screen.getByRole("button", { name: /cerrar/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByTestId("avatar-lightbox")).not.toBeInTheDocument();
    });

    // 2. Upload photo via presigned S3 pipeline
    const file = new File(["fake binary avatar"], "new-avatar.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/seleccionar imagen de perfil/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/avatar/presign"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            filename: "new-avatar.png",
            mimeType: "image/png",
            sizeBytes: file.size,
          }),
        })
      );
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://storage.example.com/upload-avatar",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/profile"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            pictureUrl: "https://storage.example.com/avatars/user-123/new-photo.png",
          }),
        })
      );
    });

    expect(useStore.getState().user.picture).toBe(
      "https://storage.example.com/avatars/user-123/new-photo.png"
    );

    // 3. Remove photo clears pictureUrl
    fireEvent.pointerDown(menuTrigger, { pointerType: "mouse" });
    fireEvent.click(menuTrigger);
    fireEvent.click(screen.getByText(/eliminar foto/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/profile"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ pictureUrl: "" }),
        })
      );
    });

    expect(useStore.getState().user.picture).toBe("");
  });

  it("useSocketSync syncs user:profile_updated across chats list, contacts, and user caches", () => {
    const initialChats: ChatSummary[] = [
      {
        id: "chat-1",
        type: "direct",
        title: null,
        directPairHash: "user-123:user-456" as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: [
          {
            userId: "user-456",
            role: "member",
            pinned: false,
            muted: false,
            archived: false,
            lastReadAt: new Date().toISOString(),
            user: {
              id: "user-456",
              name: "Bob Builder",
              bio: "Fixing things",
              email: "bob@example.com",
              pictureUrl: "https://example.com/bob-old.jpg",
              createdAt: new Date().toISOString(),
            },
          },
        ],
      },
    ];

    const initialContacts: ContactSummary[] = [
      {
        userId: "user-123",
        contactUserId: "user-456",
        nickname: "Bob",
        createdAt: new Date().toISOString(),
        contact: {
          id: "user-456",
          name: "Bob Builder",
          bio: "Fixing things",
          email: "bob@example.com",
          pictureUrl: "https://example.com/bob-old.jpg",
          createdAt: new Date().toISOString(),
        },
      },
    ];

    queryClient.setQueryData(chatKeys.lists(), initialChats);
    queryClient.setQueryData(chatKeys.contacts, initialContacts);

    renderHook(
      () => useSocketSync("chat-1", "user-123"),
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      }
    );

    expect(mockSocket.on).toHaveBeenCalledWith("user:profile_updated", expect.any(Function));

    // Simulate incoming profile update for counterpart Bob
    const updatedBob: UserProfile = {
      id: "user-456",
      name: "Bob Master Builder",
      bio: "We can fix it!",
      email: "bob@example.com",
      pictureUrl: "https://example.com/bob-new.jpg",
      createdAt: new Date().toISOString(),
    };

    const handler = mockSocketListeners["user:profile_updated"]?.[0];
    expect(handler).toBeDefined();

    act(() => {
      handler(updatedBob);
    });

    // Check chats list cache updated
    const updatedChats = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists());
    expect(updatedChats?.[0].participants[0].user.name).toBe("Bob Master Builder");
    expect(updatedChats?.[0].participants[0].user.bio).toBe("We can fix it!");
    expect(updatedChats?.[0].participants[0].user.pictureUrl).toBe("https://example.com/bob-new.jpg");

    // Check contacts cache updated
    const updatedContactList = queryClient.getQueryData<ContactSummary[]>(chatKeys.contacts);
    expect(updatedContactList?.[0].contact.name).toBe("Bob Master Builder");
    expect(updatedContactList?.[0].contact.pictureUrl).toBe("https://example.com/bob-new.jpg");
  });
});
