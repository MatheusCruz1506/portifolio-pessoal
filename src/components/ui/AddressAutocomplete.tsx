import { startTransition, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Loader2 } from "../../icons";
import type { FieldError } from "react-hook-form";
import type { AddressSelection } from "../../types/unit";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useGoogleMapsApi } from "../../hooks/useGoogleMapsApi";
import useSupabaseStore from "../../store/useSupabaseStore";
import { getProvinceBiasCountries } from "../../constants/provinces";

interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types: string[];
}

interface GooglePlace {
  addressComponents?: GoogleAddressComponent[];
  formattedAddress?: string;
  location?: {
    lat: () => number;
    lng: () => number;
  };
  fetchFields: (options: { fields: string[] }) => Promise<{ place: GooglePlace }>;
}

interface GooglePlacePrediction {
  placeId: string;
  text: {
    text?: string;
    toString: () => string;
  };
  toPlace: () => GooglePlace;
}

interface GooglePlaceSuggestion {
  description: string;
  placeId: string;
  placePrediction: GooglePlacePrediction;
}

interface PlacesLibrary {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      language?: string;
      region?: string;
      sessionToken?: unknown;
    }) => Promise<{
      suggestions: Array<{
        placePrediction?: GooglePlacePrediction;
      }>;
    }>;
  };
}

interface AddressAutocompleteProps {
  onSelectAddress: (data: AddressSelection) => void;
  error?: FieldError;
}

function getAddressComponent(components: GoogleAddressComponent[], type: string) {
  return (
    components.find((component) => component.types.includes(type))?.longText ||
    ""
  );
}

function prioritizeSuggestionsByProvince(
  suggestions: GooglePlaceSuggestion[],
  province?: string | null,
) {
  const preferredCountries = getProvinceBiasCountries(province).map((country) =>
    country.toLowerCase(),
  );

  if (preferredCountries.length === 0) {
    return suggestions;
  }

  return [...suggestions].sort((a, b) => {
    const aText = a.description.toLowerCase();
    const bText = b.description.toLowerCase();
    const aScore = preferredCountries.some((country) => aText.includes(country))
      ? 1
      : 0;
    const bScore = preferredCountries.some((country) => bText.includes(country))
      ? 1
      : 0;

    return bScore - aScore;
  });
}

export default function AddressAutocomplete({
  onSelectAddress,
  error,
}: AddressAutocompleteProps) {
  const { t } = useTranslation();
  const { isLoaded, error: googleMapsError } = useGoogleMapsApi();
  const userProvince = useSupabaseStore((state) =>
    typeof state.user?.user_metadata?.province === "string"
      ? state.user.user_metadata.province
      : null,
  );

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [isPlacesReady, setIsPlacesReady] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const placesLibraryRef = useRef<PlacesLibrary | null>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const googleMaps = window.google?.maps;

    if (!isLoaded || !googleMaps?.importLibrary) {
      placesLibraryRef.current = null;
      setIsPlacesReady(false);
      return;
    }

    let isCancelled = false;

    const loadPlacesLibrary = async () => {
      try {
        const placesLibrary = (await googleMaps.importLibrary(
          "places",
        )) as PlacesLibrary;

        if (isCancelled) {
          return;
        }

        placesLibraryRef.current = placesLibrary;
        setPlacesError(null);
        setIsPlacesReady(true);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        placesLibraryRef.current = null;
        setIsPlacesReady(false);
        setPlacesError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o Google Places.",
        );
      }
    };

    void loadPlacesLibrary();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !isPlacesReady || !placesLibraryRef.current) {
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      if (trimmedQuery.length === 0) {
        sessionTokenRef.current = null;
      }

      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    const timeOutId = window.setTimeout(() => {
      const placesLibrary = placesLibraryRef.current;

      if (!placesLibrary) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
      }

      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;

      setIsLoading(true);

      void placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmedQuery,
        language: "pt-BR",
        sessionToken: sessionTokenRef.current,
      })
        .then(({ suggestions: nextSuggestions }) => {
          if (isCancelled || latestRequestRef.current !== requestId) {
            return;
          }

          const normalizedPredictions = prioritizeSuggestionsByProvince(
            nextSuggestions
              .map((suggestion) => suggestion.placePrediction)
              .filter((prediction): prediction is GooglePlacePrediction =>
                Boolean(prediction),
              )
              .map((prediction) => ({
                description:
                  prediction.text?.toString?.() || prediction.text?.text || "",
                placeId: prediction.placeId,
                placePrediction: prediction,
              }))
              .filter((suggestion) => suggestion.description.length > 0),
            userProvince,
          ).slice(0, 5);

          startTransition(() => {
            setSuggestions(normalizedPredictions);
            setIsOpen(normalizedPredictions.length > 0);
          });
        })
        .catch(() => {
          if (isCancelled || latestRequestRef.current !== requestId) {
            return;
          }

          startTransition(() => {
            setSuggestions([]);
            setIsOpen(false);
          });
        })
        .finally(() => {
          if (isCancelled || latestRequestRef.current !== requestId) {
            return;
          }

          setIsLoading(false);
        });
    }, 400);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeOutId);
    };
  }, [isLoaded, isPlacesReady, query, userProvince]);

  useClickOutside(wrapperRef, () => setIsOpen(false), isOpen);

  const handleSelect = async (item: GooglePlaceSuggestion) => {
    setIsLoading(true);

    try {
      const place = item.placePrediction.toPlace();

      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress", "location"],
      });

      if (!place.location) {
        return;
      }

      const addressComponents = place.addressComponents || [];
      const city =
        getAddressComponent(addressComponents, "locality") ||
        getAddressComponent(addressComponents, "postal_town") ||
        getAddressComponent(addressComponents, "administrative_area_level_2") ||
        getAddressComponent(addressComponents, "sublocality_level_1");

      const addressData = {
        display_name: place.formattedAddress || item.description,
        latitude: String(place.location.lat()),
        longitude: String(place.location.lng()),
        city,
        state: getAddressComponent(
          addressComponents,
          "administrative_area_level_1",
        ),
        country: getAddressComponent(addressComponents, "country"),
        zip_code: getAddressComponent(addressComponents, "postal_code"),
      };

      sessionTokenRef.current = null;
      setQuery(addressData.display_name);
      setSuggestions([]);
      setIsOpen(false);
      onSelectAddress(addressData);
    } catch {
      sessionTokenRef.current = null;
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gold-dark animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-gold-dark" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          disabled={!isLoaded || !isPlacesReady}
          placeholder={
            googleMapsError || placesError
              ? "Google Maps indisponivel"
              : t("map.addressPlaceholder")
          }
          className={`bg-surface w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-text-primary placeholder:text-text-secondary ${
            error
              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
              : "border-border-default focus:ring-gold-light focus:border-gold-light"
          } ${!isLoaded || !isPlacesReady ? "cursor-not-allowed opacity-70" : ""}`}
        />
      </div>

      {error && (
        <span className="text-red-500 text-sm mt-1 ml-1">{error.message}</span>
      )}

      {googleMapsError && (
        <span className="text-red-500 text-sm mt-1 ml-1">
          {googleMapsError}
        </span>
      )}

      {placesError && (
        <span className="text-red-500 text-sm mt-1 ml-1">{placesError}</span>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-surface border border-border-subtle rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.placeId}
              onClick={() => void handleSelect(item)}
              className="px-4 py-2 hover:bg-hover-bg cursor-pointer text-sm text-text-primary border-b last:border-0 border-border-subtle transition-colors"
            >
              {item.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
