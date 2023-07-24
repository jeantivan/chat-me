import { IconType } from "react-icons";
import { Bell, Lock, Paintbrush, FileText, HelpCircle } from "lucide-react";
import { Header } from "./Header";
import { Shortcuts } from "./Shortcuts";
import { Theme } from "./Theme";

import { CustomIcon } from "@/components/CustomIcon";
import { UserImage } from "@/components/UserImage";
import useStore from "@/lib/store";

const User = (props: any) => {
  const { name, bio } = useStore((state) => state.user);
  return (
    <div
      {...props}
      className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-neutral-100 dark:hover:bg-slate-700"
    >
      <div className="mr-4">
        <div className="w-20 h-20 rounded-full overflow-hidden">
          <UserImage />
        </div>
      </div>
      <div className="flex-1">
        <h2 className="font-medium text-xl text-neutral-900 dark:text-neutral-50">
          {name}
        </h2>
        <p className="leading-none line-clamp-2 text-neutral-400">{bio}</p>
      </div>
    </div>
  );
};

const Item = ({
  icon,
  label,
  onClick,
  ...rest
}: {
  icon: IconType;
  label: string;
  onClick: () => void;
}) => (
  <button
    {...rest}
    onClick={onClick}
    className="w-full flex items-center hover:bg-neutral-100 dark:hover:bg-slate-700"
  >
    <span className="w-20 flex items-center justify-center">
      <span className="w-6 h-6 text-slate-400">
        <CustomIcon icon={icon} label={label} />
      </span>
    </span>

    <span className="py-5 pr-4 flex-1 border-b text-left text-lg font-medium text-neutral-900 dark:text-neutral-200 border-slate-200 dark:border-slate-700">
      {label}
    </span>
  </button>
);

export function Options() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  return (
    <>
      <Header goBack={closeLeftDrawer}>Configuración</Header>
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

        <Theme key="THEME" />
        <Item
          label="Fondo de pantalla"
          icon={Paintbrush}
          onClick={() => {
            leftDrawerGoTo("BACKGROUND");
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
          <p className="text-base text-neutral-900 dark:text-neutral-50">
            Made with{" "}
            <span className="mx-2" aria-label="Cup of coffee">
              ☕
            </span>
            <a
              className="text-emerald-500 hover:underline uppercase"
              href="https://github.com/jeantivan"
            >
              Jean Tivan
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
