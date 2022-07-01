import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { useState } from "react";
import { useDarkMode } from "./DarkMode";
import { Drawer } from "./Drawer";
import { FaUserCircle, FaBan } from "react-icons/fa";
import {
  BsX,
  BsChevronRight,
  BsStarFill,
  BsBellFill,
  BsLockFill,
  BsClockHistory,
  BsHandThumbsDownFill,
  BsTrashFill,
} from "react-icons/bs";

export function ContactInfo({ selectedChat }) {
  const { mode } = useDarkMode();
  const [open, setOpen] = useState(false);

  const isLight = mode === "light";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="w-full py-2 px-4 flex items center  dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
        Info. del Contacto
      </Dialog.Trigger>
      <Drawer from="right" open={open}>
        <div
          className={`${
            mode === "light" ? "bg-slate-50" : "bg-slate-900"
          } w-full h-full flex flex-col`}
        >
          <header
            className={`p-4 flex items-center h-14 ${
              isLight ? "bg-slate-100" : "bg-slate-700"
            }`}
          >
            <Dialog.Close className="w-7 h-7 text-slate-500  mr-4">
              <AccessibleIcon.Root label="Cerrar info. del contacto">
                <BsX className="w-full h-full" />
              </AccessibleIcon.Root>
            </Dialog.Close>
            <Dialog.Title
              className={`text-lg ${isLight ? "text-black" : "text-white"}`}
            >
              Info. del Contacto
            </Dialog.Title>
          </header>
          <div className="flex flex-col overflow-y-auto">
            <div
              className={`py-4 px-5 flex flex-col mb-4 shadow ${
                isLight ? "bg-white" : "bg-slate-800"
              }`}
            >
              <div className="mx-auto mt-16 mb-4">
                <div className="w-40 h-40 rounded-full text-gray-500">
                  <FaUserCircle className="h-full w-full" />
                </div>
              </div>
              <div className="mx-auto text-center">
                <h2
                  className={`text-2xl mb-2 ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  {selectedChat.contactName}
                </h2>
                <div className={`text-gray-500`}>081-454-0666</div>
              </div>
            </div>
            <div
              className={`py-4 px-5 mb-4 shadow ${
                isLight ? "bg-white" : "bg-slate-800"
              }`}
            >
              <div className="text-sm text-emerald-600">Info.</div>
              <div
                className={`text-lg ${
                  isLight ? "text-neutral-900" : "text-white"
                }`}
              >
                Hola estoy usando ChatMe!
              </div>
            </div>
            <div
              className={`py-4 px-5 mb-4 shadow ${
                isLight ? "bg-white" : "bg-slate-800"
              }`}
            >
              <div className="flex mb-4">
                <div className="flex-1 text-sm text-emerald-600">
                  Archivos, enlaces y documentos.
                </div>
                <div className="inline-flex items-center text-gray-500 text-sm">
                  20
                  <AccessibleIcon.Root class="Ver más">
                    <BsChevronRight />
                  </AccessibleIcon.Root>
                </div>
              </div>
              <div className="px-2 flex flex-row w-full mb-4">
                <div className="w-1/3 aspect-w-1 aspect-h-1 rounded-md bg-gray-300 mx-2">
                  <div />
                </div>
                <div className="w-1/3 aspect-w-1 aspect-h-1 rounded-md bg-gray-300 mx-2">
                  <div />
                </div>
                <div className="w-1/3 aspect-w-1 aspect-h-1 rounded-md bg-gray-300 mx-2">
                  <div />
                </div>
              </div>
              <div
                className={`text-sm ${
                  isLight ? "text-neutral-900" : "text-white"
                }`}
              >
                Usa WhatsApp en tu teléfono para ver el historial de mensajes
                completo.
              </div>
            </div>
            <div className={`pt-3 ${isLight ? "bg-white" : "bg-slate-800"}`}>
              <div className="w-full mb-5">
                <div className="flex p-3 cursor-pointer">
                  <div className="flex text-lg w-full mb-2">
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de estrella">
                          <BsStarFill className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`leading-none
                  flex-1 ${isLight ? "text-neutral-900" : "text-gray-100"}`}
                      >
                        Mensajes destacados
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de campana">
                          <BsChevronRight className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex p-3 cursor-pointer">
                  <div className="flex text-lg w-full mb-2">
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de campana">
                          <BsBellFill className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`leading-none
                  flex-1 ${isLight ? "text-neutral-900" : "text-gray-100"}`}
                      >
                        Silenciar notificaciones
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <Switch.Root
                        className={cx(
                          "group",
                          "radix-state-checked:bg-emerald-500",
                          "radix-state-unchecked:bg-gray-400 dark:radix-state-unchecked:bg-gray-800",
                          "relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                          "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
                        )}
                      >
                        <Switch.Thumb
                          className={cx(
                            "group-radix-state-checked:translate-x-5",
                            "group-radix-state-unchecked:translate-x-0",
                            "pointer-events-none inline-block h-[20px] w-[20px] p-1 transform rounded-full text-neutral-700 bg-white ring-0 transition duration-200 ease-in-out"
                          )}
                        />
                      </Switch.Root>
                    </div>
                  </div>
                </div>
                <div className="flex p-3 cursor-pointer">
                  <div className="flex text-lg w-full">
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de temporizador">
                          <BsClockHistory className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`leading-none
                  flex-1 ${isLight ? "text-neutral-900" : "text-gray-100"}`}
                      >
                        Mensajes temporales
                      </div>
                      <div className="mt-1 mr-9 text-sm text-gray-400">
                        Desactivados
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de campana">
                          <BsChevronRight className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex p-3 cursor-pointer">
                  <div className="flex text-lg w-full mb-2">
                    <div className="w-1/6 flex justify-center text-gray-400">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de candado">
                          <BsLockFill className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`leading-none
                  flex-1 ${isLight ? "text-neutral-900" : "text-gray-100"}`}
                      >
                        Cifrado
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        Los mensajes están cifrados de extremo a extremo. Haz
                        clic para verificarlo.
                      </div>
                    </div>
                    <div className="w-1/6"></div>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <div
                  className={`flex px-3 py-4 cursor-pointer text-red-500 ${
                    isLight ? "hover:bg-slate-50" : "hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center text-lg w-full">
                    <div className="w-1/6 flex justify-center">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de bloquear">
                          <FaBan className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`leading-none flex-1`}>
                        Bloquear a {selectedChat.contactName}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`flex px-3 py-4 cursor-pointer text-red-500 ${
                    isLight ? "hover:bg-slate-50" : "hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center text-lg w-full">
                    <div className="w-1/6 flex justify-center">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de no me gusta">
                          <BsHandThumbsDownFill className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`leading-none flex-1`}>
                        Reportar a {selectedChat.contactName}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`flex px-3 py-4 cursor-pointer text-red-500 ${
                    isLight ? "hover:bg-slate-50" : "hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center text-lg w-full">
                    <div className="w-1/6 flex justify-center">
                      <div className="w-5 h-5">
                        <AccessibleIcon.Root label="Icono de basura">
                          <BsTrashFill className="w-full h-full" />
                        </AccessibleIcon.Root>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`leading-none flex-1`}>Eliminar chat</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </Dialog.Root>
  );
}
