import { useState, useEffect } from "react";
import "./App.css";
import {
  useDarkMode,
  ChatList,
  ChatHeader,
  InputContainer,
  Messages,
  UserProfile,
  Welcome,
  SearchChats,
  LeftDrawerContent,
  ContactInfoContent,
} from "./components";
import MESSAGES from "./utils/messages.json";
import { INITIAL_CHAT } from "./utils/constants";
import { useGetContacts } from "./utils/useGetContacts";
import { Contact } from "./types";

function App() {
  const { mode } = useDarkMode();
  const [messages, setMessages] = useState<Array<Messages>>([]);
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const { isError, isLoading, data } = useGetContacts();

  useEffect(() => {
    setMessages([]);

    setTimeout(() => {
      setMessages([...MESSAGES.slice(0, 20)]);
    }, 250);
  }, [selectedChat]);

  return (
    <div
      className={`${mode} md:overflow-x-auto max-h-screen min-w-screen flex`}
    >
      <main className="app-container min-w-md w-full dark:bg-slate-900 overflow-hidden flex">
        <section className="user-chats relative">
          <UserProfile />
          <SearchChats />
          <ChatList
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            chats={data}
            isError={isError}
            isLoading={isLoading}
          />
          <LeftDrawerContent />
        </section>
        <section className="flex-1 w-full flex">
          <div className="chat-container flex-1">
            {!selectedChat ? (
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
