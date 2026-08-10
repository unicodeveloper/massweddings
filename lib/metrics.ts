import type { ChoroplethLayer, WeddingEvent } from "@/types";
import { STATE_PROFILES, type StateProfile } from "./state-data";

export interface StateMetrics {
  state: string;
  profile: StateProfile;
  editions: number;
  couples: number;
  spendNaira: number;
  lastYear: number | null;
}

/** Per-state totals for whatever slice of events is currently in view. */
export function computeStateMetrics(events: WeddingEvent[]): Map<string, StateMetrics> {
  const metrics = new Map<string, StateMetrics>();

  for (const profile of STATE_PROFILES) {
    metrics.set(profile.name, {
      state: profile.name,
      profile,
      editions: 0,
      couples: 0,
      spendNaira: 0,
      lastYear: null,
    });
  }

  for (const event of events) {
    const entry = metrics.get(event.state);
    if (!entry) continue;
    entry.editions += 1;
    entry.couples += event.couples ?? 0;
    entry.spendNaira += event.costNaira ?? 0;
    entry.lastYear = Math.max(entry.lastYear ?? 0, event.year);
  }

  return metrics;
}

/** The value a given choropleth layer paints. Null means "no data" — rendered grey. */
export function metricValue(layer: ChoroplethLayer, metrics: StateMetrics): number | null {
  switch (layer) {
    case "weddings":
      return metrics.editions;
    case "poverty":
      return metrics.profile.povertyHeadcount;
    case "marriageAge":
      return metrics.profile.medianAgeAtFirstMarriage;
    case "electricity":
      return metrics.profile.householdsWithElectricity;
    case "population":
      return metrics.profile.population;
    case "allocation":
      return metrics.profile.faacAllocationNairaBn;
    case "none":
    default:
      return null;
  }
}

/**
 * Colour ramps, low to high. Each layer gets its own hue family so switching
 * layers reads as a different variable rather than a redrawn version of the same one.
 */
export const RAMPS: Record<Exclude<ChoroplethLayer, "none">, string[]> = {
  weddings: ["#1e293b", "#7c2d12", "#c2410c", "#ea580c", "#f97316", "#fb923c"],
  poverty: ["#1e293b", "#713f12", "#a16207", "#ca8a04", "#eab308", "#fde047"],
  // Reversed in effect: the lowest marriage ages are the ones worth seeing, so
  // the darkest end of this ramp lands on the youngest.
  marriageAge: ["#f472b6", "#db2777", "#9d174d", "#6b21a8", "#4c1d95", "#1e293b"],
  electricity: ["#1e293b", "#3b0764", "#6b21a8", "#7e22ce", "#a855f7", "#d8b4fe"],
  population: ["#1e293b", "#164e63", "#0e7490", "#0891b2", "#06b6d4", "#67e8f9"],
  allocation: ["#1e293b", "#14532d", "#166534", "#15803d", "#22c55e", "#4ade80"],
};

export const NO_DATA_COLOUR = "#1f2430";

export interface Scale {
  /** Ascending breakpoints, one per ramp colour after the first. */
  stops: number[];
  colours: string[];
  min: number;
  max: number;
}

/**
 * Quantile breaks rather than equal intervals. Nigerian state data is heavily
 * skewed — Lagos and Kano flatten everything else on a linear scale.
 */
export function buildScale(values: number[], layer: Exclude<ChoroplethLayer, "none">): Scale {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  const colours = RAMPS[layer];

  if (sorted.length === 0) {
    return { stops: [], colours, min: 0, max: 0 };
  }

  const stops: number[] = [];
  for (let i = 1; i < colours.length; i++) {
    const quantile = sorted[Math.floor((i / colours.length) * (sorted.length - 1))];
    // Mapbox rejects non-ascending step inputs, so nudge past any duplicate.
    const previous = stops[stops.length - 1];
    stops.push(previous !== undefined && quantile <= previous ? previous + 1e-6 : quantile);
  }

  return { stops, colours, min: sorted[0], max: sorted[sorted.length - 1] };
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-NG");
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}bn`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString("en-NG");
}

/** Naira, abbreviated the way Nigerian papers write it: ₦854m, ₦1.5bn. */
export function formatNaira(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "—";
  if (Math.abs(value) >= 1_000_000_000_000) return `₦${(value / 1_000_000_000_000).toFixed(2)}tn`;
  if (Math.abs(value) >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}bn`;
  if (Math.abs(value) >= 1_000_000) return `₦${Math.round(value / 1_000_000)}m`;
  if (Math.abs(value) >= 1_000) return `₦${Math.round(value / 1_000)}k`;
  return `₦${value.toLocaleString("en-NG")}`;
}

export function formatMetric(layer: ChoroplethLayer, value: number | null): string {
  if (value === null) return "no data";
  switch (layer) {
    case "poverty":
    case "electricity":
      return `${value.toFixed(1)}%`;
    case "marriageAge":
      return `${value.toFixed(1)} yrs`;
    case "population":
      return formatCompact(value);
    case "allocation":
      return `₦${value.toFixed(1)}bn`;
    case "weddings":
      return `${value}`;
    default:
      return formatNumber(value);
  }
}

/** Date formatting that respects how precisely the ceremony was actually dated. */
export function formatEventDate(date: string, precision: "day" | "month" | "year"): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  if (precision === "year") return String(parsed.getUTCFullYear());
  if (precision === "month") {
    return parsed.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
