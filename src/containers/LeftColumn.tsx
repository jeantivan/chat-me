import { ChatList, UserProfile } from "@/components";
import { LeftDrawer, LeftDrawerElement } from "@/components/LeftDrawer";

import { Profile } from "@/components/Configuration/Profile";
import { Options } from "@/components/Configuration/Options";
import { Notifications } from "@/components/Configuration/Notifications";
import { Privacy } from "@/components/Configuration/Privacy";
import { Security } from "@/components/Configuration/Security";
import { SolInfo } from "@/components/Configuration/SolInfo";
import { Help } from "@/components/Configuration/Help";
import { Background } from "@/components/Configuration/Background";
import { NewChat } from "@/components/NewChat";

export function LeftColumn() {
  return (
    <section id="left-column" className="user-chats relative">
      <UserProfile />

      <ChatList />
      <LeftDrawer>
        <LeftDrawerElement option="PROFILE" Component={Profile} />
        <LeftDrawerElement option="OPTIONS" Component={Options} />
        <LeftDrawerElement option="NOTIFICATIONS" Component={Notifications} />
        <LeftDrawerElement option="PRIVACY" Component={Privacy} />
        <LeftDrawerElement option="SECURITY" Component={Security} />
        <LeftDrawerElement option="SOL_INFO" Component={SolInfo} />
        <LeftDrawerElement option="HELP" Component={Help} />
        <LeftDrawerElement option="BACKGROUND" Component={Background} />
        <LeftDrawerElement option="NEW_CHAT" Component={NewChat} />
      </LeftDrawer>
    </section>
  );
}
