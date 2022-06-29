import * as Dialog from "@radix-ui/react-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { useState } from "react";
import { BsX, BsChevronRight } from "react-icons/bs";
import { useDarkMode } from "./DarkMode";
import { Drawer } from "./Drawer";
import { FaUserCircle } from "react-icons/fa";

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
              isLight ? "bg-slate-50" : "bg-slate-800"
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
              className={`py-3 px-5 flex flex-col mb-4 shadow ${
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
                  className={`text-2xl mb-3 ${
                    isLight ? "text-neutral-900" : "text-white"
                  }`}
                >
                  {selectedChat.contactName}
                </h2>
                <div className={`text-gray-500`}>081-454-0666</div>
              </div>
            </div>
            <div
              className={`py-3 px-5 mb-4 shadow ${
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
              className={`py-3 px-5 mb-4 shadow ${
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
              <div className="px-2 flex flex-1">
                <div className="w-36 h-36 rounded-md bg-gray-300 mr-2" />
                <div className="w-36 h-36 rounded-md bg-gray-300 mr-2" />
                <div className="w-36 h-36 rounded-md bg-gray-300 mr-2" />
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </Dialog.Root>
  );
}
