import "./App.css";
import { Main, LeftColumn, Chat } from "@/containers";
import { RightColumn } from "./containers/RightColumn";

import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";

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
  return (
    <Main>
      <LeftColumn />

      <RightColumn />
    </Main>
  );
}

export default App;
