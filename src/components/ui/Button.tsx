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
        "py-2 px-6 min-w-[64px] rounded",
        "inline-flex justify-center items-center",
        "uppercase font-medium border",
        "bg-emerald-500 hover:bg-emerald-500/90 border-emerald-500 hover:border-emerald-500/90 text-white",
        variant === "outlined" &&
          "border-emerald-500 bg-transparent hover:bg-emerald-800/10 text-emerald-500",
        className
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </button>
  );
});
