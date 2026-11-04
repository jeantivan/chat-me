import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthContext, AuthContextType } from "../src/lib/auth/AuthContext";
import { Loading } from "../src/components/Loading";
import { RootLayout } from "../src/routes/router";
import useStore from "../src/lib/store";
import fs from "fs";
import path from "path";

// Mock subcomponents inside RootLayout to isolate router startup logic
vi.mock("../src/containers", () => ({
  Main: ({ children }: { children: React.ReactNode }) => <div data-testid="main-shell">{children}</div>,
  LeftColumn: () => <div data-testid="left-column">LeftColumn</div>,
  RightColumn: () => <div data-testid="right-column">RightColumn</div>,
}));

vi.mock("../src/components/Auth/AuthDialog", () => ({
  AuthDialog: ({ open }: { open: boolean }) => (
    <div data-testid="auth-dialog" data-open={open}>
      AuthDialog
    </div>
  ),
}));

vi.mock("@tanstack/react-router", () => ({
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  createRootRoute: (opts: any) => ({
    ...opts,
    addChildren: vi.fn(),
  }),
  createRoute: (opts: any) => opts,
  createRouter: (opts: any) => opts,
}));

vi.mock("../src/lib/socket/socketClient", () => ({
  getSocket: () => ({
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

vi.mock("../src/lib/socket/useSocketSync", () => ({
  useSocketSync: vi.fn(),
}));

describe("Router Startup & Loading Presentation Seam", () => {
  const createMockAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
    user: null,
    settings: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });

  const renderRootLayout = (authContext: AuthContextType) => {
    return render(
      <AuthContext.Provider value={authContext}>
        <RootLayout />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Loading component renders presentational loading state without reading Zustand loading or calling prepareApp", () => {
    render(<Loading />);

    expect(screen.getByRole("heading", { name: /welcome to chatme/i })).toBeInTheDocument();
    // Loading should not depend on store loading state
    const storeState = useStore.getState() as any;
    expect(storeState.prepareApp).toBeUndefined();
    expect(storeState.loading).toBeUndefined();
  });

  it("RootLayout renders Loading while auth is resolving (isLoading=true)", () => {
    renderRootLayout(
      createMockAuthContext({
        isLoading: true,
        isAuthenticated: false,
      })
    );

    expect(screen.getByRole("heading", { name: /welcome to chatme/i })).toBeInTheDocument();
    expect(screen.queryByTestId("left-column")).not.toBeInTheDocument();
    expect(screen.queryByTestId("right-column")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-dialog")).not.toBeInTheDocument();
  });

  it("RootLayout renders AuthDialog when auth is done and unauthenticated", () => {
    renderRootLayout(
      createMockAuthContext({
        isLoading: false,
        isAuthenticated: false,
      })
    );

    expect(screen.getByTestId("auth-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("left-column")).not.toBeInTheDocument();
    expect(screen.queryByTestId("right-column")).not.toBeInTheDocument();
  });

  it("RootLayout renders LeftColumn and RightColumn immediately when authenticated without checking state.loading !== ready", () => {
    renderRootLayout(
      createMockAuthContext({
        isLoading: false,
        isAuthenticated: true,
        token: "fake-token",
        user: { id: "u-1", name: "Alice", email: "alice@example.com", avatar: null, bio: null, createdAt: new Date() },
      })
    );

    expect(screen.getByTestId("left-column")).toBeInTheDocument();
    expect(screen.getByTestId("right-column")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /welcome to chatme/i })).not.toBeInTheDocument();
  });

  it("Zustand store root does not contain LoadingSlice properties or methods", () => {
    const storeState = useStore.getState() as any;
    expect(storeState.loading).toBeUndefined();
    expect(storeState.prepareApp).toBeUndefined();
  });

  it("verifies mock loader utilities and mock datasets are completely purged from disk", () => {
    const srcDir = path.resolve(__dirname, "../src");
    const mockDataDir = path.resolve(srcDir, "assets/mock-data");
    const getContactsPath = path.resolve(srcDir, "lib/utils/getContacts.ts");
    const getChatsPath = path.resolve(srcDir, "lib/utils/getChats.ts");
    const mapMessagesPath = path.resolve(srcDir, "lib/utils/mapMessages.ts");
    const loadingSlicePath = path.resolve(srcDir, "lib/store/slices/LoadingSlice.ts");

    expect(fs.existsSync(mockDataDir)).toBe(false);
    expect(fs.existsSync(getContactsPath)).toBe(false);
    expect(fs.existsSync(getChatsPath)).toBe(false);
    expect(fs.existsSync(mapMessagesPath)).toBe(false);
    expect(fs.existsSync(loadingSlicePath)).toBe(false);
  });
});
