import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import dayjs from "dayjs";
import { Options } from "../src/components/Configuration/Options";
import useStore from "../src/lib/store";
import { useTranslation, LOCALE_STORAGE_KEY } from "../src/lib/i18n";

vi.mock("../src/components/UserImage", () => ({
  UserImage: () => <div data-testid="user-image-stub" />,
}));

describe("Settings Manual Language Selector Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    useTranslation.getState().setLocale("en");
    localStorage.clear();
    useStore.setState({
      user: {
        id: "user-1",
        name: "Alice Developer",
        bio: "",
        phone: "",
        picture: "",
      },
      notifications: { all: true, sound: false, preview: false, reactions: false },
      privacy: {
        lastTimeOnline: "all",
        picture: "all",
        bio: "all",
        groups: "all",
        readReceipt: true,
      },
      theme: { mode: "light", colors: "slate-indigo" },
    });
  });

  it("renders a language selector reflecting the active locale", () => {
    render(<Options />);

    const select = screen.getByRole("combobox", { name: /language/i });
    expect(select).toHaveValue("en");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Español" })).toBeInTheDocument();
  });

  it("switches the UI to Spanish in real time and persists the choice", () => {
    render(<Options />);
    expect(screen.getByRole("button", { name: /privacy/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /language/i }), {
      target: { value: "es" },
    });

    expect(useTranslation.getState().locale).toBe("es");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
    expect(dayjs.locale()).toBe("es");
    expect(screen.getByRole("button", { name: /privacidad/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /idioma/i })).toHaveValue("es");
  });

  it("switches back to English from Spanish", () => {
    useTranslation.getState().setLocale("es");
    render(<Options />);

    fireEvent.change(screen.getByRole("combobox", { name: /idioma/i }), {
      target: { value: "en" },
    });

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(screen.getByRole("button", { name: /privacy/i })).toBeInTheDocument();
  });
});
