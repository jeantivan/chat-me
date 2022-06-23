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
import { FaUserCircle } from "react-icons/fa";
import * as Dialog from "@radix-ui/react-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { motion } from "framer-motion";
import { useDarkMode } from "../DarkMode";

const PROFILE = "PROFILE";
const NOTIFICATIONS = "NOTIFICATIONS";
const PRIVACY = "PRIVACY";
const SECURITY = "SECURITY";
const THEME = "THEME";
const BACKGROUND = "BACKGROUND";
const SOL_INFO = "SOL_INFO";
const HELP = "HELP";

const User = (props) => (
  <div
    {...props}
    className="flex items-center w-full px-4 py-3 hover:bg-slate-700"
  >
    <div className="mr-4">
      <div className="w-20 h-20 text-neutral-300">
        <FaUserCircle className="w-full h-full" />
      </div>
    </div>
    <div className="flex-1">
      <h2 className="text-neutral-50 font-medium text-xl">Jane Doe</h2>
      <p className="text-neutral-300">Hola estoy usando ChatMe!</p>
    </div>
  </div>
);

const Item = ({ icon, label, ...rest }) => (
  <button {...rest} className="w-full flex items-center hover:bg-slate-700">
    <span className="w-14 flex items-center justify-center">
      <span className="w-5 h-5 text-slate-400">
        <AccessibleIcon.Root label={label}>{icon}</AccessibleIcon.Root>
      </span>
    </span>

    <span className="py-5 pl-4 flex-1 border-b border-slate-700 text-left text-lg text-slate-50">
      {label}
    </span>
  </button>
);

export function Options({ setRender }) {
  const { mode } = useDarkMode();

  return (
    <>
      <header className="pt-16 bg-slate-700 pb-5 ">
        <motion.div
          className="px-4 flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ delay: 0.2 }}
        >
          <Dialog.Close asChild>
            <button className="w-7 h-7 dark:text-slate-400 text-slate-500 hover:text-slate-400 mr-4">
              <AccessibleIcon.Root label="Cerrar configuración">
                <BsArrowLeft className="w-full h-full" />
              </AccessibleIcon.Root>
            </button>
          </Dialog.Close>
          <Dialog.Title className="text-slate-50 text-xl">
            Configuración
          </Dialog.Title>
        </motion.div>
      </header>
      <div className="overflow-y-auto flex-1">
        <div className="flex flex-col">
          <User
            onClick={() => {
              setRender(PROFILE);
            }}
          />
          <Item
            icon={<BsBellFill className="w-full h-full" />}
            label="Notificaciones"
            onClick={() => {
              console.log("Notificaciones");
              setRender(NOTIFICATIONS);
            }}
          />
          <Item
            icon={<BsLockFill className="w-full h-full" />}
            label="Privacidad"
            onClick={() => {
              console.log("Privacidad");
              setRender(PRIVACY);
            }}
          />
          <Item
            icon={<BsShieldShaded className="w-full h-full" />}
            label="Seguridad"
            onClick={() => {
              console.log("Seguridad");
              setRender(SECURITY);
            }}
          />
          <Item
            icon={<BsMoonStarsFill className="w-full h-full" />}
            label="Tema"
            onClick={() => {
              console.log("Tema");
              setRender(THEME);
            }}
          />
          <Item
            icon={<ImFilePicture className="w-full h-full" />}
            label="Fondo de pantalla"
            onClick={() => {
              console.log("Fondo");
              setRender(BACKGROUND);
            }}
          />
          <Item
            icon={<BsFileEarmarkTextFill className="w-full h-full" />}
            label="Solicitar info. de la cuenta"
            onClick={() => {
              console.log("Info");
              setRender(SOL_INFO);
            }}
          />
          <Item
            icon={<BsQuestionCircleFill className="w-full h-full" />}
            label="Ayuda"
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
