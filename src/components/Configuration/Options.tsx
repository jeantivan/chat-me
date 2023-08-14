import {
  LucideIcon,
  Bell,
  Lock,
  Paintbrush,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Shortcuts } from "./Shortcuts";

import { Icon } from "@/components/ui/Icon";
import { UserImage } from "@/components/UserImage";
import useStore from "@/lib/store";

const User = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
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
};
const Item = ({ icon, label, ...rest }: ItemProps) => (
  <button {...rest} className="w-full flex items-center hover:bg-background-3">
    <span className="w-20 flex items-center justify-center">
      <Icon icon={icon} label={label} className="w-6 h-6 text-background-10" />
    </span>

    <span className="py-5 pr-4 flex-1 border-b text-left text-lg font-medium text-background-12 border-background-7">
      {label}
    </span>
  </button>
);

export function Options() {
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);

  return (
    <div className="overflow-y-auto flex-1 flex flex-col h-full">
      <User
        onClick={() => {
          leftDrawerGoTo("PROFILE");
        }}
      />
      <Item
        label="Notificaciones"
        icon={Bell}
        onClick={() => {
          leftDrawerGoTo("NOTIFICATIONS");
        }}
      />
      <Item
        label="Privacidad"
        icon={Lock}
        onClick={() => {
          leftDrawerGoTo("PRIVACY");
        }}
      />
      <Item
        label="Tema"
        icon={Paintbrush}
        onClick={() => {
          leftDrawerGoTo("THEME");
        }}
      />
      <Item
        label="Solicitar info. de la cuenta"
        icon={FileText}
        onClick={() => {
          leftDrawerGoTo("SOL_INFO");
        }}
      />
      <Shortcuts key="SHORTCUTS" />
      <Item
        label="Ayuda"
        icon={HelpCircle}
        onClick={() => {
          leftDrawerGoTo("HELP");
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
    </div>
  );
}
