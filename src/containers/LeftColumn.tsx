import { ChatList, UserProfile } from "@/components";
import {
  LeftDrawer,
  LeftDrawerElement,
  LeftDrawerElementProps,
} from "@/components/LeftDrawer";

import { Profile } from "@/components/Configuration/Profile";
import { Options } from "@/components/Configuration/Options";
import { Notifications } from "@/components/Configuration/Notifications";
import { Privacy } from "@/components/Configuration/Privacy";
import { SolInfo } from "@/components/Configuration/SolInfo";
import { Help } from "@/components/Configuration/Help";
import { NewChat } from "@/components/NewChat";
import { ArchivedChats } from "@/components/ArchivedChats";
import { Theme } from "@/components/Configuration/Theme";

const elements: LeftDrawerElementProps[] = [
  {
    title: "Configuración",
    option: "OPTIONS",
    Component: Options,
  },
  {
    title: "Perfil",
    option: "PROFILE",
    Component: Profile,
  },
  {
    title: "Notificaciones",
    option: "NOTIFICATIONS",
    Component: Notifications,
  },
  {
    title: "Privacidad",
    option: "PRIVACY",
    Component: Privacy,
  },
  {
    title: "Personalizar interfaz",
    option: "THEME",
    Component: Theme,
  },
  {
    title: "Solicitar info de mi cuenta",
    option: "SOL_INFO",
    Component: SolInfo,
  },
  {
    title: "Ayuda",
    option: "HELP",
    Component: Help,
  },
  {
    title: "Chat nuevo",
    option: "NEW_CHAT",
    Component: NewChat,
  },
  {
    title: "Chats archivados",
    option: "ARCHIVED_CHATS",
    Component: ArchivedChats,
  },
];

export function LeftColumn() {
  return (
    <section
      id="left-column"
      className="user-chats relative bg-background-5 border-r border-background-7"
    >
      <UserProfile />
      <ChatList />
      <LeftDrawer>
        {elements.map((el) => (
          <LeftDrawerElement key={el.option} {...el} />
        ))}
      </LeftDrawer>
    </section>
  );
}
