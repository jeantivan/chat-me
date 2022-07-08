import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as CheckBox from "@radix-ui/react-checkbox";
import { motion } from "framer-motion";
import { BsArrowLeft, BsCheck } from "react-icons/bs";
import cx from "classnames";
import { useDarkMode } from "../DarkMode";
import { CustomIcon } from "../CustomIcon";

export function Notifications({ goBack }) {
  const { mode } = useDarkMode();

  return (
    <>
      <header className="pt-16 bg-slate-700 pb-5 ">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: "tween" }}
          className="px-4 flex items-center"
        >
          <button
            onClick={goBack}
            className="w-7 h-7 dark:text-slate-400 text-slate-500 hover:text-slate-400 mr-4"
          >
            <CustomIcon Icon={BsArrowLeft} label="Cerrar configuración" />
          </button>

          <Dialog.Title className="text-slate-50 text-xl">
            Notificaciones
          </Dialog.Title>
        </motion.div>
      </header>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: "tween" }}
      >
        <div className="py-6 px-12">
          <div className="flex items-center w-full mb-5">
            <CheckBox.Root
              id="mute"
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded border-2",
                "radix-state-checked:bg-emerald-500 radix-state-checked:border-emerald-500",
                "radix-state-unchecked:border-gray-400 radix-state-unchecked:bg-transparent",
                "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
              )}
            >
              <CheckBox.Indicator>
                <BsCheck className="h-5 w-5 self-center text-white" />
              </CheckBox.Indicator>
            </CheckBox.Root>

            <Label.Root
              htmlFor="mute"
              className={`ml-3 select-none text-sm ${
                mode === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Silenciar todas las notificaciones
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox.Root
              id="sound"
              defaultChecked
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded border-2",
                "radix-state-checked:bg-emerald-500 radix-state-checked:border-emerald-500",
                "radix-state-unchecked:border-gray-400 radix-state-unchecked:bg-transparent",
                "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
              )}
            >
              <CheckBox.Indicator>
                <BsCheck className="h-5 w-5 self-center text-white" />
              </CheckBox.Indicator>
            </CheckBox.Root>

            <Label.Root
              htmlFor="sound"
              className={`ml-3 select-none text-sm ${
                mode === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Sonidos
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox.Root
              id="alerts"
              defaultChecked
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded border-2",
                "radix-state-checked:bg-emerald-500 radix-state-checked:border-emerald-500",
                "radix-state-unchecked:border-gray-400 radix-state-unchecked:bg-transparent",
                "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
              )}
            >
              <CheckBox.Indicator>
                <BsCheck className="h-5 w-5 self-center text-white" />
              </CheckBox.Indicator>
            </CheckBox.Root>

            <Label.Root
              htmlFor="alerts"
              className={`ml-3 select-none text-sm ${
                mode === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Alertas
            </Label.Root>
          </div>
          <div className="flex w-full mb-5">
            <CheckBox.Root
              id="preview"
              style={{ minWidth: 20 }}
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded border-2",
                "radix-state-checked:bg-emerald-500 radix-state-checked:border-emerald-500",
                "radix-state-unchecked:border-gray-400 radix-state-unchecked:bg-transparent",
                "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
              )}
            >
              <CheckBox.Indicator>
                <BsCheck className="h-5 w-5 self-center text-white" />
              </CheckBox.Indicator>
            </CheckBox.Root>

            <Label.Root
              htmlFor="preview"
              className={`ml-3 select-none text-sm ${
                mode === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Vista previa de los mensajes
              <span className={`mt-1 select-none inline-block text-gray-400`}>
                Se muestra el texto del mensaje en las alertas del escritorio
              </span>
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox.Root
              id="reactions"
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded border-2",
                "radix-state-checked:bg-emerald-500 radix-state-checked:border-emerald-500",
                "radix-state-unchecked:border-gray-400 radix-state-unchecked:bg-transparent",
                "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
              )}
            >
              <CheckBox.Indicator>
                <BsCheck className="h-5 w-5 self-center text-white" />
              </CheckBox.Indicator>
            </CheckBox.Root>

            <Label.Root
              htmlFor="reactions"
              className={`ml-3 select-none text-sm ${
                mode === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Silenciar notificaciones de las reacciones
            </Label.Root>
          </div>
        </div>
      </motion.div>
    </>
  );
}
