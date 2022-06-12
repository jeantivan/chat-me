import { Container } from "./Container";
import { useDarkMode } from "./DarkMode";
import { BsGithub, BsMoonFill, BsFillSunFill } from "react-icons/bs";

export function Header() {
  const { mode, toggleDarkMode } = useDarkMode();

  return (
    <header className="header bg-grey-100 dark:bg-slate-700">
      <Container>
        <div className="flex justify-between items-center py-1">
          <h1 className="dark:text-white text-xl font-bold">ChatMe</h1>
          <div className="flex">
            <button
              onClick={() => toggleDarkMode()}
              className="relative p-2 w-8 h-8 rounded-full mr-1 inline-flex items-center justify-center dark:text-white  hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              {mode === "light" ? (
                <BsMoonFill className="w-full h-full" />
              ) : (
                <BsFillSunFill className="w-full h-full" />
              )}
            </button>
            <a
              href="https://github.com/jeantivan"
              className="no-underline p-2 w-8 h-8 -mr-1 rounded-full dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              <BsGithub className="w-full h-full" />
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}
