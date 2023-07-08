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
    <>
      {isOwnMsg && (
        <MessageStatus
          status={status}
          className="w-6 h-6 mr-1 inline-block shrink-0"
        />
      )}
      <div className={cx("flex grow items-center min-w-[0]")}>
        {messageIcon && (
          <CustomIcon
            icon={messageIcon}
            label="Tipo de mensaje"
            className="w-4 h-4 mr-1.5 inline-block shrink-0"
          />
        )}

        <div
          className={cx("grow truncate", {
            "text-base": message.type !== "text",
          })}
        >
          {content}
        </div>
      </div>
    </>
  );
}
