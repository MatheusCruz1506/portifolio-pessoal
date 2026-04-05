import { useTranslation } from "react-i18next";
import useThemeStore from "../../store/useThemeStore";

export function AppearanceSection() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  return (
    <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border-subtle">
      <h2 className="text-lg font-semibold mb-4">{t("config.appearance")}</h2>

      <div className="flex items-center justify-between p-4 bg-hover-bg rounded-xl border border-border-subtle">
        <div>
          <h3 className="font-medium">{t("config.darkMode")}</h3>
          <p className="text-sm text-text-secondary">
            {t("config.darkModeDesc")}
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 ${
            theme === "dark" ? "bg-primary-light" : "bg-border-default"
          }`}
          role="switch"
          aria-checked={theme === "dark"}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              theme === "dark" ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
