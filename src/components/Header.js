import { Container } from "./Container";
import { GithubIcon } from "./GithubIcon";
import { MoonIcon } from "./MoonIcon";
import { SunIcon } from "./SunIcon";
import { useState } from "react";

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className="header dark:bg-slate-700">
      <Container>
        <div className="flex justify-between items-center py-2">
          <h1 className="dark:text-white text-3xl font-bold">ChatMe</h1>
          <div className="flex">
            <button
              onClick={() => toggleMode()}
              className="relative p-2 w-10 h-10 rounded-full mr-2 inline-flex items-center justify-center dark:text-white hover:text-emerald-300 hover:bg-slate-600"
            >
              {!darkMode ? <MoonIcon /> : <SunIcon />}
            </button>
            <a
              href="https://github.com/jeantivan"
              className="no-underline p-2 w-10 h-10 -mr-2 ml-2 rounded-full dark:text-white hover:text-emerald-300 hover:bg-slate-600"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}
