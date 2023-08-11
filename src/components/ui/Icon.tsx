import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import type { LucideIcon } from "lucide-react";
import mc from "@/lib/utils/mergeClassnames";

export type IconProps = {
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
};

export function Icon({ label, icon, iconClassName, className }: IconProps) {
  const Component = icon;
  return (
    <span className={mc("inline-block", className)}>
      <AccessibleIcon.Root label={`Icono ${label}`}>
        <Component className={mc("w-full h-full", iconClassName)} />
      </AccessibleIcon.Root>
    </span>
  );
}
