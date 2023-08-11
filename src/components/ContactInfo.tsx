import { ReactNode } from "react";

import {
  Archive,
  BarChart,
  Bell,
  ChevronRight,
  CircleSlash,
  LucideIcon,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { IconButton } from "./ui/IconButton";
import { Switch } from "./ui/Switch";
import { Icon } from "./ui/Icon";
import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";

type ItemProps = {
  children: ReactNode;
  danger?: boolean;
  icon?: LucideIcon;
  textHelper?: string;
  action?: JSX.Element;
};
const Item = ({ children, danger, textHelper, icon, action }: ItemProps) => {
  const Icon = icon || "svg";
  return (
    <div
      className={mc(
        "flex gap-6 py-4 px-6 text-background-11 text-lg ",
        danger && "text-red-500"
      )}
    >
      {icon && <Icon className="w-6 h-6" />}
      <div
        className={mc(
          "flex-1",
          "text-background-12",
          danger && "text-inherit dark:text-inherit"
        )}
      >
        {children}

        {textHelper && (
          <div className="mt-1.5 text-sm text-background-11">{textHelper}</div>
        )}
      </div>
      {action}
    </div>
  );
};

export function ContactInfo() {
  const closeRightDrawer = useStore((state) => state.closeRightDrawer);
  const muteChat = useStore((state) => state.muteChat);
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === state.currentChatId)
  );

  // TEMP
  if (!chat) return null;

  const {
    id,
    muted,
    participants: [contact],
  } = chat;
  const { name, phone, bio, picture } = contact;

  return (
    <div className="bg-background-5 h-full">
      <header className="p-2.5 flex items-center sticky gap-4 bg-background-2">
        <IconButton
          label="Cerrar info. del contacto"
          icon={X}
          onClick={() => {
            closeRightDrawer();
          }}
        />
        <h2
          id="contact-info-title "
          className="text-lg line-clamp-1 truncate text-background-12"
        >
          Info. del Contacto
        </h2>
      </header>
      <div className="overflow-y-scroll h-full">
        <section className="py-4 mb-4 shadow bg-background-3">
          <div className="flex flex-col px-5">
            <div className="mx-auto mt-16 mb-4">
              <div className="w-40 h-40 rounded-full text-gray-500">
                <img
                  className="bg-gray-400 w-full h-full rounded-full"
                  src={picture}
                  alt={`Foto de perfil de ${name}`}
                />
              </div>
            </div>
            <div className="mx-auto text-center">
              <h2 className="text-2xl mb-2 text-background-12">{name}</h2>
              <div className="text-background-11">{phone}</div>
            </div>
          </div>
        </section>
        <section className="py-4 mb-4 shadow bg-background-3">
          <div className="px-5">
            <div className="text-sm text-primary-9">Info.</div>
            <div className={`text-lg text-background-12`}>{bio}</div>
          </div>
        </section>
        <section className="py-4 mb-4 shadow bg-background-3">
          <div className="flex px-5 mb-4">
            <div className="flex-1 text-sm text-primary-9">
              Archivos, enlaces y documentos.
            </div>
            <div className="inline-flex items-center text-background-11 text-sm">
              20
              <Icon icon={ChevronRight} label="Ver más" />
            </div>
          </div>
          <div className="px-5 flex flex-row w-full mb-4">
            <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
            <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
            <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
          </div>
          <div className={`text-sm text-background-12 px-5`}>
            Usa WhatsApp en tu teléfono para ver el historial de mensajes
            completo.
          </div>
        </section>
        <section className="py-4 mb-4 shadow bg-background-3">
          <Item icon={Star} action={<ChevronRight className="w-6 h-6" />}>
            Mensajes destacados
          </Item>
          <Item
            icon={Bell}
            action={
              <Switch
                checked={muted}
                onCheckedChange={() => {
                  muteChat(id);
                }}
              />
            }
          >
            Silenciar Notificaciones
          </Item>
          <Item
            icon={BarChart}
            textHelper={`Ve estadísticas relevantes de este chat 
              como: cantidad de mensajes enviados, almacenamiento de archivos, etc.`}
          >
            Estadísticas
          </Item>
        </section>
        <section className="mb-24 shadow bg-background-3">
          <Item icon={Archive} danger>
            Archivar chat
          </Item>
          <Item icon={Trash2} danger>
            Eliminar chat
          </Item>
          <Item icon={CircleSlash} danger>
            Bloquear a {name}
          </Item>
        </section>
      </div>
    </div>
  );
}
