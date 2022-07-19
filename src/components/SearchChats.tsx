import { BsSearch } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";
export function SearchChats() {
  return (
    <div className="dark:bg-slate-800 bg-white p-2 border-b border-r border-slate-200 dark:border-slate-600 border-solid">
      <div className="flex dark:text-gray-400 text-gray-500 dark:bg-slate-700 bg-zinc-100 rounded-md">
        <CustomIcon label="Buscar" Icon={BsSearch} className="w-fit p-2 pl-3" />
        <div className="w-full">
          <input
            className="w-full py-2 px-3 bg-transparent focus:outline-none"
            placeholder="Busca o inicia un nuevo chat"
          />
        </div>
      </div>
    </div>
  );
}
