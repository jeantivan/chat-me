import { ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import useStore from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useChatMedia } from "@/lib/api/chatQueries";

export function SharedMediaPreview({
  chatId,
  testIdPrefix = "contact",
}: {
  chatId?: string;
  testIdPrefix?: "contact" | "group";
}) {
  const { t } = useTranslation();
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const { data: allMedia = [] } = useChatMedia(chatId);
  const { data: visualMedia = [] } = useChatMedia(chatId, "visual");

  return (
    <section className="py-4 shadow bg-background-3">
      <div className="flex px-5 mb-4">
        <div className="flex-1 text-sm text-primary-9">
          {t("info.sharedSectionTitle")}
        </div>
        <button
          data-testid={`${testIdPrefix}-shared-content-button`}
          onClick={() => {
            rightDrawerGoTo("SHARED_CONTENT");
          }}
          className="inline-flex items-center text-background-11 text-sm hover:text-primary-9 transition-colors"
        >
          {allMedia.length}
          <Icon icon={ChevronRight} label={t("info.seeMore")} />
        </button>
      </div>
      <div
        className="px-5 flex flex-row w-full mb-4 cursor-pointer gap-2"
        onClick={() => {
          rightDrawerGoTo("SHARED_CONTENT");
        }}
      >
        {visualMedia.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="w-1/3 aspect-square rounded-md overflow-hidden bg-background-4"
          >
            {item.hasMedia?.type === "video" ? (
              <video
                src={item.hasMedia.src}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={item.hasMedia?.src}
                alt={item.hasMedia?.filename || t("info.visualMedia")}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
        {visualMedia.length === 0 && (
          <div className="text-sm text-background-11 italic">
            {t("info.noSharedFiles")}
          </div>
        )}
      </div>
    </section>
  );
}
