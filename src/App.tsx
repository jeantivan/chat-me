import { useState, useEffect, useRef } from "react";
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
  Message,
  CreateMessage,
} from "./components";
import MESSAGES from "./assets/mock-data/messages.json";
import NEW_MESSAGES from "./assets/mock-data/new_messages.json";
import { useGetContacts } from "./utils/useGetContacts";
import { ContactType, MessageType, ReactionListType } from "./types";

const messagesCopy = [...NEW_MESSAGES] as MessageType[];

function App() {
  const messagesContainer = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useDarkMode();
  const [messages, setMessages] = useState<Array<MessageType>>(messagesCopy);
  const [selectedChat, setSelectedChat] = useState<ContactType | null>(null);
  const { isError, isLoading, data } = useGetContacts();

  const addMessage = (newMessage: MessageType) => {
    let copyMessages = [...messages];

    copyMessages.push(newMessage);

    setMessages(copyMessages);

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

  const findAndDeleteMessageById = (id: string) => {
    const indexOfMessageToDelete = messages.findIndex(
      (message) => message.id === id
    );

    if (indexOfMessageToDelete < 0) {
      console.error("No hay mensaje para borrar");
      return;
    }

    let newMessageList = [...messages];

    newMessageList.splice(indexOfMessageToDelete, 1);

    setMessages(newMessageList);
  };

  const findAndToggleFavMessage = (id: string) => {
    let messagesCopy = [...messages];

    let newMessages = messagesCopy.map((message) =>
      message.id === id
        ? { ...message, isFavMsg: message.isFavMsg < 0 ? 1 : -1 }
        : message
    );

    setMessages(newMessages);
  };

  const addOwnReaction = (id: string, reactionType: ReactionListType) => {
    const messageCopy = [...messages];

    const newMessages = messageCopy.map((message) => {
      if (message.id !== id) {
        return message;
      }

      let newReaction = {
        reaction: {
          isOwnReaction: true,
          type: reactionType,
        },
      };

      return { ...message, reactions: [...message.reactions, newReaction] };
    });

    setMessages(newMessages);
  };

  const changeOwnReaction = (id: string, reactionType: ReactionListType) => {
    const messageCopy = [...messages];

    const newMessages = messageCopy.map((message) => {
      if (message.id !== id) {
        return message;
      }

      return {
        ...message,
        reactions: message.reactions.map(({ reaction }) => {
          if (!reaction.isOwnReaction) {
            return { reaction };
          }

          return {
            reaction: { ...reaction, type: reactionType },
          };
        }),
      };
    });

    setMessages(newMessages);
  };

  const deleteOwnReaction = (id: string) => {
    const messageCopy = [...messages];

    const newMessages = messageCopy.map((message) => {
      if (message.id !== id) {
        return message;
      }

      return {
        ...message,
        reactions: message.reactions.filter(
          ({ reaction }) => reaction.isOwnReaction !== true
        ),
      };
    });

    setMessages(newMessages);
  };

  // useEffect(() => {
  //   setMessages([]);

  //   setTimeout(() => {
  //     setMessages(messagesCopy);
  //   }, 250);
  // }, [selectedChat]);

  useEffect(() => {
    if (messagesContainer.current) {
      messagesContainer.current.scrollTo(
        0,
        messagesContainer.current.scrollHeight
      );
    }
  }, [messages]);

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
                <Messages ref={messagesContainer}>
                  {messages.map((message, i, array) => {
                    let hasTail =
                      i === 0 || message.isOwnMsg !== array[i - 1].isOwnMsg;

                    return (
                      <Message
                        key={message.id}
                        hasTail={hasTail}
                        deleteMsg={findAndDeleteMessageById}
                        favMsg={findAndToggleFavMessage}
                        addOwnReaction={addOwnReaction}
                        deleteOwnReaction={deleteOwnReaction}
                        changeOwnReaction={changeOwnReaction}
                        {...message}
                      />
                    );
                  })}
                </Messages>
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
