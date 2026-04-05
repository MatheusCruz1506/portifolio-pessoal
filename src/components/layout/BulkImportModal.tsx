import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Download from "lucide-react/dist/esm/icons/download.js";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import X from "lucide-react/dist/esm/icons/x.js";
import Button from "../ui/Button";
import { PROVINCES } from "../../schemas/formSchema";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import {
  buildUnitTemplateCsv,
  parseUnitsCsv,
  type ParsedUnitBatch,
} from "../../utils/unitBatch";
import type { TablesInsert } from "../../types";
import { translateProvinceName } from "../../utils/provinceLabels";

interface BulkImportModalProps {
  isOpen: boolean;
  province: string | null;
  canSelectProvince?: boolean;
  isImporting: boolean;
  onClose: () => void;
  onImport: (rows: TablesInsert<"units">[]) => Promise<boolean>;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportModal({
  isOpen,
  province,
  canSelectProvince = false,
  isImporting,
  onClose,
  onImport,
}: BulkImportModalProps) {
  const { t } = useTranslation();
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [parsedBatch, setParsedBatch] = useState<ParsedUnitBatch | null>(null);
  const [selectedProvince, setSelectedProvince] = useState(province ?? "");

  const activeProvince = canSelectProvince ? selectedProvince : province;

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setSelectedFileName("");
    setParsedBatch(null);
    setIsReadingFile(false);
    setSelectedProvince(province ?? "");
  }, [isOpen, province]);

  const validRowsPreview = useMemo(() => {
    return parsedBatch?.rows.slice(0, 5) ?? [];
  }, [parsedBatch]);

  if (!isOpen) {
    return null;
  }

  const handleTemplateDownload = () => {
    if (!activeProvince) {
      return;
    }

    downloadTextFile(
      "modelo-unidades.csv",
      buildUnitTemplateCsv(activeProvince),
      "text/csv;charset=utf-8",
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!activeProvince) {
      setParsedBatch({
        rows: [],
        errors: [
          t("batch.provinceRequired", {
            defaultValue: canSelectProvince
              ? "Selecione uma província antes de importar as unidades."
              : "Seu usuário precisa ter uma província para importar unidades.",
          }),
        ],
        totalRows: 0,
      });
      return;
    }

    setIsReadingFile(true);
    setSelectedFileName(file.name);

    try {
      const fileContent = await file.text();
      const result = parseUnitsCsv(fileContent, activeProvince);
      setParsedBatch(result);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleImport = async () => {
    if (!parsedBatch || parsedBatch.rows.length === 0 || parsedBatch.errors.length > 0) {
      return;
    }

    const success = await onImport(parsedBatch.rows);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
              {t("batch.title", { defaultValue: "Importação em lote" })}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-text-primary">
              {t("batch.subtitle", {
                defaultValue: "Valide o arquivo CSV antes de importar",
              })}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary"
            aria-label={t("batch.close", { defaultValue: "Fechar importação" })}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border-subtle bg-background/60 p-5">
              <p className="text-sm leading-6 text-text-secondary">
                {t("batch.description", {
                  defaultValue:
                    canSelectProvince
                      ? "Use um CSV com os cabeçalhos padrão do sistema. O arquivo será validado com base na província selecionada antes da gravação."
                      : "Use um CSV com os cabeçalhos padrão do sistema. O arquivo será validado antes da gravação para evitar cadastros quebrados ou fora da sua província.",
                })}
              </p>

              {canSelectProvince && (
                <div className="mt-5 max-w-sm">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {t("form.province", { defaultValue: "Província" })}
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={(event) => {
                      setSelectedProvince(event.target.value);
                      setParsedBatch(null);
                    }}
                    className="w-full cursor-pointer rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-light/40"
                  >
                    <option value="">{t("form.selectPlaceholder")}</option>
                    {PROVINCES.map((provinceOption) => (
                      <option key={provinceOption} value={provinceOption}>
                        {translateProvinceName(provinceOption)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleTemplateDownload}
                  disabled={!activeProvince}
                  className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {t("batch.downloadTemplate", {
                    defaultValue: "Baixar modelo",
                  })}
                </button>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-light px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
                  <Upload className="h-4 w-4" />
                  {t("batch.selectFile", { defaultValue: "Selecionar CSV" })}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border-subtle bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t("batch.totalRows", { defaultValue: "Linhas" })}
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {parsedBatch?.totalRows ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t("batch.validRows", { defaultValue: "Válidas" })}
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-500">
                  {parsedBatch?.rows.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t("batch.invalidRows", { defaultValue: "Com erro" })}
                </p>
                <p className="mt-2 text-2xl font-bold text-red-500">
                  {parsedBatch?.errors.length ?? 0}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light/10 text-primary-light">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {selectedFileName ||
                      t("batch.noFileSelected", {
                        defaultValue: "Nenhum arquivo selecionado",
                      })}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {isReadingFile
                      ? t("batch.readingFile", {
                          defaultValue: "Lendo e validando arquivo...",
                        })
                      : t("batch.fileHint", {
                          defaultValue:
                            "Cabeçalhos esperados: name, type, status, address, city, country, latitude, longitude...",
                        })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border-subtle bg-background/60 p-5">
              <h3 className="font-semibold text-text-primary">
                {t("batch.preview", { defaultValue: "Prévia das unidades válidas" })}
              </h3>

              {validRowsPreview.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-text-secondary">
                  {t("batch.previewEmpty", {
                    defaultValue:
                      "Selecione um arquivo CSV para ver as unidades que serão importadas.",
                  })}
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {validRowsPreview.map((row, index) => (
                    <div
                      key={`${row.name}-${index}`}
                      className="rounded-xl border border-border-subtle px-4 py-3"
                    >
                      <p className="font-medium text-text-primary">{row.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {row.type} • {row.city} • {row.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border-subtle bg-background/60 p-5">
              <h3 className="font-semibold text-text-primary">
                {t("batch.errors", { defaultValue: "Erros encontrados" })}
              </h3>

              {!parsedBatch || parsedBatch.errors.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-emerald-600 dark:text-emerald-300">
                  {t("batch.noErrors", {
                    defaultValue: "Nenhum erro encontrado no arquivo selecionado.",
                  })}
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {parsedBatch.errors.slice(0, 8).map((error) => (
                    <div
                      key={error}
                      className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg"
          >
            {t("batch.cancel", { defaultValue: "Cancelar" })}
          </button>

          <Button
            onClick={handleImport}
            disabled={
              isImporting ||
              isReadingFile ||
              !parsedBatch ||
              parsedBatch.rows.length === 0 ||
              parsedBatch.errors.length > 0
            }
          >
            {isImporting
              ? t("batch.importing", { defaultValue: "Importando..." })
              : t("batch.importAction", { defaultValue: "Importar unidades" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
