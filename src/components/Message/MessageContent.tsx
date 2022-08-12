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
    <div className="pt-1.5 px-3 pb-2.5 h-full">
      <div className="w-full h-full relative">
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

        <div className={cx("relative float-right z-10 -mt-3 -mb-[3px]")}>
          <span className="text-xs flex items-end">
            {isFavMsg === 1 && (
              <CustomIcon
                Icon={BsStarFill}
                className="text-gray-400 self-center inline-block"
                label="Fav Msg"
              />
            )}
            <span className="text-gray-400 mx-1.5 whitespace-nowrap">
              {time}
            </span>
            {isOwnMsg && (
              <MessageStatus
                status={status}
                className="w-5 mr-1 -mb-0.5 inline-block"
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
