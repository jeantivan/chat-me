import { TMedia } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";

const dimensions: Record<"square" | "landscape" | "portrait", string> = {
  square: "w-[300px] h-[300px]",
  landscape: "w-[370px] h-[208px]",
  portrait: "w-[300px] h-[375px]",
};

type ImageAndVideoProps = React.HTMLAttributes<HTMLDivElement> & TMedia;
export function ImageAndVideo({
  orientation,
  src,
  ...rest
}: ImageAndVideoProps) {
  return (
    <div
      {...rest}
      className={mc("relative mx-1 cursor-pointer", dimensions[orientation])}
    >
      <div className="absolute inset-0 rounded bg-neutral-700">
        <img className="w-full h-full" src={src} loading="lazy" />
      </div>
    </div>
  );
}
