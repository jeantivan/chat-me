import { useTranslation } from "@/lib/i18n";

export function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full welcome bg-background-5 text-background-12 flex flex-col items-end p-5 border-b-8 border-primary-9">
      <div className="w-full h-full flex justify-center items-center">
        <div className="mx-auto">
          <h1 className="text-4xl font-bold mb-5">
            {t("welcome.titlePrefix")}
            <span className="text-primary-9">ChatMe</span>
            {t("welcome.titleSuffix")}
          </h1>
          <p className="text-background-11">
            {t("welcome.subtitle")}
          </p>
        </div>
      </div>
      <footer className="flex w-full justify-center p-3">
        <p className="text-base">
          {t("welcome.madeWith")}{" "}
          <span className="mx-2" aria-label={t("welcome.cupOfCoffee")}>
            ☕
          </span>
          <a
            className="text-primary-9 hover:underline uppercase"
            href="https://github.com/jeantivan"
          >
            Jean Tivan
          </a>
        </p>
      </footer>
    </div>
  );
}
