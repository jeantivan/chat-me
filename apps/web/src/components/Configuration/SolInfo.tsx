import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { ScrollArea } from "@/components/ui/ScrollArea";

export function SolInfo() {
  return (
    <ScrollArea className="py-7">
      <div className="mx-auto flex flex-col">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "tween" }}
          className="w-28 h-28 mx-auto rounded-full flex justify-center items-center bg-primary-10/30"
        >
          <Icon
            className="w-16 h-20 text-primary-10"
            icon={FileText}
            label="File-icon"
          />
        </motion.div>
        <div className="text-sm p-7 text-gray-500 dark:text-background-11">
          Crea un informe de la configuración y la info. de tu cuenta de ChatMe.
          Puedes acceder a la información o transferirla a otra aplicación. El
          informe no incluye tus mensajes.{" "}
          <a href="#" className="text-cyan-500 underline">
            Más información.
          </a>
        </div>
      </div>
      <div className="border-y p-7 hover:bg-background-5 border-background-7">
        <div className="flex items-center select-none">
          <Icon
            label="Solicitar reporte"
            icon={FileText}
            className="w-6 h-6 text-background-11 mr-6"
          />

          <div className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
            Solicitar reporte
          </div>
        </div>
      </div>
      <div className="p-7 text-gray-500 dark:text-background-11">
        <p className="text-sm mb-2">
          El informe estará listo en 3 días aproximadamente. Tendrás algunas
          semanas para descargarlo después de que esté disponible.
        </p>
        <p className="text-sm">
          Si realizas cambios en tu cuenta, como eliminarla o modificar el
          número de teléfono, se cancelará tu solicitud.
        </p>
      </div>
    </ScrollArea>
  );
}
