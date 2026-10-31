import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "../socket/useSocketSync";
import { getAuthHeaders } from "../auth/authClient";
import { useAuth } from "../auth/AuthContext";
import useStore from "../store";
import type { TTheme } from "../types";
import type { UserSettingsData, UpdateUserSettingsInput } from "@chat-me/shared";

const fallbackQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function useSafeQueryClient(): QueryClient {
  try {
    return useQueryClient();
  } catch {
    return fallbackQueryClient;
  }
}

function useSafeAuth(): { isAuthenticated: boolean; token: string | null } {
  try {
    return useAuth();
  } catch {
    return { isAuthenticated: false, token: null };
  }
}

function applySettingsToZustand(settings: Partial<UserSettingsData>) {
  const store = useStore.getState();
  if (settings.themeMode) {
    store.changeThemeMode(settings.themeMode);
  }
  if (settings.themeColor) {
    store.changeThemeColors(settings.themeColor as TTheme["colors"]);
  }
  if (settings.notifyAll !== undefined) {
    store.setNotification("all", settings.notifyAll);
  }
  if (settings.notifySound !== undefined) {
    store.setNotification("sound", settings.notifySound);
  }
  if (settings.notifyPreview !== undefined) {
    store.setNotification("preview", settings.notifyPreview);
  }
  if (settings.notifyReactions !== undefined) {
    store.setNotification("reactions", settings.notifyReactions);
  }
  if (settings.privacyLastSeen !== undefined) {
    store.setPrivacy("lastTimeOnline", settings.privacyLastSeen);
  }
  if (settings.privacyPicture !== undefined) {
    store.setPrivacy("picture", settings.privacyPicture);
  }
  if (settings.privacyBio !== undefined) {
    store.setPrivacy("bio", settings.privacyBio);
  }
  if (settings.privacyGroups !== undefined) {
    store.setPrivacy("groups", settings.privacyGroups);
  }
  if (settings.privacyReadReceipt !== undefined) {
    store.setPrivacy("readReceipt", settings.privacyReadReceipt);
  }
}

export function useUserSettings() {
  const { isAuthenticated, token } = useSafeAuth();
  const queryClient = useSafeQueryClient();

  return useQuery(
    {
      queryKey: chatKeys.settings,
      queryFn: async () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBase}/api/v1/users/me`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch user settings");
        const data = await res.json();
        return data.settings as UserSettingsData;
      },
      enabled: Boolean(isAuthenticated && token),
    },
    queryClient
  );
}

export function useUpdateSettings() {
  const queryClient = useSafeQueryClient();

  return useMutation(
    {
      mutationFn: async (input: UpdateUserSettingsInput) => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBase}/api/v1/users/me/settings`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to update settings");
        }

        return (await res.json()) as UserSettingsData;
      },
      onMutate: async (newSettingsInput) => {
        await queryClient.cancelQueries({ queryKey: chatKeys.settings });
        const previousSettings = queryClient.getQueryData<UserSettingsData>(chatKeys.settings);

        // Optimistically update TanStack Query cache
        if (previousSettings) {
          queryClient.setQueryData<UserSettingsData>(chatKeys.settings, {
            ...previousSettings,
            ...newSettingsInput,
          });
        }

        // Snapshot Zustand store for rollback
        const zustandStore = useStore.getState();
        const previousZustand = {
          themeMode: zustandStore.theme.mode,
          themeColors: zustandStore.theme.colors,
          notifications: { ...zustandStore.notifications },
          privacy: { ...zustandStore.privacy },
        };

        // Optimistically update Zustand store
        applySettingsToZustand(newSettingsInput);

        return { previousSettings, previousZustand };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousSettings) {
          queryClient.setQueryData<UserSettingsData>(chatKeys.settings, context.previousSettings);
        }
        if (context?.previousZustand) {
          const store = useStore.getState();
          store.changeThemeMode(context.previousZustand.themeMode);
          store.changeThemeColors(context.previousZustand.themeColors);
          store.setNotification("all", context.previousZustand.notifications.all);
          store.setNotification("sound", context.previousZustand.notifications.sound);
          store.setNotification("preview", context.previousZustand.notifications.preview);
          store.setNotification("reactions", context.previousZustand.notifications.reactions);
          store.setPrivacy("lastTimeOnline", context.previousZustand.privacy.lastTimeOnline);
          store.setPrivacy("picture", context.previousZustand.privacy.picture);
          store.setPrivacy("bio", context.previousZustand.privacy.bio);
          store.setPrivacy("groups", context.previousZustand.privacy.groups);
          store.setPrivacy("readReceipt", context.previousZustand.privacy.readReceipt);
        }
      },
      onSuccess: (updatedSettings) => {
        queryClient.setQueryData<UserSettingsData>(chatKeys.settings, updatedSettings);
        applySettingsToZustand(updatedSettings);
      },
    },
    queryClient
  );
}
