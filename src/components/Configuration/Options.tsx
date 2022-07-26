import { Dispatch, SetStateAction } from "react";
import { IconType } from "react-icons";
import {
  BsBellFill,
  BsFileEarmarkTextFill,
  BsLockFill,
  BsMoonStarsFill,
  BsQuestionCircleFill,
  BsShieldShaded,
} from "react-icons/bs";
import { ImFilePicture } from "react-icons/im";
import { ConfigurationOptionsType } from "../../types";
import { CustomIcon } from "../CustomIcon";
import { UserImage } from "../UserImage";
import { useUserInfo } from "../UserInfoProvider";
import { Header } from "./Header";
import { Shortcuts } from "./Shortcuts";
import { AnimateOptionChange } from "./AnimateOptionChange";

const User = (props: any) => {
  const { user } = useUserInfo();

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
          {user.name}
        </h2>
        <p className="leading-none line-clamp-2 text-neutral-400">
          {user.status}
        </p>
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
    <span className="w-14 flex items-center justify-center">
      <span className="w-5 h-5 text-slate-400">
        <CustomIcon Icon={icon} label={label} />
      </span>
    </span>

    <span className="py-5 pl-4 flex-1 border-b text-left text-lg text-neutral-900 dark:text-neutral-50 border-slate-200 dark:border-slate-700">
      {label}
    </span>
  </button>
);

type ConfigOption = {
  label: string;
  route: ConfigurationOptionsType;
  icon?: IconType;
};

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    label: "Perfil",
    route: "PROFILE",
  },
  {
    label: "Notificaciones",
    route: "NOTIFICATIONS",
    icon: BsBellFill,
  },
  {
    label: "Privacidad",
    route: "PRIVACY",
    icon: BsLockFill,
  },
  {
    label: "Seguridad",
    route: "SECURITY",
    icon: BsShieldShaded,
  },
  {
    label: "Tema",
    route: "THEME",
    icon: BsMoonStarsFill,
  },
  {
    label: "Fondo de pantalla",
    route: "BACKGROUND",
    icon: ImFilePicture,
  },
  {
    label: "Solicitar info. de la cuenta",
    route: "SOL_INFO",
    icon: BsFileEarmarkTextFill,
  },
  {
    label: "Atajos del teclado",
    route: "SHORTCUTS",
  },
  {
    label: "Ayuda",
    route: "HELP",
    icon: BsQuestionCircleFill,
  },
];

interface OptionsProps {
  goBack: () => void;
  setRenderOption: Dispatch<SetStateAction<ConfigurationOptionsType>>;
}

export function Options({ goBack, setRenderOption }: OptionsProps) {
  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Configuración</Header>
      <div className="overflow-y-auto flex-1 flex flex-col h-full">
        {CONFIG_OPTIONS.map((option) => {
          if (option.route === "PROFILE") {
            return (
              <User
                onClick={() => {
                  setRenderOption(option.route);
                }}
              />
            );
          } else if (option.route === "SHORTCUTS") {
            return <Shortcuts />;
          } else {
            return (
              <Item
                label={option.label}
                icon={option.icon!}
                onClick={() => {
                  setRenderOption(option.route);
                }}
              />
            );
          }
        })}
        <footer className="flex w-full justify-center p-3 mt-5">
          <p className="text-base  text-neutral-900 dark:text-neutral-50">
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
    </AnimateOptionChange>
  );
}
