import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { ConfigIcon } from "../../icons";
import { AccountSection } from "../../components/layout/AccountSection";
import { AppearanceSection } from "../../components/layout/AppearanceSection";
import { UserManagementSection } from "../../components/layout/UserManagementSection";
import LanguageSelector from "../../components/ui/LanguageSelector";
import useSupabaseStore from "../../store/useSupabaseStore";
import { canManageUsers, getUserProvince } from "../../utils/access";

type ConfigSection = "account" | "appearance" | "language" | "users";

function isConfigSection(value: string | null): value is ConfigSection {
  return (
    value === "account" ||
    value === "appearance" ||
    value === "language" ||
    value === "users"
  );
}

export default function ConfigPage() {
  const { t } = useTranslation();
  const { user, profile } = useSupabaseStore();
  const isAdmin = canManageUsers(profile, user);
  const currentProvince = getUserProvince(profile, user);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSectionParam = searchParams.get("section");
  const [selectedSection, setSelectedSection] = useState<ConfigSection>(
    isConfigSection(initialSectionParam) &&
      (initialSectionParam !== "users" || isAdmin)
      ? initialSectionParam
      : "account",
  );

  useEffect(() => {
    const sectionParam = searchParams.get("section");

    if (isConfigSection(sectionParam) && (sectionParam !== "users" || isAdmin)) {
      setSelectedSection(sectionParam);
      return;
    }

    setSelectedSection("account");
  }, [isAdmin, searchParams]);

  const handleSectionChange = (section: ConfigSection) => {
    setSelectedSection(section);
    setSearchParams({ section });
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
      <div className="flex-1 flex flex-col">
        <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <ConfigIcon className="w-8 h-8 text-primary-light" />
            <h1 className="text-2xl font-bold">{t("config.title")}</h1>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <button
                onClick={() => handleSectionChange("language")}
                className={`w-full rounded-lg px-4 py-3 text-left font-medium cursor-pointer ${
                  selectedSection === "language"
                    ? "dark:bg-surface shadow-sm"
                    : "hover:bg-hover-bg"
                }`}
              >
                {t("language.title")}
              </button>
              <button
                onClick={() => handleSectionChange("appearance")}
                className={`w-full rounded-lg px-4 py-3 text-left font-medium cursor-pointer ${
                  selectedSection === "appearance"
                    ? "dark:bg-surface shadow-sm"
                    : "hover:bg-hover-bg"
                }`}
              >
                {t("config.appearance")}
              </button>
              <button
                onClick={() => handleSectionChange("account")}
                className={`w-full rounded-lg px-4 py-3 text-left font-medium cursor-pointer ${
                  selectedSection === "account"
                    ? "dark:bg-surface shadow-sm"
                    : "hover:bg-hover-bg"
                }`}
              >
                {t("config.account")}
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleSectionChange("users")}
                  className={`w-full rounded-lg px-4 py-3 text-left font-medium cursor-pointer ${
                    selectedSection === "users"
                      ? "dark:bg-surface shadow-sm"
                      : "hover:bg-hover-bg"
                  }`}
                >
                  {t("config.users", {
                    defaultValue: "Usuarios e Permissoes",
                  })}
                </button>
              )}
            </div>

            <div className="space-y-6 md:col-span-2">
              {selectedSection === "account" && (
                <AccountSection
                  name={
                    profile?.name ||
                    user?.user_metadata?.name ||
                    t("config.user")
                  }
                  email={profile?.email ?? user?.email ?? ""}
                  avatarUrl={profile?.avatar_url ?? null}
                  province={currentProvince}
                  role={profile?.role ?? null}
                />
              )}

              {selectedSection === "language" && (
                <LanguageSelector variant="settings" />
              )}

              {selectedSection === "appearance" && <AppearanceSection />}

              {selectedSection === "users" && isAdmin && <UserManagementSection />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
