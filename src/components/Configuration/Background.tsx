import { Header } from "./Header";
import useStore from "@/lib/store";

export function Background() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  return (
    <>
      <Header goBack={closeLeftDrawer}>Elegir color de fondo</Header>
    </>
  );
}
