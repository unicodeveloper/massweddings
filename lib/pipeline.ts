import { randomUUID } from "node:crypto";
import { NIGERIAN_STATES, resolveCity, resolveState, isNorthern } from "./nigeria";
import { extractFromArticle, type Extraction } from "./extract";
import { NIGERIAN_OUTLETS, searchNews, structuredAnswer, type ValyuArticle } from "./valyu";
import { FIRST_YEAR, LAST_YEAR, WINDOW_START, withinWindow } from "./window";
import type { BeneficiaryGroup, SponsorType, WeddingDataset, WeddingEvent } from "@/types";

export { FIRST_YEAR, LAST_YEAR, WINDOW_START, withinWindow };


/** The northern states, where the state-funded programmes are concentrated. */
const NORTHERN_STATES = NIGERIAN_STATES.filter(isNorthern).map((s) => s.name);

/**
 * The south is searched too, and deliberately so. A state with no editions is a
 * finding, not a gap — the north/south split is the point of the map — so the
 * query set has to give southern states a fair chance to appear.
 */
const SOUTHERN_STATES = NIGERIAN_STATES.filter((state) => !isNorthern(state)).map((s) => s.name);

function buildQueries(): string[] {
  const thematic = [
    "Nigeria mass wedding couples state government sponsored",
    "Hisbah board mass wedding couples Nigeria dowry",
    "northern Nigeria mass wedding programme low income couples",
    "mass wedding widows divorcees Nigeria state government sponsored",
    "Nigeria government mass wedding ceremony cost naira couples married",
    "mass wedding Nigeria emir governor officiates couples",
    "Nigeria mass wedding criticism misplaced priority cost",
    "southern Nigeria mass wedding couples sponsored church ceremony",
    "Lagos Ogun Oyo mass wedding couples government sponsored",
    "south east Nigeria mass wedding couples Anambra Imo Enugu",
    "middle belt Nigeria mass wedding Plateau Benue Nasarawa couples",
    "Nigeria collective wedding ceremony hundreds of couples philanthropist",
  ];

  // Every northern state gets its own query; the south is swept a few at a time,
  // which is enough to surface an edition if one exists.
  const perNorthernState = NORTHERN_STATES.map(
    (state) => `${state} State mass wedding couples government sponsored ceremony`
  );

  const southernGroups: string[] = [];
  for (let i = 0; i < SOUTHERN_STATES.length; i += 3) {
    const group = SOUTHERN_STATES.slice(i, i + 3);
    southernGroups.push(`mass wedding couples sponsored ${group.join(" ")} State Nigeria`);
  }

  const perYear: string[] = [];
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
    perYear.push(`mass wedding Nigeria ${year} couples state government`);
  }

  return [...thematic, ...perNorthernState, ...southernGroups, ...perYear];
}

/** Run promises with a concurrency cap so we do not open 300 sockets at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/** Stage 1 — recall. Fan out across thematic, per-state and per-year queries. */
async function gatherArticles(endDate: string): Promise<ValyuArticle[]> {
  const queries = buildQueries();

  const batches = await mapWithConcurrency(queries, 6, (query) =>
    searchNews(query, { maxResults: 20, startDate: WINDOW_START, endDate })
  );

  // A second pass pinned to Nigerian outlets, which cover the smaller editions.
  const outletBatches = await mapWithConcurrency(
    queries.slice(0, 12),
    6,
    (query) =>
      searchNews(query, {
        maxResults: 20,
        startDate: WINDOW_START,
        endDate,
        includedSources: NIGERIAN_OUTLETS,
      })
  );

  const seen = new Set<string>();
  const articles: ValyuArticle[] = [];

  for (const article of [...batches.flat(), ...outletBatches.flat()]) {
    const key = article.url.split("?")[0].replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (article.content.length < 200) continue;
    articles.push(article);
  }

  return articles;
}

interface Candidate {
  extraction: Extraction;
  article?: ValyuArticle;
  via: "article" | "roundup";
}

/** Stage 2 — extraction. One structured record per article. */
async function extractAll(articles: ValyuArticle[]): Promise<Candidate[]> {
  const extractions = await mapWithConcurrency<ValyuArticle, Candidate | null>(
    articles,
    8,
    async (article) => {
      const extraction = await extractFromArticle(article);
      return extraction ? { extraction, article, via: "article" } : null;
    }
  );

  return extractions.filter((item): item is Candidate => item !== null);
}

interface RoundupEdition {
  state?: string;
  city?: string;
  date?: string;
  couples?: number;
  sponsor?: string;
  costNaira?: number;
  sourceUrl?: string;
  held?: boolean;
}

const ROUNDUP_SCHEMA = {
  type: "object",
  properties: {
    editions: {
      type: "array",
      description: "One entry per distinct ceremony. Omit editions you cannot source.",
      items: {
        type: "object",
        properties: {
          state: { type: "string", description: "Nigerian state" },
          city: { type: "string", description: "Town or LGA hosting the ceremony" },
          date: { type: "string", description: "YYYY-MM-DD, or YYYY-MM / YYYY if less precise" },
          couples: { type: "integer", description: "Number of couples married" },
          sponsor: { type: "string", description: "Organising or funding body" },
          costNaira: { type: "number", description: "Total reported spend as a plain naira number" },
          held: { type: "boolean", description: "True if the ceremony took place, false if only announced" },
          sourceUrl: { type: "string", description: "URL of the report this entry came from" },
        },
        required: ["state", "date", "couples"],
      },
    },
  },
  required: ["editions"],
} as const;

/**
 * Stage 3 — roundup. Article search misses older editions that were covered once
 * and never re-indexed, so we also ask Valyu to enumerate each state's history
 * directly. Anything it returns still has to carry a source URL.
 */
async function gatherRoundups(states: string[], endDate: string): Promise<Candidate[]> {
  const answers = await mapWithConcurrency(states, 5, (state) =>
    structuredAnswer<{ editions: RoundupEdition[] }>(
      `Every government-sponsored, Hisbah-organised or philanthropist-funded mass wedding ceremony held in ${state} State, Nigeria since ${FIRST_YEAR}. For each edition give the date, the number of couples married, the sponsor, and the amount spent.`,
      ROUNDUP_SCHEMA as unknown as Record<string, unknown>,
      {
        startDate: WINDOW_START,
        endDate,
        systemInstructions:
          "Only report ceremonies you can source from the search results. Do not infer or estimate couple counts or dates. Omit any edition you cannot attribute to a specific report.",
      }
    ).then((result) => ({ state, result }))
  );

  const candidates: Candidate[] = [];

  for (const { state, result } of answers) {
    for (const edition of result.data?.editions ?? []) {
      if (!edition.couples || !edition.date) continue;
      const resolved = resolveState(edition.state ?? state);
      if (!resolved) continue;

      candidates.push({
        via: "roundup",
        extraction: {
          isMassWedding: true,
          held: edition.held ?? true,
          state: resolved.name,
          city: edition.city ?? null,
          date: edition.date,
          couples: edition.couples,
          costNaira: edition.costNaira ?? null,
          dowryPerBrideNaira: null,
          sponsor: edition.sponsor ?? null,
          sponsorType: inferSponsorType(edition.sponsor),
          beneficiaries: "unknown",
          edition: null,
          summary: `${edition.couples.toLocaleString()} couples married in ${resolved.name} State${
            edition.sponsor ? `, organised by ${edition.sponsor}` : ""
          }.`,
        },
        article: edition.sourceUrl
          ? {
              title: `${resolved.name} mass wedding`,
              url: edition.sourceUrl,
              content: "",
              outlet: safeHost(edition.sourceUrl),
            }
          : undefined,
      });
    }
  }

  return candidates;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function inferSponsorType(sponsor?: string | null): SponsorType {
  if (!sponsor) return "unknown";
  const value = sponsor.toLowerCase();
  if (value.includes("hisbah")) return "hisbah";
  if (value.includes("emir")) return "emirate";
  if (value.includes("state government") || value.includes("govt") || value.includes("government"))
    return "state-government";
  if (value.includes("local government") || value.includes("lga")) return "lga";
  if (value.includes("foundation") || value.includes("ngo")) return "ngo";
  if (value.includes("federal") || value.includes("ministry")) return "federal";
  return "unknown";
}

function parseDate(value: string | null): { iso: string; precision: "day" | "month" | "year" } | null {
  if (!value) return null;

  const full = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (full) return { iso: `${full[1]}-${full[2]}-${full[3]}`, precision: "day" };

  const month = value.match(/^(\d{4})-(\d{2})$/);
  if (month) return { iso: `${month[1]}-${month[2]}-01`, precision: "month" };

  const year = value.match(/^(\d{4})$/);
  if (year) return { iso: `${year[1]}-01-01`, precision: "year" };

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return { iso: parsed.toISOString().slice(0, 10), precision: "day" };
  }
  return null;
}

/** Turn a raw extraction into a plotted, typed event. Returns null if unusable. */
function toEvent(candidate: Candidate): WeddingEvent | null {
  const { extraction, article, via } = candidate;

  const state = resolveState(extraction.state);
  if (!state) return null;

  const parsed = parseDate(extraction.date);
  if (!parsed) return null;

  const year = Number(parsed.iso.slice(0, 4));
  if (!withinWindow(year)) return null;

  // Guard against a stray "44 local government areas" being read as a couple count.
  const couples =
    extraction.couples && extraction.couples >= 10 && extraction.couples <= 100000
      ? Math.round(extraction.couples)
      : null;

  const city = resolveCity(extraction.city);
  const usableCity = city && city.state === state.name ? city : null;

  return {
    id: randomUUID(),
    title: article?.title?.trim() || `${state.name} mass wedding`,
    summary: extraction.summary?.trim() || "",
    state: state.name,
    city: usableCity?.name ?? extraction.city ?? undefined,
    location: {
      latitude: usableCity?.lat ?? state.lat,
      longitude: usableCity?.lng ?? state.lng,
      placeName: usableCity?.name ?? state.capital,
      state: state.name,
      precision: usableCity ? "city" : "state",
    },
    date: parsed.iso,
    datePrecision: parsed.precision,
    year,
    couples,
    costNaira: extraction.costNaira ?? null,
    dowryPerBrideNaira: extraction.dowryPerBrideNaira ?? null,
    sponsor: extraction.sponsor?.trim() || `${state.name} State Government`,
    sponsorType: extraction.sponsorType as SponsorType,
    beneficiaries: extraction.beneficiaries as BeneficiaryGroup,
    held: extraction.held,
    edition: extraction.edition ?? undefined,
    sources: article ? [{ title: article.title, url: article.url, outlet: article.outlet }] : [],
    via,
    confidence: couples && parsed.precision === "day" ? "high" : couples ? "medium" : "low",
  };
}

/**
 * Stage 4 — collapse. Twenty outlets covering one ceremony must land as one dot.
 * Records are bucketed by state and year, then split only when the couple counts
 * are clearly describing different events.
 */
function collapseEditions(events: WeddingEvent[]): WeddingEvent[] {
  const buckets = new Map<string, WeddingEvent[]>();

  for (const event of events.filter((event) => withinWindow(event.year))) {
    const key = `${event.state}::${event.year}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(event);
    else buckets.set(key, [event]);
  }

  const merged: WeddingEvent[] = [];

  for (const bucket of buckets.values()) {
    // Records that name a couple count anchor the clusters; the rest attach to them.
    const withCount = bucket.filter((event) => event.couples !== null);
    const withoutCount = bucket.filter((event) => event.couples === null);

    const clusters: WeddingEvent[][] = [];

    for (const event of withCount.sort((a, b) => (b.couples ?? 0) - (a.couples ?? 0))) {
      const target = clusters.find((cluster) => {
        const reference = cluster[0].couples as number;
        const value = event.couples as number;
        const spread = Math.abs(reference - value) / Math.max(reference, value);
        return spread <= 0.2;
      });
      if (target) target.push(event);
      else clusters.push([event]);
    }

    if (clusters.length === 0) {
      // Nothing in this year gave a number — keep them as one low-confidence edition.
      if (withoutCount.length > 0) clusters.push(withoutCount);
    } else {
      // Attach countless records to the largest cluster of the year.
      const largest = clusters.reduce((a, b) => (a.length >= b.length ? a : b));
      largest.push(...withoutCount);
    }

    for (const { cluster, couples } of reconcileDoubleCounts(clusters)) {
      const edition = mergeCluster(cluster);
      if (couples !== undefined) edition.couples = couples;
      merged.push(edition);
    }
  }

  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Some outlets report the combined number of brides and grooms — "3,600 brides
 * and grooms" for a ceremony of 1,800 couples. That lands as a second cluster
 * with roughly double the count, which would show on the map as an extra
 * ceremony and double the year's total.
 *
 * Where one cluster in a state-year is ~2× another, the two are folded together.
 * The surviving count is the better-corroborated one, not automatically the
 * smaller: a 2:1 ratio can just as easily mean the smaller figure came from a
 * single partial report, and the count backed by more outlets is the safer read.
 */
function reconcileDoubleCounts(
  clusters: WeddingEvent[][]
): Array<{ cluster: WeddingEvent[]; couples?: number }> {
  const sourceWeight = (cluster: WeddingEvent[]) =>
    cluster.reduce((sum, event) => sum + event.sources.length, 0);

  const counted = clusters
    .map((cluster, index) => ({ index, count: cluster[0]?.couples ?? null }))
    .filter((entry): entry is { index: number; count: number } => entry.count !== null);

  const absorbed = new Set<number>();
  const overrides = new Map<number, number>();

  for (const a of counted) {
    if (absorbed.has(a.index)) continue;

    for (const b of counted) {
      if (b.index === a.index || absorbed.has(b.index)) continue;

      const [larger, smaller] = a.count >= b.count ? [a, b] : [b, a];
      const expected = smaller.count * 2;
      if (Math.abs(larger.count - expected) > expected * 0.1) continue;

      // Whichever reading more outlets corroborate is the one we keep.
      const weightLarger = sourceWeight(clusters[larger.index]);
      const weightSmaller = sourceWeight(clusters[smaller.index]);
      const [keep, drop] =
        weightSmaller >= weightLarger ? [smaller, larger] : [larger, smaller];

      clusters[keep.index].push(...clusters[drop.index]);
      overrides.set(keep.index, keep.count);
      absorbed.add(drop.index);

      if (drop.index === a.index) break;
    }
  }

  return clusters
    .map((cluster, index) => ({ cluster, couples: overrides.get(index) }))
    .filter((_, index) => !absorbed.has(index));
}

/** Fold one cluster of duplicate reports into a single edition. */
function mergeCluster(cluster: WeddingEvent[]): WeddingEvent {
  // A ceremony that happened beats an announcement; a precise date beats a vague one.
  const ranked = [...cluster].sort((a, b) => {
    if (a.held !== b.held) return a.held ? -1 : 1;
    const precision = { day: 0, month: 1, year: 2 } as const;
    if (precision[a.datePrecision] !== precision[b.datePrecision]) {
      return precision[a.datePrecision] - precision[b.datePrecision];
    }
    return b.sources.length - a.sources.length;
  });

  const base = { ...ranked[0] };

  const sources = new Map<string, WeddingEvent["sources"][number]>();
  for (const event of ranked) {
    for (const source of event.sources) {
      if (source.url) sources.set(source.url.split("?")[0], source);
    }
  }

  const couples = ranked.map((e) => e.couples).filter((v): v is number => v !== null);
  const costs = ranked.map((e) => e.costNaira).filter((v): v is number => v !== null);
  const dowries = ranked.map((e) => e.dowryPerBrideNaira).filter((v): v is number => v !== null);

  base.couples = couples.length ? mode(couples) : null;
  base.costNaira = costs.length ? Math.max(...costs) : null;
  base.dowryPerBrideNaira = dowries.length ? mode(dowries) : null;
  base.held = ranked.some((event) => event.held);
  base.sources = [...sources.values()];
  base.city = ranked.find((event) => event.location.precision === "city")?.city ?? base.city;
  base.location = ranked.find((event) => event.location.precision === "city")?.location ?? base.location;
  base.sponsor = ranked.find((event) => event.sponsorType !== "unknown")?.sponsor ?? base.sponsor;
  base.sponsorType = ranked.find((event) => event.sponsorType !== "unknown")?.sponsorType ?? "unknown";
  base.beneficiaries =
    ranked.find((event) => event.beneficiaries !== "unknown")?.beneficiaries ?? "unknown";
  base.edition = ranked.find((event) => event.edition)?.edition;
  base.summary = ranked.find((event) => event.summary.length > 40)?.summary ?? base.summary;
  base.via = ranked.some((event) => event.via === "article") ? "article" : "roundup";

  const corroborated = base.sources.length >= 2;
  base.confidence =
    base.couples && corroborated ? "high" : base.couples ? "medium" : "low";

  return base;
}

/** Most frequently reported value, breaking ties toward the larger number. */
function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  let best = values[0];
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && value > best)) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/** Every state the roundup stage sweeps, in the order the seed script batches them. */
export const ROUNDUP_STATES = NIGERIAN_STATES.map((state) => state.name);

function summarise(
  editions: WeddingEvent[],
  base: { articlesScanned: number; articlesMatched: number }
): WeddingDataset {
  return {
    events: editions,
    builtAt: new Date().toISOString(),
    stats: {
      ...base,
      editions: editions.length,
      statesCovered: new Set(editions.map((event) => event.state)).size,
      totalCouples: editions.reduce((sum, event) => sum + (event.couples ?? 0), 0),
    },
  };
}

/**
 * Stage one, run alone: search the news, extract, collapse. This is the pass
 * that produces the bulk of the dataset.
 */
export async function buildFromArticles(): Promise<WeddingDataset> {
  const endDate = new Date().toISOString().slice(0, 10);

  const articles = await gatherArticles(endDate);
  const candidates = await extractAll(articles);

  const events = candidates.map(toEvent).filter((event): event is WeddingEvent => event !== null);

  return summarise(collapseEditions(events), {
    articlesScanned: articles.length,
    articlesMatched: candidates.length,
  });
}

/**
 * Roundup pass for a batch of states, merged into an existing dataset.
 *
 * Kept separate from the article pass so a rebuild is a sequence of short
 * requests rather than one long one — the whole build otherwise outlives the
 * HTTP client's timeout, and a failure halfway through would lose everything.
 */
export async function addRoundup(
  existing: WeddingDataset,
  states: string[]
): Promise<WeddingDataset> {
  const endDate = new Date().toISOString().slice(0, 10);

  const candidates = await gatherRoundups(states, endDate);
  const events = candidates.map(toEvent).filter((event): event is WeddingEvent => event !== null);

  // Collapsing is safe to repeat: re-clustering already-merged editions with new
  // records folds them together rather than duplicating them.
  const editions = collapseEditions([...existing.events, ...events]);

  return summarise(editions, {
    articlesScanned: existing.stats.articlesScanned,
    articlesMatched: existing.stats.articlesMatched,
  });
}

/**
 * Re-run the collapse stage over an existing dataset without touching the APIs.
 * Lets a change to the merge rules be applied to data already collected.
 */
export function recollapse(existing: WeddingDataset): WeddingDataset {
  return summarise(collapseEditions(existing.events), {
    articlesScanned: existing.stats.articlesScanned,
    articlesMatched: existing.stats.articlesMatched,
  });
}

export interface BuildOptions {
  /** Skip the per-state roundup pass — faster, but misses thinly covered editions. */
  skipRoundup?: boolean;
  /** Limit the roundup pass to a subset of states. */
  roundupStates?: string[];
}

/** The whole pipeline in one call. Convenient, but long — prefer the staged path. */
export async function buildDataset(options: BuildOptions = {}): Promise<WeddingDataset> {
  const dataset = await buildFromArticles();
  if (options.skipRoundup) return dataset;
  return addRoundup(dataset, options.roundupStates ?? ROUNDUP_STATES);
}
