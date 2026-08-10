/**
 * Rebuilds data/state-reference.json from the two authoritative subnational
 * datasets we rely on:
 *
 *   Population — UNFPA / NPC Common Operational Dataset (COD-PS), 2022 projection,
 *                published on HDX. Includes the age-sex breakdown, which gives us
 *                the marriage-age cohort used to normalise couple counts.
 *   Poverty    — OPHI (University of Oxford) Nigeria Multidimensional Poverty
 *                Index, computed from the 2021 MICS, published on HDX.
 *
 * Run: node scripts/build-reference.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const POPULATION_CSV =
  "https://data.humdata.org/dataset/a7c3de5e-ff27-4746-99cd-05f2ad9b1066/resource/d9fc551a-b5e4-4bed-9d0d-b047b6961817/download/nga_admpop_adm1_2022.csv";
const MPI_CSV =
  "https://data.humdata.org/dataset/042c1bf4-2942-475f-8cb2-1fb783f8da91/resource/601f51cd-c46a-4ab2-ba0f-8bef62329ddc/download/nga_mpi.csv";

const CANONICAL = {
  fct: "Federal Capital Territory",
  "federal capital territory": "Federal Capital Territory",
  "abuja federal capital territory": "Federal Capital Territory",
  nassarawa: "Nasarawa",
  "akwa ibom": "Akwa Ibom",
  "cross river": "Cross River",
};

function canonical(name) {
  const key = name.trim().toLowerCase();
  return CANONICAL[key] ?? name.trim();
}

/** Minimal CSV reader — these files are plain, comma-separated and unquoted. */
function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = splitRow(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = splitRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

function splitRow(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return parseCsv(await response.text());
}

const number = (value) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

async function main() {
  console.log("Fetching UNFPA COD-PS population (2022)…");
  const populationRows = await fetchCsv(POPULATION_CSV);

  console.log("Fetching OPHI multidimensional poverty index…");
  const mpiRows = await fetchCsv(MPI_CSV);

  const states = {};

  for (const row of populationRows) {
    const name = canonical(row.ADM1_EN ?? "");
    if (!name) continue;

    // Women of typical marriage age — the denominator for per-capita comparisons.
    const marriageAgeWomen =
      (number(row.F_15_19) ?? 0) + (number(row.F_20_24) ?? 0) + (number(row.F_25_29) ?? 0);

    states[name] = {
      state: name,
      pcode: row.ADM1_PCODE ?? null,
      population: number(row.T_TL),
      populationFemale: number(row.F_TL),
      populationMale: number(row.M_TL),
      marriageAgeWomen: marriageAgeWomen || null,
      populationYear: number(row.year) ?? 2022,
    };
  }

  let national = null;

  for (const row of mpiRows) {
    const rawName = row["Admin 1 Name"];
    const headcount = number(row["Headcount Ratio"]);

    if (!rawName) {
      // The unnamed row is the national figure.
      national = {
        povertyHeadcount: headcount,
        mpi: number(row.MPI),
        intensity: number(row["Intensity of Deprivation"]),
        survey: row.Survey,
        surveyYear: (row["Start Date"] ?? "").slice(0, 4),
      };
      continue;
    }

    const name = canonical(rawName);
    if (!states[name]) {
      console.warn(`  MPI row for unmatched state: ${rawName}`);
      continue;
    }

    states[name].povertyHeadcount = headcount;
    states[name].mpi = number(row.MPI);
    states[name].povertyIntensity = number(row["Intensity of Deprivation"]);
    states[name].severePoverty = number(row["In Severe Poverty"]);
    states[name].vulnerableToPoverty = number(row["Vulnerable to Poverty"]);
    states[name].povertySurvey = row.Survey;
    states[name].povertySurveyYear = (row["Start Date"] ?? "").slice(0, 4);
  }

  const output = {
    builtAt: new Date().toISOString(),
    national,
    sources: {
      population: {
        name: "Nigeria Subnational Population Statistics (COD-PS), 2022 projection",
        publisher: "UNFPA / National Population Commission",
        url: "https://data.humdata.org/dataset/cod-ps-nga",
        resource: POPULATION_CSV,
      },
      poverty: {
        name: "Nigeria Multidimensional Poverty Index",
        publisher: "Oxford Poverty & Human Development Initiative (OPHI), University of Oxford",
        note: "Computed from the 2021 Multiple Indicator Cluster Survey (MICS).",
        url: "https://data.humdata.org/dataset/nigeria-mpi",
        resource: MPI_CSV,
      },
    },
    states: Object.values(states).sort((a, b) => a.state.localeCompare(b.state)),
  };

  const missingPoverty = output.states.filter((s) => s.povertyHeadcount == null);
  if (missingPoverty.length) {
    console.warn(`  ${missingPoverty.length} states without a poverty figure:`, missingPoverty.map((s) => s.state).join(", "));
  }

  const target = path.join(ROOT, "data", "state-reference.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`\nWrote ${output.states.length} states → data/state-reference.json`);
  console.log(`National poverty headcount: ${national?.povertyHeadcount}%`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
