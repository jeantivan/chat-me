import cx from "classnames";
import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { CustomIcon } from "../CustomIcon";

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
        className={cx(
          "inline-flex rounded-md p-1.5 cursor-pointer",
          "dark:text-gray-400 text-gray-500",
          "hover:bg-slate-200 dark:hover:bg-slate-600",
          className
        )}
      >
        <CustomIcon className="w-6 h-6" icon={icon} label={label} />
      </button>
    );
  }
);
