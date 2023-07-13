import "./App.css";
import { Main, LeftColumn, Chat } from "@/containers";
import { RightColumn } from "./containers/RightColumn";

function App() {
  return (
    <Main>
      <LeftColumn />

      <RightColumn />
    </Main>
  );
}

export default App;
