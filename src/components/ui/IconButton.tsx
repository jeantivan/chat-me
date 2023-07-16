import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { CustomIcon } from "../CustomIcon";
import mc from "@/lib/utils/mergeClassnames";

type IconButtonProps = {
  label: string;
  icon: LucideIcon;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function ({ icon, label, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        {...props}
        className={mc(
          "inline-flex rounded-md p-1.5 cursor-pointer",
          "dark:text-gray-300 text-gray-600",
          "hover:bg-slate-200/50 dark:hover:bg-slate-600/50",
          className
        )}
      >
        <CustomIcon className="w-full h-full" icon={icon} label={label} />
      </button>
    );
  }
);
