import { NextResponse } from "next/server";
import { callAsUser, proseAnswer } from "@/lib/valyu";
import { isSelfHostedMode } from "@/lib/app-mode";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * Free-form research against Valyu — a state, a governor, a Hisbah board, a
 * programme, a claim to check. Runs on the signed-in reader's credits.
 */
export async function POST(request: Request) {
  let query: string | undefined;
  let accessToken: string | undefined;
  let angle: string | undefined;

  try {
    const body = await request.json();
    query = body?.query;
    accessToken = body?.accessToken;
    angle = body?.angle;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: "Enter something to research" }, { status: 400 });
  }

  const selfHosted = isSelfHostedMode();
  if (!selfHosted && !accessToken) {
    return NextResponse.json(
      { error: "Sign in to run intel research", requiresAuth: true },
      { status: 401 }
    );
  }

  const prompt = buildPrompt(query.trim(), angle);

  try {
    if (accessToken) {
      const result = await callAsUser(
        "/v1/answer",
        { query: prompt, search_type: "web", excluded_sources: ["wikipedia.org"] },
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
        return NextResponse.json({ error: result.error ?? "Research failed" }, { status: 500 });
      }

      const sources = ((result.data?.search_results ?? []) as Array<{ title?: string; url?: string }>)
        .filter((source) => source.url)
        .map((source) => ({ title: source.title ?? "", url: source.url as string }));

      return NextResponse.json({
        query,
        answer: (result.data?.contents as string) ?? "",
        sources,
      });
    }

    const { answer, sources } = await proseAnswer(prompt);
    return NextResponse.json({ query, answer, sources });
  } catch (error) {
    console.error("Intel research failed:", error);
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}

/** Angle presets keep the answers pointed at this map's subject matter. */
function buildPrompt(query: string, angle?: string): string {
  switch (angle) {
    case "programme":
      return `Explain the mass wedding programme associated with ${query} in Nigeria: who runs it, how it is funded, how many editions have been held and when, how many couples each married, the dowry arrangements, and how beneficiaries are selected. Cite the reporting.`;
    case "spending":
      return `How much public money has been spent on ${query} in Nigeria, and on what exactly? Give the figures, the budget lines or approvals behind them, and what critics and civil society groups have said about the spending. Cite the reporting.`;
    case "criticism":
      return `What criticism, controversy or scrutiny has ${query} attracted in Nigeria? Cover the arguments made against it, who is making them, and any responses from the authorities involved. Cite the reporting.`;
    case "background":
      return `Give a factual background briefing on ${query} in the Nigerian context: who or what it is, its role, and why it matters to state-sponsored mass wedding programmes. Cite the reporting.`;
    default:
      return `${query}\n\nAnswer with specifics from Nigerian reporting, cite your sources, and say plainly when the record is unclear or contested.`;
  }
}
