import { forwardRef } from "react";
import { Icon, IconProps } from "./Icon";
import mc from "@/lib/utils/mergeClassnames";

type IconButtonProps = IconProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function ButtonBase(
    { icon, label, className, iconClassName, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        {...props}
        className={mc(
          "inline-flex rounded-md p-1.5 cursor-pointer",
          "text-background-12 hover:bg-background-5 outline-none",
          "disabled:text-background-8",
          className
        )}
      >
        <Icon
          className="w-full h-full"
          icon={icon}
          label={label}
          iconClassName={iconClassName}
        />
      </button>
    );
  }
);
