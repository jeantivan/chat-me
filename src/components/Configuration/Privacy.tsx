import * as Separator from "@radix-ui/react-separator";
import * as Label from "@radix-ui/react-label";
import { FiChevronRight } from "react-icons/fi";

import { Header } from "./Header";

import { CustomIcon } from "@/components/CustomIcon";
import { Checkbox } from "@/components/ui/Checkbox";
import useStore from "@/lib/store";

export function Privacy() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  return (
    <>
      <Header goBack={closeLeftDrawer}>Privacidad</Header>
      <div className="overflow-y-auto flex-1 bg-background-5">
        <div className="flex flex-col">
          <div className="py-4 px-6 mb-5 bg-background-2">
            <h2 className="text-primary-9 mb-4">
              Quién puede ver mi información personal
            </h2>
            <div className="flex pb-4 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-background-12">Última vez en linea.</h3>
                <p className="text-background-11">Nadie</p>
              </div>
              <CustomIcon
                icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-background-9"
              />
            </div>
            <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />
            <div className="flex py-4 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-background-12">Foto de perfil.</h3>
                <p className="text-background-11">Mis contactos</p>
              </div>
              <CustomIcon
                icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-background-9"
              />
            </div>
            <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />
            <div className="flex py-4 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-background-12">Info.</h3>
                <p className="text-background-11">Mis contactos</p>
              </div>
              <CustomIcon
                icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-background-9"
              />
            </div>
            <Separator.Root className="bg-gray-200 dark:bg-gray-600  w-full h-px" />
            <div className="flex pt-4 items-center">
              <Label.Root asChild htmlFor="preview">
                <div className="select-none mr-2 text-background-12">
                  Confirmaciones de lectura.
                  <span className="mt-1 select-none text-sm inline-block text-background-11">
                    Si desactivas las confirmaciones de lectura, no podrás
                    enviarlas ni recibirlas. Las confirmaciones de lectura se
                    enviarán siempre en los chats grupales.
                  </span>
                </div>
              </Label.Root>
              <Checkbox defaultChecked id="preview" />
            </div>
          </div>
          <div className="py-4 px-6 mb-5 bg-background-2">
            <h2 className="text-primary-9 mb-4">Mensajes temporales</h2>
            <div className="flex items-center text-sm">
              <div className="flex-1">
                <h3 className="text-background-12">
                  Duración predeterminada de los mensajes
                </h3>
                <p className="text-background-11">Desactivados</p>
              </div>
              <CustomIcon
                icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-background-9"
              />
            </div>
          </div>
          <div className="py-4 px-6 bg-background-2">
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-background-12">Grupos</h3>
                <p className="text-background-11">Mis contactos</p>
              </div>
              <CustomIcon
                icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-background-9"
              />
            </div>
            <div className="flex py-3 items-center text-sm">
              <div className="flex-1">
                <h3 className="text-background-12">Contactos bloqueados</h3>
                <p className="text-background-11">15</p>
              </div>
              <CustomIcon
                icon={FiChevronRight}
                label="chevron-right-icon"
                className="w-6 h-6 text-background-9"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
