"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { useMapStore } from "@/stores/map-store";
import { useUiStore } from "@/stores/ui-store";
import { povertyCorrelation, summariseByState } from "@/lib/state-data";
import { formatCompact, formatNumber } from "@/lib/metrics";
import { cn } from "@/lib/utils";

type SortKey = "editions" | "couples" | "poverty" | "perCapita";

const SORTS: Array<{ id: SortKey; label: string }> = [
  { id: "editions", label: "Ceremonies" },
  { id: "couples", label: "Couples" },
  { id: "perCapita", label: "Per 100k women" },
  { id: "poverty", label: "Poverty" },
];

/** State league table, with the poverty figure alongside so the pattern is visible. */
export function StateRanking() {
  const { filteredEvents, selectState } = useWeddingsStore();
  const { flyTo } = useMapStore();
  const showMap = useUiStore((state) => state.showMap);
  const [sort, setSort] = useState<SortKey>("editions");
  const [showAll, setShowAll] = useState(false);

  const summaries = useMemo(() => summariseByState(filteredEvents), [filteredEvents]);
  const correlation = useMemo(() => povertyCorrelation(filteredEvents), [filteredEvents]);

  const sorted = useMemo(() => {
    const withActivity = summaries.filter((summary) => summary.editions > 0);
    const rows = showAll ? summaries : withActivity;

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "couples":
          return b.couples - a.couples;
        case "poverty":
          return (b.profile.povertyHeadcount ?? -1) - (a.profile.povertyHeadcount ?? -1);
        case "perCapita":
          return (b.couplesPer100kMarriageAge ?? -1) - (a.couplesPer100kMarriageAge ?? -1);
        default:
          return b.editions - a.editions || b.couples - a.couples;
      }
    });
  }, [summaries, sort, showAll]);

  const maxCouples = Math.max(...summaries.map((summary) => summary.couples), 1);
  const withActivityCount = summaries.filter((summary) => summary.editions > 0).length;

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">By state</h3>
        <span className="text-[10px] text-muted-foreground">
          {withActivityCount} of 37 have a record
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {SORTS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSort(option.id)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
              sort === option.id
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {sort === option.id && <ArrowUpDown className="h-2.5 w-2.5" />}
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {sorted.map((summary) => (
          <button
            key={summary.state}
            onClick={() => {
              selectState(summary.state);
              flyTo(summary.profile.lng, summary.profile.lat, 7);
              // The state panel lives over the map, which is hidden on phones
              // while a sidebar panel is open — switch back or the tap does nothing.
              showMap();
            }}
            className="group w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-medium">{summary.state}</span>
              <span className="tabular shrink-0 text-xs">
                {summary.editions > 0 ? (
                  <>
                    <span className="font-semibold">{summary.editions}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatCompact(summary.couples)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">none</span>
                )}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-pink-500/80"
                  style={{ width: `${(summary.couples / maxCouples) * 100}%` }}
                />
              </div>
              <span className="tabular w-11 shrink-0 text-right text-[10px] text-muted-foreground">
                {summary.profile.povertyHeadcount !== null
                  ? `${summary.profile.povertyHeadcount.toFixed(0)}%`
                  : "—"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAll(!showAll)}
        className="w-full rounded-md border border-border py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {showAll ? "Hide states with no record" : `Show all 37 states`}
      </button>

      {correlation && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Poverty rate against ceremony count across {correlation.n} states:{" "}
          <span className="tabular font-semibold text-foreground">
            r = {correlation.r.toFixed(2)}
          </span>
          . A descriptive correlation only — it says the programmes cluster in poorer states, not
          that poverty causes them.
        </div>
      )}
    </div>
  );
}
