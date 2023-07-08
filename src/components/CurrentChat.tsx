import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { ChatType } from "@/lib/types";

type CurrentChatContextType = {
  currentChat: ChatType | null;
  setCurrentChat: Dispatch<SetStateAction<ChatType | null>>;
};

const CurrentChatContext = createContext<CurrentChatContextType>(
  {} as CurrentChatContextType
);

export const useCurrentChat = () => useContext(CurrentChatContext);

export function CurrentChatProvider({ children }: { children: ReactNode }) {
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);

  return (
    <CurrentChatContext.Provider value={{ currentChat, setCurrentChat }}>
      {children}
    </CurrentChatContext.Provider>
  );
}
