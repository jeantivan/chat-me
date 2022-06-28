import * as Dialog from "@radix-ui/react-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { useState } from "react";
import { BsX } from "react-icons/bs";
import { useDarkMode } from "./DarkMode";
import { Drawer } from "./Drawer";

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
            mode === "light" ? "bg-white" : "bg-slate-900"
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
            <Dialog.Title className="text-lg text-white">
              Info. del Contacto
            </Dialog.Title>
          </header>
        </div>
      </Drawer>
    </Dialog.Root>
  );
}
