/**
 * Structural facts about Nigeria's 36 states + the FCT.
 *
 * Only stable, checkable values live here: land area, the 2006 census count
 * (the last completed national census), the capital and its coordinates, and the
 * geopolitical zone. Everything that moves — poverty rates, FAAC allocations,
 * out-of-school numbers — is sourced live through Valyu and cached separately,
 * so nothing on the map is a number we invented. See lib/state-context.ts.
 */

export type GeopoliticalZone =
  | "North West"
  | "North East"
  | "North Central"
  | "South West"
  | "South East"
  | "South South";

export interface NigerianState {
  name: string;
  /** ISO 3166-2:NG code. */
  iso: string;
  capital: string;
  zone: GeopoliticalZone;
  /** Land area in km². */
  areaKm2: number;
  /** 2006 national census population. */
  population2006: number;
  /** Capital city coordinates, used as the fallback pin for the state. */
  lat: number;
  lng: number;
  /** Shari'a penal code adopted from 1999–2001. Relevant: Hisbah boards run many of these programmes. */
  shariaState: boolean;
}

/** NPC's standard national growth assumption, used for inter-censal projections. */
export const ANNUAL_GROWTH_RATE = 0.026;
export const CENSUS_YEAR = 2006;

export const NIGERIAN_STATES: NigerianState[] = [
  // North West
  { name: "Jigawa", iso: "NG-JI", capital: "Dutse", zone: "North West", areaKm2: 23154, population2006: 4361002, lat: 11.7566, lng: 9.3390, shariaState: true },
  { name: "Kaduna", iso: "NG-KD", capital: "Kaduna", zone: "North West", areaKm2: 46053, population2006: 6113503, lat: 10.5222, lng: 7.4383, shariaState: true },
  { name: "Kano", iso: "NG-KN", capital: "Kano", zone: "North West", areaKm2: 20131, population2006: 9401288, lat: 12.0022, lng: 8.5920, shariaState: true },
  { name: "Katsina", iso: "NG-KT", capital: "Katsina", zone: "North West", areaKm2: 24192, population2006: 5801584, lat: 12.9908, lng: 7.6018, shariaState: true },
  { name: "Kebbi", iso: "NG-KE", capital: "Birnin Kebbi", zone: "North West", areaKm2: 36800, population2006: 3256541, lat: 12.4539, lng: 4.1975, shariaState: true },
  { name: "Sokoto", iso: "NG-SO", capital: "Sokoto", zone: "North West", areaKm2: 25973, population2006: 3696999, lat: 13.0059, lng: 5.2476, shariaState: true },
  { name: "Zamfara", iso: "NG-ZA", capital: "Gusau", zone: "North West", areaKm2: 39762, population2006: 3259846, lat: 12.1628, lng: 6.6641, shariaState: true },

  // North East
  { name: "Adamawa", iso: "NG-AD", capital: "Yola", zone: "North East", areaKm2: 36917, population2006: 3168101, lat: 9.2035, lng: 12.4954, shariaState: false },
  { name: "Bauchi", iso: "NG-BA", capital: "Bauchi", zone: "North East", areaKm2: 45893, population2006: 4676465, lat: 10.3158, lng: 9.8442, shariaState: true },
  { name: "Borno", iso: "NG-BO", capital: "Maiduguri", zone: "North East", areaKm2: 70898, population2006: 4171104, lat: 11.8311, lng: 13.1510, shariaState: true },
  { name: "Gombe", iso: "NG-GO", capital: "Gombe", zone: "North East", areaKm2: 18768, population2006: 2353879, lat: 10.2897, lng: 11.1673, shariaState: true },
  { name: "Taraba", iso: "NG-TA", capital: "Jalingo", zone: "North East", areaKm2: 54473, population2006: 2300736, lat: 8.8940, lng: 11.3661, shariaState: false },
  { name: "Yobe", iso: "NG-YO", capital: "Damaturu", zone: "North East", areaKm2: 45502, population2006: 2321591, lat: 11.7479, lng: 11.9608, shariaState: true },

  // North Central
  { name: "Benue", iso: "NG-BE", capital: "Makurdi", zone: "North Central", areaKm2: 34059, population2006: 4253641, lat: 7.7322, lng: 8.5391, shariaState: false },
  { name: "Federal Capital Territory", iso: "NG-FC", capital: "Abuja", zone: "North Central", areaKm2: 7315, population2006: 1406239, lat: 9.0765, lng: 7.3986, shariaState: false },
  { name: "Kogi", iso: "NG-KO", capital: "Lokoja", zone: "North Central", areaKm2: 29833, population2006: 3314043, lat: 7.8023, lng: 6.7333, shariaState: false },
  { name: "Kwara", iso: "NG-KW", capital: "Ilorin", zone: "North Central", areaKm2: 36825, population2006: 2371089, lat: 8.4966, lng: 4.5421, shariaState: false },
  { name: "Nasarawa", iso: "NG-NA", capital: "Lafia", zone: "North Central", areaKm2: 27117, population2006: 1869377, lat: 8.4939, lng: 8.5157, shariaState: false },
  { name: "Niger", iso: "NG-NI", capital: "Minna", zone: "North Central", areaKm2: 76363, population2006: 3950249, lat: 9.6139, lng: 6.5569, shariaState: true },
  { name: "Plateau", iso: "NG-PL", capital: "Jos", zone: "North Central", areaKm2: 30913, population2006: 3178712, lat: 9.8965, lng: 8.8583, shariaState: false },

  // South West
  { name: "Ekiti", iso: "NG-EK", capital: "Ado-Ekiti", zone: "South West", areaKm2: 6353, population2006: 2384212, lat: 7.6211, lng: 5.2214, shariaState: false },
  { name: "Lagos", iso: "NG-LA", capital: "Ikeja", zone: "South West", areaKm2: 3345, population2006: 9113605, lat: 6.6018, lng: 3.3515, shariaState: false },
  { name: "Ogun", iso: "NG-OG", capital: "Abeokuta", zone: "South West", areaKm2: 16762, population2006: 3728098, lat: 7.1557, lng: 3.3451, shariaState: false },
  { name: "Ondo", iso: "NG-ON", capital: "Akure", zone: "South West", areaKm2: 15500, population2006: 3441024, lat: 7.2571, lng: 5.2058, shariaState: false },
  { name: "Osun", iso: "NG-OS", capital: "Osogbo", zone: "South West", areaKm2: 9251, population2006: 3423535, lat: 7.7827, lng: 4.5418, shariaState: false },
  { name: "Oyo", iso: "NG-OY", capital: "Ibadan", zone: "South West", areaKm2: 28454, population2006: 5591589, lat: 7.3775, lng: 3.9470, shariaState: false },

  // South East
  { name: "Abia", iso: "NG-AB", capital: "Umuahia", zone: "South East", areaKm2: 6320, population2006: 2833999, lat: 5.5250, lng: 7.4940, shariaState: false },
  { name: "Anambra", iso: "NG-AN", capital: "Awka", zone: "South East", areaKm2: 4844, population2006: 4177828, lat: 6.2109, lng: 7.0722, shariaState: false },
  { name: "Ebonyi", iso: "NG-EB", capital: "Abakaliki", zone: "South East", areaKm2: 5670, population2006: 2176947, lat: 6.3249, lng: 8.1137, shariaState: false },
  { name: "Enugu", iso: "NG-EN", capital: "Enugu", zone: "South East", areaKm2: 7161, population2006: 3257298, lat: 6.4584, lng: 7.5464, shariaState: false },
  { name: "Imo", iso: "NG-IM", capital: "Owerri", zone: "South East", areaKm2: 5530, population2006: 3934899, lat: 5.4836, lng: 7.0333, shariaState: false },

  // South South
  { name: "Akwa Ibom", iso: "NG-AK", capital: "Uyo", zone: "South South", areaKm2: 7081, population2006: 3920208, lat: 5.0377, lng: 7.9128, shariaState: false },
  { name: "Bayelsa", iso: "NG-BY", capital: "Yenagoa", zone: "South South", areaKm2: 10773, population2006: 1704515, lat: 4.9247, lng: 6.2642, shariaState: false },
  { name: "Cross River", iso: "NG-CR", capital: "Calabar", zone: "South South", areaKm2: 20156, population2006: 2888966, lat: 4.9757, lng: 8.3417, shariaState: false },
  { name: "Delta", iso: "NG-DE", capital: "Asaba", zone: "South South", areaKm2: 17698, population2006: 4098391, lat: 6.1980, lng: 6.7280, shariaState: false },
  { name: "Edo", iso: "NG-ED", capital: "Benin City", zone: "South South", areaKm2: 17802, population2006: 3218332, lat: 6.3350, lng: 5.6037, shariaState: false },
  { name: "Rivers", iso: "NG-RI", capital: "Port Harcourt", zone: "South South", areaKm2: 11077, population2006: 5198716, lat: 4.8156, lng: 7.0498, shariaState: false },
];

export const NORTHERN_ZONES: GeopoliticalZone[] = ["North West", "North East", "North Central"];

export function isNorthern(state: NigerianState): boolean {
  return NORTHERN_ZONES.includes(state.zone);
}

/** Project the 2006 census forward at the NPC growth rate. */
export function projectedPopulation(state: NigerianState, year = new Date().getFullYear()): number {
  return Math.round(
    state.population2006 * Math.pow(1 + ANNUAL_GROWTH_RATE, year - CENSUS_YEAR)
  );
}

/** People per km², using the projected population. */
export function populationDensity(state: NigerianState, year = new Date().getFullYear()): number {
  return Math.round(projectedPopulation(state, year) / state.areaKm2);
}

/**
 * Names as they appear in news copy, the boundary file, and everyday use,
 * mapped to our canonical state name.
 */
const STATE_ALIASES: Record<string, string> = {
  fct: "Federal Capital Territory",
  "f.c.t": "Federal Capital Territory",
  "f.c.t.": "Federal Capital Territory",
  abuja: "Federal Capital Territory",
  "abuja federal capital territory": "Federal Capital Territory",
  "federal capital territory abuja": "Federal Capital Territory",
  "fct abuja": "Federal Capital Territory",
  nassarawa: "Nasarawa",
  "akwa-ibom": "Akwa Ibom",
  akwaibom: "Akwa Ibom",
  "cross-river": "Cross River",
  crossriver: "Cross River",
  "zamfara state": "Zamfara",
  bornu: "Borno",
  "birnin kebbi": "Kebbi",
};

const STATE_BY_KEY = new Map<string, NigerianState>();
for (const state of NIGERIAN_STATES) {
  STATE_BY_KEY.set(state.name.toLowerCase(), state);
  STATE_BY_KEY.set(state.iso.toLowerCase(), state);
}

/** Resolve any spelling of a state name to the canonical record. */
export function resolveState(input?: string | null): NigerianState | null {
  if (!input) return null;
  let key = input
    .toLowerCase()
    .replace(/\bstate\b/g, "")
    .replace(/[^a-z\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (STATE_ALIASES[key]) key = STATE_ALIASES[key].toLowerCase();
  return STATE_BY_KEY.get(key) ?? null;
}

/**
 * Towns and LGA headquarters that turn up in mass wedding coverage.
 * Lets us pin a ceremony to where it actually happened instead of defaulting
 * every record to the state capital.
 */
export const NIGERIAN_CITIES: Record<string, { lat: number; lng: number; state: string }> = {
  // Kano
  kano: { lat: 12.0022, lng: 8.5920, state: "Kano" },
  wudil: { lat: 11.8017, lng: 8.8394, state: "Kano" },
  gaya: { lat: 11.8583, lng: 9.0000, state: "Kano" },
  rano: { lat: 11.5556, lng: 8.5794, state: "Kano" },
  bichi: { lat: 12.2333, lng: 8.2333, state: "Kano" },
  gwarzo: { lat: 11.9167, lng: 7.9333, state: "Kano" },
  karaye: { lat: 11.7833, lng: 8.0000, state: "Kano" },
  dawakin: { lat: 12.0333, lng: 8.7500, state: "Kano" },
  // Katsina
  katsina: { lat: 12.9908, lng: 7.6018, state: "Katsina" },
  daura: { lat: 13.0306, lng: 8.3175, state: "Katsina" },
  funtua: { lat: 11.5236, lng: 7.3122, state: "Katsina" },
  malumfashi: { lat: 11.7906, lng: 7.6222, state: "Katsina" },
  dutsinma: { lat: 12.4500, lng: 7.4833, state: "Katsina" },
  // Kebbi
  "birnin kebbi": { lat: 12.4539, lng: 4.1975, state: "Kebbi" },
  argungu: { lat: 12.7439, lng: 4.5250, state: "Kebbi" },
  yauri: { lat: 10.7833, lng: 4.7500, state: "Kebbi" },
  zuru: { lat: 11.4333, lng: 5.2333, state: "Kebbi" },
  jega: { lat: 12.2242, lng: 4.3781, state: "Kebbi" },
  // Sokoto
  sokoto: { lat: 13.0059, lng: 5.2476, state: "Sokoto" },
  tambuwal: { lat: 12.4000, lng: 4.6500, state: "Sokoto" },
  bodinga: { lat: 12.8500, lng: 5.1500, state: "Sokoto" },
  // Zamfara
  gusau: { lat: 12.1628, lng: 6.6641, state: "Zamfara" },
  "kaura namoda": { lat: 12.5942, lng: 6.5858, state: "Zamfara" },
  talata: { lat: 12.5667, lng: 6.0667, state: "Zamfara" },
  // Jigawa
  dutse: { lat: 11.7566, lng: 9.3390, state: "Jigawa" },
  hadejia: { lat: 12.4494, lng: 10.0403, state: "Jigawa" },
  gumel: { lat: 12.6272, lng: 9.3872, state: "Jigawa" },
  birniwa: { lat: 12.5167, lng: 10.3333, state: "Jigawa" },
  // Kaduna
  kaduna: { lat: 10.5222, lng: 7.4383, state: "Kaduna" },
  zaria: { lat: 11.0855, lng: 7.7199, state: "Kaduna" },
  kafanchan: { lat: 9.5833, lng: 8.3000, state: "Kaduna" },
  // Bauchi
  bauchi: { lat: 10.3158, lng: 9.8442, state: "Bauchi" },
  azare: { lat: 11.6753, lng: 10.1928, state: "Bauchi" },
  misau: { lat: 11.3167, lng: 10.4667, state: "Bauchi" },
  // Gombe
  gombe: { lat: 10.2897, lng: 11.1673, state: "Gombe" },
  kaltungo: { lat: 9.8206, lng: 11.3081, state: "Gombe" },
  // Borno
  maiduguri: { lat: 11.8311, lng: 13.1510, state: "Borno" },
  biu: { lat: 10.6119, lng: 12.1953, state: "Borno" },
  bama: { lat: 11.5211, lng: 13.6889, state: "Borno" },
  // Yobe
  damaturu: { lat: 11.7479, lng: 11.9608, state: "Yobe" },
  potiskum: { lat: 11.7104, lng: 11.0708, state: "Yobe" },
  gashua: { lat: 12.8722, lng: 11.0472, state: "Yobe" },
  nguru: { lat: 12.8786, lng: 10.4531, state: "Yobe" },
  // Adamawa / Taraba
  yola: { lat: 9.2035, lng: 12.4954, state: "Adamawa" },
  mubi: { lat: 10.2703, lng: 13.2683, state: "Adamawa" },
  jalingo: { lat: 8.8940, lng: 11.3661, state: "Taraba" },
  // North Central
  minna: { lat: 9.6139, lng: 6.5569, state: "Niger" },
  bida: { lat: 9.0833, lng: 6.0167, state: "Niger" },
  kontagora: { lat: 10.4000, lng: 5.4667, state: "Niger" },
  suleja: { lat: 9.1806, lng: 7.1794, state: "Niger" },
  jos: { lat: 9.8965, lng: 8.8583, state: "Plateau" },
  lafia: { lat: 8.4939, lng: 8.5157, state: "Nasarawa" },
  keffi: { lat: 8.8486, lng: 7.8736, state: "Nasarawa" },
  ilorin: { lat: 8.4966, lng: 4.5421, state: "Kwara" },
  lokoja: { lat: 7.8023, lng: 6.7333, state: "Kogi" },
  makurdi: { lat: 7.7322, lng: 8.5391, state: "Benue" },
  abuja: { lat: 9.0765, lng: 7.3986, state: "Federal Capital Territory" },
  gwagwalada: { lat: 8.9433, lng: 7.0797, state: "Federal Capital Territory" },
  // South
  lagos: { lat: 6.5244, lng: 3.3792, state: "Lagos" },
  ikeja: { lat: 6.6018, lng: 3.3515, state: "Lagos" },
  ibadan: { lat: 7.3775, lng: 3.9470, state: "Oyo" },
  abeokuta: { lat: 7.1557, lng: 3.3451, state: "Ogun" },
  akure: { lat: 7.2571, lng: 5.2058, state: "Ondo" },
  osogbo: { lat: 7.7827, lng: 4.5418, state: "Osun" },
  "benin city": { lat: 6.3350, lng: 5.6037, state: "Edo" },
  "port harcourt": { lat: 4.8156, lng: 7.0498, state: "Rivers" },
  enugu: { lat: 6.4584, lng: 7.5464, state: "Enugu" },
  onitsha: { lat: 6.1667, lng: 6.7833, state: "Anambra" },
  awka: { lat: 6.2109, lng: 7.0722, state: "Anambra" },
  owerri: { lat: 5.4836, lng: 7.0333, state: "Imo" },
  uyo: { lat: 5.0377, lng: 7.9128, state: "Akwa Ibom" },
  calabar: { lat: 4.9757, lng: 8.3417, state: "Cross River" },
  yenagoa: { lat: 4.9247, lng: 6.2642, state: "Bayelsa" },
  asaba: { lat: 6.1980, lng: 6.7280, state: "Delta" },
  umuahia: { lat: 5.5250, lng: 7.4940, state: "Abia" },
  abakaliki: { lat: 6.3249, lng: 8.1137, state: "Ebonyi" },
  "ado-ekiti": { lat: 7.6211, lng: 5.2214, state: "Ekiti" },
};

/** Look up a town, tolerating "Wudil LGA", "Birnin Kebbi town" and similar. */
export function resolveCity(
  input?: string | null
): { lat: number; lng: number; state: string; name: string } | null {
  if (!input) return null;
  const key = input
    .toLowerCase()
    .replace(/\b(lga|local government|area|town|city|metropolis|emirate)\b/g, "")
    .replace(/[^a-z\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (NIGERIAN_CITIES[key]) return { ...NIGERIAN_CITIES[key], name: titleCase(key) };

  // "Dawakin Tofa" → try the leading word
  const first = key.split(" ")[0];
  if (first && NIGERIAN_CITIES[first]) return { ...NIGERIAN_CITIES[first], name: titleCase(first) };

  return null;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The boundary file spells the FCT out in full; align it with our naming. */
export function normaliseBoundaryName(shapeName: string): string {
  return resolveState(shapeName)?.name ?? shapeName;
}
