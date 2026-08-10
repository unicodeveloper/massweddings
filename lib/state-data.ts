import reference from "@/data/state-reference.json";
import faac from "@/data/state-faac.json";
import dhs from "@/data/state-dhs.json";
import { NIGERIAN_STATES, resolveState, type GeopoliticalZone, type NigerianState } from "./nigeria";
import type { WeddingEvent } from "@/types";

/**
 * Everything we know about a state: structural facts from lib/nigeria.ts,
 * official population and poverty figures from data/state-reference.json,
 * and the sourced FAAC figure where one exists.
 */
export interface StateProfile extends NigerianState {
  population: number | null;
  populationFemale: number | null;
  /** Women aged 15–29 — the cohort these programmes actually draw from. */
  marriageAgeWomen: number | null;
  populationYear: number;
  densityPerKm2: number | null;
  /** % of the population that is multidimensionally poor (OPHI, MICS 2021). */
  povertyHeadcount: number | null;
  povertyIntensity: number | null;
  severePoverty: number | null;
  mpi: number | null;
  /** Naira billions received from the Federation Account. Null when unsourced. */
  faacAllocationNairaBn: number | null;
  faacSourceUrl: string | null;
  faacYear: number;
  /** Naira received per resident — the fairer comparison across state sizes. */
  faacPerCapitaNaira: number | null;
  /** Median age at first marriage, women 25–49 (NDHS 2023–24). */
  medianAgeAtFirstMarriage: number | null;
  /** Households with electricity, % (NDHS 2023–24). */
  householdsWithElectricity: number | null;
  /** Women who are literate, % (NDHS 2023–24). */
  womenLiterate: number | null;
  womenSecondaryEducation: number | null;
}

interface ReferenceRow {
  state: string;
  population: number | null;
  populationFemale: number | null;
  marriageAgeWomen: number | null;
  populationYear: number;
  povertyHeadcount?: number | null;
  povertyIntensity?: number | null;
  severePoverty?: number | null;
  mpi?: number | null;
}

interface FaacRow {
  state: string;
  allocationNairaBillion: number;
  sourceUrl: string;
}

const referenceByState = new Map<string, ReferenceRow>(
  (reference.states as ReferenceRow[]).map((row) => [
    resolveState(row.state)?.name ?? row.state,
    row,
  ])
);

const faacByState = new Map<string, FaacRow>(
  (faac.allocations as FaacRow[]).map((row) => [resolveState(row.state)?.name ?? row.state, row])
);

interface DhsRow {
  name: string;
  medianAgeAtFirstMarriage?: number;
  householdsWithElectricity?: number;
  womenLiterate?: number;
  womenSecondaryEducation?: number;
}

const dhsByState = new Map<string, DhsRow>(
  (dhs.states as DhsRow[]).map((row) => [resolveState(row.name)?.name ?? row.name, row])
);

export const STATE_PROFILES: StateProfile[] = NIGERIAN_STATES.map((state) => {
  const ref = referenceByState.get(state.name);
  const allocation = faacByState.get(state.name);
  const survey = dhsByState.get(state.name);

  const population = ref?.population ?? null;
  const allocationNaira = allocation ? allocation.allocationNairaBillion * 1_000_000_000 : null;

  return {
    ...state,
    population,
    populationFemale: ref?.populationFemale ?? null,
    marriageAgeWomen: ref?.marriageAgeWomen ?? null,
    populationYear: ref?.populationYear ?? 2022,
    densityPerKm2: population ? Math.round(population / state.areaKm2) : null,
    povertyHeadcount: ref?.povertyHeadcount ?? null,
    povertyIntensity: ref?.povertyIntensity ?? null,
    severePoverty: ref?.severePoverty ?? null,
    mpi: ref?.mpi ?? null,
    faacAllocationNairaBn: allocation?.allocationNairaBillion ?? null,
    faacSourceUrl: allocation?.sourceUrl ?? null,
    faacYear: faac.year,
    faacPerCapitaNaira:
      allocationNaira && population ? Math.round(allocationNaira / population) : null,
    medianAgeAtFirstMarriage: survey?.medianAgeAtFirstMarriage ?? null,
    householdsWithElectricity: survey?.householdsWithElectricity ?? null,
    womenLiterate: survey?.womenLiterate ?? null,
    womenSecondaryEducation: survey?.womenSecondaryEducation ?? null,
  };
});

const profileByState = new Map(STATE_PROFILES.map((profile) => [profile.name, profile]));

export function getStateProfile(name: string): StateProfile | null {
  const resolved = resolveState(name);
  return resolved ? profileByState.get(resolved.name) ?? null : null;
}

export const DATA_SOURCES = reference.sources;
export const NATIONAL = reference.national;
export const DHS_META = dhs.survey;
export const FAAC_META = {
  year: faac.year,
  method: faac.method,
  caveat: faac.caveat,
  builtAt: faac.builtAt,
};

/**
 * The six geopolitical zones, in the order Nigerians usually list them.
 * "Middle Belt" is the everyday name for the North Central zone, so it is shown
 * alongside rather than instead of the formal label.
 */
export const ZONES: Array<{ zone: GeopoliticalZone; label: string; colour: string }> = [
  { zone: "North West", label: "North West", colour: "#f97316" },
  { zone: "North East", label: "North East", colour: "#ef4444" },
  { zone: "North Central", label: "North Central · Middle Belt", colour: "#eab308" },
  { zone: "South West", label: "South West", colour: "#22d3ee" },
  { zone: "South East", label: "South East", colour: "#a78bfa" },
  { zone: "South South", label: "South South", colour: "#34d399" },
];

export interface ZoneSummary {
  zone: GeopoliticalZone;
  label: string;
  colour: string;
  editions: number;
  couples: number;
  states: number;
  statesWithEditions: number;
  population: number;
  /** Editions per 10 million residents, so zone size does not distort the comparison. */
  editionsPer10m: number;
  couplesPerMillion: number;
  averagePoverty: number | null;
  spendNaira: number;
}

/** Roll the dataset up by geopolitical zone — the shape of the disparity. */
export function summariseByZone(events: WeddingEvent[]): ZoneSummary[] {
  return ZONES.map(({ zone, label, colour }) => {
    const states = STATE_PROFILES.filter((profile) => profile.zone === zone);
    const zoneEvents = events.filter((event) => {
      const profile = getStateProfile(event.state);
      return profile?.zone === zone;
    });

    const population = states.reduce((sum, state) => sum + (state.population ?? 0), 0);
    const couples = zoneEvents.reduce((sum, event) => sum + (event.couples ?? 0), 0);
    const povertyValues = states
      .map((state) => state.povertyHeadcount)
      .filter((value): value is number => value !== null);

    return {
      zone,
      label,
      colour,
      editions: zoneEvents.length,
      couples,
      states: states.length,
      statesWithEditions: new Set(zoneEvents.map((event) => event.state)).size,
      population,
      editionsPer10m: population ? (zoneEvents.length / population) * 10_000_000 : 0,
      couplesPerMillion: population ? (couples / population) * 1_000_000 : 0,
      averagePoverty: povertyValues.length
        ? povertyValues.reduce((sum, value) => sum + value, 0) / povertyValues.length
        : null,
      spendNaira: zoneEvents.reduce((sum, event) => sum + (event.costNaira ?? 0), 0),
    };
  });
}

export interface StateSummary {
  state: string;
  profile: StateProfile;
  editions: number;
  couples: number;
  years: number[];
  spendNaira: number;
  /** Couples married per 100,000 women aged 15–29. */
  couplesPer100kMarriageAge: number | null;
}

/** Per-state rollup, sorted by how many editions the state has run. */
export function summariseByState(events: WeddingEvent[]): StateSummary[] {
  return STATE_PROFILES.map((profile) => {
    const stateEvents = events.filter((event) => event.state === profile.name);
    const couples = stateEvents.reduce((sum, event) => sum + (event.couples ?? 0), 0);

    return {
      state: profile.name,
      profile,
      editions: stateEvents.length,
      couples,
      years: [...new Set(stateEvents.map((event) => event.year))].sort(),
      spendNaira: stateEvents.reduce((sum, event) => sum + (event.costNaira ?? 0), 0),
      couplesPer100kMarriageAge:
        profile.marriageAgeWomen && couples
          ? (couples / profile.marriageAgeWomen) * 100_000
          : null,
    };
  }).sort((a, b) => b.editions - a.editions || b.couples - a.couples);
}

/**
 * Pearson correlation between a state's poverty rate and its programme activity.
 * Reported with n so it can be read honestly — this is a descriptive statistic
 * over 37 states, not a causal claim.
 */
export function povertyCorrelation(
  events: WeddingEvent[],
  metric: "editions" | "couples" = "editions"
): { r: number; n: number } | null {
  const points = summariseByState(events)
    .filter((summary) => summary.profile.povertyHeadcount !== null)
    .map((summary) => ({
      x: summary.profile.povertyHeadcount as number,
      y: metric === "editions" ? summary.editions : summary.couples,
    }));

  if (points.length < 3) return null;

  const n = points.length;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  if (varianceX === 0 || varianceY === 0) return null;
  return { r: covariance / Math.sqrt(varianceX * varianceY), n };
}
