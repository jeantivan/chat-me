import { Container } from "./Container";
import { useDarkMode } from "./DarkMode";
import { BsGithub, BsMoonFill, BsFillSunFill } from "react-icons/bs";

export function Header() {
  const { mode, toggleDarkMode } = useDarkMode();

  return (
    <header className="header bg-slate-50 dark:bg-slate-700">
      <Container>
        <div className="flex justify-between items-center py-2">
          <h1 className="dark:text-white text-3xl font-bold">ChatMe</h1>
          <div className="flex">
            <button
              onClick={() => toggleDarkMode()}
              className="relative p-2 w-10 h-10 rounded-full mr-2 inline-flex items-center justify-center dark:text-white  hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              {mode === "light" ? (
                <BsMoonFill className="w-full h-full" />
              ) : (
                <BsFillSunFill className="w-full h-full" />
              )}
            </button>
            <a
              href="https://github.com/jeantivan"
              className="no-underline p-2 w-10 h-10 -mr-2 ml-2 rounded-full dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              <BsGithub className="w-full h-full" />
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}
