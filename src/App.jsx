import { useState } from "react";
import {
  useDarkMode,
  ChatList,
  ChatHeader,
  InputContainer,
  Messages,
  UserProfile,
  Welcome,
  SearchChats,
} from "./components";
import "./App.css";
import MESSAGES from "./utils/messages.json";
import { INITIAL_CHAT } from "./utils/constants";
import { useGetContacts } from "./utils/useGetContacts";
import { useEffect } from "react";
import { ContactInfoContent } from "./components/ContactInfo";

function App() {
  const { mode } = useDarkMode();
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(INITIAL_CHAT);
  const { isError, isLoading, data } = useGetContacts();

  useEffect(() => {
    setMessages([]);
    if (selectedChat.id !== INITIAL_CHAT.id) {
      setTimeout(() => {
        setMessages([...MESSAGES.slice(0, 20)]);
      }, 250);
    }
  }, [selectedChat]);

  return (
    <div
      className={`${mode} md:overflow-x-auto max-h-screen min-w-screen flex`}
    >
      <main className="app-container min-w-md w-full dark:bg-slate-900 overflow-hidden flex">
        <section className="user-chats">
          <UserProfile />
          <SearchChats />
          <ChatList
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            chats={data}
            isError={isError}
            isLoading={isLoading}
          />
        </section>
        <section className="flex-1 w-full flex">
          <div className="chat-container flex-1">
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
          </div>
          <ContactInfoContent selectedChat={selectedChat} />
        </section>
      </main>
    </div>
  );
}

export default App;
