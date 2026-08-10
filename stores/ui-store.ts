import { create } from "zustand";

/** The panels available in the sidebar, and on mobile in the bottom nav. */
export type PanelTab = "regions" | "states" | "ceremonies" | "live" | "intel";

interface UiState {
  /** Which sidebar panel is showing. Shared so the mobile nav can drive it. */
  panelTab: PanelTab;
  /**
   * On phones the map and the panels compete for the same space, so only one is
   * mounted at a time. Ignored from `md` up, where both are visible.
   */
  mobileView: "map" | "panel";

  setPanelTab: (tab: PanelTab) => void;
  showMap: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  panelTab: "regions",
  mobileView: "map",

  // Picking a panel on mobile implies switching away from the map.
  setPanelTab: (panelTab) => set({ panelTab, mobileView: "panel" }),
  showMap: () => set({ mobileView: "map" }),
}));
