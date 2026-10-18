import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import useStore from "@/lib/store";
import { ScrollArea } from "@/components/ui/ScrollArea";

const FakeImage = () => (
  <div className="w-full aspect-square rounded-md bg-gray-300" />
);

const FAKE_IMAGES = Array.from({ length: 50 }).map(
  (_, i, a) => `image-${a.length - i}`
);

export function SharedContent() {
  const rdGoBack = useStore((state) => state.rdGoBack);
  return (
    <div className="bg-background-5 flex flex-col h-screen">
      <header className="min-h-[56px] py-2 px-4 flex items-center sticky gap-4 bg-background-2">
        <IconButton icon={ArrowLeft} label="Volver atrás" onClick={rdGoBack} />
        <h2
          id="right-drawer-title "
          className="text-lg line-clamp-1 truncate text-background-12"
        >
          Compartido
        </h2>
      </header>
      <ScrollArea type="auto" className="pr-2.5">
        <div className="p-3 grid grid-cols-3 gap-2 overflow-y-auto">
          {FAKE_IMAGES.map((image) => (
            <FakeImage key={image} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
