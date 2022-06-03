import { Header, Ball } from "./components";
import { useRef } from "react";

function App() {
  const containerRef = useRef(null);

  return (
    <>
      <Header />
      <main className="main flex p-4">
        <div ref={containerRef} className="w-full h-full relative">
          <Ball ref={containerRef} />
        </div>
      </main>
    </>
  );
}

export default App;
