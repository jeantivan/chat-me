import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "../socket/useSocketSync";
import { getAuthHeaders } from "../auth/authClient";
import { useAuth } from "../auth/AuthContext";
import useStore from "../store";
import type {
  UserProfile,
  UpdateProfileInput,
  PresignAvatarResponse,
} from "@chat-me/shared";

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

export function useUserProfile() {
  const { isAuthenticated, token } = useSafeAuth();
  const queryClient = useSafeQueryClient();
  return useQuery(
    {
      queryKey: chatKeys.user,
      queryFn: async () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBase}/api/v1/users/me`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch user profile");
        const data = await res.json();
        return data.user as UserProfile;
      },
      enabled: Boolean(isAuthenticated && token),
    },
    queryClient
  );
}

export function useUpdateProfile() {
  const queryClient = useSafeQueryClient();

  return useMutation(
    {
      mutationFn: async (input: UpdateProfileInput) => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBase}/api/v1/users/me/profile`, {
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
          throw new Error(errJson.error || "Failed to update profile");
        }

        return (await res.json()) as UserProfile;
      },
      onMutate: async (newProfileInput) => {
        await queryClient.cancelQueries({ queryKey: chatKeys.user });
        const previousProfile = queryClient.getQueryData<UserProfile>(chatKeys.user);

        // Optimistically update TanStack Query cache
        if (previousProfile) {
          queryClient.setQueryData<UserProfile>(chatKeys.user, {
            ...previousProfile,
            ...(newProfileInput.name !== undefined && { name: newProfileInput.name }),
            ...(newProfileInput.bio !== undefined && { bio: newProfileInput.bio }),
            ...(newProfileInput.pictureUrl !== undefined && { pictureUrl: newProfileInput.pictureUrl }),
          });
        }

        // Optimistically update Zustand store
        const zustandUser = useStore.getState().user;
        const previousZustand = { ...zustandUser };

        if (newProfileInput.name !== undefined) {
          useStore.getState().changeName(newProfileInput.name);
        }
        if (newProfileInput.bio !== undefined) {
          useStore.getState().changeBio(newProfileInput.bio);
        }
        if (newProfileInput.pictureUrl !== undefined) {
          useStore.getState().changePicture(newProfileInput.pictureUrl);
        }

        return { previousProfile, previousZustand };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousProfile) {
          queryClient.setQueryData<UserProfile>(chatKeys.user, context.previousProfile);
        }
        if (context?.previousZustand) {
          useStore.getState().changeName(context.previousZustand.name);
          useStore.getState().changeBio(context.previousZustand.bio);
          useStore.getState().changePicture(context.previousZustand.picture);
        }
      },
      onSuccess: (updatedProfile) => {
        queryClient.setQueryData<UserProfile>(chatKeys.user, updatedProfile);
        useStore.getState().changeName(updatedProfile.name);
        useStore.getState().changeBio(updatedProfile.bio);
        useStore.getState().changePicture(updatedProfile.pictureUrl);
      },
    },
    queryClient
  );
}

export async function uploadAvatar(file: File): Promise<string> {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedMimes.includes(file.type)) {
    throw new Error("Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF");
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Image file size exceeds maximum limit of 5 MB");
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const presignRes = await fetch(`${apiBase}/api/v1/users/me/avatar/presign`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  if (!presignRes.ok) {
    const errJson = await presignRes.json().catch(() => ({}));
    throw new Error(errJson.error || "Failed to get presigned upload URL");
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as PresignAvatarResponse;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload avatar image to storage");
  }

  return publicUrl;
}
