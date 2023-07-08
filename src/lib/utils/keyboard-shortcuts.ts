import { ShortCut } from "../../types";
export const KEYBOARD_SHORTCUTS: ShortCut[] = [
  {
    slug: "mark-as-read",
    title: "Marcar como leído",
    keys: ["ctrl", "alt", "shift", "u"],
  },
  {
    slug: "mute",
    title: "Silenciar",
    keys: ["ctrl", "alt", "shift", "m"],
  },
  {
    slug: "archive-chat",
    title: "Archivar chat",
    keys: ["ctrl", "alt", "shift", "e"],
  },
  {
    slug: "delete-chat",
    title: "Eliminar chat",
    keys: ["ctrl", "alt", "backspace"],
  },
  {
    slug: "pin-chat",
    title: "Fijar chat",
    keys: ["ctrl", "alt", "shift", "p"],
  },
  {
    slug: "search",
    title: "Buscar",
    keys: ["ctrl", "alt", "/"],
  },
  {
    slug: "search-in-chat",
    title: "Buscar en el chat",
    keys: ["ctrl", "alt", "shift", "f"],
  },
  {
    slug: "new-chat",
    title: "Nuevo chat",
    keys: ["ctrl", "alt", "N"],
  },
  {
    slug: "next-chat",
    title: "Siguiente chat",
    keys: ["ctrl", "alt", "tab"],
  },
  {
    slug: "previous-chat",
    title: "Chat anterior",
    keys: ["ctrl", "alt", "shift", "tab"],
  },
  {
    slug: "new-group",
    title: "Nuevo grupo",
    keys: ["ctrl", "alt", "shift", "n"],
  },
  {
    slug: "profile-and-info",
    title: "Perfil e Info.",
    keys: ["ctrl", "alt", "p"],
  },
  {
    slug: "increase-audio-velocity",
    title: "Aumentar la velocidad del mensaje de voz seleccionado",
    keys: ["shift", "."],
  },
  {
    slug: "decrease-audio-velocity",
    title: "Reducir la velocidad del mensaje de voz seleccionado",
    keys: ["shift", ","],
  },
  {
    slug: "configuration",
    title: "Configuración",
    keys: ["ctrl", "alt", ","],
  },
  {
    slug: "emojis-panel",
    title: "Panel de emojis",
    keys: ["ctrl", "alt", "g"],
  },
  {
    slug: "gif-panel",
    title: "Panel de GIF",
    keys: ["ctrl", "alt", "g"],
  },
  {
    slug: "sticker-panel",
    title: "Panel de stickers",
    keys: ["ctrl", "alt", "s"],
  },
];
