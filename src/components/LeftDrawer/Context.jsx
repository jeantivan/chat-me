import { createContext, useState, useContext, useEffect } from "react";

export const LeftDrawerContext = createContext({
  openLeftDrawer: false,
  renderContent: "CONFIGURATION",
  openLeftDrawerAndRenderContent: () => {},
  closeLeftDrawer: () => {},
});

export const useLeftDrawer = () => useContext(LeftDrawerContext);

export function LeftDrawerProvider({ children }) {
  const [openLeftDrawer, setOpenLeftDrawer] = useState(false);
  const [renderContent, setRenderContent] = useState("CONFIGURATION");

  const openLeftDrawerAndRenderContent = (content) => {
    if (content !== "USER_PROFILE" && content !== "CONFIGURATION") return;

    setOpenLeftDrawer(true);
    setRenderContent(content);
  };

  const closeLeftDrawer = () => {
    setRenderContent("CONFIGURATION");
    setOpenLeftDrawer(false);
  };

  return (
    <LeftDrawerContext.Provider
      value={{
        openLeftDrawer,
        renderContent,
        openLeftDrawerAndRenderContent,
        closeLeftDrawer,
      }}
    >
      {children}
    </LeftDrawerContext.Provider>
  );
}
