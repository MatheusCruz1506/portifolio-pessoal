import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Edit2, Trash2, MoreVertical } from "../../icons";
import Clock3 from "lucide-react/dist/esm/icons/clock-3.js";
import MapPin from "lucide-react/dist/esm/icons/map-pin.js";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw.js";
import {
  getStatusColor,
  getTypeIcon,
  getTypeBadgeClasses,
} from "../../../utils/getStatusColorAndIcon";
import type { Unit } from "../../types/unit";

type CopyableField = "email" | "phone" | null;
type MenuPosition = {
  top: number;
  left: number;
};

interface UnitRowProps {
  unit: Unit;
  canManageUnit: boolean;
  onEdit: (unit: Unit) => void;
  onArchiveToggle: (unit: Unit) => Promise<void> | void;
  onViewHistory: (unit: Unit) => void;
  onViewOnMap?: (unit: Unit) => void;
  onDelete: (unit: Unit) => Promise<void> | void;
}

export default function UnitRow({
  unit,
  canManageUnit,
  onEdit,
  onArchiveToggle,
  onViewHistory,
  onViewOnMap,
  onDelete,
}: UnitRowProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<CopyableField>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuWidth = 160;

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const nextLeft = Math.max(12, rect.right - menuWidth);
    const maxLeft = window.innerWidth - menuWidth - 12;

    setMenuPosition({
      top: rect.bottom + 6,
      left: Math.min(nextLeft, Math.max(12, maxLeft)),
    });
  };

  const handleDeleteClick = async () => {
    setMenuOpen(false);
    setIsDeleting(true);
    await onDelete(unit);
    setIsDeleting(false);
  };

  const handleArchiveToggleClick = async () => {
    setMenuOpen(false);
    setIsArchiving(true);
    try {
      await onArchiveToggle(unit);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCopy = (text: string, field: Exclude<CopyableField, null>) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };
  const statusConfig = getStatusColor(unit.status);
  const menu =
    menuOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[2000] w-40 rounded-xl border border-border-subtle bg-surface py-1 shadow-2xl"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {canManageUnit && !unit.is_archived && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(unit);
                }}
                className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover-bg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-text-secondary" />
                {t("units.edit")}
              </button>
            )}

            {canManageUnit && (
              <button
                onClick={() => {
                  void handleArchiveToggleClick();
                }}
                className="cursor-pointer flex w-full items-center justify-start gap-2 px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-hover-bg"
              >
                {unit.is_archived ? (
                  <RotateCcw className="w-4 h-4 text-text-secondary" />
                ) : (
                  <Trash2 className="w-4 h-4 text-text-secondary" />
                )}
                {unit.is_archived
                  ? t("units.restore", { defaultValue: "Restaurar" })
                  : t("units.moveToTrash", {
                      defaultValue: "Mover para lixeira",
                    })}
              </button>
            )}

            <button
              onClick={() => {
                setMenuOpen(false);
                onViewHistory(unit);
              }}
              className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover-bg transition-colors"
            >
              <Clock3 className="w-4 h-4 text-text-secondary" />
              {t("history.titleShort", { defaultValue: "Histórico" })}
            </button>

            {canManageUnit && unit.is_archived && (
              <button
                onClick={handleDeleteClick}
                className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t("units.delete.confirm")}
              </button>
            )}
          </div>,
          document.body,
        )
      : null;

  useLayoutEffect(() => {
    if (!menuOpen) {
      return;
    }

    updateMenuPosition();
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleViewportChange = () => {
      updateMenuPosition();
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setMenuOpen(false);
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <>
      <tr className="border-b border-border-subtle hover:bg-hover-bg/50 transition-colors duration-150">
        {/* Nome da Unidade */}
        <td className="px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">
              {unit.name}
            </p>
            {unit.address && (
              <p className="text-xs text-text-secondary mt-0.5 truncate max-w-65">
                {unit.address}
              </p>
            )}
            {unit.is_archived && (
              <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                {t("units.archived", { defaultValue: "Lixeira" })}
              </span>
            )}
          </div>
        </td>

        {/* Tipo */}
        <td className="px-4 py-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-transparent ${getTypeBadgeClasses(unit.type)}`}
          >
            {getTypeIcon(unit.type)}
            {String(t(`types.${unit.type}`, { defaultValue: unit.type }))}
          </span>
        </td>

        {/* Cidade */}
        <td className="px-4 py-4">
          <p className="text-sm text-text-primary">{unit.city}</p>
          <p className="text-xs text-text-secondary">{unit.country}</p>
        </td>

        {/* Contato */}
        <td className="px-4 py-4">
          <p
            onClick={() => unit.email && handleCopy(unit.email, "email")}
            className="hover:text-gold-light mb-1 text-sm text-text-secondary truncate max-w-45 cursor-pointer select-none"
            title={t("map.clickToCopy")}
          >
            {copiedField === "email" ? t("map.copied") : unit.email}
          </p>
          <p
            onClick={() => unit.phone && handleCopy(unit.phone, "phone")}
            className="hover:text-gold-light text-sm text-text-secondary cursor-pointer select-none"
            title={t("map.clickToCopy")}
          >
            {copiedField === "phone" ? t("map.copied") : unit.phone}
          </p>
        </td>

        {/* Status */}
        <td className="px-4 py-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.classes}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {String(
              t(`status.${unit.status}`, { defaultValue: unit.status ?? "" }),
            )}
          </span>
        </td>

        {/* Ações — menu de 3 pontos */}
        <td className="relative px-4 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            {!unit.is_archived && onViewOnMap && (
              <button
                type="button"
                onClick={() => onViewOnMap(unit)}
                disabled={isDeleting || isArchiving}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                title={t("map.viewUnitOnMap")}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{t("map.viewUnitOnMap")}</span>
              </button>
            )}

            <div className="relative inline-block" ref={triggerRef}>
              {isDeleting || isArchiving ? (
                <div className="p-1.5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-border-default border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="cursor-pointer p-1.5 rounded-lg text-text-secondary hover:bg-hover-bg hover:text-text-primary transition-colors"
                  aria-label={t("units.actions")}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
      {menu}
    </>
  );
}
