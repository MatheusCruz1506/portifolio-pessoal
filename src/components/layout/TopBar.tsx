import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Menu from "lucide-react/dist/esm/icons/menu.js";
import Moon from "lucide-react/dist/esm/icons/moon.js";
import Sun from "lucide-react/dist/esm/icons/sun.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { LogoutIcon, UserIcon } from "../../icons";
import logoImg from "../../assets/sao-camilo-logo.png";
import LanguageSelector from "../ui/LanguageSelector";
import useSupabaseStore from "../../store/useSupabaseStore";
import useThemeStore from "../../store/useThemeStore";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { navigationItems } from "./navigation";

const PAGE_TITLE_BY_PATH: Record<string, string> = {
  "/dashboard": "sidebar.dashboard",
  "/imoveis": "sidebar.imoveis",
  "/map": "sidebar.map",
  "/config": "sidebar.config",
};

export default function TopBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSupabaseStore((state) => state.profile);
  const logoutUser = useSupabaseStore((state) => state.logoutUser);
  const { theme, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageTitleKey =
    PAGE_TITLE_BY_PATH[location.pathname] ?? "sidebar.dashboard";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEscapeKey(() => setIsMobileMenuOpen(false), isMobileMenuOpen);

  return (
    <>
      <header className="relative z-125 flex h-16 items-center justify-between border-b border-border-subtle bg-surface px-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-hover-bg text-text-primary transition-colors hover:bg-background md:hidden"
            aria-label={t("mobile.openMenu", { defaultValue: "Abrir menu" })}
          >
            <Menu className="h-5 w-5" />
          </button>

          <img
            src={logoImg}
            alt={t("common.logoAlt", { defaultValue: "Logo da São Camilo" })}
            className="h-10 w-auto object-contain sm:h-12 hidden sm:block"
          />
          <div className="hidden h-8 w-px bg-border-subtle sm:block" />
          <h2 className="text-base font-bold text-text-primary sm:text-xl">
            {t(pageTitleKey)}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-5">
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-hover-bg text-text-primary shadow-sm transition-colors hover:bg-background"
            title={t("config.darkMode")}
            aria-label={t("config.darkMode")}
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/config?section=account")}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light shadow-sm transition-colors hover:bg-primary-dark"
            title={t("config.account")}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={t("config.avatarAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-[850] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 z-[900] flex w-[86vw] max-w-sm flex-col border-r border-border-subtle bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt={t("common.logoAlt", { defaultValue: "Logo da São Camilo" })}
                  className="h-10 w-auto object-contain"
                />
                <span className="text-sm font-semibold text-text-primary">
                  {t("mobile.menuTitle", { defaultValue: "Navegação" })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full p-2 text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary"
                aria-label={t("mobile.closeMenu", { defaultValue: "Fechar menu" })}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 p-4">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-light text-white"
                        : "text-text-primary hover:bg-hover-bg"
                    }`
                  }
                >
                  <item.Icon className="h-5 w-5 shrink-0" />
                  {t(item.nameKey)}
                </NavLink>
              ))}
            </nav>

            <div className="space-y-3 border-t border-border-subtle p-4">
              <button
                type="button"
                onClick={() => {
                  navigate("/config?section=account");
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-border-subtle px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg"
              >
                <UserIcon className="h-5 w-5 shrink-0" />
                {t("config.account")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  void logoutUser();
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogoutIcon className="h-5 w-5 shrink-0" />
                {t("sidebar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
