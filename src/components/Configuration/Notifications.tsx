import * as Label from "@radix-ui/react-label";
import { motion } from "framer-motion";
import { CheckBox } from "../CheckBox";
import { Header } from "./Header";
import { AnimateOptionChange } from "./AnimateOptionChange";

interface NotificationProps {
  goBack: () => void;
}

export function Notifications({ goBack }: NotificationProps) {
  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Notificaciones</Header>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: "tween" }}
      >
        <div className="py-6 px-12">
          <div className="flex items-center w-full mb-5">
            <CheckBox id="mute" />

            <Label.Root
              htmlFor="mute"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Silenciar todas las notificaciones
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox id="sound" defaultChecked />

            <Label.Root
              htmlFor="sound"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Sonidos
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox id="alerts" defaultChecked />

            <Label.Root
              htmlFor="alerts"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Alertas
            </Label.Root>
          </div>
          <div className="flex w-full mb-5">
            <CheckBox id="preview" />
            <Label.Root
              htmlFor="preview"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Vista previa de los mensajes
              <span className="mt-1 select-none inline-block text-gray-400">
                Se muestra el texto del mensaje en las alertas del escritorio
              </span>
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox id="reactions" />
            <Label.Root
              htmlFor="reactions"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Silenciar notificaciones de las reacciones
            </Label.Root>
          </div>
        </div>
      </motion.div>
    </AnimateOptionChange>
  );
}
