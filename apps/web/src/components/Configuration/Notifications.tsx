import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";
import { Separator } from "@/components/ui/Separator";
import { Label } from "@/components/ui/Label";
import useStore from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useUpdateSettings } from "@/lib/api/settingsQueries";

export function Notifications() {
  const { t } = useTranslation();
  const notifications = useStore((state) => state.notifications);
  const toggleNotification = useStore((state) => state.toggleNotifications);
  const { mutate: updateSettings } = useUpdateSettings();

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: "tween" }}
    >
      <div className="p-6">
        <h2 className="text-primary-9 mb-6">{t("settings.messagesHeading")}</h2>
        <div className="flex gap-4 items-center w-full mb-2">
          <Label htmlFor="all">
            {t("settings.messageNotifications")}
            <span className="mt-1 text-sm select-none inline-block text-background-11">
              {t("settings.messageNotificationsDesc")}
            </span>
          </Label>
          <Checkbox
            id="all"
            checked={notifications.all}
            onCheckedChange={() => {
              const nextVal = !notifications.all;
              toggleNotification("all");
              updateSettings({ notifyAll: nextVal });
            }}
          />
        </div>
        <Separator />
        <div className="flex gap-4 items-center w-full mt-5 mb-4">
          <Label htmlFor="preview" disabled={!notifications.all}>
            {t("settings.messagePreview")}
          </Label>
          <Checkbox
            id="preview"
            disabled={!notifications.all}
            checked={notifications.preview}
            onCheckedChange={() => {
              if (!notifications.all) return;
              const nextVal = !notifications.preview;
              toggleNotification("preview");
              updateSettings({ notifyPreview: nextVal });
            }}
          />
        </div>
        <div className="flex gap-4 items-center w-full">
          <Label htmlFor="reactions" disabled={!notifications.all}>
            {t("settings.reactionNotifications")}
          </Label>
          <Checkbox
            id="reactions"
            disabled={!notifications.all}
            checked={notifications.reactions}
            onCheckedChange={() => {
              if (!notifications.all) return;
              const nextVal = !notifications.reactions;
              toggleNotification("reactions");
              updateSettings({ notifyReactions: nextVal });
            }}
          />
        </div>
        <div className="flex items-center w-full mt-12">
          <Label htmlFor="sound" disabled={!notifications.all}>
            {t("settings.sound")}
            <span className="mt-1 text-sm select-none inline-block text-background-11">
              {t("settings.soundDesc")}
            </span>
          </Label>
          <Checkbox
            id="sound"
            disabled={!notifications.all}
            checked={notifications.sound}
            onCheckedChange={() => {
              if (!notifications.all) return;
              const nextVal = !notifications.sound;
              toggleNotification("sound");
              updateSettings({ notifySound: nextVal });
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
