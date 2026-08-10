/**
 * Rebuilds the mass wedding dataset against a running server.
 *
 * The build is driven in stages — one article pass, then per-state roundups in
 * small batches — because a single request covering the whole pipeline outlives
 * the HTTP client's timeout. Staging also means a failure late in the run keeps
 * everything already written to data/weddings.json.
 *
 * Start the app first (npm run dev), then: npm run seed
 */
const BASE_URL = process.env.SEED_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/weddings`;

const STATES = [
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara",
  "Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe",
  "Benue", "Federal Capital Territory", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau",
  "Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo",
  "Abia", "Anambra", "Ebonyi", "Enugu", "Imo",
  "Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers",
];

const BATCH_SIZE = 5;

async function post(body, label) {
  const started = Date.now();
  process.stdout.write(`${label} … `);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const seconds = Math.round((Date.now() - started) / 1000);

  if (!response.ok) {
    console.log(`failed after ${seconds}s`);
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }

  console.log(`${seconds}s · ${data.stats.editions} ceremonies, ${data.stats.statesCovered} states`);
  return data;
}

const overallStart = Date.now();

try {
  console.log(`Building the mass wedding dataset via ${BASE_URL}\n`);

  let latest = await post({ stage: "articles" }, "Stage 1/2 · searching and extracting news");

  const batches = [];
  for (let i = 0; i < STATES.length; i += BATCH_SIZE) {
    batches.push(STATES.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nStage 2/2 · per-state sweep (${batches.length} batches)`);
  for (const [index, batch] of batches.entries()) {
    latest = await post(
      { stage: "roundup", states: batch },
      `  ${String(index + 1).padStart(2)}/${batches.length} ${batch[0]}…${batch.at(-1)}`
    );
  }

  const { stats } = latest;
  console.log(`\nDone in ${Math.round((Date.now() - overallStart) / 1000)}s\n`);
  console.log(`  articles scanned   ${stats.articlesScanned}`);
  console.log(`  articles matched   ${stats.articlesMatched}`);
  console.log(`  ceremonies         ${stats.editions}`);
  console.log(`  states covered     ${stats.statesCovered}`);
  console.log(`  couples married    ${stats.totalCouples.toLocaleString()}`);
  console.log(`\nWritten to data/weddings.json`);
} catch (error) {
  console.error(`\nBuild failed: ${error.message}`);
  console.error(`Is the dev server running at ${BASE_URL}?`);
  process.exit(1);
}
