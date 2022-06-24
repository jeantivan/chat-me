import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as CheckBox from "@radix-ui/react-checkbox";
import cx from "classnames";
import { motion } from "framer-motion";
import { BsArrowLeft, BsLockFill, BsShieldFill, BsCheck } from "react-icons/bs";
import { useDarkMode } from "../DarkMode";

export function Security({ goBack }) {
  const { mode } = useDarkMode();

  return (
    <motion.div
      transition={{ when: "afterChildren", staggerChildren: 0.5 }}
      initial={{ display: "none" }}
      animate={{ display: "block" }}
      exit={{ display: "none" }}
    >
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
            <AccessibleIcon.Root label="Cerrar configuración">
              <BsArrowLeft className="w-full h-full" />
            </AccessibleIcon.Root>
          </button>

          <Dialog.Title className="text-slate-50 text-xl">
            Seguridad
          </Dialog.Title>
        </motion.div>
      </header>
      <div className="p-6 flex flex-col">
        <div className="mx-auto flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "tween" }}
            className="w-28 h-28 relative rounded-full flex justify-center items-center bg-emerald-200"
          >
            <AccessibleIcon.Root asChild label="Shield-icon">
              <span className="w-16 h-20 text-slate-50">
                <BsShieldFill className="w-full h-full" />
              </span>
            </AccessibleIcon.Root>
            <AccessibleIcon.Root asChild label="Lock-icon">
              <span className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500">
                <BsLockFill className="w-full h-full" />
              </span>
            </AccessibleIcon.Root>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: "50%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "50%" }}
          transition={{ type: "tween" }}
          className="w-full mb-8"
        >
          <p className={mode === "light" ? "text-black" : "text-white"}>
            Los mensajes y llamadas en los chats cifrados de extremo a extremo
            son solo para ti y las personas con quienes decidas compartirlos, ni
            siquiera ChatMe puede leerlos ni escucharlos.{" "}
            <a href="#" className="text-cyan-500 underline">
              Más información.
            </a>
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: "50%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "50%" }}
          transition={{ type: "tween" }}
          className="flex w-full"
        >
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
          <div className="flex-1 ml-3">
            <Label.Root
              htmlFor="preview"
              className={`select-none text-lg leading-none ${
                mode === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Mostrar notificaciones de seguridad en esta computadora.
            </Label.Root>
            <p
              className={`text-sm mt-2 select-none inline-block text-gray-400`}
            >
              Recibe una notificación cuando cambie el código de seguridad del
              teléfono de alguno de tus contactos. Si tienes varios
              dispositivos, debes activar esta configuración en cada dispositivo
              en el que quieras ver las notificaciones.{" "}
              <a href="#" className="text-cyan-500 underline">
                Más información.
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
