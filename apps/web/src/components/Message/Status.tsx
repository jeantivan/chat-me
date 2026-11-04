import { Clock, Check, CheckCheck, LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { TMessage } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";
import { useTranslation, TranslationKey } from "@/lib/i18n";

const STATUS_ICONS: Record<TMessage["status"], LucideIcon> = {
  idle: Clock,
  send: Check,
  received: CheckCheck,
  read: CheckCheck,
};

const STATUS_KEY_MAP: Record<TMessage["status"], TranslationKey> = {
  idle: "chat.statusIdle",
  send: "chat.statusSent",
  received: "chat.statusReceived",
  read: "chat.statusRead",
};

export function Status({
  status,
  className,
}: {
  status: TMessage["status"];
  className?: string;
}) {
  const { t } = useTranslation();
  const icon = STATUS_ICONS[status];
  const label = t(STATUS_KEY_MAP[status]);

  return (
    <span data-testid={`message-status-${status}`} data-status={status} className="inline-flex">
      <Icon
        icon={icon}
        label={label}
        className={mc(
          "w-4 h-4 text-slate-400",
          status === "read" && "text-[#0600C1] dark:text-[#00FFFB]",
          className
        )}
      />
    </span>
  );
}
