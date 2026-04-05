import { useTranslation } from "react-i18next";
import { getStatusColor, getTypeIcon, getTypeBadgeClasses } from "../../../utils/getStatusColorAndIcon";
import { MapPin } from "../../icons";
import type { Unit } from "../../types/unit";

interface RecentUnitsTableProps {
  units: Unit[];
}

export default function RecentUnitsTable({ units }: RecentUnitsTableProps) {
  const { t, i18n } = useTranslation();
  // Ordena por created_at (mais recentes primeiro) e pega os 5 primeiros
  const recentUnits = [...units]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-md border border-border-subtle transition-colors duration-300">
      <h2 className="text-lg font-semibold mb-4 text-text-primary">
        {t("dashboard.recentUnits")}
      </h2>

      {recentUnits.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          {t("units.notFound")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-text-secondary text-xs uppercase tracking-wider border-b border-border-subtle">
              <tr>
                <th className="py-3 pr-4">{t("units.unitName")}</th>
                <th className="py-3 pr-4">{t("units.type")}</th>
                <th className="py-3 pr-4">{t("units.city")}</th>
                <th className="py-3 pr-4">{t("units.status")}</th>
                <th className="py-3">{t("units.date") || "Data"}</th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y divide-border-subtle">
              {recentUnits.map((unit) => (
                <tr
                  key={unit.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <td className="py-3.5 pr-4">
                    <span className="font-medium text-text-primary">
                      {unit.name}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-transparent ${getTypeBadgeClasses(unit.type)}`}
                    >
                      {getTypeIcon(unit.type)}
                      {String(t(`types.${unit.type}`, { defaultValue: unit.type }))}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {unit.city}, {unit.country}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(unit.status).classes}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${getStatusColor(unit.status).dot}`}
                      />
                      {String(t(`status.${unit.status}`, { defaultValue: unit.status ?? "" }))}
                    </span>
                  </td>
                  <td className="py-3.5 text-text-secondary text-xs">
                    {new Date(unit.created_at).toLocaleDateString(i18n.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
