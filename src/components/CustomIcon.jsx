import * as AccessibleIcon from "@radix-ui/react-accessible-icon";

export function CustomIcon({ label, Icon, ...rest }) {
  return (
    <span {...rest}>
      <AccessibleIcon.Root label={`Icono ${label}`}>
        <Icon className="w-full h-full text-inherit" />
      </AccessibleIcon.Root>
    </span>
  );
}
