import { useState } from "react";
import { BsPaperclip, BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { AttachFilesMenu } from "./AttachFilesMenu";
import { CustomIcon } from "./CustomIcon";

const generateRandomId = () => (Math.random() + 1).toString(36).substring(2);
const getMessageHour = () => {
  const date = new Date();
  let minutes =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();

  let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();

  let terminal = date.getHours() > 12 ? "PM" : "AM";

  return `${hours}:${minutes} ${terminal}`;
};

export function InputContainer({ setMessages }) {
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    if (!message && e.target.value === " ") return;
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessages((prevMessages) => [
      {
        id: generateRandomId(),
        message: message.trim(),
        type: "send",
        time: getMessageHour(),
      },
      ...prevMessages,
    ]);
    setMessage("");
  };
  return (
    <div className="input-container dark:bg-slate-700 h-full py-2 px-6 flex">
      <div className="flex items-center">
        <div className="w-10 h-10 p-2 rounded-full dark:text-slate-400 text-slate-600">
          <CustomIcon Icon={BsEmojiSmile} label="Mostrar emojis" />
        </div>
        <div className="ml-2 flex items-center">
          <AttachFilesMenu />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="w-full flex ">
        <div className="w-full mx-4 dark:text-gray-400 text-gray-500 dark:bg-slate-600 bg-zinc-200 rounded-md">
          <input
            className="w-full py-2 max-w-full px-3 bg-transparent focus:outline-none dark:text-white text-black"
            placeholder="Escribe un mensaje aquí"
            value={message}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center">
          <button
            type="submit"
            disabled={!Boolean(message)}
            className="w-7 h-7 dark:disabled:text-slate-500 disabled:text-slate-600 text-emerald-500 p-0.5"
          >
            <CustomIcon Icon={IoSend} label="Enviar mensaje" />
          </button>
        </div>
      </form>
    </div>
  );
}
