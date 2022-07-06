import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { BsChevronDown } from "react-icons/bs";

export function Message({ message, type, time, isFirstMessage }) {
  const isSend = type === "send";

  return (
    <div
      className={cx(
        "w-full flex group",
        "px-5 md:px-10 lg:px-20",
        { "justify-start": !isSend, "justify-end": isSend },
        { "mt-4": isFirstMessage, "mt-1": !isFirstMessage }
      )}
    >
      <div className="w-11/12 md:w-4/5 lg:w-3/4 drop-shadow">
        <div
          className={cx(
            "relative overflow-hidden p-2 flex flex-wrap drop-shadow group",
            {
              "dark:bg-emerald-700 bg-green-200": isSend,
              "dark:bg-slate-700 bg-white": !isSend,
            },
            { "rounded-b": isFirstMessage, rounded: !isFirstMessage },
            { "rounded-tl": isSend, "rounded-tr": !isSend }
          )}
        >
          <p className="text-base dark:text-white leading-tight text-clip">
            {message}
          </p>
          <span className="text-xs absolute bottom-0 right-0 mb-2 mr-2 dark:text-gray-400 text-neutral-500 ml-auto self-end pt-1 pl-1">
            {time}
          </span>
          <button
            className={cx(
              "transition opacity-0 translate-x-full group-hover:-translate-x-0 group-hover:opacity-100",
              "text-lg text-gray-400",
              "px-2 py-1 absolute top-0 right-0 ",
              "bg-gradient-to-bl",
              {
                "dark:from-emerald-700 dark:via-emerald-700 via-green-200 from-green-200":
                  isSend,
                "dark:from-slate-700 dark:via-slate-700 via-white from-white":
                  !isSend,
              }
            )}
          >
            <AccessibleIcon.Root label="Mostrar menu">
              <BsChevronDown className="w-full h-full stroke-1" />
            </AccessibleIcon.Root>
          </button>
        </div>
        {isFirstMessage && (
          <span
            aria-hidden={true}
            className={cx(
              "w-3 h-3 absolute top-0",
              {
                "dark:bg-emerald-700 bg-green-200": isSend,
                "dark:bg-slate-700 bg-white": !isSend,
              },
              { "left-full": isSend, "left-0": !isSend }
            )}
            style={{
              zIndex: "-1",
              transform: isSend
                ? "translate3d(-2%, 0, -10px)"
                : "translate3d(-98%, 0, -10px)",
              borderRadius: isSend
                ? "95% 5% 100% 0% / 0% 5% 95% 100%"
                : "5% 95% 0% 100% / 5% 0% 100% 95%",
            }}
          />
        )}
      </div>
    </div>
  );
}
