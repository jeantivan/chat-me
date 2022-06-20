import { MinusIcon } from "./MinusIcon";
import { SendIcon } from "./SendIcon";

export function ChatWindow() {
  return (
    <aside
      className="dark:bg-slate-700 xs:w-full w-96 rounded-lg overflow-hidden flex flex-col"
      style={{ height: 400 }}
    >
      <header className="bg-emerald-400 p-4 flex items-center">
        <div className="text-lg font-bold flex-1 flex items-center">
          <span className="mr-3 bg-gray-600 rounded-full block w-8 h-8" />
          John Doe
        </div>
        <div className="flex">
          <button className="inline-flex items-center justify-center font-bold hover:bg-emerald-100 w-8 h-8 py-2 rounded-full">
            <MinusIcon />
          </button>
        </div>
      </header>
      <div className="p-2 dark:bg-slate-900 w-full flex items-center mt-auto">
        <div className="dark:bg-slate-700 flex-1  self-stretch px-2 p-1 flex items-center mr-2 rounded-xl">
          <p className="text-slate-400">Escribe tu mensaje...</p>
        </div>
        <button className="inline-flex items-center justify-center font-bold text-emerald-200 hover:text-emerald-100 bg-emerald-800 hover:bg-emerald-700 w-10 h-10  rounded-full">
          <SendIcon />
        </button>
      </div>
    </aside>
  );
}
