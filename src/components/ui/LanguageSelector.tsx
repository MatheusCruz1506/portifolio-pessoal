import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Globe from "lucide-react/dist/esm/icons/globe.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import { useClickOutside } from "../../hooks/useClickOutside";

const languages = [
  { code: "en", flag: "🇺🇸" },
  { code: "pt-BR", flag: "🇧🇷" },
  { code: "es", flag: "🇪🇸" },
  { code: "it", flag: "🇮🇹" },
  { code: "fr", flag: "🇫🇷" },
];

export default function LanguageSelector({ variant = "topbar" }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang =
    languages.find((l) => l.code === i18n.resolvedLanguage || l.code === i18n.language) ||
    languages[0];

  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === "settings") {
    return (
      <div className=" bg-surface rounded-2xl p-6 shadow-sm border border-border-subtle">
        <h2 className="text-lg font-semibold mb-4">{t("language.title")}</h2>
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`cursor-pointer w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                i18n.language === lang.code
                  ? "bg-primary-light/10 border-primary-light"
                  : "bg-hover-bg border-border-subtle hover:border-primary-light/50"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="font-medium">
                  {t(`languages.${lang.code}`)}
                </span>
              </span>
              {i18n.language === lang.code && (
                <span className="w-2 h-2 rounded-full bg-primary-light" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-text-primary hover:bg-hover-bg transition-colors"
      >
        <Globe className="w-5 h-5 text-text-secondary" />
        <span className="text-xl">{currentLang.flag}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-border-subtle overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-text-primary hover:bg-hover-bg transition-colors ${
                i18n.language === lang.code ? "bg-primary-light/10" : ""
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">
                {t(`languages.${lang.code}`)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
