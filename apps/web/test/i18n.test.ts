import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveInitialLocale, useTranslation } from "../src/lib/i18n";
import en from "../src/lib/i18n/en";
import es from "../src/lib/i18n/es";
import dayjs from "dayjs";

describe("i18n Engine & Locale Resolution Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("resolveInitialLocale", () => {
    it("returns saved preference if 'es' or 'en' is stored", () => {
      expect(resolveInitialLocale("es", "en-US")).toBe("es");
      expect(resolveInitialLocale("en", "es-ES")).toBe("en");
    });

    it("resolves browser Spanish locale variants to 'es'", () => {
      expect(resolveInitialLocale(null, "es")).toBe("es");
      expect(resolveInitialLocale(null, "es-ES")).toBe("es");
      expect(resolveInitialLocale(null, "es-MX")).toBe("es");
      expect(resolveInitialLocale(null, "ES-419")).toBe("es");
    });

    it("falls back to 'en' for non-Spanish or missing browser locales", () => {
      expect(resolveInitialLocale(null, "en-US")).toBe("en");
      expect(resolveInitialLocale(null, "en-GB")).toBe("en");
      expect(resolveInitialLocale(null, "fr-FR")).toBe("en");
      expect(resolveInitialLocale(null, "de-DE")).toBe("en");
      expect(resolveInitialLocale(null, undefined)).toBe("en");
    });
  });

  describe("Dictionaries & Type Safety", () => {
    it("ensures es dictionary matches all en keys recursively", () => {
      function getKeys(obj: Record<string, any>, prefix = ""): string[] {
        return Object.keys(obj).flatMap((key) => {
          const val = obj[key];
          const newPath = prefix ? `${prefix}.${key}` : key;
          if (typeof val === "object" && val !== null) {
            return getKeys(val, newPath);
          }
          return [newPath];
        });
      }

      const enKeys = getKeys(en).sort();
      const esKeys = getKeys(es).sort();
      expect(esKeys).toEqual(enKeys);
    });
  });

  describe("useTranslation hook & dayjs synchronization", () => {
    it("provides translation function with parameter interpolation", () => {
      const { t, setLocale } = useTranslation.getState();
      setLocale("en");

      expect(t("common.cancel")).toBe("Cancel");
      expect(t("chat.profilePictureOf", { name: "Alice" })).toBe("Profile picture of Alice");

      setLocale("es");
      expect(t("common.cancel")).toBe("Cancelar");
      expect(t("chat.profilePictureOf", { name: "Alice" })).toBe("Foto de perfil de Alice");
      expect(t("chat.statusRead")).toBe("Mensaje leído");
      expect(t("chat.uploadProgress")).toBe("Progreso de subida");
    });

    it("synchronizes dayjs.locale when switching runtime locales", () => {
      const { setLocale } = useTranslation.getState();

      setLocale("es");
      expect(useTranslation.getState().locale).toBe("es");
      expect(localStorage.getItem("chatme_locale")).toBe("es");
      expect(dayjs.locale()).toBe("es");

      setLocale("en");
      expect(useTranslation.getState().locale).toBe("en");
      expect(localStorage.getItem("chatme_locale")).toBe("en");
      expect(dayjs.locale()).toBe("en");
    });
  });
});
