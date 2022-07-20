import cx from "classnames";
import { BsCameraFill, BsCameraVideoFill, BsMicFill } from "react-icons/bs";
import { MessageType } from "../types";
import { MessageStatus } from "./MessageStatus";
import { CustomIcon } from "./CustomIcon";

interface LastMessageProps {
  lastMessage: MessageType;
}
export function LastMessage({ lastMessage }: LastMessageProps) {
  const { message, status, isOwnMsg } = lastMessage;
  let messageIcon;
  let content = message.content;

  if (message.type === "audio") {
    messageIcon = BsMicFill;
    content = "Audio";
  } else if (message.type === "video") {
    messageIcon = BsCameraVideoFill;
    content = "Video";
  } else if (message.type === "image") {
    messageIcon = BsCameraFill;
    content = "Foto";
  }

  return (
    <>
      {isOwnMsg && <MessageStatus status={status} className="w-6 h-6 mr-1" />}
      <div className="text-sm dark:text-gray-400 text-gray-500 w-full flex items-center">
        {messageIcon && (
          <div className="w-4 h-4 mr-1.5">
            <CustomIcon Icon={messageIcon} label="Tipo de mensaje" />
          </div>
        )}

        <div
          className={cx("grow truncate", {
            "text-base": message.type !== "text",
          })}
        >
          <div className="flex">{content}</div>
        </div>
      </div>
    </>
  );
}
