import "@/styles/App.css";
import { Main, LeftColumn } from "@/containers";
import { RightColumn } from "./containers/RightColumn";

import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import useStore from "@/lib/store";
import { Loading } from "./components/Loading";

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

function App() {
  const loading = useStore((state) => state.loading);

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

export default App;
