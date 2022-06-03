import { Header, Ball } from "./components";

function App() {
  return (
    <>
      <Header />
      <main className="main flex relative p-4">
        <Ball />
        <div className="w-full border-r-2 border-t-2 border-red-600" />
      </main>
    </>
  );
}

export default App;
