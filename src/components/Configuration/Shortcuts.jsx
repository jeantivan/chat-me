import * as Dialog from "@radix-ui/react-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { BsKeyboardFill } from "react-icons/bs";

export function Shortcuts({ mode }) {
  return (
    <Dialog.Root id="shortcut-modal">
      <Dialog.Trigger asChild>
        <button
          className={`w-full flex items-center ${
            mode === "light" ? "hover:bg-slate-50" : "hover:bg-slate-700"
          }`}
        >
          <span className="w-14 flex items-center justify-center">
            <span className="w-5 h-5 text-slate-400">
              <AccessibleIcon.Root label="Atajos del teclado">
                <BsKeyboardFill className="w-full h-full" />
              </AccessibleIcon.Root>
            </span>
          </span>

          <span
            className={`py-5 pl-4 flex-1 border-b text-left text-lg ${
              mode === "light"
                ? "text-black border-slate-200 "
                : "text-slate-50 border-slate-700 "
            }`}
          >
            Atajos del teclado
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="bg-black/50 fixed inset-0 w-screen h-screen"
          style={{ zIndex: 1001 }}
        />
        <Dialog.Content
          style={{ zIndex: 1001, height: "calc(100vh - 1rem)" }}
          className={`w-4/5 shadow-lg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
           `}
        >
          <div
            className={`w-full h-full p-8 flex flex-col justify-start
             ${mode === "light" ? "bg-white" : "bg-slate-800"}`}
          >
            <header className="mb-8">
              <Dialog.Title
                className={`text-xl font-medium ${
                  mode === "light" ? "text-black" : "text-white"
                }`}
              >
                Atajos del teclado
              </Dialog.Title>
            </header>
            <div className="flex-1 self-stretch"></div>
            <footer className="flex justify-end">
              <Dialog.Close className="py-2 px-4 inline-flex items-center justify-center rounded-md uppercase font-medium text-white bg-emerald-600">
                Ok
              </Dialog.Close>
            </footer>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
