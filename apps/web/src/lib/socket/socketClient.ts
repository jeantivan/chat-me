import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../auth/authClient";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@chat-me/shared";

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(token?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  const activeToken = token || getAccessToken() || undefined;
  if (!socketInstance) {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

    socketInstance = io(apiBaseUrl, {
      auth: { token: activeToken },
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  } else if (activeToken && socketInstance.auth) {
    (socketInstance.auth as { token?: string }).token = activeToken;
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
