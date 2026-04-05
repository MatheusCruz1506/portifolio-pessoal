import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.js";
import Clock from "lucide-react/dist/esm/icons/clock-3.js";
import Mail from "lucide-react/dist/esm/icons/mail.js";
import MapPin from "lucide-react/dist/esm/icons/map-pin.js";
import ExternalLink from "lucide-react/dist/esm/icons/external-link.js";
import Phone from "lucide-react/dist/esm/icons/phone.js";
import X from "lucide-react/dist/esm/icons/x.js";
import useStore from "../../store/useStore";
import useSupabaseStore from "../../store/useSupabaseStore";
import type { UnitStatus, UnitWithLegacyFields } from "../../types/unit";

const getStatusConfig = (status: UnitStatus | null) => {
  switch (status) {
    case "Ativo":
      return {
        classes:
          "light:bg-green-50 light:text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dot: "bg-green-500",
      };
    case "Vendido":
      return {
        classes:
          "light:bg-blue-50 light:text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        dot: "bg-blue-500",
      };
    case "Em Construção":
      return {
        classes:
          "light:bg-yellow-50 light:text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        dot: "bg-yellow-500",
      };
    case "Inativo":
      return {
        classes:
          "light:bg-red-50 light:text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dot: "bg-red-500",
      };
    default:
      return {
        classes: "bg-hover-bg text-text-secondary",
        dot: "bg-gray-400",
      };
  }
};

export function UnitSideCard() {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<"email" | "phone" | null>(null);

  const handleCopy = (text: string, field: "email" | "phone") => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const selectedMarkerId = useStore((state) => state.selectedMarkerId);
  const setSelectedMarkerId = useStore((state) => state.setSelectedMarkerId);
  const units = useSupabaseStore((state) => state.units);

  const [activeUnit, setActiveUnit] = useState<UnitWithLegacyFields | null>(null);

  // Cache the selected unit so we can animate it out gracefully
  useEffect(() => {
    if (selectedMarkerId) {
      const found = units.find((u) => u.id === selectedMarkerId);
      if (found && found !== activeUnit) {
        setTimeout(() => setActiveUnit(found), 0);
      }
    }
  }, [selectedMarkerId, units, activeUnit]);

  const isOpen = !!selectedMarkerId && !!activeUnit;
  const statusConfig = activeUnit?.status ? getStatusConfig(activeUnit.status) : null;

  const typeLabel =
    activeUnit?.type || activeUnit?.category
      ? t(`types.${activeUnit.type || activeUnit.category}`, activeUnit.type || activeUnit.category)
      : null;

  const googleMapsUrl = activeUnit
    ? (() => {
        if (Number.isFinite(activeUnit.latitude) && Number.isFinite(activeUnit.longitude)) {
          return `https://www.google.com/maps/search/?api=1&query=${activeUnit.latitude},${activeUnit.longitude}`;
        }

        const addressParts = [
          activeUnit.address,
          activeUnit.city,
          activeUnit.state,
          activeUnit.zip_code,
        ].filter(Boolean);

        if (addressParts.length === 0) {
          return null;
        }

        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(", "))}`;
      })()
    : null;

  const detailList = activeUnit ? (
    <div className="space-y-4 border-t border-border-subtle pt-4">
      <div className="flex items-start gap-3">
        <MapPin
          className="mt-0.5 shrink-0 text-primary-base dark:text-text-primary"
          size={20}
        />
        <div>
          <p className="font-medium text-text-primary">{activeUnit.address}</p>
          <p className="text-sm text-text-secondary">
            {activeUnit.city}, {activeUnit.state} - {activeUnit.zip_code}
          </p>
        </div>
      </div>

      {(activeUnit.phone || activeUnit.telefones) && (
        <div className="flex items-center gap-3">
          <Phone
            className="shrink-0 text-primary-base dark:text-text-primary"
            size={20}
          />
          <p
            onClick={() => {
              const phone = activeUnit.phone || activeUnit.telefones;
              phone && handleCopy(phone, "phone");
            }}
            className="cursor-pointer select-none text-text-primary hover:text-gold-light"
            title={t("map.clickToCopy")}
          >
            {copiedField === "phone"
              ? t("map.copied")
              : activeUnit.phone || activeUnit.telefones}
          </p>
        </div>
      )}

      {(activeUnit.email || activeUnit.emails) && (
        <div className="flex items-center gap-3">
          <Mail
            className="shrink-0 text-primary-base dark:text-text-primary"
            size={20}
          />
          <p
            onClick={() => {
              const email = activeUnit.email || activeUnit.emails;
              email && handleCopy(email, "email");
            }}
            className="cursor-pointer break-all select-none text-text-primary hover:text-gold-light"
            title={t("map.clickToCopy")}
          >
            {copiedField === "email"
              ? t("map.copied")
              : activeUnit.email || activeUnit.emails}
          </p>
        </div>
      )}

      {(activeUnit.operating_hours || activeUnit.horario_funcionamento) && (
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 shrink-0 text-primary-base" size={20} />
          <p className="whitespace-pre-wrap text-sm text-text-primary">
            {activeUnit.operating_hours || activeUnit.horario_funcionamento}
          </p>
        </div>
      )}

      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-base/20 bg-primary-base px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
        >
          <ExternalLink size={16} />
          {t("map.viewOnGoogleMaps")}
        </a>
      )}
    </div>
  ) : null;

  return (
    <>
      <div
        className={`hidden h-full overflow-hidden bg-surface shadow-2xl transition-all duration-300 ease-in-out md:block ${
          isOpen ? "w-96 border-r border-border-default" : "w-0 border-transparent opacity-0"
        }`}
      >
        <div className="relative flex h-full w-96 min-w-[24rem] flex-col bg-surface">
          {activeUnit && (
            <>
              {/* Header Image */}
              <div className="relative h-48 w-full shrink-0 bg-hover-bg">
                {activeUnit.image_url ? (
                  <img
                    src={activeUnit.image_url}
                    alt={activeUnit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className=" dark:text-text-primary w-full h-full flex items-center justify-center text-text-muted">
                    {t("map.noImage")}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="border-t border-border-default flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {typeLabel && (
                      <span className="dark:text-text-primary inline-block px-2.5 py-1 bg-primary-base/10 text-primary-base text-xs font-semibold rounded-full uppercase tracking-wider">
                        {typeLabel}
                      </span>
                    )}
                    {activeUnit.status && statusConfig && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${statusConfig.classes}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {t(`status.${activeUnit.status}`, activeUnit.status)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary leading-tight mb-2">
                    {activeUnit.name}
                  </h2>
                  <p className="text-text-secondary text-sm">
                    {activeUnit.description || t("map.noDescription")}
                  </p>
                </div>

                {detailList}
              </div>
            </>
          )}
        </div>
      </div>

      {activeUnit && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[500] p-3 transition-all duration-300 md:hidden ${
            isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
        >
          <div className="pointer-events-auto overflow-hidden rounded-[28px] border border-border-default bg-surface shadow-2xl">
            <div className="px-4 pt-3">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-border-default" />
            </div>

            <div className="relative flex max-h-[72vh] flex-col">
              <button
                type="button"
                onClick={() => setSelectedMarkerId(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary"
                title={t("map.closeDetails")}
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-4 px-4 pb-4 pt-3">
                <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-hover-bg">
                  {activeUnit.image_url ? (
                    <img
                      src={activeUnit.image_url}
                      alt={activeUnit.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-text-muted">
                      {t("map.noImage")}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 pr-12">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {typeLabel && (
                      <span className="inline-block rounded-full bg-primary-base/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-base">
                        {typeLabel}
                      </span>
                    )}
                    {activeUnit.status && statusConfig && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusConfig.classes}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {t(`status.${activeUnit.status}`, activeUnit.status)}
                      </span>
                    )}
                  </div>

                  <h2 className="line-clamp-2 text-lg font-bold leading-tight text-text-primary">
                    {activeUnit.name}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {activeUnit.city}, {activeUnit.state}
                  </p>
                </div>
              </div>

              <div className="overflow-y-auto border-t border-border-subtle px-4 pb-5 pt-4">
                <p className="text-sm leading-6 text-text-secondary">
                  {activeUnit.description || t("map.noDescription")}
                </p>

                <div className="mt-5">{detailList}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeUnit && (
        <button
          type="button"
          onClick={() => setSelectedMarkerId(isOpen ? null : activeUnit.id)}
          className={`absolute top-1/2 z-[500] hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-default bg-surface p-2 text-text-primary shadow-lg transition-all duration-300 ease-in-out hover:bg-border-default md:flex ${
            isOpen ? "left-[23rem] rotate-0" : "left-24 rotate-180"
          }`}
          title={isOpen ? t("map.closeDetails") : t("map.reopenDetails")}
        >
          <ChevronLeft size={24} />
        </button>
      )}
    </>
  );
}
