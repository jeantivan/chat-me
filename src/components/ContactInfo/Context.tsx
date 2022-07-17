import {
  createContext,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from "react";

interface ContactInfoInterface {
  openContactInfo: boolean;
  setOpenContactInfo: Dispatch<SetStateAction<boolean>>;
}

export const ContactInfoContext = createContext({} as ContactInfoInterface);

export const useContactInfo = () => useContext(ContactInfoContext);

export function ContactInfoProvider({ children }: { children: JSX.Element }) {
  const [openContactInfo, setOpenContactInfo] = useState<boolean>(false);

  return (
    <ContactInfoContext.Provider
      value={{ openContactInfo, setOpenContactInfo }}
    >
      {children}
    </ContactInfoContext.Provider>
  );
}
