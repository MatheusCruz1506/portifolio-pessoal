import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 w-full max-w-4xl border-t border-border-subtle pt-4 text-center text-sm text-text-secondary">
      <p className="leading-6">
        Proprietà © 2026 {t("footer.by")}{" "}
        <a
          href="https://github.com/MatheusCruz1506"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary-light transition-colors hover:text-gold-dark"
        >
          Matheus Cruz
        </a>
        . {t("footer.licensedUnder")}{" "}
        <a
          href="https://creativecommons.org/licenses/by-nd/4.0/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary-light transition-colors hover:text-gold-dark"
        >
          CC BY-ND 4.0
        </a>
        .
      </p>
    </footer>
  );
}
