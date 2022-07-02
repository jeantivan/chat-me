import { Switch } from "./Switch";
import { useDarkMode } from "./DarkMode";
import { BsMoonStarsFill } from "react-icons/bs";

export function SwitchDarkMode() {
  const { mode, toggleDarkMode } = useDarkMode();

  return (
    <div className="dark:text-white flex w-full">
      <div className="flex items-center flex-1">Dark Mode</div>

      <Switch
        checked={mode === "dark"}
        onCheckedChange={() => toggleDarkMode()}
      >
        <BsMoonStarsFill className="w-full h-full" />
      </Switch>
    </div>
  );
}
