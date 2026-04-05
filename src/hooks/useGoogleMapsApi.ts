import { useEffect, useState } from "react";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-javascript-api";
const GOOGLE_MAPS_LIBRARIES = ["places", "marker"] as const;
const GOOGLE_MAPS_CALLBACK_NAME = "__initGoogleMapsApi";

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is only available in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error(
        "Missing Google Maps environment variable. Check VITE_GOOGLE_MAPS_API_KEY.",
      ),
    );
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const finishLoading = () => {
      if (window.google?.maps?.Map) {
        resolve();
        return;
      }

      reject(new Error("Google Maps API loaded without the Map constructor."));
    };

    window[GOOGLE_MAPS_CALLBACK_NAME] = () => {
      finishLoading();
      delete window[GOOGLE_MAPS_CALLBACK_NAME];
    };

    if (existingScript) {
      if (window.google?.maps?.Map) {
        finishLoading();
        return;
      }

      existingScript.addEventListener("load", finishLoading, { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          delete window[GOOGLE_MAPS_CALLBACK_NAME];
          reject(new Error("Failed to load Google Maps script."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=${GOOGLE_MAPS_LIBRARIES.join(",")}` +
      `&language=pt-BR&region=BR&loading=async&callback=${GOOGLE_MAPS_CALLBACK_NAME}`;
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps script."));

    document.head.appendChild(script);
  }).catch((error) => {
    delete window[GOOGLE_MAPS_CALLBACK_NAME];
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise;
}

export function useGoogleMapsApi() {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== "undefined" && Boolean(window.google?.maps),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!isMounted) return;
        setIsLoaded(true);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (!isMounted) return;
        setError(loadError.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoaded, error };
}
