import { Clock, Check, CheckCheck, LucideIcon } from "lucide-react";
import { CustomIcon } from "../CustomIcon";
import { MessageType } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";

const STATUS: Record<
  MessageType["status"],
  { icon: LucideIcon; label: string }
> = {
  idle: { icon: Clock, label: "Enviando mensaje" },
  send: { icon: Check, label: "Mensaje enviado" },
  received: { icon: CheckCheck, label: "Mensaje recibido" },
  read: { icon: CheckCheck, label: "Mensaje leído" },
};

export function Status({
  status,
  className,
}: {
  status: MessageType["status"];
  className?: string;
}) {
  const { icon, label } = STATUS[status];

  return (
    <CustomIcon
      icon={icon}
      label={label}
      className={mc(
        "w-4 h-4 text-slate-400",
        status === "read" && "text-cyan-400",
        className
      )}
    />
  );
}
