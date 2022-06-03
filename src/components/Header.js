import { Container } from "./Container";
import { GithubIcon } from "./GithubIcon";

export function Header() {
  return (
    <header className="dark:bg-slate-700">
      <Container>
        <div className="flex justify-between items-center py-2">
          <h1 className="dark:text-white text-3xl font-bold">ChatMe</h1>
          <div className="p-1 flex">
            <a
              href="https://github.com/jeantivan"
              className="no-underline w-8 h-8 dark:text-white hover:text-green-700"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}
