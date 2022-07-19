import {
  BsArrowLeft,
  BsBellFill,
  BsLockFill,
  BsShieldShaded,
  BsMoonStarsFill,
  BsFileEarmarkTextFill,
  BsQuestionCircleFill,
} from "react-icons/bs";
import { ImFilePicture } from "react-icons/im";
import { motion } from "framer-motion";
import { Shortcuts } from "./Shortcuts";
import { UserImage } from "../UserImage";
import { useUserInfo } from "../UserInfoProvider";
import { CustomIcon } from "../CustomIcon";
import { Notifications } from "./Notifications";
import { Profile } from "./Profile";
import { Privacy } from "./Privacy";
import { Security } from "./Security";
import { Theme } from "./Theme";
import { Background } from "./Background";
import { SolInfo } from "./SolInfo";
import { Help } from "./Help";
import { useState } from "react";
import { useLeftDrawer } from "../LeftDrawer";
import { IconType } from "react-icons";

const PROFILE = "PROFILE";
const NOTIFICATIONS = "NOTIFICATIONS";
const PRIVACY = "PRIVACY";
const SECURITY = "SECURITY";
const THEME = "THEME";
const BACKGROUND = "BACKGROUND";
const SOL_INFO = "SOL_INFO";
const HELP = "HELP";

type Options =
  | "PROFILE"
  | "NOTIFICATIONS"
  | "PRIVACY"
  | "SECURITY"
  | "THEME"
  | "BACKGROUND"
  | "SOL_INFO"
  | "HELP"
  | "";

const renderOptions: { [x: string]: (goBack: () => void) => JSX.Element } = {
  NOTIFICATIONS: (goBack) => <Notifications goBack={goBack} />,
  PROFILE: (goBack) => <Profile goBack={goBack} />,
  PRIVACY: (goBack) => <Privacy goBack={goBack} />,
  SECURITY: (goBack) => <Security goBack={goBack} />,
  THEME: (goBack) => <Theme goBack={goBack} />,
  BACKGROUND: (goBack) => <Background goBack={goBack} />,
  SOL_INFO: (goBack) => <SolInfo goBack={goBack} />,
  HELP: (goBack) => <Help goBack={goBack} />,
};

const getRenderOption = (option: Options, goBack: () => void) => {
  return renderOptions[option](goBack);
};

const childVariants = {
  initial: {
    x: -20,
    opacity: 0,
  },
  enter: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: -20,
    opacity: 0,
  },
};

const User = (props: any) => {
  const { user } = useUserInfo();

  return (
    <div
      {...props}
      className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700"
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
    className="w-full flex items-center hover:bg-slate-50 dark:hover:bg-slate-700"
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

export function Configuration() {
  const { closeLeftDrawer } = useLeftDrawer();
  const [renderOption, setRenderOption] = useState<Options>("");

  const goBack = () => {
    setRenderOption("");
  };

  return !renderOption ? (
    <>
      <header className="pt-16 bg-slate-700 pb-5">
        <motion.div className="px-4 flex items-center" variants={childVariants}>
          <button
            onClick={closeLeftDrawer}
            className="w-7 h-7 dark:text-slate-400 text-slate-500 hover:text-slate-400 mr-4"
          >
            <CustomIcon Icon={BsArrowLeft} label="Cerrar configuración" />
          </button>
          <h2 id="left-drawer-title" className="text-neutral-50 text-xl">
            Configuración
          </h2>
        </motion.div>
      </header>
      <div className="overflow-y-auto overflow-x-hidden flex-1">
        <div className="flex flex-col">
          <User
            onClick={() => {
              setRenderOption(PROFILE);
            }}
          />

          <Item
            icon={BsBellFill}
            label="Notificaciones"
            onClick={() => {
              setRenderOption(NOTIFICATIONS);
            }}
          />
          <Item
            icon={BsLockFill}
            label="Privacidad"
            onClick={() => {
              setRenderOption(PRIVACY);
            }}
          />
          <Item
            icon={BsShieldShaded}
            label="Seguridad"
            onClick={() => {
              setRenderOption(SECURITY);
            }}
          />
          <Item
            icon={BsMoonStarsFill}
            label="Tema"
            onClick={() => {
              setRenderOption(THEME);
            }}
          />
          <Item
            icon={ImFilePicture}
            label="Fondo de pantalla"
            onClick={() => {
              setRenderOption(BACKGROUND);
            }}
          />
          <Item
            icon={BsFileEarmarkTextFill}
            label="Solicitar info. de la cuenta"
            onClick={() => {
              setRenderOption(SOL_INFO);
            }}
          />
          <Shortcuts />
          <Item
            icon={BsQuestionCircleFill}
            label="Ayuda"
            onClick={() => {
              setRenderOption(HELP);
            }}
          />
        </div>
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
    </>
  ) : (
    getRenderOption(renderOption, goBack)
  );
}
