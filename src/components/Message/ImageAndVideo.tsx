import mc from "@/lib/utils/mergeClassnames";

function calculateAspectRatio(width: number, height: number) {
  if (width > height) {
    return "landscape";
  } else if (height > width) {
    return "portrait";
  }

  return "square";
}

const dimensions: Record<"squarish" | "landscape" | "portrait", string> = {
  squarish: "w-[240px] h-[240px]",
  landscape: "w-[330px] h-[186px]",
  portrait: "w-[300px] h-[375px]",
};

type ImageAndVideoProps = {
  src?: string;
  type: "image" | "video";
  orientation: "squarish" | "landscape" | "portrait";
};
export function ImageAndVideo({ orientation }: ImageAndVideoProps) {
  return (
    <div className={mc("relative mx-1", dimensions[orientation])}>
      <div className="absolute inset-0 rounded bg-neutral-700"></div>
    </div>
  );
}
