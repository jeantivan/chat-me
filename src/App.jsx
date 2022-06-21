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
  Welcome,
} from "./components";
import "./App.css";
import MESSAGES from "./utils/messages.json";
import { CHATS } from "./utils/constants";

const CONTACTS = [];

function App() {
  const { mode } = useDarkMode();
  const [messages, setMessages] = useState([...MESSAGES]);
  const [selectedChat, setSelectedChat] = useState({
    id: "",
    contactName: "",
    lastMessage: "",
    time: "",
    photo: "",
  });

  console.log(selectedChat);

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
            <ContactInfo
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
