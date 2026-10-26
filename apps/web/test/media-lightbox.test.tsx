import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaMessageDialog } from "../src/components/MediaMessageDialog";
import useStore from "../src/lib/store";
import type { TMessage } from "../src/lib/types";

vi.mock("../src/lib/api/chatQueries", () => ({
  useContacts: () => ({
    data: [
      {
        userId: "current-user",
        contactUserId: "user-789",
        nickname: null,
        createdAt: "2026-10-26T00:00:00.000Z",
        contact: {
          id: "user-789",
          email: "jane@example.com",
          name: "Sender Jane",
          bio: "Adventurer",
          phone: "+1234567890",
          pictureUrl: "https://example.com/jane.png",
          createdAt: "2026-10-26T00:00:00.000Z",
        },
      },
    ],
  }),
}));

describe("Fullscreen Media Lightbox Viewer Seam", () => {
  const dummyMessage: TMessage = {
    id: "msg-123",
    chatId: "chat-456",
    owner: "user-789",
    body: "Look at this mountain view",
    time: "2026-10-26T12:00:00.000Z",
    status: "read",
    starred: false,
    forwarded: false,
    reactions: [{ owner: "user-789", type: ":sparkling_heart:" as any }],
    hasMedia: {
      id: "media-999",
      type: "image",
      src: "https://storage.example.com/mountain.jpg",
      orientation: "landscape",
      duration: null,
      width: 1920,
      height: 1080,
      blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
    },
  };

  beforeEach(() => {
    useStore.setState({
      user: {
        id: "current-user",
        name: "Current User",
        bio: "",
        phone: "",
        picture: "https://example.com/me.png",
      },
      contacts: [
        {
          id: "user-789",
          name: "Sender Jane",
          bio: "Adventurer",
          phone: "+1234567890",
          picture: "https://example.com/jane.png",
        },
      ],
      chats: [], // Empty to test fallback to mediaMessage prop
    });
  });

  it("renders lightbox viewer with sender metadata, reactions, and caption", () => {
    render(<MediaMessageDialog mediaMessage={dummyMessage} />);

    // Sender metadata
    expect(screen.getByText("Sender Jane")).toBeInTheDocument();
    expect(screen.getByAltText("Sender Jane")).toBeInTheDocument();

    // Caption
    expect(screen.getByText("Look at this mountain view")).toBeInTheDocument();

    // Media element
    const img = screen.getByAltText(/Foto enviada por Sender Jane/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://storage.example.com/mountain.jpg");
  });

  it("provides zoom controls that adjust the media scale", () => {
    render(<MediaMessageDialog mediaMessage={dummyMessage} />);

    const zoomInBtn = screen.getByRole("button", { name: /acercar|zoom in/i });
    const zoomOutBtn = screen.getByRole("button", { name: /alejar|zoom out/i });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();

    // Initial scale is 100%
    expect(screen.getByText("100%")).toBeInTheDocument();

    // Click Zoom In
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("125%")).toBeInTheDocument();

    // Click Zoom In again
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("150%")).toBeInTheDocument();

    // Click Zoom Out
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText("125%")).toBeInTheDocument();
  });
});
