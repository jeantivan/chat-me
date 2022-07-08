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
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Shortcuts } from "./Shortcuts";
import { useDarkMode } from "../DarkMode";
import { UserImage } from "../UserImage";
import { useUserInfo } from "../UserInfoProvider";
import { CustomIcon } from "../CustomIcon";

const PROFILE = "PROFILE";
const NOTIFICATIONS = "NOTIFICATIONS";
const PRIVACY = "PRIVACY";
const SECURITY = "SECURITY";
const THEME = "THEME";
const BACKGROUND = "BACKGROUND";
const SOL_INFO = "SOL_INFO";
const HELP = "HELP";

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

const User = ({ mode, ...rest }) => {
  const { user } = useUserInfo();

  return (
    <div
      {...rest}
      className={`flex items-center cursor-pointer w-full px-4 py-3 ${
        mode === "light" ? "hover:bg-slate-50" : "hover:bg-slate-700"
      }`}
    >
      <div className="mr-4">
        <div className="w-20 h-20 rounded-full overflow-hidden">
          <UserImage />
        </div>
      </div>
      <div className="flex-1">
        <h2
          className={`font-medium text-xl ${
            mode === "light" ? "text-black" : "text-neutral-50"
          }`}
        >
          {user.name}
        </h2>
        <p
          className={`leading-none line-clamp-2 ${
            mode === "light" ? "text-gray-500" : "text-neutral-400"
          }`}
        >
          {user.status}
        </p>
      </div>
    </div>
  );
};

const Item = ({ icon, label, mode, ...rest }) => (
  <button
    {...rest}
    className={`w-full flex items-center ${
      mode === "light" ? "hover:bg-slate-50" : "hover:bg-slate-700"
    }`}
  >
    <span className="w-14 flex items-center justify-center">
      <span className="w-5 h-5 text-slate-400">
        <CustomIcon Icon={icon} label={label} />
      </span>
    </span>

    <span
      className={`py-5 pl-4 flex-1 border-b text-left text-lg ${
        mode === "light"
          ? "text-black border-slate-200 "
          : "text-slate-50 border-slate-700 "
      }`}
    >
      {label}
    </span>
  </button>
);

export function Options({ setRender }) {
  const { mode } = useDarkMode();

  return (
    <>
      <header className="pt-16 bg-slate-700 pb-5 ">
        <motion.div className="px-4 flex items-center" variants={childVariants}>
          <Dialog.Close asChild>
            <button className="w-7 h-7 dark:text-slate-400 text-slate-500 hover:text-slate-400 mr-4">
              <CustomIcon Icon={BsArrowLeft} label="Cerrar configuración" />
            </button>
          </Dialog.Close>
          <Dialog.Title className="text-slate-50 text-xl">
            Configuración
          </Dialog.Title>
        </motion.div>
      </header>
      <div className="overflow-y-auto overflow-x-hidden flex-1">
        <div className="flex flex-col">
          <User
            mode={mode}
            onClick={() => {
              setRender(PROFILE);
            }}
          />

          <Item
            icon={BsBellFill}
            label="Notificaciones"
            mode={mode}
            onClick={() => {
              console.log("Notificaciones");
              setRender(NOTIFICATIONS);
            }}
          />
          <Item
            icon={BsLockFill}
            label="Privacidad"
            mode={mode}
            onClick={() => {
              console.log("Privacidad");
              setRender(PRIVACY);
            }}
          />
          <Item
            icon={BsShieldShaded}
            label="Seguridad"
            mode={mode}
            onClick={() => {
              console.log("Seguridad");
              setRender(SECURITY);
            }}
          />
          <Item
            icon={BsMoonStarsFill}
            label="Tema"
            mode={mode}
            onClick={() => {
              console.log("Tema");
              setRender(THEME);
            }}
          />
          <Item
            icon={ImFilePicture}
            label="Fondo de pantalla"
            mode={mode}
            onClick={() => {
              console.log("Fondo");
              setRender(BACKGROUND);
            }}
          />
          <Item
            icon={BsFileEarmarkTextFill}
            label="Solicitar info. de la cuenta"
            mode={mode}
            onClick={() => {
              console.log("Info");
              setRender(SOL_INFO);
            }}
          />
          <Shortcuts mode={mode} />
          <Item
            icon={BsQuestionCircleFill}
            label="Ayuda"
            mode={mode}
            onClick={() => {
              console.log("Ayuda");
              setRender(HELP);
            }}
          />
        </div>
        <footer className="flex w-full justify-center p-3 mt-5">
          <p
            className={`text-base ${
              mode === "light" ? "text-black" : "text-slate-50"
            }`}
          >
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
