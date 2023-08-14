import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import useStore from "@/lib/store";

export function SharedContent() {
  const rdGoBack = useStore((state) => state.rdGoBack);
  return (
    <div className="bg-background-5 h-full">
      <header className="p-2.5 flex items-center sticky gap-4 bg-background-2">
        <IconButton icon={ArrowLeft} label="Volver atrás" onClick={rdGoBack} />
        <h2
          id="right-drawer-title "
          className="text-lg line-clamp-1 truncate text-background-12"
        >
          Compartido
        </h2>
      </header>
    </div>
  );
}
