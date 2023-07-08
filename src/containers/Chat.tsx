import { ReactNode } from "react";
import {
  Welcome,
  Messages,
  InputContainer,
  ChatHeader,
  CreateMessage,
  ContactInfoContent,
  ContactInfoProvider,
} from "@/components";
import useStore from "@/lib/store";

const Container = ({ children }: { children: ReactNode }) => (
  <ContactInfoProvider>
    <section className="flex-1 w-full flex">{children}</section>
  </ContactInfoProvider>
);

export function Chat() {
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === state.currentChatId)
  );

  const getAllMessages = useStore((state) => state.getAllMessages);

  if (chat?.shouldLoadOldMsg) {
    getAllMessages();
  }

  return (
    <Container>
      {!chat && <Welcome />}
      {chat && (
        <>
          <div className="chat-container flex-1">
            <ChatHeader chat={chat} />
            <Messages
              messages={chat.messages}
              shouldLoadOldMsg={chat.shouldLoadOldMsg}
            />
            <InputContainer>
              <CreateMessage chatId={chat.id} />
            </InputContainer>
          </div>
          <ContactInfoContent chat={chat} />
        </>
      )}
    </Container>
  );
}
