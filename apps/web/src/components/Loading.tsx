import useStore from "@/lib/store";
import { useEffect } from "react";

export function Loading() {
  const loading = useStore((state) => state.loading);
  const prepareApp = useStore((state) => state.prepareApp);

  useEffect(() => {
    prepareApp();
  }, []);
  return (
    <div className="w-full h-full grid place-items-center bg-background-2 text-background-12">
      <div>
        <h1 className="text-4xl mb-2">
          Welcome to <span className="text-primary-10">ChatMe!</span>
        </h1>
        <p className="text-2xl">Por favor espera mientras preparamos todo</p>
        <div className="text-xl text-background-11">{loading}</div>
      </div>
    </div>
  );
}
