import cx from "classnames";
import { MessageStatus } from "../MessageStatus";
import { MessageType } from "../../types";
import { CustomIcon } from "../CustomIcon";
import { BsChevronDown, BsStarFill } from "react-icons/bs";
import { MenuTrigger } from "../Menu";

const MessageMenuTrigger = ({ isOwnMsg }: { isOwnMsg: boolean }) => (
  <MenuTrigger
    className={cx(
      "text-lg text-gray-400",
      "w-16 min-h-[32px] rounded-tr-md inline-flex justify-end",
      "px-2 py-0.5 absolute top-0 right-0 z-20",
      "transition opacity-0 translate-x-full",
      "group-hover:-translate-x-0 group-hover:opacity-100",
      "menu-trigger-bg",
      {
        "menu-trigger-bg-main dark:menu-trigger-bg-main": isOwnMsg,
        "menu-trigger-bg-secondary dark:menu-trigger-bg-secondary": !isOwnMsg,
      },
      "radix-state-open:-translate-x-0 radix-state-open:opacity-100"
    )}
  >
    <CustomIcon
      Icon={BsChevronDown}
      label="Mostrar menu"
      className="inline-block w-5"
      iconClassName="stroke-1"
    />
  </MenuTrigger>
);

interface MessageTextProps extends MessageType {}

export function MessageText({
  message,
  status,
  isOwnMsg,
  isFavMsg,
  time,
}: MessageTextProps) {
  return (
    <div
      className={cx("pt-1 px-2 pb-2.5 overflow-hidden relative", {
        "dark:bg-emerald-700 bg-green-200": isOwnMsg,
        "dark:bg-slate-700 bg-white": !isOwnMsg,
      })}
    >
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
          <span className="text-gray-400 mx-1 whitespace-nowrap">{time}</span>
          {isOwnMsg && (
            <MessageStatus
              status={status}
              className="w-5 -mb-0.5 inline-block"
            />
          )}
        </span>
      </div>
      <MessageMenuTrigger isOwnMsg={isOwnMsg} />
    </div>
  );
}
