import type { Socket } from "socket.io-client";

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
