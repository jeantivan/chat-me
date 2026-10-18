import { forwardRef } from "react";
import mc from "@/lib/utils/mergeClassnames";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "filled" | "outlined";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function ButtonBase(
  { className, children, variant = "filled", ...rest },
  ref
) {
  return (
    <button
      className={mc(
        "py-2 px-8 min-w-[64px] rounded-full",
        "inline-flex justify-center items-center",
        "uppercase font-medium border",
        "bg-primary-9 hover:bg-primary-10 border-primary-9 hover:border-primary-10 text-neutral-950",
        variant === "outlined" &&
          "bg-transparent hover:bg-primary-10/10 text-primary-9",
        className
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </button>
  );
});
