import { ChatList, UserProfile } from "@/components";
import { LeftDrawer, LeftDrawerElement } from "@/components/LeftDrawer";

import { Profile } from "@/components/Configuration/Profile";
import { Options } from "@/components/Configuration/Options";
import { Notifications } from "@/components/Configuration/Notifications";
import { Privacy } from "@/components/Configuration/Privacy";
import { SolInfo } from "@/components/Configuration/SolInfo";
import { Help } from "@/components/Configuration/Help";
import { Background } from "@/components/Configuration/Background";
import { NewChat } from "@/components/NewChat";
import { ArchivedChats } from "@/components/ArchivedChats";

export function LeftColumn() {
  return (
    <section id="left-column" className="user-chats relative">
      <UserProfile />

      <ChatList />
      <LeftDrawer>
        <LeftDrawerElement key="PROFILE" option="PROFILE" Component={Profile} />
        <LeftDrawerElement key="OPTIONS" option="OPTIONS" Component={Options} />
        <LeftDrawerElement
          key="NOTIFICATIONS"
          option="NOTIFICATIONS"
          Component={Notifications}
        />
        <LeftDrawerElement key="PRIVACY" option="PRIVACY" Component={Privacy} />

        <LeftDrawerElement
          key="SOL_INFO"
          option="SOL_INFO"
          Component={SolInfo}
        />
        <LeftDrawerElement key="HELP" option="HELP" Component={Help} />
        <LeftDrawerElement
          key="BACKGROUND"
          option="BACKGROUND"
          Component={Background}
        />
        <LeftDrawerElement
          key="NEW_CHAT"
          option="NEW_CHAT"
          Component={NewChat}
        />
        <LeftDrawerElement
          key="ARCHIVED_CHATS"
          option="ARCHIVED_CHATS"
          Component={ArchivedChats}
        />
      </LeftDrawer>
    </section>
  );
}
