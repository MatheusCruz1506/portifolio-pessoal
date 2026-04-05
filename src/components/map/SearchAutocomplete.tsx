import { useMemo, useRef, useState } from "react";
import Search from "lucide-react/dist/esm/icons/search.js";
import MapPin from "lucide-react/dist/esm/icons/map-pin.js";
import { useTranslation } from "react-i18next";
import useStore from "../../store/useStore";
import useSupabaseStore from "../../store/useSupabaseStore";
import type { Unit } from "../../types/unit";
import { useClickOutside } from "../../hooks/useClickOutside";

export default function SearchAutoComplete() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const units = useSupabaseStore((state) => state.units);
  const setMapLocation = useStore((state) => state.setMapLocation);
  const setSelectedMarkerId = useStore((state) => state.setSelectedMarkerId);
  const visibleUnits = useMemo(
    () => units.filter((unit) => !unit.is_archived),
    [units],
  );

  // Filter units based on search query
  const filteredUnits = useMemo(() => {
    if (query.trim() === "") {
      return [];
    }

    const normalizedQuery = query.toLowerCase();

    return visibleUnits
      .filter(
        (unit) =>
          unit.name.toLowerCase().includes(normalizedQuery) ||
          (unit.city && unit.city.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 5);
  }, [query, visibleUnits]);

  // Handle click outside to close dropdown
  useClickOutside(wrapperRef, () => setIsOpen(false), isOpen);

  const handleSelectUnit = (unit: Unit) => {
    setQuery(unit.name);
    setIsOpen(false);

    // Zoom and pan map
    setMapLocation([unit.latitude, unit.longitude], 15);

    // Select marker to open side card
    setTimeout(() => {
      setSelectedMarkerId(unit.id);
    }, 300); // slight delay to let map pan first
  };

  return (
    <div
      ref={wrapperRef}
      className="relative z-[400] w-full min-w-0 flex-1 md:max-w-sm md:flex-none"
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted dark:text-text-primary" />
        </div>
        <input
          type="text"
          autoComplete="off"
          className="block h-12 w-full rounded-2xl border border-border-default bg-surface py-3 pl-10 pr-3 leading-5 text-text-primary placeholder-text-muted shadow-md transition-shadow focus:border-gold-light focus:outline-none focus:ring-2 focus:ring-gold-light sm:text-sm"
          placeholder={t("map.search")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filteredUnits.length > 0 && (
        <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xl">
          <ul className="max-h-60 overflow-auto py-1 text-sm text-text-primary">
            {filteredUnits.map((unit) => (
              <li
                key={unit.id}
                className="relative cursor-pointer select-none py-3 pl-3 pr-9 transition-colors hover:bg-hover-bg"
                onClick={() => handleSelectUnit(unit)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="text-text-muted shrink-0" size={16} />
                  <div className="truncate">
                    <span className="font-medium block truncate">{unit.name}</span>
                    <span className="text-xs text-text-secondary block truncate">
                      {unit.city} - {unit.state}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && query.trim() !== "" && filteredUnits.length === 0 && (
        <div className="absolute mt-2 w-full cursor-default overflow-hidden rounded-2xl border border-border-default bg-surface p-4 text-center text-sm text-text-muted shadow-xl dark:text-text-primary">
          {t("map.notFound")}
        </div>
      )}
    </div>
  );
}
