import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Store {
  page: string;
  activeFilters: {
    types: string[];
    status: string[];
  };
  isLoading: boolean;
  mapZoom: number;
  mapCenter: [number, number];
  selectedMarkerId: string | null;
  setPage: (page: string) => void;
  setSelectedMarkerId: (id: string | null) => void;
  setMapLocation: (coords: [number, number], zoomLevel: number) => void;
  toggleFilter: (type: "types" | "status", value: string) => void;
  clearFilters: () => void;
}

const useStore = create<Store>()(
  devtools(
    (set) => ({
      page: "Dashboard",
      activeFilters: {
        types: [],
        status: [],
      },
      isLoading: false,
      mapZoom: 11,
      mapCenter: [-23.5505, -46.6333],
      selectedMarkerId: null,

      setPage: (page) =>
        set(
          {
            page,
          },
          false,
          "setPage",
        ),

      setSelectedMarkerId: (id) =>
        set(
          {
            selectedMarkerId: id,
          },
          false,
          "setSelectedMarkerId",
        ),

      setMapLocation: (coords, zoomLevel) =>
        set({ mapCenter: coords, mapZoom: zoomLevel }, false, "setMapLocation"),

      toggleFilter: (type, value) =>
        set(
          (state) => {
            const currentList = state.activeFilters[type];
            const isSelected = currentList.includes(value);

            return {
              activeFilters: {
                ...state.activeFilters,
                [type]: isSelected
                  ? currentList.filter((item) => item !== value)
                  : [...currentList, value],
              },
            };
          },
          false,
          "toggleFilter",
        ),

      clearFilters: () =>
        set(
          {
            activeFilters: { types: [], status: [] },
          },
          false,
          "clearFilters",
        ),
    }),
    { name: "useStore" },
  ),
);

export default useStore;
