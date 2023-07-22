import useStore from "@/lib/store";
import { useEffect } from "react";

export function Loading() {
  const loading = useStore((state) => state.loading);
  const prepareApp = useStore((state) => state.prepareApp);

  useEffect(() => {
    prepareApp();
  }, []);
  return (
    <div className="w-full h-full grid place-items-center bg-slate-200 dark:bg-slate-700">
      <div>
        <h1 className="text-4xl text-slate-950 dark:text-slate-50 mb-2">
          Welcome to ChatMe!
        </h1>
        <p className="text-2xl text-slate-700 dark:text-slate-300">
          Por favor espera mientras preparamos todo
        </p>
        <div className="text-xl text-slate-700 dark:text-slate-300">
          {loading}
        </div>
      </div>
    </div>
  );
}
