import { useEffect } from "react";
import "./App.css";
import {
  useDarkMode,
  ChatList,
  ChatHeader,
  InputContainer,
  Messages,
  Message,
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

  // const findAndUpdateMessageStatus = (id: string) => {
  //   setMessages((prevMessages) => {
  //     const newMessages = prevMessages.map((message) => {
  //       if (message.id !== id) return message;

  //       let newMessage = message;
  //       if (message.status === "send") {
  //         newMessage = { ...message, status: "received" };
  //       } else if (message.status === "received") {
  //         newMessage = { ...message, status: "read" };
  //       }
  //       return newMessage;
  //     });

  //     return newMessages;
  //   });
  // };

  // const findAndDeleteMessageById = (id: string) => {
  //   const indexOfMessageToDelete = messages.findIndex(
  //     (message) => message.id === id
  //   );

  //   if (indexOfMessageToDelete < 0) {
  //     console.error("No hay mensaje para borrar");
  //     return;
  //   }

  //   let newMessageList = [...messages];

  //   newMessageList.splice(indexOfMessageToDelete, 1);

  //   setMessages(newMessageList);
  // };

  // const findAndToggleFavMessage = (id: string) => {
  //   let messagesCopy = [...messages];

  //   let newMessages = messagesCopy.map((message) =>
  //     message.id === id ? { ...message, isFavMsg: !message.isFavMsg } : message
  //   );

  //   setMessages(newMessages);
  // };

  // const addOwnReaction = (id: string, reactionType: ReactionListType) => {
  //   const messageCopy = [...messages];

  //   const newMessages = messageCopy.map((message) => {
  //     if (message.id !== id) {
  //       return message;
  //     }

  //     let newReaction = {
  //       reaction: {
  //         isOwnReaction: true,
  //         type: reactionType,
  //       },
  //     };

  //     return { ...message, reactions: [...message.reactions, newReaction] };
  //   });

  //   setMessages(newMessages);
  // };

  // const changeOwnReaction = (id: string, reactionType: ReactionListType) => {
  //   const messageCopy = [...messages];

  //   const newMessages = messageCopy.map((message) => {
  //     if (message.id !== id) {
  //       return message;
  //     }

  //     return {
  //       ...message,
  //       reactions: message.reactions.map(({ reaction }) => {
  //         if (!reaction.isOwnReaction) {
  //           return { reaction };
  //         }

  //         return {
  //           reaction: { ...reaction, type: reactionType },
  //         };
  //       }),
  //     };
  //   });

  //   setMessages(newMessages);
  // };

  // const deleteOwnReaction = (id: string) => {
  //   const messageCopy = [...messages];

  //   const newMessages = messageCopy.map((message) => {
  //     if (message.id !== id) {
  //       return message;
  //     }

  //     return {
  //       ...message,
  //       reactions: message.reactions.filter(
  //         ({ reaction }) => reaction.isOwnReaction !== true
  //       ),
  //     };
  //   });

  //   setMessages(newMessages);
  // };

  // useEffect(() => {
  //   if (messagesContainer.current) {
  //     messagesContainer.current.scrollTo(
  //       0,
  //       messagesContainer.current.scrollHeight
  //     );
  //   }
  // }, [currentChat, messages.length]);

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
