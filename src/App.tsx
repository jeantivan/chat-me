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
import MESSAGES from "./utils/mock-data/messages.json";
import { useGetContacts } from "./utils/useGetContacts";
import { ContactType, MessageType } from "./types";
import { CreateMessage } from "./components/CreateMessage";

const messagesCopy = [...MESSAGES] as MessageType[];

function App() {
  const { isDarkMode } = useDarkMode();
  const [messages, setMessages] = useState<Array<MessageType>>(messagesCopy);
  const [selectedChat, setSelectedChat] = useState<ContactType | null>(null);
  const { isError, isLoading, data } = useGetContacts();

  const addMessage = (newMessage: MessageType) => {
    setMessages([newMessage, ...messages]);

    setTimeout(() => {
      findAndUpdateMessageStatus(newMessage.id);
      setTimeout(() => {
        findAndUpdateMessageStatus(newMessage.id);
      }, 1000);
    }, 1000);
  };

  const findAndUpdateMessageStatus = (id: string) => {
    setMessages((prevMessages) => {
      const newMessages = prevMessages.map((message) => {
        if (message.id !== id) return message;

        let newMessage = message;
        if (message.status === "send") {
          newMessage = { ...message, status: "received" };
        } else if (message.status === "received") {
          newMessage = { ...message, status: "read" };
        }
        return newMessage;
      });

      return newMessages;
    });
  };

  useEffect(() => {
    setMessages([]);

    setTimeout(() => {
      setMessages(messagesCopy);
    }, 250);
  }, [selectedChat]);

  return (
    <div
      className={`${
        isDarkMode ? "dark" : "light"
      } md:overflow-x-auto max-h-screen min-w-screen flex`}
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
                <InputContainer>
                  <CreateMessage addMessage={addMessage} />
                </InputContainer>
              </>
            )}
          </div>
          {selectedChat && <ContactInfoContent selectedChat={selectedChat} />}
        </section>
      </main>
    </div>
  );
}

export default App;
