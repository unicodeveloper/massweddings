import { NextResponse } from "next/server";
import { proseAnswer, NIGERIAN_OUTLETS } from "@/lib/valyu";
import { resolveState } from "@/lib/nigeria";
import { getStateProfile } from "@/lib/state-data";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * A live, cited briefing on one state's mass wedding record. Used by the state
 * panel so a reader can go past the dots on the map to the reporting behind them.
 */
export async function POST(request: Request) {
  let stateName: string | undefined;

  try {
    const body = await request.json();
    stateName = body?.state;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with a state" }, { status: 400 });
  }

  const state = resolveState(stateName);
  if (!state) {
    return NextResponse.json({ error: `Unknown state: ${stateName}` }, { status: 400 });
  }

  const profile = getStateProfile(state.name);

  try {
    const { answer, sources } = await proseAnswer(
      `Summarise the history of government-sponsored mass wedding programmes in ${state.name} State, Nigeria since 2015. Cover how many editions have been held and when, how many couples each one married, who funded them, how much was spent, what the dowry arrangements were, and what criticism the programme has attracted. If ${state.name} State has never run one, say so plainly.`,
      { startDate: "2015-01-01", includedSources: NIGERIAN_OUTLETS }
    );

    return NextResponse.json({
      state: state.name,
      answer,
      sources,
      profile: profile
        ? {
            zone: profile.zone,
            capital: profile.capital,
            population: profile.population,
            povertyHeadcount: profile.povertyHeadcount,
            faacAllocationNairaBn: profile.faacAllocationNairaBn,
            densityPerKm2: profile.densityPerKm2,
          }
        : null,
    });
  } catch (error) {
    console.error("State brief failed:", error);
    return NextResponse.json({ error: "Could not build a briefing" }, { status: 500 });
  }
}
