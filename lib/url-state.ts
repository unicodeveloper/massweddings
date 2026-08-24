import { choroplethLabels, type ChoroplethLayer } from "@/types";
import type { Projection } from "@/stores/map-store";
import type { PanelTab } from "@/stores/ui-store";
import { FIRST_YEAR, LAST_YEAR } from "@/lib/window";

const PANEL_TABS: PanelTab[] = ["regions", "states", "ceremonies", "live", "intel"];
const CHOROPLETH_LAYERS = Object.keys(choroplethLabels) as ChoroplethLayer[];

/** The slice of app state a URL can capture — the "core view" the user can share. */
export interface ViewState {
  choropleth: ChoroplethLayer;
  projection: Projection;
  selectedState: string | null;
  yearRange: [number, number] | null;
  panelTab: PanelTab;
}

const DEFAULTS = {
  choropleth: "poverty" as ChoroplethLayer,
  projection: "mercator" as Projection,
  panelTab: "regions" as PanelTab,
};

/** Only ever writes a param when it differs from its store default, so the default view has no query string. */
export function encodeViewState(state: ViewState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.choropleth !== DEFAULTS.choropleth) params.set("layer", state.choropleth);
  if (state.projection !== DEFAULTS.projection) params.set("proj", state.projection);
  if (state.selectedState) params.set("state", state.selectedState);
  if (state.yearRange) params.set("years", `${state.yearRange[0]}-${state.yearRange[1]}`);
  if (state.panelTab !== DEFAULTS.panelTab) params.set("panel", state.panelTab);

  return params;
}

/** Validates every field against a whitelist so a hand-edited or stale URL can never put a store into a bad state. */
export function decodeViewState(params: URLSearchParams): Partial<ViewState> {
  const result: Partial<ViewState> = {};

  const layer = params.get("layer");
  if (layer && CHOROPLETH_LAYERS.includes(layer as ChoroplethLayer)) {
    result.choropleth = layer as ChoroplethLayer;
  }

  const proj = params.get("proj");
  if (proj === "globe" || proj === "mercator") {
    result.projection = proj;
  }

  const state = params.get("state");
  if (state) result.selectedState = state;

  const years = params.get("years");
  if (years) {
    const [fromRaw, toRaw] = years.split("-");
    const from = Number.parseInt(fromRaw, 10);
    const to = Number.parseInt(toRaw, 10);
    if (Number.isFinite(from) && Number.isFinite(to)) {
      result.yearRange = [
        Math.min(Math.max(from, FIRST_YEAR), LAST_YEAR),
        Math.min(Math.max(to, FIRST_YEAR), LAST_YEAR),
      ];
    }
  }

  const panel = params.get("panel");
  if (panel && PANEL_TABS.includes(panel as PanelTab)) {
    result.panelTab = panel as PanelTab;
  }

  return result;
}
