import { useEffect } from "react";
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
  CreateMessage,
} from "./components";

import useStore from "./store";
import { MessageType } from "./types";

function App() {
  const { isDarkMode } = useDarkMode();

  const currentChatId = useStore((state) => state.currentChatId);

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
          <ChatList />
          <LeftDrawerContent />
        </section>
        <section className="flex-1 w-full flex">
          <div className="chat-container flex-1">
            {!currentChatId ? (
              <Welcome />
            ) : (
              <>
                <ChatHeader />
                <Messages />

                <InputContainer>
                  <CreateMessage />
                </InputContainer>
              </>
            )}
          </div>
          <ContactInfoContent />
        </section>
      </main>
    </div>
  );
}

export default App;
