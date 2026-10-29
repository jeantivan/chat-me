import "@/styles/App.css";
import "@/styles/themes/index.css";

import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider } from "./lib/auth/AuthContext";
import { ThemeSync } from "./components/ThemeSync";
import { InAppNotificationBanner } from "./components/InAppNotificationBanner";
import { router } from "./routes/router";

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <InAppNotificationBanner />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
