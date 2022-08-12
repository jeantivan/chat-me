import cx from "classnames";
import { BsImage, BsPlayCircleFill } from "react-icons/bs";
import { MessageType } from "../../types";

const MultimediaContent = ({ type }: { type: any }) => {
  return (
    <div className="w-full h-full rounded bg-neutral-900 flex justify-center items-center">
      {type === "image" && <BsImage className="text-white w-10 h-10" />}
      {type === "video" && (
        <BsPlayCircleFill className="text-white w-10 h-10" />
      )}
    </div>
  );
};

const orientationWidth = {
  squarish: "w-[45%]",
  landscape: "w-1/2",
  portrait: "w-2/5",
};

export function MessageMultimedia(props: MessageType) {
  const { message, isOwnMsg } = props;
  return (
    <div className="w-full">
      <div
        className={cx(
          "relative overflow-hidden w-full",
          {
            "pt-[100%]": message?.orientation === "squarish",
            "pt-[56.25%]": message?.orientation === "landscape",
            "pt-[133%]": message?.orientation === "portrait",
          },
          {
            "dark:bg-emerald-700 bg-green-200": isOwnMsg,
            "dark:bg-slate-700 bg-white": !isOwnMsg,
          }
        )}
      >
        <div className="absolute inset-0 w-full h-full p-1 rounded">
          <MultimediaContent type={message.type} />
        </div>
      </div>
    </div>
  );
}
