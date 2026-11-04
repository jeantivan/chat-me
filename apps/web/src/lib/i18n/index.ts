import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/en";
import { create } from "zustand";
import en from "./en";
import es, { TranslationSchema } from "./es";

export type Locale = "en" | "es";

export const LOCALE_STORAGE_KEY = "chatme_locale";

const dictionaries: Record<Locale, TranslationSchema> = {
  en,
  es,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationSchema>;

export function resolveInitialLocale(
  savedPreference?: string | null,
  browserLanguage?: string
): Locale {
  if (savedPreference === "en" || savedPreference === "es") {
    return savedPreference;
  }
  if (browserLanguage && browserLanguage.toLowerCase().startsWith("es")) {
    return "es";
  }
  return "en";
}

export function syncDayjsLocale(locale: Locale): void {
  dayjs.locale(locale);
}

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // localStorage might be unavailable/restricted
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore localStorage write error
    }
  },
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function interpolate(
  text: string,
  params?: Record<string, string | number>
): string {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [key, val]) => {
    return acc.replace(
      new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, "g"),
      String(val)
    );
  }, text);
}

export interface I18nStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const getStoredLocale = (): string | null => {
  return safeStorage.getItem(LOCALE_STORAGE_KEY);
};

const getBrowserLocale = (): string | undefined => {
  if (typeof navigator !== "undefined") {
    return navigator.language;
  }
  return undefined;
};

const initialLocale = resolveInitialLocale(getStoredLocale(), getBrowserLocale());
syncDayjsLocale(initialLocale);

export const useTranslation = create<I18nStore>((set, get) => ({
  locale: initialLocale,
  setLocale: (locale: Locale) => {
    safeStorage.setItem(LOCALE_STORAGE_KEY, locale);
    syncDayjsLocale(locale);
    set({ locale });
  },
  t: (key: TranslationKey, params?: Record<string, string | number>) => {
    const activeLocale = get().locale;
    const dict = dictionaries[activeLocale] || dictionaries.en;
    const raw = getNestedValue(dict, key);
    return interpolate(raw, params);
  },
}));

export default useTranslation;
