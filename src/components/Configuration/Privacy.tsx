import * as Separator from "@radix-ui/react-separator";
import * as Label from "@radix-ui/react-label";
import cx from "classnames";
import { FiChevronRight } from "react-icons/fi";
import { useDarkMode } from "../DarkMode";
import { CustomIcon } from "../CustomIcon";
import { CheckBox } from "../CheckBox";
import { Header } from "./Header";

import { AnimateOptionChange } from "./AnimateOptionChange";

interface PrivacyProps {
  goBack: () => void;
}

export function Privacy({ goBack }: PrivacyProps) {
  const { mode } = useDarkMode();
  const isLight = mode === "light";

  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Privacidad</Header>
      <div className="overflow-y-auto flex-1 bg-neutral-100 dark:bg-slate-900">
        <div className="flex flex-col">
          <div className="p-6 mb-5 bg-white dark:bg-slate-800">
            <h2 className="text-emerald-600 mb-3">
              Quién puede ver mi información personal
            </h2>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-neutral-900 dark:text-neutral-50">
                  Última vez en linea.
                </h3>
                <p className="text-gray-500 dark:text-gray-400">Nadie</p>
              </div>
              <CustomIcon
                Icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-gray-400"
              />
            </div>
            <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-neutral-900 dark:text-neutral-50">
                  Foto de perfil.
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Mis contactos
                </p>
              </div>
              <CustomIcon
                Icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-gray-400"
              />
            </div>
            <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-neutral-900 dark:text-neutral-50">Info.</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Mis contactos
                </p>
              </div>
              <CustomIcon
                Icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-gray-400"
              />
            </div>
            <Separator.Root className="bg-gray-200 dark:bg-gray-600  w-full h-px" />
            <div className="flex pt-3 items-center">
              <Label.Root asChild htmlFor="preview">
                <div
                  className={`select-none mr-2  ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}
                >
                  Confirmaciones de lectura.
                  <span
                    className={`mt-1 select-none text-sm inline-block text-gray-400`}
                  >
                    Si desactivas las confirmaciones de lectura, no podrás
                    enviarlas ni recibirlas. Las confirmaciones de lectura se
                    enviarán siempre en los chats grupales.
                  </span>
                </div>
              </Label.Root>
              <CheckBox defaultChecked id="preview" />
            </div>
          </div>
          <div className="p-6 mb-5 bg-white dark:bg-slate-800">
            <h2 className="text-emerald-600 mb-5">Mensajes temporales</h2>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-neutral-900 dark:text-neutral-50">
                  Duración predeterminada de los mensajes
                </h3>
                <p className="text-gray-500 dark:text-gray-400">Desactivados</p>
              </div>
              <CustomIcon
                Icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-gray-400"
              />
            </div>
          </div>
          <div className="p-6 mb-5 bg-white dark:bg-slate-800">
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-neutral-900 dark:text-neutral-50">
                  Grupos
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Mis contactos
                </p>
              </div>
              <CustomIcon
                Icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-gray-400"
              />
            </div>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-neutral-900 dark:text-neutral-50">
                  Contactos bloqueados
                </h3>
                <p className="text-gray-500 dark:text-gray-400">15</p>
              </div>
              <CustomIcon
                Icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </AnimateOptionChange>
  );
}
