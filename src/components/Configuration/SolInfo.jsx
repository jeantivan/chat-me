import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { BsArrowLeft, BsFileEarmarkTextFill } from "react-icons/bs";
import { CustomIcon } from "../CustomIcon";
import { useDarkMode } from "../DarkMode";

export function SolInfo({ goBack }) {
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
            Solicitar info de mi cuenta
          </Dialog.Title>
        </motion.div>
      </header>
      <div className="py-7 overflow-y-auto">
        <div className="mx-auto flex flex-col">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "tween" }}
            className="w-28 h-28 mx-auto rounded-full flex justify-center items-center bg-emerald-400/30"
          >
            <CustomIcon
              className="w-16 h-20 text-emerald-400"
              Icon={BsFileEarmarkTextFill}
              label="File-icon"
            />
          </motion.div>
          <div
            className={`text-sm p-7 ${
              mode === "light" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Crea un informe de la configuración y la info. de tu cuenta de
            ChatMe. Puedes acceder a la información o transferirla a otra
            aplicación. El informe no incluye tus mensajes.{" "}
            <a href="#" className="text-cyan-500 underline">
              Más información.
            </a>
          </div>
        </div>
        <div
          className={`border-y  p-7 ${
            mode === "light"
              ? "hover:bg-slate-50 border-slate-300"
              : "hover:bg-slate-700 border-slate-600"
          }`}
        >
          <div className="flex items-center select-none">
            <CustomIcon
              label="Solicitar reporte"
              Icon={BsFileEarmarkTextFill}
              className="w-6 h-6 text-gray-400 mr-6"
            />

            <div
              className={`text-lg font-medium ${
                mode === "light" ? "text-gray-800" : "text-white"
              }`}
            >
              Solicitar reporte
            </div>
          </div>
        </div>
        <div
          className={`p-7 ${
            mode === "light" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <p className="text-sm mb-2">
            El informe estará listo en 3 días aproximadamente. Tendrás algunas
            semanas para descargarlo después de que esté disponible.
          </p>
          <p className="text-sm">
            Si realizas cambios en tu cuenta, como eliminarla o modificar el
            número de teléfono, se cancelará tu solicitud.
          </p>
        </div>
      </div>
    </>
  );
}
