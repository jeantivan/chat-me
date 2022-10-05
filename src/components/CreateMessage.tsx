import { useState } from "react";
import { IoSend } from "react-icons/io5";
import { v4 as uuid } from "uuid";
import useStore from "../store";
import { MessageType } from "../types";
import { CustomIcon } from "./CustomIcon";

const getMessageHour = () => {
  const date = new Date();
  let minutes =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();

  let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();

  let terminal = date.getHours() > 12 ? "PM" : "AM";

  return `${hours}:${minutes} ${terminal}`;
};

const createMessage = (content: string): MessageType => {
  return {
    id: uuid(),
    message: { type: "text", content },
    status: "idle",
    isOwnMsg: true,
    isFavMsg: false,
    reactions: [],
    time: getMessageHour(),
  };
};

interface CreateMessageProps {
  addMessage: (message: MessageType) => void;
}

export function CreateMessage() {
  const [content, setContent] = useState("");
  const addMessage = useStore((state) => state.addMessage);
  const currentChatId = useStore((state) => state.currentChatId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    addMessage(createMessage(content), currentChatId);
    setContent("");
  };

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setContent(e.currentTarget.value);
  };
  return (
    <form onSubmit={handleSubmit} className="w-full flex">
      <div className="w-full mx-4 dark:text-gray-400 text-gray-500 dark:bg-slate-600 bg-white rounded-md">
        <input
          className="w-full py-2 max-w-full px-3 bg-transparent focus:outline-none dark:text-white text-black"
          placeholder="Escribe un mensaje aquí"
          value={content}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center">
        <button
          type="submit"
          disabled={!Boolean(content)}
          className="w-7 h-7 dark:disabled:text-slate-500 disabled:text-slate-600 text-emerald-500 p-0.5"
        >
          <CustomIcon Icon={IoSend} label="Enviar mensaje" />
        </button>
      </div>
    </form>
  );
}
