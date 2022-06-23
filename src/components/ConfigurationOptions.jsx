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

const User = () => (
  <div className="flex items-center w-full px-4 py-3 hover:bg-slate-700">
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

const Item = ({ icon, label }) => (
  <div className="flex items-center hover:bg-slate-700">
    <div className="w-14 flex items-center justify-center">
      <span className="w-5 h-5 text-slate-400">
        <AccessibleIcon.Root label={label}>{icon}</AccessibleIcon.Root>
      </span>
    </div>

    <span className="py-5 pl-4 flex-1 border-b border-slate-700 text-lg text-slate-50">
      {label}
    </span>
  </div>
);

export function ConfigurationOptions({ mode }) {
  return (
    <>
      <header className="pt-16 bg-slate-700 px-4 pb-5 flex items-center">
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
      </header>
      <div className="overflow-y-auto flex-1">
        <div className="flex flex-col">
          <User />
          <Item
            icon={<BsBellFill className="w-full h-full" />}
            label="Notificaciones"
          />
          <Item
            icon={<BsLockFill className="w-full h-full" />}
            label="Privacidad"
          />
          <Item
            icon={<BsShieldShaded className="w-full h-full" />}
            label="Seguridad"
          />
          <Item
            icon={<BsMoonStarsFill className="w-full h-full" />}
            label="Tema"
          />
          <Item
            icon={<ImFilePicture className="w-full h-full" />}
            label="Fondo de pantalla"
          />
          <Item
            icon={<BsFileEarmarkTextFill className="w-full h-full" />}
            label="Solicitar info. de la cuenta"
          />
          <Item
            icon={<BsQuestionCircleFill className="w-full h-full" />}
            label="Ayuda"
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
