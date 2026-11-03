import { ArrowLeft, FileText, Download, Play, Music } from "lucide-react";
import dayjs from "dayjs";
import { IconButton } from "@/components/ui/IconButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import { useCurrentChatId } from "@/lib/hooks";
import { useChatMedia } from "@/lib/api/chatQueries";
import { formatBytes, formatDuration } from "@/lib/utils/formatters";

export function SharedContent() {
  const rdGoBack = useStore((state) => state.rdGoBack);
  const openMediaMessage = useStore((state) => state.openMediaMessage);
  const { currentChatId } = useCurrentChatId();
  const { data: mediaMessages = [] } = useChatMedia(currentChatId);

  const visualItems = mediaMessages.filter(
    (m) => m.hasMedia?.type === "image" || m.hasMedia?.type === "video"
  );
  const docItems = mediaMessages.filter((m) => m.hasMedia?.type === "document");
  const audioItems = mediaMessages.filter((m) => m.hasMedia?.type === "audio");

  return (
    <div className="bg-background-5 flex flex-col h-screen">
      <header className="min-h-[56px] py-2 px-4 flex items-center sticky gap-4 bg-background-2 shadow-sm">
        <IconButton icon={ArrowLeft} label="Volver atrás" onClick={rdGoBack} />
        <h2
          id="right-drawer-title"
          className="text-lg font-medium line-clamp-1 truncate text-background-12"
        >
          Compartido
        </h2>
      </header>

      <Tabs defaultValue="multimedia" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3 bg-background-2 border-b border-background-7">
          <TabsList className="grid grid-cols-3 w-full bg-background-3">
            <TabsTrigger value="multimedia" className="text-xs sm:text-sm">
              Multimedia
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs sm:text-sm">
              Documentos
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs sm:text-sm">
              Audio
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Multimedia */}
        <TabsContent value="multimedia" className="flex-1 overflow-hidden p-0 m-0">
          <ScrollArea type="auto" rootClassName="h-full">
            {visualItems.length === 0 ? (
              <div className="p-8 text-center text-background-11 text-sm">
                No hay archivos multimedia
              </div>
            ) : (
              <div className="p-3 grid grid-cols-3 gap-2">
                {visualItems.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => openMediaMessage(msg as any)}
                    className="relative w-full aspect-square rounded-md overflow-hidden bg-background-4 group focus:outline-none focus:ring-2 focus:ring-primary-9 cursor-pointer"
                  >
                    {msg.hasMedia?.type === "video" ? (
                      <div className="relative w-full h-full">
                        <video
                          src={msg.hasMedia.src}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={msg.hasMedia?.src}
                        alt={msg.hasMedia?.filename || "Visual media"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab 2: Documentos */}
        <TabsContent value="documentos" className="flex-1 overflow-hidden p-0 m-0">
          <ScrollArea type="auto" rootClassName="h-full">
            {docItems.length === 0 ? (
              <div className="p-8 text-center text-background-11 text-sm">
                No hay documentos compartidos
              </div>
            ) : (
              <div className="p-3 divide-y divide-background-7/50">
                {docItems.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-background-3 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-9/10 text-primary-9 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-background-12 truncate">
                        {msg.hasMedia?.filename || "documento"}
                      </div>
                      <div className="text-xs text-background-11 flex items-center gap-1.5 mt-0.5">
                        <span>{formatBytes(msg.hasMedia?.sizeBytes)}</span>
                        <span>•</span>
                        <span>{dayjs(msg.time).format("DD/MM/YYYY")}</span>
                      </div>
                    </div>
                    <a
                      href={msg.hasMedia?.src}
                      download={msg.hasMedia?.filename || "documento"}
                      aria-label={`Descargar ${msg.hasMedia?.filename || "documento"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-background-11 hover:text-primary-9 hover:bg-background-4 rounded-full transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab 3: Audio */}
        <TabsContent value="audio" className="flex-1 overflow-hidden p-0 m-0">
          <ScrollArea type="auto" rootClassName="h-full">
            {audioItems.length === 0 ? (
              <div className="p-8 text-center text-background-11 text-sm">
                No hay audios compartidos
              </div>
            ) : (
              <div className="p-3 divide-y divide-background-7/50">
                {audioItems.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex flex-col gap-2 py-3 px-2 rounded-lg hover:bg-background-3 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-background-11">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-primary-9" />
                        <span className="font-medium text-background-12 truncate max-w-[180px]">
                          {msg.hasMedia?.filename || "Audio"}
                        </span>
                      </div>
                      <span>
                        {msg.hasMedia?.duration ? `${formatDuration(msg.hasMedia.duration)} • ` : ""}
                        {dayjs(msg.time).format("DD/MM/YYYY")}
                      </span>
                    </div>
                    <audio
                      controls
                      src={msg.hasMedia?.src}
                      className="w-full h-8"
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
