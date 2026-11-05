import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NewChat } from "../src/components/NewChat";
import { chatKeys } from "../src/lib/socket/useSocketSync";

vi.mock("../src/lib/auth/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "mock-token",
    user: { id: "user-1", name: "Me", email: "me@example.com" },
  }),
}));

describe("NewChat Add Contact by Email Seam", () => {
  let queryClient: QueryClient;
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("/api/v1/contacts")) {
        if (options?.method === "POST") {
          const body = JSON.parse(options.body);
          if (body.email === "notfound@example.com") {
            return Promise.resolve({
              ok: false,
              status: 404,
              json: async () => ({ error: "Target contact user not found" }),
            });
          }
          if (body.email === "self@example.com") {
            return Promise.resolve({
              ok: false,
              status: 400,
              json: async () => ({ error: "Cannot add self as contact" }),
            });
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              userId: "user-1",
              contactUserId: "contact-2",
              nickname: null,
              createdAt: new Date().toISOString(),
              contact: {
                id: "contact-2",
                name: "Bob",
                email: body.email,
                bio: "Hello",
                pictureUrl: "",
              },
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the inline add contact by email form", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NewChat />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText(/enter user email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add/i })
    ).toBeInTheDocument();
  });

  it("submits contact email, calls POST /api/v1/contacts, invalidates contacts cache, and displays success feedback", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <NewChat />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/enter user email/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "bob@example.com" } });
    expect(input.value).toBe("bob@example.com");

    const submitBtn = screen.getByRole("button", { name: /add/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/contacts"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "bob@example.com" }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/contact added successfully/i)).toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatKeys.contacts });
    expect(input.value).toBe("");
  });

  it("displays server error feedback when adding non-existent user", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NewChat />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/enter user email/i);
    fireEvent.change(input, { target: { value: "notfound@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /add/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/target contact user not found/i)).toBeInTheDocument();
    });
  });

  it("displays error feedback when trying to add self", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NewChat />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/enter user email/i);
    fireEvent.change(input, { target: { value: "self@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /add/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/cannot add self as contact/i)).toBeInTheDocument();
    });
  });
});
