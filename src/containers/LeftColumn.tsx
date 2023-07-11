import { ChatList, SearchChats, UserProfile } from "@/components";
import { LeftDrawer, LeftDrawerElement } from "@/components/LeftDrawer";

import { Profile } from "@/components/Configuration/Profile";
export function LeftColumn() {
  return (
    <section id="left-column" className="user-chats relative">
      <UserProfile />
      <SearchChats />
      <ChatList />
      <LeftDrawer>
        <LeftDrawerElement option="PROFILE" Component={Profile} />
      </LeftDrawer>
    </section>
  );
}
