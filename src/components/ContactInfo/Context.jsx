import { createContext, useState, useContext } from "react";

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
      {children}
    </ContactInfoContext.Provider>
  );
}
