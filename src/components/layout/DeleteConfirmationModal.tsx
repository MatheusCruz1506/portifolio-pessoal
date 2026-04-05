import { useTranslation } from "react-i18next";
import { Trash2, AlertCircle } from "../../icons";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  unitName: string;
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, isDeleting, unitName }: DeleteConfirmationModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header/Icon Area */}
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            {t("units.delete.title")}
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            {t("units.delete.messageWithUnit", { unitName })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-5 bg-surface flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer flex-1 px-4 py-2.5 rounded-xl border border-border-default text-text-primary font-medium hover:bg-hover-bg transition-colors disabled:opacity-50"
          >
            {t("units.delete.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-70"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {t("units.delete.confirm")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
