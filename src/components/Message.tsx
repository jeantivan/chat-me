import { MessageStatus } from "./MessageStatus";
import { MessageType } from "../types";

export function Message({ message, status, isOwnMsg, time }: MessageType) {
  return (
    <div className="relative">
      <div className="relative whitespace-pre-wrap break-words">
        <span className="text-base dark:text-white leading-tight">
          {message.content}
        </span>
        <span className="w-[84px] inline-block" />
      </div>

      <div className="relative float-right z-10 -mt-3 -mb-[5px]">
        <span className="text-xs flex items-end">
          <span className="dark:text-gray-400 text-neutral-500 mr-1 whitespace-nowrap">
            {time}
          </span>
          {isOwnMsg && (
            <MessageStatus
              status={status}
              className="w-5 -mb-0.5 inline-block"
            />
          )}
        </span>
      </div>
    </div>
  );
}
