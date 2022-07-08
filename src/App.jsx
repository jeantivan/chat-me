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
import { INITIAL_CHAT } from "./utils/constants";
import { useGetContacts } from "./utils/useGetContacts";
import { useEffect } from "react";
import { ContactInfoContent, useContactInfo } from "./components/ContactInfo";

function App() {
  const { mode } = useDarkMode();
  const { openContactInfo } = useContactInfo();
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(INITIAL_CHAT);
  const { isError, isLoading, data } = useGetContacts();

  useEffect(() => {
    setMessages([]);
    if (selectedChat.id !== INITIAL_CHAT.id) {
      setTimeout(() => {
        setMessages([...MESSAGES]);
      }, 250);
    }
  }, [selectedChat]);

  return (
    <div className={`${mode} app-container md:overflow-x-auto`}>
      <main className="main chat-container min-w-md dark:bg-slate-900 overflow-hidden">
        <UserProfile />
        <ChatList
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          chats={data}
          isError={isError}
          isLoading={isLoading}
        />

        {!selectedChat.name.fullName ? (
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
        <ContactInfoContent
          selectedChat={selectedChat}
          openContactInfo={openContactInfo}
        />
      </main>
    </div>
  );
}

export default App;
