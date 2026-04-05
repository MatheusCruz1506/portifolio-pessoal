import { useEffect } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import useSupabaseStore from "../../store/useSupabaseStore";

const ERROR_AUTO_DISMISS_MS = 4500;
const SUCCESS_AUTO_DISMISS_MS = 8000;

export default function GlobalFeedback() {
  const { t } = useTranslation();
  const { erro, message, clearMessage } = useSupabaseStore();
  const content = erro ?? message;
  const isError = Boolean(erro);

  useEffect(() => {
    if (!content) {
      return undefined;
    }

    const dismissDelay = isError
      ? ERROR_AUTO_DISMISS_MS
      : SUCCESS_AUTO_DISMISS_MS;

    const timer = window.setTimeout(() => {
      clearMessage();
    }, dismissDelay);

    return () => window.clearTimeout(timer);
  }, [clearMessage, content, isError]);

  if (!content) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[1000] w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
          isError
            ? "border-red-500/20 bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300"
            : "border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
        }`}
        role="status"
        aria-live="polite"
      >
        {isError ? (
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
        )}

        <p className="min-w-0 flex-1 text-sm font-medium">{content}</p>

        <button
          type="button"
          onClick={clearMessage}
          className="cursor-pointer rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
          aria-label={t("feedback.close", {
            defaultValue: "Fechar notificação",
          })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
