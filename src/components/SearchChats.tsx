import { BsSearch } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";
export function SearchChats() {
  return (
    <div className="dark:bg-slate-800 bg-slate-50 p-2 border-b border-r border-slate-200 dark:border-slate-600">
      <div className="flex dark:text-slate-300 text-slate-600 dark:bg-slate-700 bg-slate-200 rounded-md">
        <CustomIcon label="Buscar" icon={BsSearch} className="w-fit p-2 pl-3" />
        <div className="w-full">
          <input
            className="w-full py-2 px-3 bg-transparent focus:outline-none placeholder:text-slate-400"
            placeholder="Busca o inicia un nuevo chat"
          />
        </div>
      </div>
    </div>
  );
}
