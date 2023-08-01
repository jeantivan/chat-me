import { useState, createContext, useContext, ReactNode } from "react";

const Context = createContext<{
  container: HTMLElement | null;
}>({
  container: null,
});

export const useDialogContainer = () => useContext(Context);

export function DialogContainer({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<null | HTMLElement>(null);

  return (
    <Context.Provider value={{ container }}>
      {children}
      <div id="dialog-container" ref={setContainer} />
    </Context.Provider>
  );
}
