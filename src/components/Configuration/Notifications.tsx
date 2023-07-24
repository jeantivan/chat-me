import * as Label from "@radix-ui/react-label";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { CheckBox } from "@/components/CheckBox";
import useStore from "@/lib/store";

export function Notifications() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const notifications = useStore((state) => state.notifications);
  const toggleNotification = useStore((state) => state.toggleNotifications);
  return (
    <>
      <Header goBack={closeLeftDrawer}>Notificaciones</Header>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: "tween" }}
      >
        <div className="py-6 px-12">
          <div className="flex items-center w-full mb-5">
            <CheckBox
              id="allNoti"
              checked={notifications.all}
              onCheckedChange={() => {
                toggleNotification();
              }}
            />

            <Label.Root
              htmlFor="allNoti"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Silenciar todas las notificaciones
            </Label.Root>
          </div>
          <div className="flex items-center w-full mb-5">
            <CheckBox
              id="sound"
              checked={notifications.sound}
              onCheckedChange={() => {
                toggleNotification();
              }}
            />

            <Label.Root
              htmlFor="sound"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Sonidos
            </Label.Root>
          </div>

          <div className="flex w-full mb-5">
            <CheckBox
              id="preview"
              checked={notifications.preview}
              onCheckedChange={() => {
                toggleNotification();
              }}
            />
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
            <CheckBox
              id="reactions"
              checked={notifications.reactions}
              onCheckedChange={() => {
                toggleNotification();
              }}
            />
            <Label.Root
              htmlFor="reactions"
              className="ml-3 select-none text-sm text-gray-900 dark:text-gray-100"
            >
              Silenciar notificaciones de las reacciones
            </Label.Root>
          </div>
        </div>
      </motion.div>
    </>
  );
}
