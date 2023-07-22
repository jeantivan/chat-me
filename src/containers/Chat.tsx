import {
  Messages,
  ChatHeader,
  MessageInput,
  RightDrawer,
  RightDrawerElement,
} from "@/components";
import useStore from "@/lib/store";
import { ContactInfo } from "@/components/ContactInfo";
import { AnimatePresence, LayoutGroup } from "framer-motion";

// TODO: Animación de salida del left drawer

export function Chat({ chatId }: { chatId: string }) {
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === chatId)
  );

  if (!chat) return null;

  return (
    <div className="relative w-full h-full flex">
      <AnimatePresence mode="wait">
        <LayoutGroup>
          <div className="chat-container flex-1  min-h-screen">
            <ChatHeader chat={chat} />
            <Messages messages={chat.messages} />
            <MessageInput key={chat.id} />
          </div>
          <RightDrawer>
            <RightDrawerElement
              key="CONTACT_INFO"
              option="CONTACT_INFO"
              Component={ContactInfo}
            />
          </RightDrawer>
        </LayoutGroup>
      </AnimatePresence>
    </div>
  );
}
