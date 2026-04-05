import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import useStore from "../../store/useStore";
import SearchAutoComplete from "../../components/map/SearchAutocomplete";
import { UnitSideCard } from "../../components/map/UnitSideCard";
import { MapFilterOverlay } from "../../components/map/MapFilterOverlay";

import { iconsConfigMap } from "../../icons";
import useSupabaseStore from "../../store/useSupabaseStore";
import type { UnitWithLegacyFields } from "../../types/unit";
import { useGoogleMapsApi } from "../../hooks/useGoogleMapsApi";
import { getProvinceMapViewport, isProvinceName } from "../../constants/provinces";
import Button from "../../components/ui/Button";

interface MapMarkerEntry {
  marker: any;
  cleanup: () => void;
  position: { lat: number; lng: number };
}

function createAdvancedMarkerContent(iconUrl: string, title: string) {
  const img = document.createElement("img");
  img.src = iconUrl;
  img.alt = title;
  img.width = 42;
  img.height = 57;
  img.loading = "lazy";
  img.draggable = false;
  img.style.display = "block";
  img.style.width = "42px";
  img.style.height = "57px";
  img.style.cursor = "pointer";
  img.style.userSelect = "none";

  return img;
}

function getMarkerStatusTheme(status: string | null) {
  switch (status) {
    case "Ativo":
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    case "Vendido":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    case "Em Construção":
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    case "Inativo":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };
    default:
      return {
        background: "#e5e7eb",
        color: "#374151",
      };
  }
}

interface MarkerHoverContentOptions {
  imageUrl: string | null;
  noImageLabel: string;
  status: string | null;
  statusLabel: string | null;
  title: string;
  typeLabel: string | null;
}

function createMarkerHoverContent({
  imageUrl,
  noImageLabel,
  status,
  statusLabel,
  title,
  typeLabel,
}: MarkerHoverContentOptions) {
  const container = document.createElement("div");
  Object.assign(container.style, {
    background: "#ffffff",
    borderRadius: "18px",
    color: "#111827",
    overflow: "hidden",
    width: "220px",
  });

  const media = document.createElement("div");
  Object.assign(media.style, {
    alignItems: "center",
    background: "linear-gradient(135deg, #f8f3e9 0%, #ece2cf 100%)",
    display: "flex",
    height: "110px",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  });

  const renderFallbackImage = () => {
    media.replaceChildren();

    const fallback = document.createElement("span");
    Object.assign(fallback.style, {
      color: "#6b7280",
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    });
    fallback.textContent = noImageLabel;
    media.appendChild(fallback);
  };

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = title;
    image.loading = "lazy";
    Object.assign(image.style, {
      display: "block",
      height: "100%",
      objectFit: "cover",
      width: "100%",
    });
    image.onerror = () => renderFallbackImage();
    media.appendChild(image);
  } else {
    renderFallbackImage();
  }

  const body = document.createElement("div");
  Object.assign(body.style, {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
  });

  const titleElement = document.createElement("p");
  Object.assign(titleElement.style, {
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1.35",
    margin: "0",
  });
  titleElement.textContent = title;
  body.appendChild(titleElement);

  if (typeLabel || statusLabel) {
    const badges = document.createElement("div");
    Object.assign(badges.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
    });

    if (typeLabel) {
      const typeBadge = document.createElement("span");
      Object.assign(typeBadge.style, {
        background: "#f6efe2",
        borderRadius: "999px",
        color: "#8a5b18",
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        padding: "4px 8px",
        textTransform: "uppercase",
      });
      typeBadge.textContent = typeLabel;
      badges.appendChild(typeBadge);
    }

    if (statusLabel) {
      const statusTheme = getMarkerStatusTheme(status);
      const statusBadge = document.createElement("span");
      Object.assign(statusBadge.style, {
        background: statusTheme.background,
        borderRadius: "999px",
        color: statusTheme.color,
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        padding: "4px 8px",
        textTransform: "uppercase",
      });
      statusBadge.textContent = statusLabel;
      badges.appendChild(statusBadge);
    }

    body.appendChild(badges);
  }

  container.appendChild(media);
  container.appendChild(body);

  return container;
}

export function UnitsMap() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const units = useSupabaseStore((state) => state.units);
  const user = useSupabaseStore((state) => state.user);
  const isUnitsLoading = useSupabaseStore(
    (state) => state.isLoading && !state.hasLoadedUnits,
  );
  const { isLoaded, error } = useGoogleMapsApi();
  const visibleUnits = units.filter((unit) => !unit.is_archived);
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  const mapCenter = useStore((state) => state.mapCenter);
  const mapZoom = useStore((state) => state.mapZoom);
  const selectedMarkerId = useStore((state) => state.selectedMarkerId);
  const setSelectedMarkerId = useStore((state) => state.setSelectedMarkerId);
  const setMapLocation = useStore((state) => state.setMapLocation);
  const activeFilters = useStore((state) => state.activeFilters);
  const hasNoUnits = visibleUnits.length === 0;
  const requestedUnitId = searchParams.get("unitId");

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, MapMarkerEntry>>({});
  const initialProvinceViewportRef = useRef<string | null>(null);
  const requestedUnitSelectionRef = useRef<string | null>(null);
  const zoomAnimationTimeoutRef = useRef<number | null>(null);
  const hoverInfoWindowRef = useRef<any>(null);

  const stopZoomAnimation = useCallback(() => {
    if (zoomAnimationTimeoutRef.current !== null) {
      window.clearTimeout(zoomAnimationTimeoutRef.current);
      zoomAnimationTimeoutRef.current = null;
    }
  }, []);

  const animateZoomTo = useCallback(
    (targetZoom: number) => {
      if (!mapRef.current) {
        return;
      }

      stopZoomAnimation();

      const currentZoom = Number(mapRef.current.getZoom() ?? targetZoom);
      const normalizedCurrentZoom = Math.round(currentZoom);

      if (normalizedCurrentZoom === targetZoom) {
        mapRef.current.setZoom(targetZoom);
        return;
      }

      const direction = targetZoom > normalizedCurrentZoom ? 1 : -1;
      let nextZoom = normalizedCurrentZoom;

      const stepZoom = () => {
        if (!mapRef.current) {
          zoomAnimationTimeoutRef.current = null;
          return;
        }

        nextZoom += direction;
        mapRef.current.setZoom(nextZoom);

        if (nextZoom === targetZoom) {
          zoomAnimationTimeoutRef.current = null;
          return;
        }

        zoomAnimationTimeoutRef.current = window.setTimeout(stepZoom, 85);
      };

      zoomAnimationTimeoutRef.current = window.setTimeout(stepZoom, 85);
    },
    [stopZoomAnimation],
  );

  const userProvince =
    typeof user?.user_metadata?.province === "string" &&
    isProvinceName(user.user_metadata.province)
      ? user.user_metadata.province
      : null;

  useEffect(() => {
    if (!userProvince || initialProvinceViewportRef.current === userProvince) {
      return;
    }

    const viewport = getProvinceMapViewport(userProvince);

    if (!viewport) {
      return;
    }

    initialProvinceViewportRef.current = userProvince;
    setMapLocation(viewport.center, viewport.zoom);
  }, [setMapLocation, userProvince]);

  useEffect(() => {
    if (!requestedUnitId || requestedUnitSelectionRef.current === requestedUnitId) {
      return;
    }

    const requestedUnit = visibleUnits.find((unit) => unit.id === requestedUnitId);

    if (!requestedUnit) {
      return;
    }

    requestedUnitSelectionRef.current = requestedUnitId;
    setMapLocation([requestedUnit.latitude, requestedUnit.longitude], 15);
    setSelectedMarkerId(requestedUnit.id);
  }, [requestedUnitId, setMapLocation, setSelectedMarkerId, visibleUnits]);

  useEffect(() => {
    const googleMaps = window.google?.maps;

    if (!isLoaded || !mapElementRef.current || mapRef.current || !googleMaps) {
      return;
    }

    mapRef.current = new googleMaps.Map(mapElementRef.current, {
      center: { lat: mapCenter[0], lng: mapCenter[1] },
      zoom: mapZoom,
      ...(mapId ? { mapId } : {}),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
    });

    hoverInfoWindowRef.current = new googleMaps.InfoWindow({
      disableAutoPan: true,
      headerDisabled: true,
      ariaLabel: t("map.hoverPreviewAriaLabel"),
    });
  }, [isLoaded, mapCenter, mapId, mapZoom, t]);

  useEffect(() => {
    hoverInfoWindowRef.current?.setOptions({
      ariaLabel: t("map.hoverPreviewAriaLabel"),
    });
  }, [i18n.language, t]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.panTo({ lat: mapCenter[0], lng: mapCenter[1] });
    animateZoomTo(mapZoom);
  }, [animateZoomTo, mapCenter, mapZoom]);

  const unitsFiltradas = visibleUnits.filter((unit) => {
    const normalizeStr = (str?: string | null) => str?.toLowerCase().trim() || "";
    const unitData = unit as UnitWithLegacyFields;

    const typeMatch =
      activeFilters.types.length === 0 ||
      activeFilters.types.includes("Todos") ||
      activeFilters.types.some(
        (t) => normalizeStr(t) === normalizeStr(unitData.type || unitData.category),
      );

    const statusMatch =
      activeFilters.status.length === 0 ||
      activeFilters.status.includes("Todos") ||
      activeFilters.status.some(
        (s) => normalizeStr(s) === normalizeStr(unit.status),
      );

    return typeMatch && statusMatch;
  });

  useEffect(() => {
    const googleMaps = window.google?.maps;
    const advancedMarker = googleMaps?.marker?.AdvancedMarkerElement;
    const canUseAdvancedMarkers = Boolean(advancedMarker);

    if (!mapRef.current || !unitsFiltradas || !googleMaps) {
      return;
    }

    Object.values(markersRef.current).forEach(({ marker, cleanup }) => {
      cleanup();
      marker.map = null;
    });
    markersRef.current = {};

    unitsFiltradas.forEach((unit) => {
      const unitData = unit as UnitWithLegacyFields;
      const typeStr = unitData.type || unitData.category || "";
      const iconKey = typeStr.toLowerCase() as keyof typeof iconsConfigMap;
      const iconUrl = iconsConfigMap[iconKey] || iconsConfigMap.hospital;

      const position = { lat: unit.latitude, lng: unit.longitude };
      const handleMarkerClick = () => {
        setMapLocation([unit.latitude, unit.longitude], 15);
        setSelectedMarkerId(unit.id);
      };
      const typeLabel = typeStr ? t(`types.${typeStr}`, typeStr) : null;
      const statusLabel = unit.status ? t(`status.${unit.status}`, unit.status) : null;

      if (canUseAdvancedMarkers) {
        const marker = new advancedMarker({
          map: mapRef.current,
          position,
          title: unit.name,
          content: createAdvancedMarkerContent(iconUrl, unit.name),
          gmpClickable: true,
        });
        const onMarkerClick = () => handleMarkerClick();
        const onMarkerMouseOver = () => {
          if (!hoverInfoWindowRef.current || !mapRef.current) {
            return;
          }

          hoverInfoWindowRef.current.setContent(
            createMarkerHoverContent({
              imageUrl: unit.image_url || null,
              noImageLabel: t("map.noImage"),
              status: unit.status,
              statusLabel,
              title: unit.name,
              typeLabel,
            }),
          );
          hoverInfoWindowRef.current.open({
            map: mapRef.current,
            anchor: marker,
            shouldFocus: false,
          });
        };
        const onMarkerMouseOut = () => {
          hoverInfoWindowRef.current?.close();
        };

        marker.addEventListener("gmp-click", onMarkerClick);
        marker.addEventListener("mouseover", onMarkerMouseOver);
        marker.addEventListener("mouseout", onMarkerMouseOut);

        markersRef.current[unit.id] = {
          marker,
          cleanup: () => {
            marker.removeEventListener("gmp-click", onMarkerClick);
            marker.removeEventListener("mouseover", onMarkerMouseOver);
            marker.removeEventListener("mouseout", onMarkerMouseOut);
          },
          position,
        };

        return;
      }
    });

    return () => {
      hoverInfoWindowRef.current?.close();
      Object.values(markersRef.current).forEach(({ marker, cleanup }) => {
        cleanup();
        marker.map = null;
      });
      markersRef.current = {};
    };
  }, [i18n.language, mapId, setMapLocation, setSelectedMarkerId, t, unitsFiltradas]);

  useEffect(() => {
    if (!selectedMarkerId || !markersRef.current[selectedMarkerId]) {
      return;
    }

    const { position } = markersRef.current[selectedMarkerId];

    if (!position || !mapRef.current) {
      return;
    }

    mapRef.current.panTo(position);
    hoverInfoWindowRef.current?.close();
  }, [selectedMarkerId]);

  useEffect(() => () => stopZoomAnimation(), [stopZoomAnimation]);

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background">
      <UnitSideCard />

      <div className="relative h-full flex-1">
        {!hasNoUnits && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] p-3 md:p-4">
            <div className="flex pointer-events-auto items-start gap-3">
              <SearchAutoComplete />
              <MapFilterOverlay />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute left-3 right-3 top-[4.5rem] z-[400] rounded-2xl border border-red-500/30 bg-surface px-4 py-3 text-sm text-red-500 shadow-md md:left-4 md:right-4 md:top-20">
            {error}
          </div>
        )}

        {isUnitsLoading && (
          <div className="pointer-events-none absolute inset-0 z-[450] flex items-center justify-center p-6">
            <div className="flex items-center gap-4 rounded-3xl border border-border-subtle bg-surface/92 px-6 py-5 shadow-xl backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-subtle border-t-primary-light" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {t("map.loadingUnits", {
                    defaultValue: "Carregando unidades no mapa...",
                  })}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {t("map.loadingUnitsHint", {
                    defaultValue: "Aguarde enquanto localizamos as unidades.",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasNoUnits && !isUnitsLoading && (
          <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
            <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-border-subtle bg-surface/90 p-8 text-center shadow-xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-text-primary">
                {t("map.emptyTitle")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {t("map.emptyDescription")}
              </p>
              <Button
                className="mt-6"
                onClick={() => navigate("/imoveis/novo")}
              >
                {t("map.emptyAction")}
              </Button>
            </div>
          </div>
        )}

        <div
          ref={mapElementRef}
          className={`h-full w-full transition-all duration-300 ${
            hasNoUnits || isUnitsLoading ? "blur-[2px]" : ""
          }`}
          style={{ minHeight: "100%", zIndex: 0 }}
        />
      </div>
    </div>
  );
}
