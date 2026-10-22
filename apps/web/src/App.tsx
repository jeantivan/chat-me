import "@/styles/App.css";
import "@/styles/themes/index.css";
import { Main, LeftColumn, RightColumn } from "@/containers";

import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import useStore from "@/lib/store";
import { Loading } from "./components/Loading";
import { AuthProvider, useAuth } from "./lib/auth/AuthContext";
import { AuthDialog } from "./components/Auth/AuthDialog";

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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const loading = useStore((state) => state.loading);

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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
