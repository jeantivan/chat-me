import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { BsArrowLeft, BsPencilFill, BsCameraFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { useDarkMode } from "../DarkMode";

export function Profile({ goBack }) {
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

          <Dialog.Title className="text-slate-50 text-xl">Perfil</Dialog.Title>
        </motion.div>
      </header>
      <div className="py-6 overflow-y-auto">
        <div className="w-full flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "tween" }}
          >
            <div className="group w-[200px] h-[200px] relative rounded-full text-gray-400 overflow-hidden">
              <span className="w-full h-full">
                <FaUserCircle className="w-full h-full" />
              </span>
              <div className="hidden group-hover:flex items-center justify-center absolute w-full h-full inset-0 bg-neutral-900/80">
                <div className="w-3/4 flex flex-col items-center justify-center mt-5">
                  <span className="w-6 h-6 mb-1 text-neutral-50">
                    <BsCameraFill className="w-full h-full" />
                  </span>
                  <span className="uppercase text-center text-sm text-neutral-50 w-4/5">
                    Elegir foto de perfil
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="p-6 ">
          <div className="mb-10">
            <div className="text-emerald-600 text-sm mb-2">Nombre</div>
            <div className="border-b border-emerald-500 p-2 pb-3 flex items-center mb-5">
              <div
                className={`flex-1  ${
                  mode === "light" ? "text-black" : "text-white"
                }`}
              >
                Joe Doe
              </div>
              <div className="w-4 h-4 text-gray-500">
                <BsPencilFill className="w-full h-full" />
              </div>
            </div>
            <div
              className={`text-sm ${
                mode === "light" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Este no es tu nombre de usuario ni un PIN. Este nombre será
              visible para tus contactos de ChatMe.
            </div>
          </div>
          <div className="mb-5">
            <div className="text-emerald-600 text-sm mb-2">Estado</div>
            <div className="border-b border-emerald-500 p-2 pb-3 flex items-center">
              <div
                className={`flex-1  ${
                  mode === "light" ? "text-black" : "text-white"
                }`}
              >
                Hola estoy usando ChatMe!
              </div>
              <div className="w-4 h-4 text-gray-500">
                <BsPencilFill className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
