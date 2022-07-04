import { BsChevronDown } from "react-icons/bs";

export function Message({ message, type, time, isFirstMessage }) {
  const bgColor =
    type === "send"
      ? "dark:bg-emerald-700 bg-green-200"
      : "dark:bg-slate-700 bg-white";
  const alignSelf = type === "send" ? "self-end" : "self-start";

  const corner = type === "send" ? "rounded-tl" : "rounded-tr";

  return (
    <div
      className={`${alignSelf} ${
        isFirstMessage ? "mt-4" : "mt-1"
      }  relative max-w-7/10 drop-shadow group`}
    >
      <div
        className={`${bgColor} ${
          isFirstMessage ? "rounded-b" : "rounded"
        } ${corner} p-2 flex flex-wrap  relative drop-shadow`}
      >
        <p className="text-base dark:text-white leading-tight text-clip">
          {message}
        </p>
        <span className="text-xs dark:text-gray-400 text-neutral-500 ml-auto self-end pt-1 pl-1">
          {time}
        </span>
      </div>
      {isFirstMessage && (
        <span
          aria-hidden={true}
          className={`${bgColor} ${
            type === "send" ? "left-full" : "left-0"
          } w-3 h-3 absolute top-0`}
          style={{
            zIndex: "-1",
            transform:
              type === "send"
                ? "translate3d(-2%, 0, -10px)"
                : "translate3d(-98%, 0, -10px)",
            borderRadius:
              type === "send"
                ? "95% 5% 100% 0% / 0% 5% 95% 100%"
                : "5% 95% 0% 100% / 5% 0% 100% 95%",
          }}
        />
      )}
    </div>
  );
}
