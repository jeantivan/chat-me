import {
  Archive,
  Bookmark,
  LogOut,
  MoreVertical,
  Settings,
  Users,
} from "lucide-react";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./ui/Menu";
import useStore from "@/lib/store";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconButton } from "./ui/IconButton";
import { useTranslation } from "@/lib/i18n";

export function ShowMoreMenu() {
  const { t } = useTranslation();
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { logout } = useAuth();

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton icon={MoreVertical} label={t("menu.showMore")} />
      </MenuTrigger>
      <MenuContent align="end" className="w-60">
        <MenuItem
          icon={Users}
          onClick={() => {
            leftDrawerGoTo("NEW_GROUP");
          }}
        >
          {t("menu.newGroup")}
        </MenuItem>
        <MenuItem
          icon={Archive}
          onClick={() => {
            leftDrawerGoTo("ARCHIVED_CHATS");
          }}
        >
          {t("menu.archivedChats")}
        </MenuItem>
        <MenuItem
          icon={Bookmark}
          onClick={() => {
            leftDrawerGoTo("STARRED_MESSAGES");
          }}
        >
          {t("menu.starredMessages")}
        </MenuItem>
        <MenuItem
          icon={Settings}
          onClick={() => {
            leftDrawerGoTo("OPTIONS");
          }}
        >
          {t("menu.settings")}
        </MenuItem>

        <MenuItem
          icon={LogOut}
          onClick={() => {
            logout();
          }}
        >
          {t("menu.logOut")}
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
