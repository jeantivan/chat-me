import { createContext, useState, useContext } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export const ContactInfoContext = createContext({
  openContactInfo: false,
  setOpenContactInfo: () => {},
});

export const useContactInfo = () => useContext(ContactInfoContext);

export function ContactInfoProvider({ children }) {
  const [openContactInfo, setOpenContactInfo] = useState(false);

  return (
    <ContactInfoContext.Provider
      value={{ openContactInfo, setOpenContactInfo }}
    >
      <Dialog.Root open={openContactInfo} onOpenChange={setOpenContactInfo}>
        {children}
      </Dialog.Root>
    </ContactInfoContext.Provider>
  );
}
