import cx from "classnames";
import { MessageStatus } from "../MessageStatus";
import { MessageType } from "../../types";
import { CustomIcon } from "../CustomIcon";
import { BsStarFill } from "react-icons/bs";

export function MessageContent({
  message,
  status,
  isOwnMsg,
  isFavMsg,
  time,
}: MessageType) {
  return (
    <div className="relative">
      <div className="relative whitespace-pre-wrap break-words">
        <span className="text-base dark:text-white leading-tight">
          {message.content}
        </span>
        <span
          className={cx("inline-block", {
            "w-[84px]": isFavMsg < 0,
            "w-[96px]": isFavMsg > 0,
          })}
        />
      </div>

      <div className="relative float-right z-10 -mt-3 -mb-[5px]">
        <span className="text-xs flex items-end">
          {isFavMsg === 1 && (
            <CustomIcon
              Icon={BsStarFill}
              className="text-gray-400 self-center inline-block"
              label="Fav Msg"
            />
          )}
          <span className="dark:text-gray-400 text-neutral-500 mx-1.5 whitespace-nowrap">
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
