import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";
import { Separator } from "@/components/ui/Separator";
import { Label } from "@/components/ui/Label";
import useStore from "@/lib/store";

export function Notifications() {
  const notifications = useStore((state) => state.notifications);
  const toggleNotification = useStore((state) => state.toggleNotifications);
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: "tween" }}
    >
      <div className="p-6">
        <h2 className="text-primary-9 mb-6">Mensajes</h2>
        <div className="flex gap-4 items-center w-full mb-2">
          <Label htmlFor="all">
            Notificaciones de mensajes
            <span className="mt-1 text-sm select-none inline-block text-background-11">
              Se muestran notificaciones de mensajes nuevos
            </span>
          </Label>
          <Checkbox
            id="all"
            checked={notifications.all}
            onCheckedChange={() => {
              toggleNotification("all");
            }}
          />
        </div>
        <Separator />
        <div className="flex gap-4 items-center w-full mt-5 mb-4">
          <Label htmlFor="preview" disabled={!notifications.all}>
            Vista previa de los mensajes
          </Label>
          <Checkbox
            id="preview"
            disabled={!notifications.all}
            checked={notifications.preview}
            onCheckedChange={() => {
              toggleNotification("preview");
            }}
          />
        </div>
        <div className="flex gap-4 items-center w-full">
          <Label htmlFor="reactions" disabled={!notifications.all}>
            Mostrar notificaciones de reacciones
          </Label>
          <Checkbox
            id="reactions"
            disabled={!notifications.all}
            checked={notifications.reactions}
            onCheckedChange={() => {
              toggleNotification("reactions");
            }}
          />
        </div>
        <div className="flex items-center w-full mt-12">
          <Label htmlFor="sound">
            Sonido
            <span className="mt-1 text-sm select-none inline-block text-background-11">
              Reproduce un sonido cuando llega un mensaje
            </span>
          </Label>
          <Checkbox
            id="sound"
            checked={notifications.sound}
            onCheckedChange={() => {
              toggleNotification("sound");
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
