export function Loading() {
  return (
    <div className="w-full h-full grid place-items-center bg-background-2 text-background-12">
      <div>
        <h1 className="text-4xl mb-2">
          Welcome to <span className="text-primary-10">ChatMe!</span>
        </h1>
        <p className="text-2xl">Please wait while we prepare everything...</p>
      </div>
    </div>
  );
}
