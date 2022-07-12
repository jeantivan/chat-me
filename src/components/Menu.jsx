import * as Popover from "@radix-ui/react-popover";
import cx from "classnames";
import { CustomIcon } from "./CustomIcon";

export const MenuRoot = Popover.Root;

export const MenuTrigger = Popover.Trigger;

export const MenuItem = ({ className, children, ...rest }) => (
  <li
    className={cx(
      "w-full dark:text-white hover:bg-neutral-200 dark:hover:bg-gray-800",
      "flex items-center",
      { "px-4 py-2": typeof children === "string" },
      className
    )}
    {...rest}
  >
    {children}
  </li>
);

export const MenuIcon = ({ label, isDanger, Icon, className, ...rest }) => (
  <span
    className={cx(
      "w-6",
      {
        "text-neutral-700 dark:text-neutral-50": !isDanger,
        "text-red-500 dark:text-red-600": isDanger,
      },
      className
    )}
    {...rest}
  >
    <CustomIcon Icon={Icon} label={label} />
  </span>
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
      "bg-white dark:bg-gray-700",
      "z-50 select-none",
      className
    )}
    {...rest}
  >
    <ul>{children}</ul>
  </Popover.Content>
);
