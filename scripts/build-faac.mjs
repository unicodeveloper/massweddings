/**
 * Rebuilds data/state-faac.json — federal allocations (FAAC) received by each state.
 *
 * Unlike population and poverty, there is no machine-readable open dataset for
 * state-level FAAC: NBS publishes monthly disbursements as report scans, and the
 * Open Treasury portal is not reliably reachable. So we source the figures through
 * Valyu, restricted to NBS itself and the outlets that publish NBS/BudgIT
 * breakdowns, and we keep a source URL for every single number.
 *
 * Any state Valyu cannot source stays null — the map renders those as "no data"
 * rather than guessing.
 *
 * Run: node --env-file=.env.local scripts/build-faac.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Valyu } from "valyu-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = path.join(ROOT, "data", "state-faac.json");

const args = process.argv.slice(2);
const YEAR = Number(args.find((arg) => /^\d{4}$/.test(arg)) ?? 2024);
/** Retry only the states with no figure yet, merging into the existing file. */
const FILL_GAPS = args.includes("--fill-gaps");

const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
];

/** NBS first, then the outlets that reliably republish its FAAC breakdowns. */
const SOURCES = [
  "nigerianstat.gov.ng",
  "budgit.org",
  "opentreasury.gov.ng",
  "nairametrics.com",
  "punchng.com",
  "businessday.ng",
  "premiumtimesng.com",
  "thecable.ng",
  "dataphyte.org",
];

const SCHEMA = {
  type: "object",
  properties: {
    allocations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          state: { type: "string", description: "Nigerian state name" },
          totalNairaBillion: {
            type: "number",
            description: `Total FAAC allocation the state government received in ${YEAR}, in billions of naira. Null if not reported.`,
          },
          sourceUrl: { type: "string", description: "URL of the report this figure came from" },
          note: { type: "string", description: "Whether the figure is gross or net of deductions, and the period it covers" },
        },
        required: ["state"],
      },
    },
  },
  required: ["allocations"],
};

const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size)
  );

async function main() {
  if (!process.env.VALYU_API_KEY) {
    console.error("VALYU_API_KEY is not set. Run with: node --env-file=.env.local scripts/build-faac.mjs");
    process.exit(1);
  }

  const valyu = new Valyu(process.env.VALYU_API_KEY);

  const results = new Map();
  const allSources = new Set();
  let pending = STATES;

  if (FILL_GAPS && fs.existsSync(TARGET)) {
    const existing = JSON.parse(fs.readFileSync(TARGET, "utf8"));
    for (const row of existing.allocations ?? []) results.set(row.state, row);
    for (const url of existing.consultedSources ?? []) allSources.add(url);
    pending = STATES.filter((state) => !results.has(state));
    console.log(`Filling gaps: ${pending.length} states still unsourced.\n`);
    if (pending.length === 0) return;
  }

  // Smaller batches when retrying — the wide ones are what timed out.
  const batches = chunk(pending, FILL_GAPS ? 4 : 8);

  for (const [index, batch] of batches.entries()) {
    process.stdout.write(`Batch ${index + 1}/${batches.length} (${batch[0]}…${batch.at(-1)}) `);

    const response = await valyu.answer(
      `Total FAAC (Federation Account Allocation Committee) allocation received in ${YEAR} by each of these Nigerian state governments, in naira: ${batch.join(", ")}. Use National Bureau of Statistics or BudgIT figures.`,
      {
        structuredOutput: SCHEMA,
        searchType: "web",
        includedSources: SOURCES,
        systemInstructions:
          "Report only figures you can find in the search results, and give the URL for each. If a state's allocation is not in the sources, omit its number rather than estimating it. Do not convert or scale figures beyond expressing them in naira billions.",
      }
    );

    if (!response.success) {
      console.log(`failed: ${response.error}`);
      continue;
    }

    for (const result of response.search_results ?? []) {
      if (result.url) allSources.add(result.url);
    }

    let parsed;
    try {
      parsed =
        typeof response.contents === "string" ? JSON.parse(response.contents) : response.contents;
    } catch {
      console.log("unparseable response");
      continue;
    }

    let found = 0;
    for (const row of parsed?.allocations ?? []) {
      const value = row.totalNairaBillion;
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
      if (!row.sourceUrl) continue;
      results.set(row.state, {
        state: row.state,
        allocationNairaBillion: Number(value.toFixed(2)),
        sourceUrl: row.sourceUrl,
        note: row.note ?? null,
      });
      found++;
    }
    console.log(`→ ${found} sourced`);
  }

  const output = {
    builtAt: new Date().toISOString(),
    year: YEAR,
    method:
      "Sourced through Valyu, restricted to NBS and outlets publishing NBS/BudgIT FAAC breakdowns. Every figure carries the URL it came from; unsourced states are omitted.",
    caveat:
      "FAAC figures are reported, not read from an official machine-readable dataset. Treat them as indicative and follow the source link before citing.",
    consultedSources: [...allSources],
    allocations: [...results.values()].sort((a, b) => a.state.localeCompare(b.state)),
  };

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`\nWrote ${output.allocations.length}/${STATES.length} states → data/state-faac.json`);
  const missing = STATES.filter((state) => !results.has(state));
  if (missing.length) console.log(`No sourced figure for: ${missing.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
