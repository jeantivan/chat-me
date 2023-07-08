import { ReactNode } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { AttachFilesMenu } from "./AttachFilesMenu";
import { CustomIcon } from "./CustomIcon";

export function InputContainer({ children }: { children: ReactNode }) {
  return (
    <div className="input-container bg-slate-100 dark:bg-slate-700 h-full py-2 px-6 flex">
      <div className="flex items-center w-full">
        <div className="w-10 h-10 p-2 rounded-full dark:text-slate-400 text-slate-600">
          <CustomIcon icon={BsEmojiSmile} label="Mostrar emojis" />
        </div>
        <div className="ml-2 flex items-center">
          <AttachFilesMenu />
        </div>
        {children}
      </div>
    </div>
  );
}
