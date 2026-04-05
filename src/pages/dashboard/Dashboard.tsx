import useSupabaseStore from "../../store/useSupabaseStore";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import StatCard from "../../components/layout/StatCard";
import RecentUnitsTable from "../../components/layout/RecentUnitsTable";
import UnitTypeChart from "../../components/layout/UnitTypeChart";
import Skeleton from "../../components/ui/Skeleton";
import { Building2, Activity } from "../../icons";

function DashboardSkeleton() {
  return (
    <main className="min-w-0 space-y-6 p-6">
      {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-surface border border-border-subtle flex items-center gap-4"
          >
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-44 rounded" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
        <Skeleton className="h-5 w-56 rounded mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-full rounded" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function DashBoard() {
  const { t } = useTranslation();
  const { units, isLoading } = useSupabaseStore();
  const dashboardUnits = units.filter((unit) => !unit.is_archived);

  // KPIs
  const total = dashboardUnits.length;
  const ativos = dashboardUnits.filter((u) => u.status === "Ativo").length;
  const vendidos = dashboardUnits.filter((u) => u.status === "Vendido").length;

  return (
    <div className="flex min-h-full min-w-0 bg-background text-text-primary">
      <div className="flex min-w-0 flex-1 flex-col">

        {isLoading && dashboardUnits.length === 0 ? (
          <DashboardSkeleton />
        ) : (
          <main className="min-w-0 space-y-6 p-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <StatCard
                title={t("dashboard.totalUnits")}
                value={total}
                color="gold"
                Icon={Building2}
              />
              <StatCard
                title={t("dashboard.active")}
                value={ativos}
                color="green"
                Icon={Activity}
              />
              <StatCard
                title={t("dashboard.sold")}
                value={vendidos}
                color="amber"
                Icon={Check}
              />
            </div>

            {/* Distribuição por Tipo */}
            <UnitTypeChart units={dashboardUnits} />

            {/* Tabela de Unidades Recentes */}
            <RecentUnitsTable units={dashboardUnits} />
          </main>
        )}
      </div>
    </div>
  );
}
