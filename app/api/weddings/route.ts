import { NextResponse } from "next/server";
import { readDataset, writeDataset } from "@/lib/dataset";
import {
  addRoundup,
  buildDataset,
  buildFromArticles,
  recollapse,
  ROUNDUP_STATES,
} from "@/lib/pipeline";
import { isAIExtractionEnabled } from "@/lib/extract";

export const dynamic = "force-dynamic";
/** The full pipeline runs dozens of searches and hundreds of extractions. */
export const maxDuration = 800;

function isRebuildAllowed(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ALLOW_REBUILD === "true";
}

/** Serve the cached dataset. */
export async function GET() {
  const dataset = await readDataset();
  const rebuildAllowed = isRebuildAllowed();

  if (!dataset) {
    return NextResponse.json(
      {
        error: "No dataset yet",
        rebuildAllowed,
        message: rebuildAllowed
          ? "Run the build once to populate the map (npm run seed, or the Rebuild button)."
          : "No cached dataset is available on this deployment.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ...dataset, rebuildAllowed });
}

/**
 * Rebuild the dataset through Valyu. Expensive and deliberate.
 *
 * Runs in stages so no single request outlives an HTTP client timeout:
 *   { stage: "articles" }                → search + extract + collapse
 *   { stage: "roundup", states: [...] }  → per-state sweep, merged in
 *   { stage: "recollapse" }              → re-apply the merge rules, no API calls
 *   { }                                  → everything in one call
 */
export async function POST(request: Request) {
  if (!isRebuildAllowed()) {
    return NextResponse.json(
      { error: "Rebuilds are disabled on this deployment", rebuildAllowed: false },
      { status: 403 }
    );
  }

  if (!process.env.VALYU_API_KEY) {
    return NextResponse.json(
      { error: "VALYU_API_KEY is not configured", rebuildAllowed: true },
      { status: 500 }
    );
  }

  let stage: string | undefined;
  let states: string[] | undefined;
  let skipRoundup = false;

  try {
    const body = await request.json();
    stage = body?.stage;
    states = Array.isArray(body?.states) ? body.states : undefined;
    skipRoundup = Boolean(body?.skipRoundup);
  } catch {
    // No body is fine — run the full build.
  }

  try {
    const started = Date.now();
    let dataset;

    if (stage === "articles") {
      dataset = await buildFromArticles();
    } else if (stage === "recollapse") {
      const existing = await readDataset();
      if (!existing) {
        return NextResponse.json({ error: "There is no dataset to recollapse" }, { status: 409 });
      }
      dataset = recollapse(existing);
    } else if (stage === "roundup") {
      const existing = await readDataset();
      if (!existing) {
        return NextResponse.json(
          { error: "Run the articles stage before the roundup stage" },
          { status: 409 }
        );
      }
      dataset = await addRoundup(existing, states ?? ROUNDUP_STATES);
    } else {
      dataset = await buildDataset({ skipRoundup });
    }

    await writeDataset(dataset);

    return NextResponse.json({
      ...dataset,
      rebuildAllowed: true,
      buildSeconds: Math.round((Date.now() - started) / 1000),
      aiExtraction: isAIExtractionEnabled(),
    });
  } catch (error) {
    console.error("Dataset build failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Build failed" },
      { status: 500 }
    );
  }
}
