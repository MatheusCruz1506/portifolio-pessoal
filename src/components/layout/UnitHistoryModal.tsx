import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Archive from "lucide-react/dist/esm/icons/archive.js";
import Clock3 from "lucide-react/dist/esm/icons/clock-3.js";
import FilePlus2 from "lucide-react/dist/esm/icons/file-plus-2.js";
import FileUp from "lucide-react/dist/esm/icons/file-up.js";
import Pencil from "lucide-react/dist/esm/icons/pencil.js";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import X from "lucide-react/dist/esm/icons/x.js";
import useSupabaseStore from "../../store/useSupabaseStore";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import type { Unit, UnitHistory } from "../../types/unit";

const EMPTY_HISTORY: UnitHistory[] = [];

interface UnitHistoryModalProps {
  isOpen: boolean;
  unit: Unit | null;
  onClose: () => void;
}

type HistoryDetails = {
  changedFields?: string[];
};

function getActionIcon(action: UnitHistory["action"]) {
  switch (action) {
    case "created":
      return FilePlus2;
    case "updated":
      return Pencil;
    case "archived":
      return Archive;
    case "restored":
      return RotateCcw;
    case "deleted":
      return Trash2;
    case "imported":
      return FileUp;
    default:
      return Clock3;
  }
}

function getActionClasses(action: UnitHistory["action"]) {
  switch (action) {
    case "created":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    case "updated":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-300";
    case "archived":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
    case "restored":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-300";
    case "deleted":
      return "bg-red-500/10 text-red-600 dark:text-red-300";
    case "imported":
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300";
    default:
      return "bg-hover-bg text-text-secondary";
  }
}

function getFieldLabel(field: string, t: (key: string, options?: object) => string) {
  const fieldLabelMap: Record<string, string> = {
    name: t("form.unitName"),
    type: t("units.type"),
    status: t("units.status"),
    address: t("history.fields.address", { defaultValue: "Endereço" }),
    city: t("units.city"),
    state: t("history.fields.state", { defaultValue: "Estado" }),
    country: t("form.country"),
    zip_code: t("form.zipCode"),
    phone: t("form.phone"),
    email: t("form.email"),
    website: t("form.website"),
    description: t("form.description"),
    image_url: t("history.fields.image", { defaultValue: "Imagem" }),
  };

  return fieldLabelMap[field] ?? field;
}

function getEntryDescription(
  entry: UnitHistory,
  t: (key: string, options?: object) => string,
) {
  const details =
    entry.details && typeof entry.details === "object" && !Array.isArray(entry.details)
      ? (entry.details as HistoryDetails)
      : null;

  if (entry.action === "updated" && Array.isArray(details?.changedFields)) {
    const changedFields = details.changedFields.map((field) =>
      getFieldLabel(field, t),
    );

    if (changedFields.length > 0) {
      return t("history.updatedFields", {
        defaultValue: "Campos alterados: {{fields}}",
        fields: changedFields.join(", "),
      });
    }
  }

  if (entry.action === "imported") {
    return t("history.importedDescription", {
      defaultValue: "Importado via arquivo CSV.",
    });
  }

  if (entry.action === "archived") {
    return t("history.archivedDescription", {
      defaultValue: "A unidade saiu da listagem principal e foi movida para o arquivo.",
    });
  }

  if (entry.action === "restored") {
    return t("history.restoredDescription", {
      defaultValue: "A unidade voltou a aparecer na listagem principal.",
    });
  }

  if (entry.action === "deleted") {
    return t("history.deletedDescription", {
      defaultValue: "A unidade foi removida permanentemente.",
    });
  }

  if (entry.action === "created") {
    return t("history.createdDescription", {
      defaultValue: "Cadastro inicial da unidade.",
    });
  }

  return t("history.genericDescription", {
    defaultValue: "Atualização registrada no histórico.",
  });
}

export default function UnitHistoryModal({
  isOpen,
  unit,
  onClose,
}: UnitHistoryModalProps) {
  const { t, i18n } = useTranslation();
  const fetchUnitHistory = useSupabaseStore((state) => state.fetchUnitHistory);
  const isHistoryLoading = useSupabaseStore((state) => state.isHistoryLoading);
  const historyByUnit = useSupabaseStore((state) => state.historyByUnit);
  const history = unit ? historyByUnit[unit.id] ?? EMPTY_HISTORY : EMPTY_HISTORY;

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (!isOpen || !unit) {
      return;
    }

    void fetchUnitHistory(unit.id);
  }, [fetchUnitHistory, isOpen, unit]);

  if (!isOpen || !unit) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
              {t("history.title", { defaultValue: "Histórico da Unidade" })}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-text-primary">
              {unit.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary"
            aria-label={t("history.close", { defaultValue: "Fechar histórico" })}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {isHistoryLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-hover-bg/40 px-4 py-6 text-sm text-text-secondary">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-primary-light" />
              {t("history.loading", { defaultValue: "Carregando histórico..." })}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-subtle px-6 py-10 text-center text-sm text-text-secondary">
              {t("history.empty", {
                defaultValue: "Ainda não há eventos registrados para esta unidade.",
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                const ActionIcon = getActionIcon(entry.action);

                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border-subtle bg-background/60 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getActionClasses(entry.action)}`}
                        >
                          <ActionIcon className="h-5 w-5" />
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-semibold text-text-primary">
                            {t(`history.action.${entry.action}`, {
                              defaultValue: entry.action,
                            })}
                          </p>
                          <p className="text-sm leading-6 text-text-secondary">
                            {getEntryDescription(entry, t)}
                          </p>
                          <p className="text-xs text-text-secondary/80">
                            {t("history.by", {
                              defaultValue: "por {{actor}}",
                              actor:
                                entry.actor_name ||
                                t("history.unknownActor", {
                                  defaultValue: "Usuário do sistema",
                                }),
                            })}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-text-secondary">
                        {new Date(entry.created_at).toLocaleString(i18n.language)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
