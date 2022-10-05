import cx from "classnames";
import {
  BsChevronDown,
  BsImage,
  BsCameraVideoFill,
  BsPlayCircleFill,
  BsStarFill,
} from "react-icons/bs";
import { MessageType } from "../../types";
import { secondsToMin } from "../../utils/secondsToMin";
import { CustomIcon } from "../CustomIcon";
import { MenuTrigger } from "../Menu";
import { MessageStatus } from "../MessageStatus";

const MessageMenuTrigger = ({ openMenu }: { openMenu: boolean }) => (
  <span
    className={cx(
      "w-32 min-h-[48px] rounded-tr",
      "inline-flex justify-end items-start",
      "pr-1 py-0.5 absolute top-0 right-0 z-20",
      "transition opacity-0 translate-x-full",
      "group-hover:-translate-x-0 group-hover:opacity-100",
      "menu-trigger-bg multimedia-menu-bg",
      { "-translate-x-0": openMenu, "opacity-100": openMenu }
    )}
  >
    <MenuTrigger className={cx("text-lg text-gray-300")}>
      <CustomIcon
        Icon={BsChevronDown}
        label="Mostrar menu"
        className="inline-block w-5"
        iconClassName="stroke-1"
      />
    </MenuTrigger>
  </span>
);

const MultimediaContent = ({ type }: { type: any }) => {
  return (
    <div className="w-full h-full rounded bg-neutral-400 flex justify-center items-center">
      {type === "image" && <BsImage className="text-white w-10 h-10" />}
      {type === "video" && (
        <BsPlayCircleFill className="text-white w-10 h-10" />
      )}
    </div>
  );
};

const VideoDuration = ({ duration }: { duration: number }) => (
  <span className="text-neutral-100 ml-2 mr-auto flex">
    <CustomIcon
      className="inline-block w-3"
      Icon={BsCameraVideoFill}
      label="Video cámara"
    />
    <span className="ml-2">{secondsToMin(duration)}</span>
  </span>
);

interface MessageMultimediaProps extends MessageType {
  openMenu: boolean;
}

export function MessageMultimedia(props: MessageMultimediaProps) {
  const { message, isOwnMsg, isFavMsg, time, status } = props;
  return (
    <div className="w-full">
      <div
        className={cx(
          "relative overflow-hidden w-full",
          {
            "dark:bg-emerald-700 bg-green-200": isOwnMsg,
            "dark:bg-slate-700 bg-white": !isOwnMsg,
          },
          {
            "pt-[100%]": message?.orientation === "squarish",
            "pt-[56.25%]": message?.orientation === "landscape",
            "pt-[133%]": message?.orientation === "portrait",
          }
        )}
      >
        <div className="absolute inset-0 p-1 rounded">
          <div className="relative overflow-hidden w-full h-full">
            <MultimediaContent type={message.type} />
            <MessageMenuTrigger openMenu={props.openMenu} />
            <div className="absolute w-full bottom-0 z-10 p-1 bg-gradient-to-t from-neutral-900/60 via-transparent">
              <span className="text-xs flex">
                {message.type === "video" && (
                  <VideoDuration duration={Number(message.content)} />
                )}
                <span className="ml-auto">
                  {isFavMsg && (
                    <CustomIcon
                      Icon={BsStarFill}
                      className="text-neutral-100 self-center inline-block mr-0.5"
                      label="Fav Msg"
                    />
                  )}
                  <span className="text-neutral-100 mx-1 whitespace-nowrap">
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
