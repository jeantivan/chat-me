import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { CustomIcon } from "./CustomIcon";

export function Loader() {
  return (
    <div className="w-full mb-4 flex justify-center px-5 md:px-[5%] lg:px-[9%]">
      <div className="w-12 h-12 md:w-14 md:h-14 dark:bg-slate-800 bg-neutral-50 rounded-full p-2">
        <CustomIcon
          Icon={AiOutlineLoading3Quarters}
          label="Cargando"
          className="w-full animate-spin inline-block text-emerald-500"
        />
      </div>
    </div>
  );
}
