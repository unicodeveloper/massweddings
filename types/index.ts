import { z } from "zod";

/** Who paid for / organised the ceremony. */
export const SponsorType = z.enum([
  "state-government",
  "hisbah",
  "federal",
  "lga",
  "emirate",
  "philanthropist",
  "ngo",
  "religious-body",
  "unknown",
]);
export type SponsorType = z.infer<typeof SponsorType>;

/** Who the couples were drawn from — the programmes target specific groups. */
export const BeneficiaryGroup = z.enum([
  "low-income",
  "widows",
  "divorcees",
  "orphans",
  "displaced",
  "disabled",
  "students",
  "mixed",
  "unknown",
]);
export type BeneficiaryGroup = z.infer<typeof BeneficiaryGroup>;

export const GeoLocation = z.object({
  latitude: z.number(),
  longitude: z.number(),
  placeName: z.string().optional(),
  state: z.string(),
  /** Precision of the coordinate we plotted: a named town, or the state capital as a stand-in. */
  precision: z.enum(["city", "state"]).default("state"),
});
export type GeoLocation = z.infer<typeof GeoLocation>;

export const WeddingSource = z.object({
  title: z.string(),
  url: z.string(),
  outlet: z.string().optional(),
});
export type WeddingSource = z.infer<typeof WeddingSource>;

/**
 * One mass wedding edition — a single ceremony (or a single announced programme)
 * in one state at one point in time. Multiple articles collapse into one edition.
 */
export const WeddingEvent = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  state: z.string(),
  city: z.string().optional(),
  location: GeoLocation,
  /** ISO date. Day precision when reported, otherwise the 1st of the month/year. */
  date: z.string(),
  datePrecision: z.enum(["day", "month", "year"]),
  year: z.number(),
  couples: z.number().nullable(),
  /** Reported public spend in naira (absolute, not millions). */
  costNaira: z.number().nullable(),
  /** Reported dowry paid per bride, in naira. */
  dowryPerBrideNaira: z.number().nullable(),
  sponsor: z.string(),
  sponsorType: SponsorType,
  beneficiaries: BeneficiaryGroup,
  /** True when the ceremony happened; false when it was only announced/planned. */
  held: z.boolean(),
  edition: z.string().optional(),
  sources: z.array(WeddingSource),
  /** How this record entered the dataset. */
  via: z.enum(["article", "roundup"]),
  confidence: z.enum(["high", "medium", "low"]),
});
export type WeddingEvent = z.infer<typeof WeddingEvent>;

export const WeddingDataset = z.object({
  events: z.array(WeddingEvent),
  builtAt: z.string(),
  stats: z.object({
    articlesScanned: z.number(),
    articlesMatched: z.number(),
    editions: z.number(),
    statesCovered: z.number(),
    totalCouples: z.number(),
  }),
});
export type WeddingDataset = z.infer<typeof WeddingDataset>;

/** A Valyu-sourced socioeconomic figure. `value` is null when nothing could be sourced. */
export const SourcedFigure = z.object({
  value: z.number().nullable(),
  unit: z.string().optional(),
  asOf: z.string().optional(),
  sourceUrl: z.string().optional(),
  note: z.string().optional(),
});
export type SourcedFigure = z.infer<typeof SourcedFigure>;

export const StateContext = z.object({
  state: z.string(),
  povertyHeadcount: SourcedFigure,
  faacAllocation: SourcedFigure,
  outOfSchoolChildren: SourcedFigure,
  updatedAt: z.string(),
});
export type StateContext = z.infer<typeof StateContext>;

export interface MapViewport {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

/** Which variable paints the state polygons. */
export type ChoroplethLayer =
  | "none"
  | "weddings"
  | "poverty"
  | "marriageAge"
  | "electricity"
  | "population"
  | "allocation";

export const choroplethLabels: Record<ChoroplethLayer, string> = {
  none: "No fill",
  weddings: "Mass weddings held",
  poverty: "Multidimensional poverty",
  marriageAge: "Age at first marriage",
  electricity: "Households with electricity",
  population: "Population",
  allocation: "FAAC allocation",
};

/** The vintage of each context layer, shown next to its name so nothing is undated. */
export const choroplethVintages: Partial<Record<ChoroplethLayer, string>> = {
  poverty: "2021",
  marriageAge: "2024",
  electricity: "2024",
  population: "2022",
  allocation: "2024",
};

export const sponsorColors: Record<SponsorType, string> = {
  "state-government": "#22d3ee",
  hisbah: "#a78bfa",
  federal: "#34d399",
  lga: "#facc15",
  emirate: "#fb923c",
  philanthropist: "#f472b6",
  ngo: "#60a5fa",
  "religious-body": "#c084fc",
  unknown: "#94a3b8",
};

export const sponsorLabels: Record<SponsorType, string> = {
  "state-government": "State government",
  hisbah: "Hisbah board",
  federal: "Federal agency",
  lga: "Local government",
  emirate: "Emirate council",
  philanthropist: "Philanthropist",
  ngo: "NGO",
  "religious-body": "Religious body",
  unknown: "Unattributed",
};

export const beneficiaryLabels: Record<BeneficiaryGroup, string> = {
  "low-income": "Low-income couples",
  widows: "Widows",
  divorcees: "Divorcees",
  orphans: "Orphans",
  displaced: "Displaced persons",
  disabled: "Persons with disabilities",
  students: "Students",
  mixed: "Mixed groups",
  unknown: "Unspecified",
};
