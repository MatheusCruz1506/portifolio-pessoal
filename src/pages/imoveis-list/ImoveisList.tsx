import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Download from "lucide-react/dist/esm/icons/download.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import Button from "../../components/ui/Button";
import UnitRow from "../../components/ui/UnitRow";
import useSupabaseStore from "../../store/useSupabaseStore";
import EditUnitModal from "../../components/layout/EditUnitModal";
import DeleteConfirmationModal from "../../components/layout/DeleteConfirmationModal";
import Skeleton from "../../components/ui/Skeleton";
import BulkImportModal from "../../components/layout/BulkImportModal";
import UnitHistoryModal from "../../components/layout/UnitHistoryModal";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "../../icons";
import { SearchIcon } from "../../icons";
import type { Unit } from "../../types/unit";
import { serializeUnitsToCsv } from "../../utils/unitBatch";
import {
  canManageUnits,
  getUserProvince,
  isGeneralAdmin,
} from "../../utils/access";

const ITEMS_PER_PAGE = 10;
const STATUS_OPTIONS = ["Todos", "Ativo", "Vendido"] as const;
const TYPE_OPTIONS = [
  "Todos",
  "Hospital",
  "Centro Universitário",
  "Paróquia",
  "Casa de Repouso",
  "Seminário",
  "Missão",
  "Outro",
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];
type TypeFilter = (typeof TYPE_OPTIONS)[number];
type PageToken = number | "...";
type ViewMode = "active" | "archived" | "all" | "sold";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ImoveisList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    units,
    user,
    profile,
    deleteUnit,
    archiveUnit,
    restoreUnit,
    importUnits,
    isLoading,
    setMessage,
  } = useSupabaseStore();
  const canWriteUnits = canManageUnits(profile, user);
  const currentProvince = getUserProvince(profile, user);
  const hasGlobalAccess = isGeneralAdmin(profile, user);

  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [historyUnit, setHistoryUnit] = useState<Unit | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("Todos");
  const [filterType, setFilterType] = useState<TypeFilter>("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const activeUnitsCount = useMemo(
    () => units.filter((unit) => !unit.is_archived).length,
    [units],
  );
  const archivedUnitsCount = useMemo(
    () => units.filter((unit) => unit.is_archived).length,
    [units],
  );
  const soldUnitsCount = useMemo(
    () => units.filter((unit) => unit.status === "Vendido").length,
    [units],
  );

  const scopedUnits = useMemo(() => {
    if (viewMode === "active") {
      return units.filter((unit) => !unit.is_archived);
    }

    if (viewMode === "archived") {
      return units.filter((unit) => unit.is_archived);
    }

    if (viewMode === "sold") {
      return units.filter((unit) => unit.status === "Vendido");
    }

    return units;
  }, [units, viewMode]);

  const filteredUnits = useMemo(() => {
    let result = scopedUnits;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (unit) =>
          unit.name?.toLowerCase().includes(query) ||
          unit.city?.toLowerCase().includes(query) ||
          unit.address?.toLowerCase().includes(query),
      );
    }

    if (filterStatus !== "Todos") {
      result = result.filter((unit) => unit.status === filterStatus);
    }

    if (filterType !== "Todos") {
      result = result.filter((unit) => unit.type === filterType);
    }

    return result;
  }, [filterStatus, filterType, scopedUnits, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedUnits = filteredUnits.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const activeFiltersCount =
    (filterStatus !== "Todos" ? 1 : 0) +
    (filterType !== "Todos" ? 1 : 0);

  const handleOpenDeleteModal = (unit: Unit) => {
    setUnitToDelete(unit);
    setIsDeletingModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!unitToDelete) return;

    setIsDeleting(true);
    await deleteUnit(unitToDelete.id);
    setIsDeleting(false);
    setIsDeletingModalOpen(false);
    setUnitToDelete(null);
  };

  const handleArchiveToggle = async (unit: Unit) => {
    if (unit.is_archived) {
      await restoreUnit(unit.id);
      return;
    }

    await archiveUnit(unit.id);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterStatus = (value: StatusFilter) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleFilterType = (value: TypeFilter) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleViewModeChange = (nextMode: ViewMode) => {
    setViewMode(nextMode);
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (filteredUnits.length === 0) {
      return;
    }

    downloadCsv(
      `unidades-${viewMode}-${new Date().toISOString().slice(0, 10)}.csv`,
      serializeUnitsToCsv(filteredUnits),
    );

    setMessage(
      t("batch.exportSuccess", {
        defaultValue: "{{count}} unidades exportadas para CSV.",
        count: filteredUnits.length,
      }),
    );
  };

  const getPageNumbers = () => {
    const pages: PageToken[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let page = 1; page <= totalPages; page += 1) {
        pages.push(page);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, safePage - 1);
      let end = Math.min(totalPages - 1, safePage + 1);

      if (safePage <= 3) {
        end = Math.min(maxVisible, totalPages - 1);
      }

      if (safePage >= totalPages - 2) {
        start = Math.max(totalPages - maxVisible + 1, 2);
      }

      if (start > 2) pages.push("...");
      for (let page = start; page <= end; page += 1) pages.push(page);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading && units.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 transition-colors duration-300">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-52 rounded" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="overflow-visible rounded-2xl border border-border-subtle bg-surface">
          <div className="flex items-center gap-3 border-b border-border-subtle p-4">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-full rounded" />
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 transition-colors duration-300">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-text-primary">
              {t("units.manage")}
            </h2>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold light:bg-emerald-100 light:text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {filteredUnits.length}{" "}
              {filteredUnits.length === 1 ? t("units.unit") : t("units.units")}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              {
                key: "active" as const,
                label: t("units.tabs.active", { defaultValue: "Ativas" }),
                count: activeUnitsCount,
              },
              {
                key: "archived" as const,
                label: t("units.tabs.archived", { defaultValue: "Lixeira" }),
                count: archivedUnitsCount,
              },
              {
                key: "sold" as const,
                label: t("units.tabs.sold", { defaultValue: "Vendidas" }),
                count: soldUnitsCount,
              },
              {
                key: "all" as const,
                label: t("units.tabs.all", { defaultValue: "Todas" }),
                count: units.length,
              },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleViewModeChange(option.key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === option.key
                    ? "border-primary-light bg-primary-light text-white"
                    : "border-border-subtle bg-surface text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {canWriteUnits && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg"
            >
              <Upload className="h-4 w-4" />
              {t("batch.importAction", { defaultValue: "Importar unidades" })}
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredUnits.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {t("batch.exportAction", { defaultValue: "Exportar CSV" })}
          </button>

          {canWriteUnits && (
            <Button onClick={() => navigate("/imoveis/novo")}>
              {t("units.new")}
            </Button>
          )}
        </div>
      </div>

      {!canWriteUnits && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t("units.readOnlyHint", {
            defaultValue:
              "Seu perfil tem acesso somente leitura nesta província. Você pode consultar dados e histórico, mas não alterar unidades.",
          })}
        </div>
      )}

      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-surface py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-hover-bg">
            <span className="text-3xl">🏥</span>
          </div>
          <p className="mb-6 text-lg text-text-secondary">{t("units.empty")}</p>
          {canWriteUnits && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate("/imoveis/novo")}>
                {t("units.addNew")}
              </Button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg"
              >
                {t("batch.importAction", { defaultValue: "Importar unidades" })}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
          <div className="flex flex-col items-stretch gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder={t("units.search")}
                className="w-full rounded-xl border border-border-subtle bg-background py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary transition-all focus:border-gold-light focus:outline-none focus:ring-2 focus:ring-gold-light/40"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                showFilters || activeFiltersCount > 0
                  ? "border-gold-light bg-gold-light/10 text-gold-dark"
                  : "border-border-subtle text-text-secondary hover:bg-hover-bg"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("units.filters")}
              {activeFiltersCount > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold-light text-xs font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-col gap-3 border-b border-border-subtle bg-hover-bg/30 p-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {t("units.type")}
                </label>
                <select
                  value={filterType}
                  onChange={(event) =>
                    handleFilterType(event.target.value as TypeFilter)
                  }
                  className="w-full cursor-pointer rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-light/40"
                >
                  {TYPE_OPTIONS.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {String(
                        t(`types.${typeOption}`, { defaultValue: typeOption }),
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {t("units.status")}
                </label>
                <select
                  value={filterStatus}
                  onChange={(event) =>
                    handleFilterStatus(event.target.value as StatusFilter)
                  }
                  className="w-full cursor-pointer rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-light/40"
                >
                  {STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {String(
                        t(`status.${statusOption}`, {
                          defaultValue: statusOption,
                        }),
                      )}
                    </option>
                  ))}
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("Todos");
                      setFilterStatus("Todos");
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 text-sm text-text-secondary underline transition-colors hover:text-primary-light"
                  >
                    {t("units.clearFilters")}
                  </button>
                </div>
              )}
            </div>
          )}

          {scopedUnits.length === 0 && !searchTerm && activeFiltersCount === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-semibold text-text-primary">
                {viewMode === "archived"
                  ? t("units.archivedEmptyTitle", {
                      defaultValue: "Nenhuma unidade na lixeira",
                    })
                  : viewMode === "sold"
                    ? t("units.soldEmptyTitle", {
                        defaultValue: "Nenhuma unidade vendida",
                      })
                    : t("units.activeEmptyTitle", {
                        defaultValue: "Nenhuma unidade ativa",
                      })}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {viewMode === "archived"
                  ? t("units.archivedEmptyDescription", {
                      defaultValue:
                        "Mova unidades para a lixeira para retirá-las da operação diária sem perder o histórico.",
                    })
                  : viewMode === "sold"
                    ? t("units.soldEmptyDescription", {
                        defaultValue:
                          "As unidades marcadas como vendidas aparecerão nesta visão.",
                      })
                    : t("units.activeEmptyDescription", {
                        defaultValue:
                          "Restaure uma unidade da lixeira ou cadastre uma nova unidade para voltar a operar nesta visão.",
                    })}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border-subtle bg-hover-bg/50">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        {t("units.unitName")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        {t("units.type")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        {t("units.city")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        {t("units.contact")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        {t("units.status")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        {t("units.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUnits.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-sm text-text-secondary"
                        >
                          {t("units.notFound")}
                        </td>
                      </tr>
                    ) : (
                      paginatedUnits.map((unit) => (
                        <UnitRow
                          key={unit.id}
                          unit={unit}
                          canManageUnit={canWriteUnits}
                          onEdit={() => setEditingUnit(unit)}
                          onArchiveToggle={handleArchiveToggle}
                          onViewHistory={() => setHistoryUnit(unit)}
                          onViewOnMap={(selectedUnit) =>
                            navigate(`/map?unitId=${selectedUnit.id}`)
                          }
                          onDelete={() => handleOpenDeleteModal(unit)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredUnits.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("units.previous")}
                  </button>

                  <div className="hidden items-center gap-1 sm:flex">
                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 py-1 text-sm text-text-secondary"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                            page === safePage
                              ? "bg-primary-light text-white shadow-sm"
                              : "text-text-secondary hover:bg-hover-bg"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <span className="text-sm text-text-secondary sm:hidden">
                    {t("units.page", { current: safePage, total: totalPages })}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("units.next")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {editingUnit && (
        <EditUnitModal unit={editingUnit} onClose={() => setEditingUnit(null)} />
      )}

      <DeleteConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        unitName={unitToDelete?.name ?? ""}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        province={currentProvince}
        canSelectProvince={hasGlobalAccess}
        isImporting={isLoading}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importUnits}
      />

      <UnitHistoryModal
        isOpen={Boolean(historyUnit)}
        unit={historyUnit}
        onClose={() => setHistoryUnit(null)}
      />
    </div>
  );
}
