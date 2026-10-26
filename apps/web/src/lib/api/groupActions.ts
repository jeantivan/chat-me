import { getAuthHeaders } from "@/lib/auth/authClient";

const getApiBase = () => import.meta.env.VITE_API_BASE_URL || "";

export async function updateGroupMetadata(
  chatId: string,
  data: { title?: string; bio?: string | null; pictureUrl?: string | null }
): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/api/v1/chats/${chatId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function addGroupParticipants(
  chatId: string,
  userIds: string[]
): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/api/v1/chats/${chatId}/participants`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ userIds }),
  });
  return res.ok;
}

export async function updateParticipantRole(
  chatId: string,
  userId: string,
  role: "admin" | "member"
): Promise<boolean> {
  const res = await fetch(
    `${getApiBase()}/api/v1/chats/${chatId}/participants/${userId}/role`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ role }),
    }
  );
  return res.ok;
}

export async function removeParticipant(
  chatId: string,
  userId: string
): Promise<boolean> {
  const res = await fetch(
    `${getApiBase()}/api/v1/chats/${chatId}/participants/${userId}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    }
  );
  return res.ok;
}
