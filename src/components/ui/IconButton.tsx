import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { CustomIcon } from "../CustomIcon";
import mc from "@/lib/utils/mergeClassnames";

type IconButtonProps = {
  label: string;
  icon: LucideIcon;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function ButtonBase({ icon, label, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        {...props}
        className={mc(
          "inline-flex rounded-md p-1.5 cursor-pointer",
          "text-background-12 hover:bg-background-5 outline-none",
          className
        )}
      >
        <CustomIcon className="w-full h-full" icon={icon} label={label} />
      </button>
    );
  }
);
