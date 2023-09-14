import { ImagePlus, X } from "lucide-react";

import { Header } from "./Header";
import { Editor } from "./Editor";
import { Messages } from "./Messages";
import { ContactInfo } from "./ContactInfo";
import { StarredMessages } from "./StarredMessages";
import { SharedContent } from "./SharedContent";

import { IconButton } from "@/components/ui/IconButton";
import { RightDrawer, RightDrawerElement } from "@/components/RightDrawer";
import { FilesToSend, useFilesToSend } from "@/components/SendFiles";

import useStore from "@/lib/store";
import { useUserId } from "@/lib/hooks";
import { createMessage } from "@/lib/utils/createMessage";
import mc from "@/lib/utils/mergeClassnames";

const Image = ({ image, className }: { image: File; className?: string }) => {
  const src = URL.createObjectURL(image);

  return (
    <img
      className={mc(className)}
      alt={image.name}
      src={src}
      onLoad={() => {
        URL.revokeObjectURL(src);
      }}
    />
  );
};

const FileList = () => {
  const { files, deleteFile } = useFilesToSend();

  if (files.length <= 0) return null;

  return (
    <div className="flex gap-2.5">
      {files.map((image) => (
        <div
          key={`${image.name}-preview`}
          className={mc("relative flex rounded")}
        >
          <button
            onClick={() => deleteFile(image)}
            className="z-20 rounded-full inline-flex items-center justify-center w-5 h-5 bg-red-600 text-background-12 absolute right-0 translate-x-1/4 -translate-y-1/4"
          >
            <X className="w-4 h-4" />
          </button>
          <button className="w-14 h-14 relative rounded bg-neutral-300 overflow-hidden">
            <Image image={image} className="w-full h-full object-cover" />
          </button>
        </div>
      ))}
    </div>
  );
};

const AddImage = () => {
  const { open, files } = useFilesToSend();
  return (
    <IconButton
      label="Añadir imagen o video"
      icon={ImagePlus}
      className="shrink-0 w-10 h-10 text-background-11"
      onClick={open}
      disabled={Boolean(files && files.length >= 5)}
    />
  );
};

export function Chat({ chatId }: { chatId: string }) {
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === chatId)
  );
  const userId = useUserId();
  const addMessage = useStore((state) => state.addMessage);

  if (!chat) return null;

  return (
    <div className="relative w-full h-full flex">
      <FilesToSend className="chat-container flex-1 min-h-screen">
        <Header chat={chat} />
        <Messages messages={chat.messages} />
        <div className="input-container bg-background-2 text-background-12 h-full py-3 px-5 grid items-center gap-2">
          <FileList />
          <div className="flex gap-2">
            <AddImage />
            <Editor key={chat.id} chatId={chat.id} />
          </div>
        </div>
      </FilesToSend>
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
    </div>
  );
}
