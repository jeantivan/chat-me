import { Container } from "./Container";

export function Header() {
  return (
    <header className="header bg-grey-100 dark:bg-slate-700">
      <Container>
        <div className="flex justify-between items-center py-1">
          <h1 className="dark:text-white text-xl font-bold">ChatMe</h1>
        </div>
      </Container>
    </header>
  );
}
