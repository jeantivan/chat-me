import * as Switch from "@radix-ui/react-switch";
import { useDarkMode } from "./DarkMode";
import { BsMoonStarsFill } from "react-icons/bs";
import cx from "classnames";

export function SwitchDarkMode() {
  const { mode, toggleDarkMode } = useDarkMode();

  return (
    <div className="dark:text-white flex w-full">
      <div className="flex items-center flex-1">Dark Mode</div>
      <Switch.Root
        className={cx(
          "group",
          "radix-state-checked:bg-emerald-500",
          "radix-state-unchecked:bg-gray-400 dark:radix-state-unchecked:bg-gray-800",
          "relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
          "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
        )}
        checked={mode === "dark"}
        onCheckedChange={() => toggleDarkMode()}
      >
        <Switch.Thumb
          className={cx(
            "group-radix-state-checked:translate-x-5",
            "group-radix-state-unchecked:translate-x-0",
            "pointer-events-none inline-block h-[20px] w-[20px] p-1 transform rounded-full text-neutral-700 bg-white ring-0 transition duration-200 ease-in-out"
          )}
          asChild
        >
          <BsMoonStarsFill className="w-full h-full" />
        </Switch.Thumb>
      </Switch.Root>
    </div>
  );
}
