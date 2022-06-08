import { Header, Ball, ChatWindow } from "./components";
import { useRef } from "react";

function App() {
  const containerRef = useRef(null);

  return (
    <div class="dark app-container">
      <Header />
      <main className="main flex p-4 justify-center">
        <ChatWindow />
        <div ref={containerRef} className="w-full h-full relative">
          <Ball ref={containerRef} />
        </div>
      </main>
    </div>
  );
}

export default App;
