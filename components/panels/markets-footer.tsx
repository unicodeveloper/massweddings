"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProbability, formatVolume, getLeadingOutcome, type ParsedMarket } from "@/lib/polymarket";

/**
 * Heights live in classes rather than inline styles so the drawer can be shorter
 * on a phone, where 260px would swallow most of the viewport.
 */
const COLLAPSED = "h-11";
const EXPANDED = "h-[200px] md:h-[260px]";
const ROW = "h-11";
const BODY = "h-[156px] md:h-[216px]";

/** What the panel searches Polymarket for, most specific first. */
const FEEDS = [
  { id: "nigeria", label: "Nigeria", query: "Nigeria", tag: "africa" },
  { id: "africa", label: "Africa", query: "", tag: "africa" },
  { id: "global", label: "Geopolitics", query: "", tag: "" },
] as const;

type FeedId = (typeof FEEDS)[number]["id"];

/**
 * Prediction markets along the bottom of the app. Nigeria-first, because the
 * story that started this map came off a Polymarket feed in the first place.
 */
export function MarketsFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feed, setFeed] = useState<FeedId>("nigeria");
  const [markets, setMarkets] = useState<ParsedMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const entry = FEEDS.find((item) => item.id === feed);
    const url = entry?.query
      ? `/api/polymarket?type=search&query=${encodeURIComponent(entry.query)}&tag=${entry.tag}&limit=24`
      : entry?.tag
        ? `/api/polymarket?type=tag&tag=${entry.tag}&limit=24`
        : "/api/polymarket?type=geopolitical&limit=24";

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMarkets(data.markets ?? []);
        setUpdatedAt(new Date());
      } else {
        setError(data.error ?? "Could not load markets");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load markets");
    } finally {
      setIsLoading(false);
    }
  }, [feed]);

  // Only fetch once the reader opens the drawer, then whenever the feed changes.
  useEffect(() => {
    if (isExpanded) load();
  }, [isExpanded, load]);

  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(load, 300_000);
    return () => clearInterval(interval);
  }, [isExpanded, load]);

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden border-t border-border bg-card transition-[height] duration-300",
        isExpanded ? EXPANDED : COLLAPSED
      )}
    >
      <div className={cn("flex items-center justify-between gap-2 px-3 md:px-4", ROW)}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold">Prediction markets</span>
          <span className="hidden text-[10px] text-muted-foreground lg:inline">
            powered by Polymarket
          </span>
          {markets.length > 0 && !isExpanded && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
              {markets.length} live
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {isExpanded && (
            <>
              <div className="flex gap-1">
                {FEEDS.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setFeed(entry.id)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                      feed === entry.id
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>

              {updatedAt && (
                <span className="hidden text-[10px] text-muted-foreground md:inline">
                  {updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}

              <button
                onClick={load}
                disabled={isLoading}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="Refresh markets"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </button>

              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                View all
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={isExpanded ? "Collapse markets" : "Expand markets"}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={cn("overflow-x-auto border-t border-border px-3 py-3 md:px-4", BODY)}>
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isLoading && markets.length === 0 && (
            <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading markets…
            </div>
          )}

          {!isLoading && !error && markets.length === 0 && (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No open markets in this feed right now.
            </div>
          )}

          {markets.length > 0 && (
            <div className="flex h-full gap-3">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MarketCard({ market }: { market: ParsedMarket }) {
  const leading = getLeadingOutcome(market);
  const tone =
    leading.probability >= 70
      ? "bg-green-500/20 text-green-400"
      : leading.probability <= 30
        ? "bg-red-500/20 text-red-400"
        : "bg-yellow-500/20 text-yellow-400";

  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full w-56 shrink-0 flex-col rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent md:w-64"
    >
      <p className="line-clamp-3 text-xs font-medium leading-snug transition-colors group-hover:text-primary">
        {market.question}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {market.outcomes.slice(0, 2).map((outcome) => (
          <span
            key={outcome.label}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              outcome.label === leading.label ? tone : "bg-muted text-muted-foreground"
            )}
          >
            {outcome.label} {formatProbability(outcome.probability)}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Vol {formatVolume(market.volume)}</span>
        {market.endDate && <span>Ends {new Date(market.endDate).toLocaleDateString("en-GB")}</span>}
      </div>
    </a>
  );
}
