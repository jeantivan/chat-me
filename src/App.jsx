import { useState } from "react";
import {
  useDarkMode,
  ChatList,
  ChatHeader,
  InputContainer,
  Messages,
  UserProfile,
  Welcome,
} from "./components";
import "./App.css";
import MESSAGES from "./utils/messages.json";
import { CHATS, INITIAL_CHAT } from "./utils/constants";
import { useEffect } from "react";

const CONTACTS = [];

function App() {
  const { mode } = useDarkMode();
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(INITIAL_CHAT);

  useEffect(() => {
    setMessages([]);
    if (selectedChat.id !== INITIAL_CHAT.id) {
      setTimeout(() => {
        setMessages([...MESSAGES]);
      }, 250);
    }
  }, [selectedChat]);

  return (
    <div className={`${mode} app-container`}>
      <main className="main chat-container dark:bg-slate-900 overflow-hidden">
        <UserProfile />
        <ChatList
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          contacts={CONTACTS}
          chats={CHATS}
        />

        {!selectedChat.contactName ? (
          <Welcome />
        ) : (
          <>
            <ChatHeader
              setSelectedChat={setSelectedChat}
              selectedChat={selectedChat}
            />
            <Messages messages={messages} />
            <InputContainer setMessages={setMessages} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
