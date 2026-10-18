import { LucideIcon, HelpCircle, FileText, Users } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

const Item = ({
  icon,
  label,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
}) => (
  <div {...rest} className="w-full flex items-center hover:bg-background-3">
    <span className="w-20 flex items-center justify-center">
      <span className="w-6 h-6 text-background-10">
        <Icon icon={icon} label={label} />
      </span>
    </span>

    <span className="py-5 pr-4 flex-1 border-b text-left text-lg font-medium text-background-12 border-background-7">
      {label}
    </span>
  </div>
);

export function Help() {
  return (
    <div className="h-full flex">
      <div className="w-full mt-auto">
        <Item icon={HelpCircle} label="Centro de ayuda" />
        <Item icon={Users} label="Contáctanos" />
        <Item icon={FileText} label="Condiciones y Políticas de privacidad" />
      </div>
    </div>
  );
}
