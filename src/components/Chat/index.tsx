import { AnimatePresence } from "framer-motion";

import { Header } from "./Header";
import { Editor } from "./Editor";
import { Messages } from "./Messages";
import { ContactInfo } from "./ContactInfo";
import { StarredMessages } from "./StarredMessages";
import { SharedContent } from "./SharedContent";

import { RightDrawer, RightDrawerElement } from "@/components/RightDrawer";
import useStore from "@/lib/store";

export function Chat({ chatId }: { chatId: string }) {
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === chatId)
  );

  if (!chat) return null;

  return (
    <div className="relative w-full h-full flex">
      <AnimatePresence mode="wait">
        <div className="chat-container flex-1 min-h-screen">
          <Header chat={chat} />
          <Messages messages={chat.messages} />
          <Editor key={chat.id} chatId={chat.id} />
        </div>
        <RightDrawer>
          <RightDrawerElement
            key="CONTACT_INFO"
            option="CONTACT_INFO"
            Component={ContactInfo}
          />
          <RightDrawerElement
            key="STARRED_MESSAGES"
            option="STARRED_MESSAGES"
            Component={StarredMessages}
          />
          <RightDrawerElement
            key="SHARED_CONTENT"
            option="SHARED_CONTENT"
            Component={SharedContent}
          />
        </RightDrawer>
      </AnimatePresence>
    </div>
  );
}
