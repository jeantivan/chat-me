import { FileText, Download } from "lucide-react";
import type { TMedia } from "@/lib/types";
import { formatBytes } from "@/lib/utils/formatters";
import { useTranslation } from "@/lib/i18n";

export function DocumentAttachment({ media }: { media: TMedia }) {
  const { t } = useTranslation();
  const filename = media.filename || t("chat.document");
  return (
    <div className="flex items-center gap-3 p-2.5 bg-background-3/80 rounded-lg max-w-xs w-full my-1 border border-background-7/50">
      <div className="w-9 h-9 rounded-md bg-primary-9/10 text-primary-9 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-background-12 truncate" title={filename}>
          {filename}
        </div>
        {media.sizeBytes ? (
          <div className="text-xs text-background-11">
            {formatBytes(media.sizeBytes)}
          </div>
        ) : null}
      </div>
      <a
        href={media.src}
        download={filename}
        aria-label={t("chat.downloadFile", { filename })}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-background-11 hover:text-primary-9 hover:bg-background-4 rounded-full transition-colors"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
