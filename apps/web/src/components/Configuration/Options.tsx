import {
  LucideIcon,
  User as UserIcon,
  Bell,
  Lock,
  Paintbrush,
} from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { UserImage } from "@/components/UserImage";
import useStore from "@/lib/store";

const UserProfileSummary = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { name, bio } = useStore((state) => state.user);
  return (
    <button
      {...props}
      className="flex gap-6 items-center cursor-pointer w-full p-4 hover:bg-background-3"
    >
      <UserImage className="w-20 h-20" />
      <span className="inline-block flex-1 text-xl text-left text-background-12">
        {name}
        <span className="text-base leading-tight mt-1 line-clamp-2 text-background-11">
          {bio}
        </span>
      </span>
    </button>
  );
};

type ItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
};

const Item = ({ icon, label, subtitle, ...rest }: ItemProps) => (
  <button {...rest} className="w-full flex items-center hover:bg-background-3">
    <span className="w-20 flex items-center justify-center">
      <Icon icon={icon} label={label} className="w-6 h-6 text-background-10" />
    </span>

    <span className="py-4 pr-4 flex-1 border-b text-left text-lg font-medium text-background-12 border-background-7">
      {label}
      {subtitle && (
        <span className="block text-sm font-normal text-background-11 mt-0.5">
          {subtitle}
        </span>
      )}
    </span>
  </button>
);

export function Options() {
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { bio } = useStore((state) => state.user);
  const notifications = useStore((state) => state.notifications);
  const privacy = useStore((state) => state.privacy);
  const theme = useStore((state) => state.theme);

  const notificationSubtitle = !notifications.all
    ? "Desactivadas"
    : notifications.sound && notifications.reactions
    ? "Sonidos y reacciones activados"
    : notifications.sound
    ? "Sonidos activados"
    : notifications.reactions
    ? "Reacciones activadas"
    : "Activadas";

  const privacySubtitle = privacy.readReceipt
    ? "Confirmaciones de lectura activadas"
    : "Confirmaciones de lectura desactivadas";

  const themeSubtitle =
    theme.mode === "dark"
      ? "Oscuro"
      : theme.mode === "light"
      ? "Claro"
      : "Tema del sistema";

  return (
    <ScrollArea type="auto" className="pr-2.5">
      <UserProfileSummary
        onClick={() => {
          leftDrawerGoTo("PROFILE");
        }}
      />
      <Item
        label="Perfil"
        subtitle={bio || "Nombre y mensaje de estado"}
        icon={UserIcon}
        onClick={() => {
          leftDrawerGoTo("PROFILE");
        }}
      />
      <Item
        label="Notificaciones"
        subtitle={notificationSubtitle}
        icon={Bell}
        onClick={() => {
          leftDrawerGoTo("NOTIFICATIONS");
        }}
      />
      <Item
        label="Privacidad"
        subtitle={privacySubtitle}
        icon={Lock}
        onClick={() => {
          leftDrawerGoTo("PRIVACY");
        }}
      />
      <Item
        label="Tema"
        subtitle={themeSubtitle}
        icon={Paintbrush}
        onClick={() => {
          leftDrawerGoTo("THEME");
        }}
      />
      <footer className="flex w-full justify-center p-3 mt-5">
        <p className="text-base text-background-12">
          Made with{" "}
          <span className="mx-2" aria-label="Cup of coffee">
            ☕
          </span>
          <a
            className="text-primary-9 hover:underline uppercase"
            href="https://github.com/jeantivan"
          >
            Jean Tivan
          </a>
        </p>
      </footer>
    </ScrollArea>
  );
}
