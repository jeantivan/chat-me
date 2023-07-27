import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { IconButton } from "./ui/IconButton";
import useStore from "@/lib/store";
import { ChatItem } from "./ChatItem";

export function ArchivedChats() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);

  const chats = useStore((state) => state.chats);

  const archivedChats = chats.filter((c) => c.archived);

  return (
    <>
      <header className="pt-16 bg-primary-9 dark:bg-background-2 pb-5">
        <motion.div
          transition={{ type: "tween", delay: 0.15 }}
          initial={{
            x: -20,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          className="px-4 flex items-center gap-6"
        >
          <IconButton
            onClick={closeLeftDrawer}
            className="text-background-1 dark:text-background-12 hover:bg-background-6/20"
            icon={ArrowLeft}
            label="Volver atrás"
          />
          <h2
            id="left-drawer-title"
            className="text-background-1 dark:text-background-12 text-xl"
          >
            Chats archivados
          </h2>
        </motion.div>
      </header>
      <div className="p-2 overflow-y-auto flex-1 flex flex-col h-full">
        {archivedChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </>
  );
}
