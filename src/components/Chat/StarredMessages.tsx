import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";

export function StarredMessages() {
  const rdGoBack = useStore((state) => state.rdGoBack);
  return (
    <div className="bg-background-5 flex flex-col h-full">
      <header className="min-h-[56px] py-2 px-4 flex items-center sticky gap-4 bg-background-2">
        <IconButton icon={ArrowLeft} label="Volver atrás" onClick={rdGoBack} />
        <h2
          id="right-drawer-title "
          className="text-lg line-clamp-1 truncate text-background-12"
        >
          Mensajes destacados
        </h2>
      </header>
      <ScrollArea type="auto" className="pr-2.5">
        <div className="p-3"></div>
      </ScrollArea>
    </div>
  );
}
