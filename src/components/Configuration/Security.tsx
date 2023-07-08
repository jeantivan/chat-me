import * as Label from "@radix-ui/react-label";
import { motion } from "framer-motion";
import { BsLockFill, BsShieldFill } from "react-icons/bs";

import { Header } from "./Header";
import { AnimateOptionChange } from "./AnimateOptionChange";

import { CheckBox } from "@/components/CheckBox";
import useStore from "@/lib/store";

interface SecurityProps {
  goBack: () => void;
}

export function Security({ goBack }: SecurityProps) {
  const { toggleSecurityNoti, showSecurityNoti } = useStore((state) => ({
    showSecurityNoti: state.config.security.showSecurityNoti,
    toggleSecurityNoti: state.toggleSecurityNoti,
  }));
  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Seguridad</Header>
      <div className="p-6 flex flex-col">
        <div className="mx-auto flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "tween" }}
            className="w-28 h-28 relative rounded-full flex justify-center items-center bg-emerald-200"
          >
            <span className="w-16 h-20 text-slate-50">
              <BsShieldFill className="w-full h-full" />
            </span>

            <span className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500">
              <BsLockFill className="w-full h-full" />
            </span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: "50%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "50%" }}
          transition={{ type: "tween" }}
          className="w-full mb-8"
        >
          <p className="text-neutral-900 dark:text-neutral-50">
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
          <CheckBox
            id="securityNoti"
            checked={showSecurityNoti}
            onCheckedChange={() => {
              toggleSecurityNoti();
            }}
          />

          <div className="flex-1 ml-3">
            <Label.Root
              htmlFor="securityNoti"
              className="select-none text-lg leading-none text-gray-900 dark:text-gray-100"
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
    </AnimateOptionChange>
  );
}
