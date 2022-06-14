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
import MESSAGES from "./utils/messages.json";

function App() {
  //const containerRef = useRef(null);
  const { mode } = useDarkMode();

  return (
    <div className={`${mode} app-container`}>
      <Header />
      <main className="main chat-container dark:bg-slate-900 overflow-hidden">
        <ContactInfo />
        <UserProfile />
        <ChatList />
        <Messages messages={MESSAGES} />
        <InputContainer />
      </main>
    </div>
  );
}

export default App;
