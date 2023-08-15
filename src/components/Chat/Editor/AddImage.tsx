import { ImagePlus } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

export function AddImage() {
  return (
    <>
      <IconButton
        label="Añadir imagen o video"
        icon={ImagePlus}
        className="w-10 h-10 text-background-11"
      />
    </>
  );
}
