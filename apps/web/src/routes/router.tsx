import { useEffect } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Main, LeftColumn, RightColumn } from "@/containers";
import { Loading } from "@/components/Loading";
import { AuthDialog } from "@/components/Auth/AuthDialog";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSocketSync } from "@/lib/socket/useSocketSync";
import { getSocket } from "@/lib/socket/socketClient";
import useStore from "@/lib/store";

function RootLayout() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const loading = useStore((state) => state.loading);
  const currentChatId = useStore((state) => state.currentChatId);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = getSocket(token);
      if (!socket.connected) {
        socket.connect();
      }
      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  // Real-time synchronization bridge with TanStack Query
  useSocketSync(currentChatId, user?.id);

  // When currentChatId changes or socket connects, join chat room
  useEffect(() => {
    if (isAuthenticated && currentChatId && token) {
      const socket = getSocket(token);
      const joinRoom = () => socket.emit("chat:join", currentChatId);
      if (socket.connected) {
        joinRoom();
      }
      socket.on("connect", joinRoom);
      return () => {
        socket.off("connect", joinRoom);
      };
    }
  }, [isAuthenticated, currentChatId, token]);

  if (isLoading) {
    return (
      <Main>
        <Loading />
      </Main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Main>
        <AuthDialog open={true} />
      </Main>
    );
  }

  return (
    <Main>
      {loading !== "ready" ? (
        <Loading />
      ) : (
        <>
          <LeftColumn />
          <RightColumn />
        </>
      )}
      <Outlet />
    </Main>
  );
}

function IndexComponent() {
  const closeChat = useStore((state) => state.closeChat);
  useEffect(() => {
    closeChat();
  }, [closeChat]);

  return null;
}

function ChatRouteComponent() {
  const { chatId } = chatRoute.useParams();
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);

  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
    }
  }, [chatId, setCurrentChatId]);

  return null;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexComponent,
});

export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/c/$chatId",
  component: ChatRouteComponent,
});

const routeTree = rootRoute.addChildren([indexRoute, chatRoute]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
