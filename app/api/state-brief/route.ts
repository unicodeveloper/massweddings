import { NextResponse } from "next/server";
import { callAsUser, proseAnswer, NIGERIAN_OUTLETS } from "@/lib/valyu";
import { isSelfHostedMode } from "@/lib/app-mode";
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
  let accessToken: string | undefined;

  try {
    const body = await request.json();
    stateName = body?.state;
    accessToken = body?.accessToken;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with a state" }, { status: 400 });
  }

  const state = resolveState(stateName);
  if (!state) {
    return NextResponse.json({ error: `Unknown state: ${stateName}` }, { status: 400 });
  }

  const profile = getStateProfile(state.name);
  const prompt = `Summarise the history of government-sponsored mass wedding programmes in ${state.name} State, Nigeria since 2015. Cover how many editions have been held and when, how many couples each one married, who funded them, how much was spent, what the dowry arrangements were, and what criticism the programme has attracted. If ${state.name} State has never run one, say so plainly.`;

  if (!isSelfHostedMode() && !accessToken) {
    return NextResponse.json(
      { error: "Sign in to build a state briefing", requiresAuth: true },
      { status: 401 }
    );
  }

  try {
    if (accessToken) {
      const result = await callAsUser(
        "/v1/answer",
        {
          query: prompt,
          search_type: "web",
          start_date: "2015-01-01",
          included_sources: NIGERIAN_OUTLETS,
        },
        accessToken
      );

      if (result.requiresReauth) {
        return NextResponse.json(
          { error: "Your session expired. Sign in again.", requiresAuth: true },
          { status: 401 }
        );
      }

      if (result.requiresCredits) {
        return NextResponse.json(
          { error: "Insufficient credits", message: "Please top up your Valyu credits." },
          { status: 402 }
        );
      }

      if (!result.success) {
        return NextResponse.json(
          { error: result.error ?? "Could not build a briefing" },
          { status: 500 }
        );
      }

      const sources = ((result.data?.search_results ?? []) as Array<{ title?: string; url?: string }>)
        .filter((source) => source.url)
        .map((source) => ({ title: source.title ?? "", url: source.url as string }));

      return NextResponse.json({
        state: state.name,
        answer: (result.data?.contents as string) ?? "",
        sources,
        profile: briefProfile(profile),
      });
    }

    const { answer, sources } = await proseAnswer(
      prompt,
      { startDate: "2015-01-01", includedSources: NIGERIAN_OUTLETS }
    );

    return NextResponse.json({
      state: state.name,
      answer,
      sources,
      profile: briefProfile(profile),
    });
  } catch (error) {
    console.error("State brief failed:", error);
    return NextResponse.json({ error: "Could not build a briefing" }, { status: 500 });
  }
}

function briefProfile(profile: ReturnType<typeof getStateProfile>) {
  return profile
    ? {
        zone: profile.zone,
        capital: profile.capital,
        population: profile.population,
        povertyHeadcount: profile.povertyHeadcount,
        faacAllocationNairaBn: profile.faacAllocationNairaBn,
        densityPerKm2: profile.densityPerKm2,
      }
    : null;
}
