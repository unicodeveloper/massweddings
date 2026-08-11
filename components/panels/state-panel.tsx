"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCreditErrorStore, CREDIT_ERROR_MESSAGE } from "@/stores/credit-error-store";
import { isSelfHostedMode } from "@/lib/app-mode";
import { getStateProfile } from "@/lib/state-data";
import { formatCompact, formatEventDate, formatNaira, formatNumber } from "@/lib/metrics";
import { SignInModal } from "@/components/auth/sign-in-modal";

interface Brief {
  answer: string;
  sources: Array<{ title: string; url: string }>;
}

/** Detail view for a clicked state: the official figures, its editions, and a live briefing. */
export function StatePanel() {
  const { selectedState, selectState, events } = useWeddingsStore();
  const { getAccessToken } = useAuthStore();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  const profile = selectedState ? getStateProfile(selectedState) : null;
  const needsSignIn = !isSelfHostedMode() && !getAccessToken();
  const stateEvents = useMemo(
    () => events.filter((event) => event.state === selectedState),
    [events, selectedState]
  );

  // A briefing belongs to one state; drop it as soon as the selection changes.
  useEffect(() => {
    setBrief(null);
    setError(null);
  }, [selectedState]);

  const loadBrief = useCallback(async () => {
    if (!selectedState) return;

    const accessToken = getAccessToken();
    if (!isSelfHostedMode() && !accessToken) {
      setShowSignIn(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/state-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: selectedState, accessToken }),
      });
      const data = await response.json();

      if (response.status === 401 || data.requiresAuth) {
        setError(data.error ?? "Sign in to build a state briefing");
        setShowSignIn(true);
        return;
      }

      if (response.status === 402) {
        useCreditErrorStore.getState().setCreditError(CREDIT_ERROR_MESSAGE);
        setError("Insufficient Valyu credits.");
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Could not build a briefing");
        return;
      }
      setBrief({ answer: data.answer, sources: data.sources ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build a briefing");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, selectedState]);

  if (!selectedState || !profile) return null;

  const couples = stateEvents.reduce((sum, event) => sum + (event.couples ?? 0), 0);
  const spend = stateEvents.reduce((sum, event) => sum + (event.costNaira ?? 0), 0);

  return (
    <>
      {/* Full-screen sheet on phones, side panel from md up. */}
      <div className="absolute inset-0 z-20 flex flex-col bg-card shadow-2xl animate-slide-in md:inset-y-0 md:left-auto md:right-0 md:w-[420px] md:border-l md:border-border">
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{profile.name}</h2>
          <p className="text-xs text-muted-foreground">
            {profile.capital} · {profile.zone}
            {profile.shariaState && " · Shari'a penal code"}
          </p>
        </div>
        <button
          onClick={() => selectState(null)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-px bg-border">
          <Metric label="Population" value={formatCompact(profile.population)} note={`${profile.populationYear} projection`} />
          <Metric
            label="Density"
            value={profile.densityPerKm2 ? `${formatNumber(profile.densityPerKm2)}/km²` : "—"}
            note={`${formatNumber(profile.areaKm2)} km²`}
          />
          <Metric
            label="Multidimensional poverty"
            value={profile.povertyHeadcount !== null ? `${profile.povertyHeadcount.toFixed(1)}%` : "no data"}
            note="OPHI · MICS 2021"
          />
          <Metric
            label="Age at first marriage"
            value={
              profile.medianAgeAtFirstMarriage !== null
                ? `${profile.medianAgeAtFirstMarriage.toFixed(1)} yrs`
                : "no data"
            }
            note="women 25–49 · NDHS 2023–24"
          />
          <Metric
            label="Households w/ electricity"
            value={
              profile.householdsWithElectricity !== null
                ? `${profile.householdsWithElectricity.toFixed(1)}%`
                : "no data"
            }
            note="NDHS 2023–24"
          />
          <Metric
            label="Women literate"
            value={profile.womenLiterate !== null ? `${profile.womenLiterate.toFixed(1)}%` : "no data"}
            note="NDHS 2023–24"
          />
          <Metric
            label={`FAAC ${profile.faacYear}`}
            value={
              profile.faacAllocationNairaBn !== null
                ? `₦${profile.faacAllocationNairaBn.toFixed(1)}bn`
                : "no data"
            }
            note={
              profile.faacPerCapitaNaira
                ? `₦${formatNumber(profile.faacPerCapitaNaira)} per resident`
                : "reported figure"
            }
            href={profile.faacSourceUrl ?? undefined}
          />
        </div>

        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Mass weddings on record</h3>
            <span className="tabular text-xs text-muted-foreground">
              {stateEvents.length} · {formatNumber(couples)} couples
              {spend > 0 && ` · ${formatNaira(spend)}`}
            </span>
          </div>

          {stateEvents.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              No government-sponsored mass wedding was found for {profile.name} in the search window.
              That is an absence of reporting we could find, not proof none happened — use the
              briefing below to check.
            </p>
          ) : (
            <ul className="space-y-2">
              {stateEvents.map((event) => (
                <li key={event.id} className="rounded-md border border-border p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="tabular text-xs font-semibold">
                      {formatEventDate(event.date, event.datePrecision)}
                    </span>
                    <span className="tabular text-xs">
                      {event.couples ? `${formatNumber(event.couples)} couples` : "count unreported"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {event.summary || event.title}
                  </p>
                  {event.sources[0] && (
                    <a
                      href={event.sources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      {event.sources[0].outlet || "source"}
                      {event.sources.length > 1 && ` +${event.sources.length - 1}`}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Live briefing</h3>
            <button
              onClick={needsSignIn ? () => setShowSignIn(true) : loadBrief}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {needsSignIn ? "Sign in to research" : brief ? "Refresh" : "Research with Valyu"}
            </button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {isLoading && !brief && (
            <p className="text-xs text-muted-foreground">
              Searching Nigerian outlets for {profile.name}&apos;s programme history…
            </p>
          )}

          {brief && (
            <div className="space-y-3">
              <div className="prose max-w-none text-xs leading-relaxed dark:prose-invert [&_h2]:mt-3 [&_h2]:text-sm [&_h3]:mt-3 [&_h3]:text-xs [&_li]:my-0.5 [&_p]:my-2 [&_table]:text-[10px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{brief.answer}</ReactMarkdown>
              </div>

              {brief.sources.length > 0 && (
                <div className="border-t border-border pt-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {brief.sources.length} sources
                  </p>
                  <ul className="space-y-0.5">
                    {brief.sources.slice(0, 10).map((source) => (
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
      </div>

      <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
    </>
  );
}

function Metric({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note: string;
  href?: string;
}) {
  return (
    <div className="bg-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="tabular mt-0.5 text-base font-semibold leading-none">{value}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[10px] text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
        >
          {note}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ) : (
        <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>
      )}
    </div>
  );
}
