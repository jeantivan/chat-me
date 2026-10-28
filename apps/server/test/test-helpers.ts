import { io as ioc, type Socket } from "socket.io-client";
import type { FastifyInstance } from "fastify";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@chat-me/shared";

/**
 * Resilient socket event waiter that filters events by predicate and unregisters
 * itself upon match or timeout, preventing listener leaks and cross-suite test crosstalk.
 */
export function waitForSocketEvent<T = any>(
  socket: Socket,
  event: string,
  predicate: (data: T) => boolean = () => true,
  timeoutMs = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(
        new Error(
          `Timed out waiting for socket event "${event}" after ${timeoutMs}ms (socket id: ${socket.id || "unconnected"})`
        )
      );
    }, timeoutMs);

    const handler = (data: T) => {
      try {
        if (predicate(data)) {
          clearTimeout(timer);
          socket.off(event, handler);
          resolve(data);
        }
      } catch (err) {
        clearTimeout(timer);
        socket.off(event, handler);
        reject(err);
      }
    };

    socket.on(event, handler);
  });
}

export async function registerTestUser(
  app: FastifyInstance,
  params: { email: string; password?: string; name: string }
): Promise<{ userId: string; accessToken: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email: params.email,
      password: params.password || "Password123!",
      name: params.name,
    },
  });
  const data = res.json();
  return {
    userId: data.user.id,
    accessToken: data.accessToken,
  };
}

export async function connectTestSocket(
  serverUrl: string,
  token: string
): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = ioc(
    serverUrl,
    {
      auth: { token },
      transports: ["websocket"],
    }
  );
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", (err) => reject(err));
  });
  return socket;
}
