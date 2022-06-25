import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as Dialog from "@radix-ui/react-dialog";
import * as Separator from "@radix-ui/react-separator";
import * as Label from "@radix-ui/react-label";
import * as CheckBox from "@radix-ui/react-checkbox";
import cx from "classnames";
import { motion } from "framer-motion";
import { BsArrowLeft, BsCheck } from "react-icons/bs";
import { FiChevronRight } from "react-icons/fi";
import { useDarkMode } from "../DarkMode";

export function Privacy({ goBack }) {
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
            <AccessibleIcon.Root label="Cerrar configuración">
              <BsArrowLeft className="w-full h-full" />
            </AccessibleIcon.Root>
          </button>

          <Dialog.Title className="text-slate-50 text-xl">
            Privacidad
          </Dialog.Title>
        </motion.div>
      </header>
      <div
        className={`overflow-y-auto flex-1 bg-slate-900 ${
          mode === "light" && "bg-slate-100"
        }`}
      >
        <div className="flex flex-col">
          <div
            className={`p-6 mb-5 ${
              mode === "light" ? "bg-white" : "bg-slate-800"
            }`}
          >
            <h2 className="text-emerald-600 mb-3">
              Quién puede ver mi información personal
            </h2>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className={mode === "light" ? "text-black" : "text-white"}>
                  Última vez en linea.
                </h3>
                <p
                  className={
                    mode === "light" ? "text-gray-500" : "text-gray-400"
                  }
                >
                  Nadie
                </p>
              </div>
              <AccessibleIcon.Root asChild label="chevron-right-icon">
                <div className="w-6 h-6 text-gray-400">
                  <FiChevronRight className="w-full h-full" />
                </div>
              </AccessibleIcon.Root>
            </div>
            <Separator.Root className="bg-gray-600 w-full h-px" />
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className={mode === "light" ? "text-black" : "text-white"}>
                  Foto de perfil.
                </h3>
                <p
                  className={
                    mode === "light" ? "text-gray-500" : "text-gray-400"
                  }
                >
                  Mis contactos
                </p>
              </div>
              <AccessibleIcon.Root asChild label="chevron-right-icon">
                <div className="w-6 h-6 text-gray-400">
                  <FiChevronRight className="w-full h-full" />
                </div>
              </AccessibleIcon.Root>
            </div>
            <Separator.Root className="bg-gray-600 w-full h-px" />
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className={mode === "light" ? "text-black" : "text-white"}>
                  Info.
                </h3>
                <p
                  className={
                    mode === "light" ? "text-gray-500" : "text-gray-400"
                  }
                >
                  Mis contactos
                </p>
              </div>
              <AccessibleIcon.Root asChild label="chevron-right-icon">
                <div className="w-6 h-6 text-gray-400">
                  <FiChevronRight className="w-full h-full" />
                </div>
              </AccessibleIcon.Root>
            </div>
            <Separator.Root className="bg-gray-600 w-full h-px" />
            <div className="flex pt-3 items-center">
              <Label.Root asChild htmlFor="preview">
                <div
                  className={`select-none mr-2 ${
                    mode === "light" ? "text-gray-900" : "text-gray-100"
                  }`}
                >
                  Confirmaciones de lectura.
                  <span
                    className={`mt-1 select-none text-sm inline-block text-gray-400`}
                  >
                    Si desactivas las confirmaciones de lectura, no podrás
                    enviarlas ni recibirlas. Las confirmaciones de lectura se
                    enviarán siempre en los chats grupales.
                  </span>
                </div>
              </Label.Root>
              <CheckBox.Root
                defaultChecked
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
            </div>
          </div>
          <div
            className={`p-6 mb-5 ${
              mode === "light" ? "bg-white" : "bg-slate-800"
            }`}
          >
            <h2 className="text-emerald-600 mb-5">Mensajes temporales</h2>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className={mode === "light" ? "text-black" : "text-white"}>
                  Duración predeterminada de los mensajes
                </h3>
                <p
                  className={
                    mode === "light" ? "text-gray-500" : "text-gray-400"
                  }
                >
                  Desactivados
                </p>
              </div>
              <AccessibleIcon.Root asChild label="chevron-right-icon">
                <div className="w-6 h-6 text-gray-400">
                  <FiChevronRight className="w-full h-full" />
                </div>
              </AccessibleIcon.Root>
            </div>
          </div>
          <div
            className={`p-6 mb-5 ${
              mode === "light" ? "bg-white" : "bg-slate-800"
            }`}
          >
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className={mode === "light" ? "text-black" : "text-white"}>
                  Grupos.
                </h3>
                <p
                  className={
                    mode === "light" ? "text-gray-500" : "text-gray-400"
                  }
                >
                  Mis contactos
                </p>
              </div>
              <AccessibleIcon.Root asChild label="chevron-right-icon">
                <div className="w-6 h-6 text-gray-400">
                  <FiChevronRight className="w-full h-full" />
                </div>
              </AccessibleIcon.Root>
            </div>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className={mode === "light" ? "text-black" : "text-white"}>
                  Contactos bloqueados
                </h3>
                <p
                  className={
                    mode === "light" ? "text-gray-500" : "text-gray-400"
                  }
                >
                  15
                </p>
              </div>
              <AccessibleIcon.Root asChild label="chevron-right-icon">
                <div className="w-6 h-6 text-gray-400">
                  <FiChevronRight className="w-full h-full" />
                </div>
              </AccessibleIcon.Root>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
