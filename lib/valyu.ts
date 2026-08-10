import { Valyu } from "valyu-js";

let client: Valyu | null = null;

function getClient(): Valyu {
  if (!client) {
    const apiKey = process.env.VALYU_API_KEY;
    if (!apiKey) throw new Error("VALYU_API_KEY environment variable is not set");
    client = new Valyu(apiKey);
  }
  return client;
}

const OAUTH_PROXY_URL =
  process.env.VALYU_OAUTH_PROXY_URL ||
  `${process.env.VALYU_APP_URL || "https://platform.valyu.ai"}/api/oauth/proxy`;

export interface ProxyResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  requiresReauth?: boolean;
  requiresCredits?: boolean;
}

function looksLikeCreditError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("insufficient credits") ||
    lower.includes("credit limit exceeded") ||
    lower.includes("no credits available") ||
    message.includes("402")
  );
}

/**
 * Call Valyu on behalf of a signed-in user, through the platform's OAuth proxy.
 *
 * The interactive features — Live Feed and Intel — run through here rather than
 * the server's own API key, so the credits spent belong to whoever is signed in.
 */
export async function callAsUser(
  path: string,
  body: Record<string, unknown>,
  accessToken: string
): Promise<ProxyResult> {
  try {
    const response = await fetch(OAUTH_PROXY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, method: "POST", body }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Session expired", requiresReauth: true };
      }
      if (response.status === 402) {
        return { success: false, error: "Insufficient credits", requiresCredits: true };
      }
      try {
        const errorData = await response.json();
        const message = errorData.error || errorData.message || "";
        if (looksLikeCreditError(message)) {
          return { success: false, error: message, requiresCredits: true };
        }
        return { success: false, error: message || `Valyu call failed: ${response.status}` };
      } catch {
        return { success: false, error: `Valyu call failed: ${response.status}` };
      }
    }

    const text = await response.text();

    // The proxy answers /v1/answer as an SSE stream; fold it back into one object.
    if (text.startsWith("data: ")) {
      let contents = "";
      let searchResults: Array<{ title?: string; url?: string }> = [];

      for (const line of text.split("\n").filter((l) => l.startsWith("data: "))) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.search_results) searchResults = parsed.search_results;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) contents += delta;
        } catch {
          // Skip keep-alives and the trailing [DONE] marker.
        }
      }

      return {
        success: true,
        data: {
          contents: contents || undefined,
          search_results: searchResults.length > 0 ? searchResults : undefined,
        },
      };
    }

    try {
      return { success: true, data: JSON.parse(text) };
    } catch {
      return { success: false, error: `Unreadable response: ${text.slice(0, 160)}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Valyu error",
    };
  }
}

export interface ValyuArticle {
  title: string;
  url: string;
  content: string;
  outlet: string;
  publishedDate?: string;
}

/**
 * Nigerian outlets that actually cover state-level ceremonies. Foreign wires pick
 * up the headline Kano editions but never the Kebbi or Gombe ones, so the
 * recall pass leans on these.
 */
export const NIGERIAN_OUTLETS = [
  "dailytrust.com",
  "punchng.com",
  "vanguardngr.com",
  "premiumtimesng.com",
  "thenationonlineng.net",
  "leadership.ng",
  "channelstv.com",
  "thisdaylive.com",
  "dailypost.ng",
  "tribuneonlineng.com",
  "blueprint.ng",
  "sunnewsonline.com",
  "guardian.ng",
  "legit.ng",
  "nannews.ng",
  "arise.tv",
  "peoplesgazette.com",
  "thecable.ng",
];

/** Aggregators and syndication mirrors that add copies without adding facts. */
const BLOCKED_HOSTS = [
  "x.com",
  "twitter.com",
  "facebook.com",
  "youtube.com",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "wikipedia.org",
  "canberratimes.com.au",
  "bordermail.com.au",
  "standard.net.au",
  "theadvocate.com.au",
  "northerndailyleader.com.au",
  "dailyliberal.com.au",
  "nvi.com.au",
  "yahoo.com",
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isBlocked(url: string): boolean {
  const host = hostOf(url);
  return BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

/** Strip nav chrome, share widgets and image markup so the extractor sees prose. */
export function cleanArticle(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\b(Share|Tweet|WhatsApp|Facebook|Telegram|Print|Advertisement|PAY ATTENTION)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface SearchOptions {
  maxResults?: number;
  startDate?: string;
  endDate?: string;
  includedSources?: string[];
}

/** One Valyu web search, cleaned and de-chromed. */
export async function searchNews(
  query: string,
  options: SearchOptions = {}
): Promise<ValyuArticle[]> {
  const valyu = getClient();

  try {
    const response = await valyu.search(query, {
      searchType: "web",
      maxNumResults: options.maxResults ?? 20,
      relevanceThreshold: 0.4,
      ...(options.startDate ? { startDate: options.startDate } : {}),
      ...(options.endDate ? { endDate: options.endDate } : {}),
      ...(options.includedSources ? { includedSources: options.includedSources } : {}),
    });

    if (!response.success) {
      console.error(`Valyu search failed for "${query}":`, response.error);
      return [];
    }

    return (response.results ?? [])
      .filter((result) => result.url && !isBlocked(result.url))
      .map((result) => ({
        title: result.title ?? "",
        url: result.url,
        content: cleanArticle(
          typeof result.content === "string" ? result.content : JSON.stringify(result.content)
        ),
        outlet: hostOf(result.url),
        publishedDate: result.publication_date || result.date || undefined,
      }));
  } catch (error) {
    console.error(`Valyu search threw for "${query}":`, error);
    return [];
  }
}

export interface StructuredAnswer<T> {
  data: T | null;
  sources: Array<{ title: string; url: string }>;
  error?: string;
}

/**
 * Ask Valyu a question and get JSON back against a schema, with the sources it
 * read. Used both for the roundup pass over ceremonies and for the socioeconomic
 * figures — any field it cannot source comes back null rather than invented.
 */
export async function structuredAnswer<T>(
  query: string,
  schema: Record<string, unknown>,
  options: SearchOptions & { systemInstructions?: string } = {}
): Promise<StructuredAnswer<T>> {
  const valyu = getClient();

  try {
    const response = (await valyu.answer(query, {
      structuredOutput: schema,
      searchType: "web",
      ...(options.startDate ? { startDate: options.startDate } : {}),
      ...(options.endDate ? { endDate: options.endDate } : {}),
      ...(options.includedSources ? { includedSources: options.includedSources } : {}),
      ...(options.systemInstructions ? { systemInstructions: options.systemInstructions } : {}),
    })) as {
      success: boolean;
      contents?: string | object;
      search_results?: Array<{ title?: string; url?: string }>;
      error?: string;
    };

    if (!response.success) {
      return { data: null, sources: [], error: response.error ?? "Valyu answer failed" };
    }

    const sources = (response.search_results ?? [])
      .filter((result) => result.url)
      .map((result) => ({ title: result.title ?? "", url: result.url as string }));

    const contents = response.contents;
    if (contents == null) return { data: null, sources, error: "Empty answer" };

    if (typeof contents === "object") return { data: contents as T, sources };

    try {
      return { data: JSON.parse(contents) as T, sources };
    } catch {
      // Occasionally the model wraps the JSON in prose or a code fence.
      const match = contents.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return { data: JSON.parse(match[0]) as T, sources };
        } catch {
          /* fall through */
        }
      }
      return { data: null, sources, error: "Could not parse structured answer" };
    }
  } catch (error) {
    return {
      data: null,
      sources: [],
      error: error instanceof Error ? error.message : "Unknown Valyu error",
    };
  }
}

/** Prose answer with citations, for the per-state briefing panel. */
export async function proseAnswer(
  query: string,
  options: SearchOptions = {}
): Promise<{ answer: string; sources: Array<{ title: string; url: string }> }> {
  const valyu = getClient();

  try {
    const response = (await valyu.answer(query, {
      searchType: "web",
      ...(options.startDate ? { startDate: options.startDate } : {}),
      ...(options.includedSources ? { includedSources: options.includedSources } : {}),
    })) as {
      success: boolean;
      contents?: string;
      search_results?: Array<{ title?: string; url?: string }>;
      error?: string;
    };

    if (!response.success || !response.contents) {
      return { answer: "", sources: [] };
    }

    return {
      answer: typeof response.contents === "string" ? response.contents : "",
      sources: (response.search_results ?? [])
        .filter((result) => result.url)
        .map((result) => ({ title: result.title ?? "", url: result.url as string })),
    };
  } catch (error) {
    console.error("Valyu answer threw:", error);
    return { answer: "", sources: [] };
  }
}
