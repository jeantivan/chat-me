import { useState } from "react";
import { TMedia } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";
import { Play } from "lucide-react";

const dimensions: Record<"square" | "landscape" | "portrait", string> = {
  square: "w-[300px] h-[300px]",
  landscape: "w-[370px] h-[208px]",
  portrait: "w-[300px] h-[375px]",
};

type ImageAndVideoProps = React.HTMLAttributes<HTMLDivElement> & TMedia;

export function ImageAndVideo({
  orientation,
  src,
  uploadProgress,
  type,
  blurhash,
  ...rest
}: ImageAndVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;
  const isVideo = type === "video";

  return (
    <div
      {...rest}
      className={mc(
        "relative mx-1 cursor-pointer overflow-hidden rounded",
        dimensions[orientation]
      )}
    >
      <div className="absolute inset-0 rounded bg-neutral-700">
        {isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/60">
            <video
              className="w-full h-full object-cover"
              src={src}
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-white pointer-events-none">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
          </div>
        ) : (
          <>
            {blurhash && !isLoaded && (
              <div
                data-testid="blurhash-placeholder"
                className="absolute inset-0 bg-neutral-800 animate-pulse"
                title={`Placeholder: ${blurhash}`}
              />
            )}
            <img
              className={mc(
                "w-full h-full object-cover transition-opacity duration-300",
                !isLoaded && blurhash ? "opacity-0" : "opacity-100"
              )}
              src={src}
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
            />
          </>
        )}
      </div>

      {isUploading && (
        <div
          data-testid="circular-progress-ring"
          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] rounded z-10"
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg
              className="w-12 h-12 -rotate-90"
              viewBox="0 0 36 36"
              aria-label="Upload Progress"
            >
              <path
                className="text-white/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary-9 transition-all duration-150 ease-out"
                strokeDasharray={`${uploadProgress}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-semibold text-white select-none">
              {Math.round(uploadProgress)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
