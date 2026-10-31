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
import { BlockedContacts } from "@/components/Configuration/BlockedContacts";

import { NewChat } from "@/components/NewChat";
import { NewGroup } from "@/components/NewGroup";
import { ArchivedChats } from "@/components/ArchivedChats";
import { Theme } from "@/components/Configuration/Theme";
import { StarredMessages } from "@/components/Chat/StarredMessages";

const GlobalStarredMessages = () => <StarredMessages isLeftDrawer={true} />;

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
    title: "Contactos bloqueados",
    option: "BLOCKED_USERS",
    Component: BlockedContacts,
  },

  {
    title: "Chat nuevo",
    option: "NEW_CHAT",
    Component: NewChat,
  },
  {
    title: "Nuevo grupo",
    option: "NEW_GROUP",
    Component: NewGroup,
  },
  {
    title: "Chats archivados",
    option: "ARCHIVED_CHATS",
    Component: ArchivedChats,
  },
  {
    title: "Mensajes destacados",
    option: "STARRED_MESSAGES",
    Component: GlobalStarredMessages,
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
