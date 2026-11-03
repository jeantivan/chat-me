import { Music } from "lucide-react";
import type { TMedia } from "@/lib/types";
import { formatDuration } from "@/lib/utils/formatters";

export function AudioAttachment({ media }: { media: TMedia }) {
  return (
    <div className="flex flex-col gap-1.5 p-2 bg-background-3/80 rounded-lg max-w-xs w-full my-1">
      <div className="flex items-center justify-between text-xs text-background-11 px-1">
        <div className="flex items-center gap-1.5 truncate">
          <Music className="w-3.5 h-3.5 text-primary-9 shrink-0" />
          <span className="font-medium text-background-12 truncate">
            {media.filename || "Audio"}
          </span>
        </div>
        {media.duration ? <span>{formatDuration(media.duration)}</span> : null}
      </div>
      <audio
        controls
        src={media.src}
        className="w-full h-8"
        preload="metadata"
      />
    </div>
  );
}
