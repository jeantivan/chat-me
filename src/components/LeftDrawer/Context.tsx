import { createContext, useState, useContext } from "react";

interface LeftDrawerInterface {
  openLeftDrawer: boolean;
  renderContent: "CONFIGURATION" | "USER_PROFILE";
  openLeftDrawerAndRenderContent: (
    content: "CONFIGURATION" | "USER_PROFILE"
  ) => void;
  closeLeftDrawer: () => void;
}

export const LeftDrawerContext = createContext<LeftDrawerInterface>(
  {} as LeftDrawerInterface
);

export const useLeftDrawer = () => useContext(LeftDrawerContext);

export function LeftDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openLeftDrawer, setOpenLeftDrawer] = useState(false);
  const [renderContent, setRenderContent] = useState<
    "CONFIGURATION" | "USER_PROFILE"
  >("CONFIGURATION");

  const openLeftDrawerAndRenderContent = (
    content: "CONFIGURATION" | "USER_PROFILE"
  ) => {
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
