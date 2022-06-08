export function ChatWindow() {
  return (
    <aside
      className="dark:bg-slate-700 xs:w-full w-96 rounded-lg overflow-hidden"
      style={{ height: 400 }}
    >
      <header className="bg-emerald-400 p-4 flex items-center">
        <div className="text-lg font-bold flex-1 flex items-center">
          <span className="mr-3 bg-gray-600 rounded-full block w-8 h-8" />
          John Doe
        </div>
        <div className="flex">
          <button className="inline-flex items-center justify-center font-bold hover:bg-emerald-100 w-8 h-8 rounded-full">
            -
          </button>
        </div>
      </header>
    </aside>
  );
}
