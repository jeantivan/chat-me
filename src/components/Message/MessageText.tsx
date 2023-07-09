import cx from "classnames";
import { BsChevronDown, BsStarFill } from "react-icons/bs";
import { MessageStatus } from "@/components/MessageStatus";
import { CustomIcon } from "@/components/CustomIcon";
import { MenuTrigger } from "@/components/Menu";
import { MessageType } from "@/lib/types";

const MessageMenuTrigger = ({
  isOwnMsg,
  openMenu,
}: {
  isOwnMsg: boolean;
  openMenu: boolean;
}) => (
  <span
    className={cx(
      "w-16 min-h-[32px] rounded-tr",
      "inline-flex justify-end items-start",
      "pr-1 py-0.5 absolute top-0 right-0 z-20",
      "transition opacity-0 translate-x-full",
      "group-hover:-translate-x-0 group-hover:opacity-100",
      "menu-trigger-bg",
      {
        "menu-trigger-bg-main dark:menu-trigger-bg-main": isOwnMsg,
        "menu-trigger-bg-secondary dark:menu-trigger-bg-secondary": !isOwnMsg,
      },
      { "-translate-x-0": openMenu, "opacity-100": openMenu }
    )}
  >
    <MenuTrigger className={cx("text-lg text-gray-400")}>
      <CustomIcon
        icon={BsChevronDown}
        label="Mostrar menu"
        className="inline-block w-5"
        iconClassName="stroke-1"
      />
    </MenuTrigger>
  </span>
);

interface MessageTextProps extends MessageType {
  openMenu: boolean;
}

export function MessageText({
  message,
  status,
  isOwnMsg,
  isFavMsg,
  time,
  openMenu,
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
            "w-[84px]": !isFavMsg,
            "w-[96px]": isFavMsg,
          })}
        />
      </div>

      <div className="relative float-right z-10 -mt-3 -mb-[5px]">
        <span className="text-xs flex items-center">
          {isFavMsg && (
            <CustomIcon
              icon={BsStarFill}
              className="text-gray-400 self-center inline-block"
              label="Fav Msg"
            />
          )}
          <span className="text-gray-400 mx-1 whitespace-nowrap">{time}</span>
          {isOwnMsg && <MessageStatus status={status} />}
        </span>
      </div>
      <MessageMenuTrigger isOwnMsg={isOwnMsg} openMenu={openMenu} />
    </div>
  );
}
