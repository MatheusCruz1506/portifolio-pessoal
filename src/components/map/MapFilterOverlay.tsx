import { useState } from "react";
import Filter from "lucide-react/dist/esm/icons/filter.js";
import X from "lucide-react/dist/esm/icons/x.js";
import Check from "lucide-react/dist/esm/icons/check.js";
import { useTranslation } from "react-i18next";
import {
  CasaDeRepousoIcon,
  CentroUniversitarioIcon,
  HospitalIcon,
  MissaoIcon,
  OutrosIcon,
  ParoquiaIcon,
  SeminarioIcon,
} from "../../icons";
import useStore from "../../store/useStore";
import type { UnitType } from "../../types/unit";

const STATUS_OPTIONS = ["Ativo", "Vendido"];
const TYPE_OPTIONS = [
  "Hospital",
  "Centro Universitário",
  "Paróquia",
  "Casa de Repouso",
  "Seminário",
  "Missão",
  "Outro",
];

const TYPE_ICONS: Record<UnitType, React.ComponentType<{ className?: string }>> = {
  Hospital: HospitalIcon,
  "Centro Universitário": CentroUniversitarioIcon,
  Paróquia: ParoquiaIcon,
  "Casa de Repouso": CasaDeRepousoIcon,
  Seminário: SeminarioIcon,
  Missão: MissaoIcon,
  Outro: OutrosIcon,
};

export function MapFilterOverlay() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const activeFilters = useStore((state) => state.activeFilters);
  const toggleFilter = useStore((state) => state.toggleFilter);
  const clearFilters = useStore((state) => state.clearFilters);

  const hasActiveFilters =
    activeFilters.types.length > 0 || activeFilters.status.length > 0;
  const totalActiveFilters =
    activeFilters.types.length + activeFilters.status.length;

  const filterSections = (
    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 md:max-h-96">
      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
          {t("map.unitType")}
        </h4>
        <div className="space-y-2">
          {TYPE_OPTIONS.map((type) => {
            const isSelected = activeFilters.types.includes(type);
            const TypeIcon = TYPE_ICONS[type as UnitType];

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFilter("types", type)}
                className={`w-full cursor-pointer rounded-xl border p-2.5 transition-all hover:bg-hover-bg ${
                  isSelected
                    ? "border-primary-base bg-hover-bg text-text-primary"
                    : "bg-background text-text-primary hover:border-text-muted"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <TypeIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t(`types.${type}`, type)}</span>
                  </span>
                  {isSelected && <Check size={16} className="shrink-0" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
          {t("units.status")}
        </h4>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((status) => {
            const isSelected = activeFilters.status.includes(status);

            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleFilter("status", status)}
                className={`w-full cursor-pointer rounded-xl border p-2.5 transition-all hover:bg-hover-bg ${
                  isSelected
                    ? "border-primary-base bg-hover-bg text-text-primary"
                    : "bg-background text-text-primary hover:border-text-muted"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    {t(`status.${status}`, status)}
                  </span>
                  {isSelected && <Check size={16} className="shrink-0" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const filterFooter = (
    <div className="border-t border-border-subtle bg-hover-bg p-4">
      <button
        type="button"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
        className={`w-full rounded-xl py-2 text-sm font-medium transition-colors ${
          hasActiveFilters
            ? "cursor-pointer text-text-primary hover:bg-text-primary/10"
            : "cursor-not-allowed text-text-muted opacity-50"
        }`}
      >
        {t("map.clearFilters")}
      </button>
    </div>
  );

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={t("units.filters")}
        className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium shadow-md transition-all duration-200 ${
          hasActiveFilters
            ? "bg-primary-base text-white border-primary-base hover:opacity-90"
            : "bg-surface text-text-primary border-border-default hover:bg-hover-bg"
        }`}
      >
        <Filter size={18} />
        <span className="hidden md:inline">{t("units.filters")}</span>
        {hasActiveFilters && (
          <span
            className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              hasActiveFilters ? "bg-white/20 text-white" : "bg-hover-bg"
            }`}
          >
            {totalActiveFilters}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[840] bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-[850] md:hidden">
            <div className="rounded-t-[28px] border border-border-subtle bg-surface shadow-2xl">
              <div className="px-4 pt-3">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-border-default" />
              </div>

              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4">
                <h3 className="font-semibold text-text-primary">
                  {t("map.advancedFilters")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-text-muted transition-colors hover:bg-hover-bg hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              {filterSections}
              {filterFooter}
            </div>
          </div>

          <div className="absolute right-0 top-full z-[400] mt-2 hidden w-72 overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-xl md:flex md:flex-col">
            <div className="flex items-center justify-between border-b border-border-subtle bg-hover-bg p-4">
              <h3 className="font-semibold text-text-primary">
                {t("map.advancedFilters")}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            {filterSections}
            {filterFooter}
          </div>
        </>
      )}
    </div>
  );
}
