"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, Radio } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useCreditErrorStore, CREDIT_ERROR_MESSAGE } from "@/stores/credit-error-store";
import { SignInGate } from "./sign-in-gate";

interface FeedItem {
  title: string;
  url: string;
  outlet: string;
  excerpt: string;
  publishedDate?: string;
  state?: string;
}

/**
 * Rolling coverage, fetched live rather than read from the cached dataset —
 * what the papers are saying about mass weddings right now.
 */
export function LiveFeed() {
  return (
    <SignInGate
      feature="Live Feed"
      description="Pulls the last 90 days of Nigerian reporting on mass weddings straight from Valyu, on your own credits."
    >
      <LiveFeedContent />
    </SignInGate>
  );
}

function LiveFeedContent() {
  const { getAccessToken } = useAuthStore();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/live-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: getAccessToken() }),
      });

      const data = await response.json();

      if (response.status === 402) {
        useCreditErrorStore.getState().setCreditError(CREDIT_ERROR_MESSAGE);
        setError("Insufficient Valyu credits.");
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Could not load the feed");
        return;
      }

      setItems(data.items ?? []);
      setFetchedAt(data.fetchedAt ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the feed");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2 text-xs">
          <Radio className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold">Live coverage</span>
          {fetchedAt && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(fetchedAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && items.length === 0 && (
          <div className="flex items-center justify-center gap-2 p-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching Nigerian outlets…
          </div>
        )}

        {error && <p className="p-4 text-xs text-destructive">{error}</p>}

        {!isLoading && !error && items.length === 0 && (
          <p className="p-6 text-center text-xs text-muted-foreground">
            Nothing in the last 90 days.
          </p>
        )}

        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.url} className="animate-slide-in">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block space-y-1.5 p-3 transition-colors hover:bg-accent"
              >
                <p className="line-clamp-2 text-xs font-medium leading-snug">{item.title}</p>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {item.excerpt}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <ExternalLink className="h-2.5 w-2.5" />
                  <span>{item.outlet}</span>
                  {item.state && (
                    <>
                      <span>·</span>
                      <span className="rounded-full border border-border px-1.5">{item.state}</span>
                    </>
                  )}
                  {item.publishedDate && (
                    <>
                      <span>·</span>
                      <span className="tabular">
                        {new Date(item.publishedDate).toLocaleDateString("en-GB")}
                      </span>
                    </>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
