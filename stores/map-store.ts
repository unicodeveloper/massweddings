import { create } from "zustand";
import type { ChoroplethLayer, MapViewport } from "@/types";

/** Framed on Nigeria — this map never leaves the country. */
export const NIGERIA_VIEWPORT: MapViewport = {
  longitude: 8.3,
  latitude: 9.3,
  zoom: 5.4,
  bearing: 0,
  pitch: 0,
};

/** Pulled back and tilted, so Nigeria sits on a visible curve. */
export const GLOBE_VIEWPORT: MapViewport = {
  longitude: 8.3,
  latitude: 9.3,
  zoom: 3.4,
  bearing: 0,
  pitch: 25,
};

/** Hard bounds so panning cannot wander off into the Atlantic. */
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [
  [-1.5, 1.0],
  [18.0, 17.0],
];

export type Projection = "mercator" | "globe";

interface MapState {
  viewport: MapViewport;
  choropleth: ChoroplethLayer;
  showBubbles: boolean;
  showLabels: boolean;
  hoveredState: string | null;
  projection: Projection;

  setViewport: (viewport: Partial<MapViewport>) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
  resetView: () => void;
  setChoropleth: (layer: ChoroplethLayer) => void;
  setProjection: (projection: Projection) => void;
  toggleBubbles: () => void;
  toggleLabels: () => void;
  setHoveredState: (state: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: NIGERIA_VIEWPORT,
  choropleth: "poverty",
  showBubbles: true,
  showLabels: true,
  hoveredState: null,
  // Flat by default: for one country at this zoom the globe curves the frame
  // without adding information. The toggle is there for the wider-context view.
  projection: "mercator",

  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  flyTo: (longitude, latitude, zoom = 7.5) =>
    set((state) => ({ viewport: { ...state.viewport, longitude, latitude, zoom } })),

  resetView: () =>
    set((state) => ({
      viewport: state.projection === "globe" ? GLOBE_VIEWPORT : NIGERIA_VIEWPORT,
    })),

  // The globe needs room around the country to read as a sphere, so switching
  // projection also pulls the camera back and tilts it.
  setProjection: (projection) =>
    set({
      projection,
      viewport: projection === "globe" ? GLOBE_VIEWPORT : NIGERIA_VIEWPORT,
    }),
  setChoropleth: (choropleth) => set({ choropleth }),
  toggleBubbles: () => set((state) => ({ showBubbles: !state.showBubbles })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  setHoveredState: (hoveredState) => set({ hoveredState }),
}));
