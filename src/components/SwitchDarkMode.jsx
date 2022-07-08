import { Switch } from "./Switch";
import { useDarkMode } from "./DarkMode";
import { BsMoonStarsFill } from "react-icons/bs";

export function SwitchDarkMode() {
  const { mode, toggleDarkMode } = useDarkMode();

  return (
    <div className="dark:text-white flex w-full">
      <div className="flex-1">Modo oscuro</div>

      <Switch
        checked={mode === "dark"}
        onCheckedChange={() => toggleDarkMode()}
        title={`${mode === "dark" ? "Desactivar" : "Activar"} el modo oscuro`}
      >
        <BsMoonStarsFill className="w-full h-full" />
      </Switch>
    </div>
  );
}
