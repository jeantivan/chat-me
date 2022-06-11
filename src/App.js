import {
  Header,
  //Ball,
  //ChatWindow,
  useDarkMode,
  ChatList,
  ContactInfo,
  InputContainer,
  Messages,
  UserProfile,
} from "./components";
import "./App.css";

function App() {
  //const containerRef = useRef(null);
  const { mode } = useDarkMode();

  return (
    <div className={`${mode} app-container`}>
      <Header />
      <main className="main chat-container dark:bg-slate-900">
        <ContactInfo />
        <UserProfile />
        <ChatList />
        <Messages />
        <InputContainer />
      </main>
    </div>
  );
}

export default App;
