import { AnimateOptionChange } from "./AnimateOptionChange";
import { Header } from "./Header";

interface HelpProps {
  goBack: () => void;
}

export function Help({ goBack }: HelpProps) {
  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Ayuda</Header>
    </AnimateOptionChange>
  );
}
