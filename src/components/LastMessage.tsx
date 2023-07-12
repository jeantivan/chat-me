import cx from "classnames";
import { BsCameraFill, BsCameraVideoFill, BsMicFill } from "react-icons/bs";
import { MessageStatus } from "./MessageStatus";
import { CustomIcon } from "./CustomIcon";
import { MessageType } from "@/lib/types";

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
    <div className="flex-1 flex gap-1">
      {isOwnMsg && (
        <MessageStatus
          status={status}
          className="w-6 h-6 inline-block shrink-0"
        />
      )}
      <div className={cx("flex-1 flex items-center")}>
        {messageIcon && (
          <CustomIcon
            icon={messageIcon}
            label="Tipo de mensaje"
            className="w-4 h-4 mr-1.5 inline-block shrink-0"
          />
        )}

        <span className="line-clamp-1">{content}</span>
      </div>
    </div>
  );
}
