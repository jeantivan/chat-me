import { ChatList } from "../components/ChatList";
import {
  LeftDrawerContent,
  LeftDrawerProvider,
} from "../components/LeftDrawer";
import { SearchChats } from "../components/SearchChats";
import { UserProfile } from "../components/UserProfile";

export function HeaderAndChatList() {
  return (
    <LeftDrawerProvider>
      <section className="user-chats relative">
        <UserProfile />
        <SearchChats />
        <ChatList />
        <LeftDrawerContent />
      </section>
    </LeftDrawerProvider>
  );
}
