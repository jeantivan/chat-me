import { useState } from "react";
import { IoSend } from "react-icons/io5";
import { v4 as uuid } from "uuid";
import { CustomIcon } from "./CustomIcon";
import useStore from "@/lib/store";
import { MessageType } from "@/lib/types";

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
    status: "read",
    isOwnMsg: true,
    isFavMsg: false,
    reactions: [],
    time: getMessageHour(),
  };
};

export function CreateMessage({ chatId }: { chatId: string }) {
  const [content, setContent] = useState("");
  const addMessage = useStore((state) => state.addMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    addMessage(createMessage(content), chatId);
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
          <CustomIcon icon={IoSend} label="Enviar mensaje" />
        </button>
      </div>
    </form>
  );
}
