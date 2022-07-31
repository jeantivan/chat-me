import { MessageStatus } from "./MessageStatus";
import { MessageType } from "../types";

export function Message({ message, status, isOwnMsg, time }: MessageType) {
  return (
    <>
      <p className="text-base dark:text-white leading-tight text-clip">
        {message.content}
      </p>
      <div className="text-xs  ml-auto self-end pt-1 pl-1 flex items-end">
        <span className="dark:text-gray-400 text-neutral-500 mr-1">{time}</span>
        {isOwnMsg && (
          <MessageStatus status={status} className="w-5 -mb-0.5 inline-block" />
        )}
      </div>
    </>
  );
}
