import { TMedia } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";

const dimensions: Record<"square" | "landscape" | "portrait", string> = {
  square: "w-[240px] h-[240px]",
  landscape: "w-[330px] h-[186px]",
  portrait: "w-[300px] h-[375px]",
};

export function ImageAndVideo({ orientation }: TMedia) {
  return (
    <div className={mc("relative mx-1", dimensions[orientation])}>
      <div className="absolute inset-0 rounded bg-neutral-700"></div>
    </div>
  );
}
