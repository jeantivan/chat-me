import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Options } from "../src/components/Configuration/Options";
import { Privacy } from "../src/components/Configuration/Privacy";
import { ChangeUserImage } from "../src/components/ChangeUserImage";
import { LeftColumn } from "../src/containers/LeftColumn";
import useStore from "../src/lib/store";

vi.mock("../src/components", () => ({
  UserProfile: () => <div data-testid="user-profile-stub">UserProfileStub</div>,
  ChatList: () => <div data-testid="chat-list-stub">ChatListStub</div>,
}));

vi.mock("../src/components/UserImage", () => ({
  UserImage: () => <div data-testid="user-image-stub">UserImageStub</div>,
}));

describe("Settings Sidebar Cleanup & Summary Navigation Seam", () => {
  const leftDrawerGoToMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      user: {
        id: "user-1",
        name: "Alice Developer",
        bio: "Building real-time apps",
        phone: "+1234567890",
        picture: "https://example.com/avatar.jpg",
      },
      notifications: {
        all: true,
        sound: true,
        preview: false,
        reactions: true,
      },
      privacy: {
        lastTimeOnline: "all",
        picture: "contacts",
        bio: "all",
        groups: "contacts",
        readReceipt: true,
      },
      theme: {
        mode: "dark",
        colors: "slate-indigo",
      },
      leftDrawerGoTo: leftDrawerGoToMock,
    });
  });

  describe("Options Component Seam", () => {
    it("renders the user profile card and exactly 4 active configuration sections with dynamic subtitles", () => {
      render(<Options />);

      // 1. Profile card renders user info
      expect(screen.getByText("Alice Developer")).toBeInTheDocument();
      expect(screen.getAllByText("Building real-time apps").length).toBeGreaterThan(0);

      // 2. The four active configuration sections render
      expect(screen.getByRole("button", { name: /perfil/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /notificaciones/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /privacidad/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument();

      // 3. Dynamic subtitles reflect store state
      expect(screen.getByText(/oscuro/i)).toBeInTheDocument();
      expect(screen.getByText(/sonidos/i)).toBeInTheDocument();
      expect(screen.getByText(/confirmaciones/i)).toBeInTheDocument();

      // 4. Dead features are completely absent from Options DOM
      expect(screen.queryByText(/solicitar info/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/atajos del teclado/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ayuda/i)).not.toBeInTheDocument();
    });

    it("updates dynamic subtitles when user preferences change in the store", () => {
      useStore.setState({
        user: {
          id: "user-1",
          name: "Alice Developer",
          bio: "Updated status bio",
          phone: "+1234567890",
          picture: "",
        },
        notifications: {
          all: false,
          sound: false,
          preview: false,
          reactions: false,
        },
        privacy: {
          lastTimeOnline: "none",
          picture: "none",
          bio: "none",
          groups: "contacts",
          readReceipt: false,
        },
        theme: {
          mode: "light",
          colors: "slate-indigo",
        },
      });

      render(<Options />);

      expect(screen.getByText("Claro")).toBeInTheDocument();
      expect(screen.getByText("Desactivadas")).toBeInTheDocument();
      expect(
        screen.getByText("Confirmaciones de lectura desactivadas")
      ).toBeInTheDocument();
      expect(screen.getAllByText("Updated status bio").length).toBeGreaterThan(0);
    });

    it("navigates to respective drawers when navigation items and profile card are clicked", () => {
      render(<Options />);

      // Click profile card
      fireEvent.click(screen.getByText("Alice Developer").closest("button")!);
      expect(leftDrawerGoToMock).toHaveBeenCalledWith("PROFILE");

      // Click Perfil item
      fireEvent.click(screen.getByRole("button", { name: /perfil/i }));
      expect(leftDrawerGoToMock).toHaveBeenCalledWith("PROFILE");

      // Click Notificaciones item
      fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));
      expect(leftDrawerGoToMock).toHaveBeenCalledWith("NOTIFICATIONS");

      // Click Privacidad item
      fireEvent.click(screen.getByRole("button", { name: /privacidad/i }));
      expect(leftDrawerGoToMock).toHaveBeenCalledWith("PRIVACY");

      // Click Tema item
      fireEvent.click(screen.getByRole("button", { name: /tema/i }));
      expect(leftDrawerGoToMock).toHaveBeenCalledWith("THEME");
    });
  });

  describe("Dead Feature Cleanup Seams", () => {
    it("does not render disappearing messages (Mensajes temporales) in Privacy view", () => {
      render(<Privacy />);
      expect(screen.queryByText(/mensajes temporales/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/duración predeterminada de los mensajes/i)
      ).not.toBeInTheDocument();
    });

    it("does not render webcam or take photo option in ChangeUserImage component", () => {
      render(<ChangeUserImage />);
      expect(screen.queryByText(/tomar foto/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/webcam/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/webcam/i)).not.toBeInTheDocument();
    });

    it("renders LeftColumn without SOL_INFO and HELP drawer elements", () => {
      const { container } = render(<LeftColumn />);
      expect(container.querySelector('[data-option="SOL_INFO"]')).toBeNull();
      expect(container.querySelector('[data-option="HELP"]')).toBeNull();
      expect(screen.queryByText("Solicitar info de mi cuenta")).not.toBeInTheDocument();
      expect(screen.queryByText("Ayuda")).not.toBeInTheDocument();
    });
  });
});
