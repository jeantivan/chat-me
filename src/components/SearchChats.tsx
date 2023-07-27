import { BsSearch } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";
export function SearchChats() {
  return (
    <div className="bg-background-2 p-2 border-b border-background-7">
      <div className="flex text-background-12 bg-background-5 focus:bg-background-5 rounded-md">
        <CustomIcon label="Buscar" icon={BsSearch} className="w-fit p-2 pl-3" />
        <div className="w-full">
          <input
            className="w-full py-2 px-3 bg-transparent focus:outline-none placeholder:text-background-10"
            placeholder="Busca o inicia un nuevo chat"
          />
        </div>
      </div>
    </div>
  );
}
