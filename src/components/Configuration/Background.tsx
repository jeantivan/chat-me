import { AnimateOptionChange } from "./AnimateOptionChange";
import { Header } from "./Header";

interface BackgroundProps {
  goBack: () => void;
}

export function Background({ goBack }: BackgroundProps) {
  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Elegir color de fondo</Header>
    </AnimateOptionChange>
  );
}
