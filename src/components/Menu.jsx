import * as Popover from "@radix-ui/react-popover";
import cx from "classnames";

export const MenuRoot = Popover.Root;

export const MenuTrigger = Popover.Trigger;

export const MenuItem = ({ children }) => (
  <li
    className={cx(
      "w-full dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-900",
      { "px-4 py-2": typeof children === "string" }
    )}
  >
    {children}
  </li>
);

export const MenuContent = ({
  children,
  className,
  sideOffset = 4,
  ...rest
}) => (
  <Popover.Content
    sideOffset={sideOffset}
    className={cx(
      "rounded py-2 shadow-md",
      "bg-white dark:bg-slate-800",
      "z-50 select-none",
      className
    )}
    {...rest}
  >
    <ul>{children}</ul>
  </Popover.Content>
);
