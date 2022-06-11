import {
  Header,
  //Ball,
  //ChatWindow,
  useDarkMode,
} from "./components";

function App() {
  //const containerRef = useRef(null);
  const { mode } = useDarkMode();

  return (
    <div className={`${mode} app-container`}>
      <Header />
      <main className="main flex p-4 justify-center">
        {/* <ChatWindow />
        <div ref={containerRef} className="w-full h-full relative">
          <Ball ref={containerRef} />
        </div> */}
      </main>
    </div>
  );
}

export default App;
