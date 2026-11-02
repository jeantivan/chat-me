import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserImage } from "../src/components/UserImage";
import { ContactItem } from "../src/components/ContactItem";
import { GroupParticipantItem } from "../src/components/Chat/GroupParticipantItem";
import { BlockedContacts } from "../src/components/Configuration/BlockedContacts";
import { chatKeys } from "../src/lib/socket/useSocketSync";
import useStore from "../src/lib/store";
import type { TUser } from "../src/lib/types";

describe("UserImage Avatar Fallback Seam", () => {
  beforeEach(() => {
    useStore.setState({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        bio: "",
        phone: "",
        picture: "",
      },
    });
  });

  it("renders fallback avatar icon when src is empty string", () => {
    render(<UserImage src="" alt="Test User" />);
    expect(screen.getByTestId("user-avatar-fallback-icon")).toBeInTheDocument();
  });

  it("renders fallback avatar icon when src is null", () => {
    render(<UserImage src={null} alt="Test User" />);
    expect(screen.getByTestId("user-avatar-fallback-icon")).toBeInTheDocument();
  });

  it("renders fallback avatar icon when src is undefined and store user picture is empty", () => {
    render(<UserImage alt="Test User" />);
    expect(screen.getByTestId("user-avatar-fallback-icon")).toBeInTheDocument();
  });

  it("renders custom fallback node when provided and src is empty", () => {
    render(
      <UserImage
        src=""
        fallback={<span data-testid="custom-fallback">Custom Avatar</span>}
      />
    );
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("user-avatar-fallback-icon")).not.toBeInTheDocument();
  });

  it("ContactItem renders avatar fallback icon when contact picture is empty (deleted or blocked)", () => {
    const contact: TUser = {
      id: "contact-1",
      name: "Contact Without Picture",
      bio: "Hello world",
      phone: "+1234567890",
      picture: "",
    };

    render(<ContactItem contact={contact} selectable={false} />);
    expect(screen.getByTestId("user-avatar-fallback-icon")).toBeInTheDocument();
  });

  it("GroupParticipantItem renders avatar fallback icon when participant pictureUrl is empty", () => {
    const participant = {
      userId: "user-part-1",
      role: "member" as const,
      pinned: false,
      muted: false,
      archived: false,
      lastReadAt: new Date().toISOString(),
      user: {
        id: "user-part-1",
        name: "Part User",
        email: "part@example.com",
        bio: "Part bio",
        pictureUrl: "",
        createdAt: new Date().toISOString(),
      },
    };

    render(
      <GroupParticipantItem
        participant={participant}
        isSelf={false}
        isAdmin={false}
        isOnline={false}
        onToggleRole={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByTestId("user-avatar-fallback-icon")).toBeInTheDocument();
  });

  it("BlockedContacts renders avatar fallback icon for blocked users without pictures", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(chatKeys.blocked, [
      {
        id: "blocked-1",
        name: "Blocked User",
        email: "blocked@example.com",
        bio: "",
        pictureUrl: "",
        createdAt: new Date().toISOString(),
        user: {
          id: "blocked-1",
          name: "Blocked User",
          email: "blocked@example.com",
          bio: "",
          pictureUrl: "",
          createdAt: new Date().toISOString(),
        },
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <BlockedContacts />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("user-avatar-fallback-icon")).toBeInTheDocument();
  });
});
