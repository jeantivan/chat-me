import cx from "classnames";
import { BsChevronDown, BsPlayFill, BsStarFill } from "react-icons/bs";

import { CustomIcon } from "@/components/CustomIcon";
import { MenuTrigger } from "@/components/Menu";
import { MessageStatus } from "@/components/MessageStatus";
import { secondsToMin } from "@/lib/utils/secondsToMin";
import useStore from "@/lib/store";
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
      "w-16 h-6",
      "inline-flex justify-end items-start",
      "py-0.5 absolute top-0 right-0 z-20",
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
    <MenuTrigger className={cx("text-gray-400")}>
      <CustomIcon
        Icon={BsChevronDown}
        label="Mostrar menu"
        className="inline-block w-5"
        iconClassName="stroke-1"
      />
    </MenuTrigger>
  </span>
);

interface MessageAudioProps extends MessageType {
  openMenu: boolean;
}

export function MessageAudio({
  openMenu,
  message,
  status,
  time,
  isFavMsg,
  isOwnMsg,
}: MessageAudioProps) {
  const { name, picture } = useStore((state) => state.profile);
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === state.currentChatId)
  );
  return (
    <div
      className={cx("w-full px-2 min-h-[56px]", {
        "dark:bg-emerald-700 bg-green-200": isOwnMsg,
        "dark:bg-slate-700 bg-white": !isOwnMsg,
      })}
    >
      <div className="flex">
        <div
          className={cx(
            "py-1",
            {
              "mr-2": isOwnMsg,
              "ml-2": !isOwnMsg,
            },
            {
              "order-first": isOwnMsg,
              "order-last": !isOwnMsg,
            }
          )}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden">
            <img
              alt={
                isOwnMsg
                  ? "Tu foto de perfil."
                  : `Foto de: ${chat?.contact.name}`
              }
              src={isOwnMsg ? picture.medium : chat?.contact.picture.medium}
              className="w-full h-full bg-gray-400 object-fill"
            />
          </div>
        </div>
        <div className="flex-1 flex">
          <button className="outline-none w-10 text-gray-400 my-2">
            <CustomIcon Icon={BsPlayFill} label="Reproducir audio" />
          </button>
          <div className="flex-1 pl-2 flex items-center relative overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="flex-1 h-1 rounded-full bg-gray-400 mr-2" />
            <MessageMenuTrigger openMenu={openMenu} isOwnMsg={isOwnMsg} />
            <div className="absolute w-full bottom-0 left-0 z-10 p-0.5">
              <span className="text-xs flex items-end">
                <span className="mr-auto text-gray-400">
                  {secondsToMin(Number(message.content))}
                </span>
                <span className="ml-auto">
                  {isFavMsg && (
                    <CustomIcon
                      Icon={BsStarFill}
                      className="text-gray-400 self-center inline-block mr-0.5"
                      label="Fav Msg"
                    />
                  )}
                  <span className="text-gray-400 ml-1 whitespace-nowrap">
                    {time}
                  </span>
                  {isOwnMsg && (
                    <MessageStatus status={status} className="-mb-1" />
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
