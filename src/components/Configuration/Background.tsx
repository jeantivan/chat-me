import { Header } from "./Header";
import useStore from "@/lib/store";

export function Background() {
  const close = useStore((state) => state.close);
  return (
    <>
      <Header goBack={close}>Elegir color de fondo</Header>
    </>
  );
}
