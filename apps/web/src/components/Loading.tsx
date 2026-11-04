import { useTranslation } from "@/lib/i18n";

export function Loading() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full grid place-items-center bg-background-2 text-background-12">
      <div>
        <h1 className="text-4xl mb-2">
          {t("welcome.loadingWelcome")}{" "}
          <span className="text-primary-10">ChatMe!</span>
        </h1>
        <p className="text-2xl">{t("welcome.loadingSubtitle")}</p>
      </div>
    </div>
  );
}
