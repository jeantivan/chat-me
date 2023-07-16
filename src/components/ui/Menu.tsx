import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconButton } from "./IconButton";
import { LucideIcon } from "lucide-react";
import { CustomIcon } from "../CustomIcon";
import mc from "@/lib/utils/mergeClassnames";

export const MenuRoot = DropdownMenu.Root;
export const RadioGroup = DropdownMenu.RadioGroup;
export const RadioItem = DropdownMenu.RadioItem;
export const TriggerBase = DropdownMenu.Trigger;
export const Arrow = () => (
  <DropdownMenu.Arrow className="fill-slate-50 dark:fill-slate-800" />
);

type MenuTriggerProps = DropdownMenu.DropdownMenuTriggerProps & {
  icon: LucideIcon;
  label: string;
};
export const MenuTrigger = ({ className, ...rest }: MenuTriggerProps) => {
  return (
    <DropdownMenu.Trigger asChild>
      <IconButton
        className={mc(
          "text-slate-800",
          "data-[state=open]:bg-slate-500/20 dark:data-[state=open]:bg-slate-600/50",
          className
        )}
        {...rest}
      />
    </DropdownMenu.Trigger>
  );
};

export const MenuItem = ({
  className,
  icon,
  children,
  ...rest
}: DropdownMenu.MenuItemProps & { icon?: LucideIcon }) => {
  const componentClassName = mc(
    "w-full px-4 py-2 rounded flex items-center gap-3",
    "outline-none cursor-pointer data-[disabled]:cursor-not-allowed",
    "dark:text-white text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-600",
    "data-[disabled]:bg-slate-200/50 data-[disabled]:text-slate-500/80 ",
    "dark:data-[disabled]:bg-slate-600/50 dark:data-[disabled]:text-white/80",
    "flex items-center",
    className
  );

  return (
    <DropdownMenu.DropdownMenuItem className={componentClassName} {...rest}>
      {icon && (
        <CustomIcon className="w-5 h-5" icon={icon} label="Menu item icon" />
      )}
      {children}
    </DropdownMenu.DropdownMenuItem>
  );
};

export const MenuContent = ({
  children,
  className,
  sideOffset = 4,
  align = "end",
  ...rest
}: DropdownMenu.MenuContentProps) => (
  <DropdownMenu.Content
    sideOffset={sideOffset}
    align={align}
    className={mc(
      "rounded p-1 shadow-md flex flex-col gap-1",
      "bg-slate-50 dark:bg-slate-800",
      "z-50 select-none",
      className
    )}
    {...rest}
  >
    {children}
  </DropdownMenu.Content>
);
