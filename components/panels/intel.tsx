"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useCreditErrorStore, CREDIT_ERROR_MESSAGE } from "@/stores/credit-error-store";
import { cn } from "@/lib/utils";
import { SignInGate } from "./sign-in-gate";

const ANGLES = [
  { id: "programme", label: "Programme" },
  { id: "spending", label: "Spending" },
  { id: "criticism", label: "Criticism" },
  { id: "background", label: "Background" },
  { id: "open", label: "Open question" },
] as const;

type Angle = (typeof ANGLES)[number]["id"];

const SUGGESTIONS = [
  "Kano State Hisbah Board",
  "Kebbi mass wedding programme",
  "Zamfara zakat board weddings",
  "Cost of marriage in northern Nigeria",
];

/** Free-form research on anything the map raises, answered with citations. */
export function Intel() {
  return (
    <SignInGate
      feature="Intel"
      description="Runs Valyu research on any state, board, governor or claim behind these programmes — on your own credits."
    >
      <IntelContent />
    </SignInGate>
  );
}

function IntelContent() {
  const { getAccessToken } = useAuthStore();
  const [query, setQuery] = useState("");
  const [angle, setAngle] = useState<Angle>("programme");
  const [result, setResult] = useState<{
    query: string;
    answer: string;
    sources: Array<{ title: string; url: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const research = useCallback(
    async (subject: string) => {
      if (subject.trim().length < 3) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/intel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: subject,
            angle: angle === "open" ? undefined : angle,
            accessToken: getAccessToken(),
          }),
        });

        const data = await response.json();

        if (response.status === 402) {
          useCreditErrorStore.getState().setCreditError(CREDIT_ERROR_MESSAGE);
          setError("Insufficient Valyu credits.");
          return;
        }

        if (!response.ok) {
          setError(data.error ?? "Research failed");
          return;
        }

        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Research failed");
      } finally {
        setIsLoading(false);
      }
    },
    [angle, getAccessToken]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            research(query);
          }}
          className="relative"
        >
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="A state, a board, a governor, a claim…"
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-16 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={isLoading || query.trim().length < 3}
            className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Run
          </button>
        </form>

        <div className="flex flex-wrap gap-1">
          {ANGLES.map((option) => (
            <button
              key={option.id}
              onClick={() => setAngle(option.id)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                angle === option.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!result && !isLoading && !error && (
          <div className="space-y-3 p-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Every answer is searched fresh and comes back with its sources. Try:
            </p>
            <ul className="space-y-1">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    onClick={() => {
                      setQuery(suggestion);
                      research(suggestion);
                    }}
                    className="w-full rounded-md border border-border px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Researching…
          </div>
        )}

        {error && <p className="p-4 text-xs text-destructive">{error}</p>}

        {result && !isLoading && (
          <div className="space-y-3 p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {result.query}
            </p>

            <div className="prose max-w-none text-xs leading-relaxed dark:prose-invert [&_h2]:mt-3 [&_h2]:text-sm [&_h3]:mt-3 [&_h3]:text-xs [&_li]:my-0.5 [&_p]:my-2 [&_table]:text-[10px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
            </div>

            {result.sources.length > 0 && (
              <div className="border-t border-border pt-2">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {result.sources.length} sources
                </p>
                <ul className="space-y-0.5">
                  {result.sources.slice(0, 12).map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-1 text-[10px] text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
                      >
                        {source.title || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
