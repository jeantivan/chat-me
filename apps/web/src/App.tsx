import { useEffect } from "react";
import "@/styles/App.css";
import "@/styles/themes/index.css";
import { Main, LeftColumn, RightColumn } from "@/containers";

import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useStore from "@/lib/store";
import { Loading } from "./components/Loading";
import { AuthProvider, useAuth } from "./lib/auth/AuthContext";
import { AuthDialog } from "./components/Auth/AuthDialog";
import { useSocketSync } from "./lib/socket/useSocketSync";
import { getSocket } from "./lib/socket/socketClient";

dayjs.extend(updateLocale);
dayjs.extend(relativeTime);
dayjs.extend(calendar);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "now",
    m: "1 m",
    mm: "%d m",
    h: "1 h",
    hh: "%d h",
    d: "1 d",
    dd: "%d d",
    M: "m",
    MM: "%d m",
    y: "1 y",
    yy: "%d y",
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const loading = useStore((state) => state.loading);
  const { currentChatId, setCurrentChatId, closeChat } = useStore((state) => ({
    currentChatId: state.currentChatId,
    setCurrentChatId: state.setCurrentChatId,
    closeChat: state.closeChat,
  }));

  // Route synchronization for /c/$chatId
  useEffect(() => {
    const handleLocationChange = () => {
      const match = window.location.pathname.match(/^\/c\/([^/]+)/);
      if (match && match[1]) {
        setCurrentChatId(match[1]);
      } else if (window.location.pathname === "/" || window.location.pathname === "") {
        closeChat();
      }
    };

    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [setCurrentChatId, closeChat]);

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
    </Main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
