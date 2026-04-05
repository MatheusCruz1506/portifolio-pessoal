import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import useSupabaseStore from "../store/useSupabaseStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { isAuthLoading, user } = useSupabaseStore();

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

  return children;
}
