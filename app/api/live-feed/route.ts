import { NextResponse } from "next/server";
import { callAsUser, cleanArticle, NIGERIAN_OUTLETS, searchNews } from "@/lib/valyu";
import { isSelfHostedMode } from "@/lib/app-mode";
import { resolveState } from "@/lib/nigeria";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Rolling coverage of mass weddings and the marriage-cost politics around them.
 * Unlike the mapped dataset — which is a curated, de-duplicated history — this is
 * raw, recent reporting, refreshed on demand.
 */
const FEED_QUERIES = [
  "Nigeria mass wedding couples state government latest",
  "Hisbah mass wedding Nigeria dowry couples news",
  "Nigeria mass wedding announcement screening couples",
  "Nigeria cost of marriage dowry policy state government",
];

interface FeedItem {
  title: string;
  url: string;
  outlet: string;
  excerpt: string;
  publishedDate?: string;
  state?: string;
}

/** Pick out the first Nigerian state named in the headline, for the state chip. */
function detectState(text: string): string | undefined {
  const candidates = text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?\b/g) ?? [];
  for (const candidate of candidates) {
    const state = resolveState(candidate);
    if (state) return state.name;
  }
  return undefined;
}

function toFeedItems(
  results: Array<{ title: string; url: string; content: string; outlet: string; publishedDate?: string }>
): FeedItem[] {
  const seen = new Set<string>();
  const items: FeedItem[] = [];

  for (const result of results) {
    const key = result.url.split("?")[0].replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (!result.title || result.content.length < 120) continue;

    items.push({
      title: result.title,
      url: result.url,
      outlet: result.outlet,
      excerpt: result.content.slice(0, 260).trim(),
      publishedDate: result.publishedDate,
      state: detectState(result.title),
    });
  }

  return items;
}

export async function POST(request: Request) {
  let accessToken: string | undefined;

  try {
    const body = await request.json();
    accessToken = body?.accessToken;
  } catch {
    // No body — fall through to the self-hosted check below.
  }

  const selfHosted = isSelfHostedMode();

  // In hosted mode the feed runs on the reader's own Valyu credits, so it needs a session.
  if (!selfHosted && !accessToken) {
    return NextResponse.json(
      { error: "Sign in to load the live feed", requiresAuth: true },
      { status: 401 }
    );
  }

  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    if (accessToken) {
      const responses = await Promise.all(
        FEED_QUERIES.map((query) =>
          callAsUser(
            "/v1/search",
            {
              query,
              searchType: "news",
              maxNumResults: 12,
              start_date: startDate,
              included_sources: NIGERIAN_OUTLETS,
            },
            accessToken as string
          )
        )
      );

      if (responses.some((r) => r.requiresReauth)) {
        return NextResponse.json(
          { error: "Your session expired. Sign in again.", requiresAuth: true },
          { status: 401 }
        );
      }

      if (responses.some((r) => r.requiresCredits)) {
        return NextResponse.json(
          { error: "Insufficient credits", message: "Please top up your Valyu credits." },
          { status: 402 }
        );
      }

      const results = responses.flatMap((response) => {
        const raw = (response.data?.results ?? []) as Array<Record<string, unknown>>;
        return raw.map((item) => ({
          title: String(item.title ?? ""),
          url: String(item.url ?? ""),
          content: cleanArticle(
            typeof item.content === "string" ? item.content : JSON.stringify(item.content ?? "")
          ),
          outlet: hostOf(String(item.url ?? "")),
          publishedDate: (item.publication_date ?? item.date) as string | undefined,
        }));
      });

      return NextResponse.json({ items: toFeedItems(results), fetchedAt: new Date().toISOString() });
    }

    // Self-hosted: the server's own key.
    const batches = await Promise.all(
      FEED_QUERIES.map((query) =>
        searchNews(query, { maxResults: 12, startDate, includedSources: NIGERIAN_OUTLETS })
      )
    );

    return NextResponse.json({
      items: toFeedItems(batches.flat()),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Live feed failed:", error);
    return NextResponse.json({ error: "Could not load the live feed" }, { status: 500 });
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
