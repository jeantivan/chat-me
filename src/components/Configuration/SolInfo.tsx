import { motion } from "framer-motion";
import { BsFileEarmarkTextFill } from "react-icons/bs";
import { Header } from "./Header";
import { CustomIcon } from "@/components/CustomIcon";
import useStore from "@/lib/store";

export function SolInfo() {
  const close = useStore((state) => state.close);
  return (
    <>
      <Header goBack={close}>Solicitar info de mi cuenta</Header>
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
              icon={BsFileEarmarkTextFill}
              label="File-icon"
            />
          </motion.div>
          <div className="text-sm p-7 text-gray-500 dark:text-gray-400">
            Crea un informe de la configuración y la info. de tu cuenta de
            ChatMe. Puedes acceder a la información o transferirla a otra
            aplicación. El informe no incluye tus mensajes.{" "}
            <a href="#" className="text-cyan-500 underline">
              Más información.
            </a>
          </div>
        </div>
        <div className="border-y p-7 hover:bg-neutral-100 hover:dark:bg-slate-700 border-neutral-300 dark:border-slate-600">
          <div className="flex items-center select-none">
            <CustomIcon
              label="Solicitar reporte"
              icon={BsFileEarmarkTextFill}
              className="w-6 h-6 text-gray-400 mr-6"
            />

            <div className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
              Solicitar reporte
            </div>
          </div>
        </div>
        <div className="p-7 text-gray-500 dark:text-gray-400">
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
