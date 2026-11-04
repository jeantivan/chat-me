import { Search, X } from "lucide-react";
import { Icon } from "./ui/Icon";
import useStore from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export function SearchChats() {
  const { t } = useTranslation();
  const chatSearchFilter = useStore((state) => state.chatSearchFilter);
  const setChatSearchFilter = useStore((state) => state.setChatSearchFilter);
  const clearChatSearchFilter = useStore((state) => state.clearChatSearchFilter);

  return (
    <div className="bg-background-2 p-2 border-b border-background-7">
      <div className="flex items-center text-background-12 bg-background-5 focus:bg-background-5 rounded-md">
        <Icon label={t("common.search")} icon={Search} className="w-fit p-2 pl-3 shrink-0" />
        <div className="w-full">
          <input
            value={chatSearchFilter}
            onChange={(e) => setChatSearchFilter(e.target.value)}
            className="w-full py-2 px-3 bg-transparent focus:outline-none placeholder:text-background-10"
            placeholder={t("chat.searchPlaceholder")}
          />
        </div>
        {chatSearchFilter.length > 0 && (
          <button
            type="button"
            data-testid="clear-chat-search"
            aria-label={t("common.clearSearch")}
            onClick={clearChatSearchFilter}
            className="p-2 text-background-10 hover:text-background-12 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
