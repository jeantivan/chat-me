import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthDialog } from "../src/components/Auth/AuthDialog";
import { AuthContext, AuthContextType } from "../src/lib/auth/AuthContext";

describe("Frontend AuthDialog Seam", () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();

  const createMockAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
    user: null,
    settings: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    ...overrides,
  });

  const renderWithAuth = (contextValue = createMockAuthContext()) => {
    return render(
      <AuthContext.Provider value={contextValue}>
        <AuthDialog open={true} />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form by default with email and password inputs", () => {
    renderWithAuth();

    expect(screen.getByRole("heading", { name: /welcome to chatme/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument();
  });

  it("shows validation error feedback if email or password are empty on login submit", async () => {
    renderWithAuth();

    const submitBtn = screen.getByRole("button", { name: /^log in$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("switches to registration form and displays name, email, and password fields", async () => {
    const user = userEvent.setup();
    renderWithAuth();

    const registerTab = screen.getByRole("tab", { name: /register/i });
    await user.click(registerTab);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create account$/i })).toBeInTheDocument();
  });

  it("submits valid registration form with user inputs", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);
    renderWithAuth();

    const registerTab = screen.getByRole("tab", { name: /register/i });
    await user.click(registerTab);

    await user.type(screen.getByLabelText(/full name/i), "Alice Wonderland");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "Secret123!");

    const submitBtn = screen.getByRole("button", { name: /^create account$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("alice@example.com", "Secret123!", "Alice Wonderland");
    });
  });

  it("displays server error feedback when login rejects", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error("Invalid email or password"));
    renderWithAuth();

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "WrongPass1");

    const submitBtn = screen.getByRole("button", { name: /^log in$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("logs in immediately with seeded credentials when clicking Quick Demo Login button", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    renderWithAuth();

    const demoAliceBtn = screen.getByRole("button", { name: /demo as alice/i });
    await user.click(demoAliceBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("alice@example.com", "Password123!");
    });
  });
});
