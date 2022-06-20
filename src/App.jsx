import { useState } from "react";
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
  const { mode } = useDarkMode();
  const [messages, setMessages] = useState([...MESSAGES]);

  return (
    <div className={`${mode} app-container`}>
      <Header />
      <main className="main chat-container dark:bg-slate-900 overflow-hidden">
        <ContactInfo />
        <UserProfile />
        <ChatList />
        <Messages messages={messages} />
        <InputContainer setMessages={setMessages} />
      </main>
    </div>
  );
}

export default App;
