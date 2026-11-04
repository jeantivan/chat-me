import { useMemo } from "react";
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
import { useTranslation } from "@/lib/i18n";

const GlobalStarredMessages = () => <StarredMessages isLeftDrawer={true} />;

export function LeftColumn() {
  const { t, locale } = useTranslation();

  const elements: LeftDrawerElementProps[] = useMemo(() => {
    void locale;
    return [
      {
        title: t("drawer.settings"),
        option: "OPTIONS",
        Component: Options,
      },
      {
        title: t("drawer.profile"),
        option: "PROFILE",
        Component: Profile,
      },
      {
        title: t("drawer.notifications"),
        option: "NOTIFICATIONS",
        Component: Notifications,
      },
      {
        title: t("drawer.privacy"),
        option: "PRIVACY",
        Component: Privacy,
      },
      {
        title: t("drawer.theme"),
        option: "THEME",
        Component: Theme,
      },
      {
        title: t("drawer.blockedUsers"),
        option: "BLOCKED_USERS",
        Component: BlockedContacts,
      },
      {
        title: t("drawer.newChat"),
        option: "NEW_CHAT",
        Component: NewChat,
      },
      {
        title: t("drawer.newGroup"),
        option: "NEW_GROUP",
        Component: NewGroup,
      },
      {
        title: t("drawer.archivedChats"),
        option: "ARCHIVED_CHATS",
        Component: ArchivedChats,
      },
      {
        title: t("drawer.starredMessages"),
        option: "STARRED_MESSAGES",
        Component: GlobalStarredMessages,
      },
    ];
  }, [t, locale]);

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
