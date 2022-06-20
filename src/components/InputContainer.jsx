import { BsPaperclip, BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";

export function InputContainer() {
  return (
    <div className="input-container dark:bg-slate-700 h-full py-2 px-6 flex">
      <div className="flex items-center">
        <div className="w-7 h-7 dark:text-slate-500 text-slate-600 rounded-full mr-1">
          <BsPaperclip className="w-full h-full rotate-45" />
        </div>
        <div className="w-7 h-7 dark:text-slate-500 text-slate-600 p-0.5 rounded-full ml-1">
          <BsEmojiSmile className="w-full h-full" />
        </div>
      </div>
      <div className="w-full mx-4 dark:text-gray-400 text-gray-500 dark:bg-slate-600 bg-zinc-200 rounded-md">
        <input
          className="w-full py-2 px-3 bg-transparent focus:outline-none"
          placeholder="Escribe un mensaje aquí"
        />
      </div>
      <div className="flex items-center">
        <div className="w-7 h-7 dark:text-slate-500 text-slate-600 p-0.5">
          <IoSend className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
