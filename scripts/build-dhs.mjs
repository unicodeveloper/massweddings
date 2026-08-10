/**
 * Rebuilds data/state-dhs.json from the Nigeria Demographic and Health Survey
 * 2023–24 (published 2024), the most recent state-level survey of Nigerian
 * households, via The DHS Program's subnational release on HDX.
 *
 * This is where the map's 2024-vintage indicators come from. The multidimensional
 * poverty index is still 2021 — nobody has published a state-level MPI from this
 * survey yet — but these give a current read on the same underlying deprivation,
 * and median age at first marriage speaks directly to what the programmes do.
 *
 * Run: node scripts/build-dhs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = path.join(ROOT, "data", "state-dhs.json");

const SOURCE_CSV =
  "https://data.humdata.org/dataset/6de94d23-f178-458d-ad0b-69a75d9e0b00/resource/e9862feb-121a-4800-a9c1-80ee42a65bfa/download/dhs-quickstats_subnational_nga.csv";

const SURVEY_YEAR = "2024";

/** DHS indicator name → the field we store it under. */
const INDICATORS = {
  "Median age at first marriage [Women]: 25-49": "medianAgeAtFirstMarriage",
  "Households with electricity": "householdsWithElectricity",
  "Women who are literate": "womenLiterate",
  "Women with secondary or higher education": "womenSecondaryEducation",
};

/** DHS labels its states with a "..州" style prefix and its own FCT spelling. */
function canonicalState(label) {
  const name = label.replace(/^\.+/, "").trim();
  if (name === "FCT Abuja") return "Federal Capital Territory";
  return name;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows[0].map((h) => h.replace(/^﻿/, "").trim());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? "").trim()]))
  );
}

async function main() {
  console.log("Fetching DHS subnational data for Nigeria…");
  const response = await fetch(SOURCE_CSV);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const rows = parseCsv(await response.text()).filter((row) => row.SurveyYear === SURVEY_YEAR);
  if (rows.length === 0) throw new Error(`No rows for survey year ${SURVEY_YEAR}`);

  const states = {};
  const zones = {};
  let surveyId = "";

  for (const row of rows) {
    const field = INDICATORS[row.Indicator];
    if (!field) continue;

    const value = Number(row.Value);
    if (!Number.isFinite(value)) continue;
    surveyId ||= row.SurveyId;

    // Rows prefixed with dots are states; the bare ones are the six zones.
    const isState = row.CharacteristicLabel.startsWith("..");
    const bucket = isState ? states : zones;
    const key = isState ? canonicalState(row.CharacteristicLabel) : row.CharacteristicLabel.trim();

    bucket[key] ??= { name: key };
    bucket[key][field] = value;
  }

  const output = {
    builtAt: new Date().toISOString(),
    survey: {
      name: "Nigeria Demographic and Health Survey 2023–24",
      surveyId,
      publisher: "National Population Commission (Nigeria) and ICF · The DHS Program",
      surveyYear: Number(SURVEY_YEAR),
      url: "https://data.humdata.org/dataset/dhs-subnational-data-for-nigeria",
      note: "Fieldwork ran 2023–24. State-level estimates as published by The DHS Program.",
    },
    indicators: {
      medianAgeAtFirstMarriage: "Median age at first marriage, women aged 25–49 (years)",
      householdsWithElectricity: "Households with electricity (%)",
      womenLiterate: "Women who are literate (%)",
      womenSecondaryEducation: "Women with secondary or higher education (%)",
    },
    states: Object.values(states).sort((a, b) => a.name.localeCompare(b.name)),
    zones: Object.values(zones).sort((a, b) => a.name.localeCompare(b.name)),
  };

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Wrote ${output.states.length} states, ${output.zones.length} zones → data/state-dhs.json`);

  const missing = output.states.filter((s) => s.medianAgeAtFirstMarriage == null);
  if (missing.length) console.warn(`No marriage-age figure for: ${missing.map((s) => s.name).join(", ")}`);

  const sorted = [...output.states]
    .filter((s) => s.medianAgeAtFirstMarriage != null)
    .sort((a, b) => a.medianAgeAtFirstMarriage - b.medianAgeAtFirstMarriage);
  console.log(
    `Median age at first marriage: ${sorted[0].name} ${sorted[0].medianAgeAtFirstMarriage} → ` +
      `${sorted.at(-1).name} ${sorted.at(-1).medianAgeAtFirstMarriage}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
