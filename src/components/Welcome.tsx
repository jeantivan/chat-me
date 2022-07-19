export function Welcome() {
  return (
    <div className="w-full h-full welcome dark:bg-slate-700 bg-slate-100  flex flex-col items-end p-5 border-b-8 border-emerald-500 ">
      <div className="w-full h-full flex justify-center items-center">
        <div className="mx-auto">
          <h1 className="text-4xl font-bold dark:text-white mb-5">
            Welcome to <span className="text-emerald-500">ChatMe</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-300">
            A clone of the WhatsApp Web interface
          </p>
        </div>
      </div>
      <footer className="flex w-full justify-center p-3">
        <p className="text-base dark:text-slate-50">
          Made with{" "}
          <span className="mx-2" aria-label="Cup of coffee">
            ☕
          </span>
          <a
            className="text-emerald-500 hover:underline uppercase"
            href="https://github.com/jeantivan"
          >
            Jean Tivan
          </a>
        </p>
      </footer>
    </div>
  );
}
