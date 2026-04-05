import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import useSupabaseStore from "../store/useSupabaseStore";
import { canManageUnits } from "../utils/access";

interface PermissionRouteProps {
  children: ReactNode;
}

export default function PermissionRoute({ children }: PermissionRouteProps) {
  const { t } = useTranslation();
  const { isAuthLoading, user, profile } = useSupabaseStore();

  if (isAuthLoading) {
    return (
      <div className="flex justify-center p-10">
        {t("common.verifyingSession", {
          defaultValue: "Verificando sessão...",
        })}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canManageUnits(profile, user)) {
    return <Navigate to="/imoveis" replace />;
  }

  return children;
}
