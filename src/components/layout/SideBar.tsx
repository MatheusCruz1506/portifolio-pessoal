import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { LogoutIcon } from "../../icons";
import useSupabaseStore from "../../store/useSupabaseStore";
import useStore from "../../store/useStore";
import { navigationItems } from "./navigation";

export default function SideBar() {
  const { t } = useTranslation();
  const { logoutUser } = useSupabaseStore();
  const setPage = useStore((state) => state.setPage);

  return (
    <aside className="group absolute left-0 top-0 bottom-0 z-999 hidden w-20 flex-col overflow-hidden border-r border-border-subtle bg-surface py-4 text-text-primary shadow-[2px_0_8px_transparent] transition-all duration-300 ease-in-out hover:w-54 hover:shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:hover:shadow-[4px_0_24px_rgba(0,0,0,0.2)] md:flex">
      <nav className="flex-1 space-y-2 px-3 text-sm text-text-secondary">
        {navigationItems.map((item) => (
          <NavLink
            onClick={() => setPage(t(item.nameKey))}
            key={item.path}
            to={item.path}
            title={t(item.nameKey)}
            className={({ isActive }) =>
              `flex w-full cursor-pointer items-center overflow-hidden rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-primary-light text-white shadow-sm"
                  : "hover:bg-hover-bg hover:text-text-primary"
              }`
            }
          >
            <div className="flex h-12 min-w-14 items-center justify-center">
              <item.Icon className="h-5 w-5 shrink-0" />
            </div>
            <span className="whitespace-nowrap font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {t(item.nameKey)}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3">
        <button
          className="flex w-full cursor-pointer items-center overflow-hidden rounded-xl text-text-secondary transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
          onClick={() => logoutUser()}
          title={t("sidebar.logout")}
        >
          <div className="flex h-12 min-w-14 items-center justify-center">
            <LogoutIcon className="h-5 w-5 shrink-0" />
          </div>
          <span className="whitespace-nowrap font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {t("sidebar.logout")}
          </span>
        </button>
      </div>
    </aside>
  );
}
