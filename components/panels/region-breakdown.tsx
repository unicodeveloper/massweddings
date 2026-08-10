"use client";

import { useMemo, useState } from "react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { summariseByZone, type ZoneSummary } from "@/lib/state-data";
import { formatNumber } from "@/lib/metrics";
import { cn } from "@/lib/utils";

type Mode = "editions" | "couples" | "per-capita";

const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  { id: "editions", label: "Ceremonies", hint: "Number of mass wedding editions recorded" },
  { id: "couples", label: "Couples", hint: "Total couples married across all editions" },
  {
    id: "per-capita",
    label: "Per 10m people",
    hint: "Editions per 10 million residents — removes the effect of zone size",
  },
];

function valueFor(zone: ZoneSummary, mode: Mode): number {
  if (mode === "editions") return zone.editions;
  if (mode === "couples") return zone.couples;
  return zone.editionsPer10m;
}

function formatValue(value: number, mode: Mode): string {
  if (mode === "per-capita") return value.toFixed(1);
  return formatNumber(Math.round(value));
}

/**
 * The regional picture: how the programme splits across Nigeria's six
 * geopolitical zones, in absolute terms and per head of population.
 */
export function RegionBreakdown() {
  const { eventsBeforeZoneFilter, zoneFilters, toggleZone } = useWeddingsStore();
  const [mode, setMode] = useState<Mode>("editions");

  // Built from the zone-agnostic set so selecting a zone highlights it rather
  // than zeroing out every other bar.
  const zones = useMemo(
    () => summariseByZone(eventsBeforeZoneFilter),
    [eventsBeforeZoneFilter]
  );
  const max = Math.max(...zones.map((zone) => valueFor(zone, mode)), 1);

  const north = zones.filter((zone) => zone.zone.startsWith("North"));
  const south = zones.filter((zone) => zone.zone.startsWith("South"));
  const northEditions = north.reduce((sum, zone) => sum + zone.editions, 0);
  const southEditions = south.reduce((sum, zone) => sum + zone.editions, 0);
  const total = northEditions + southEditions;

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">By region</h3>
        {zoneFilters.length > 0 ? (
          <button
            onClick={() => zoneFilters.forEach(toggleZone)}
            className="text-[10px] text-primary hover:underline"
          >
            clear region filter
          </button>
        ) : (
          <span className="text-[10px] text-muted-foreground">click to filter</span>
        )}
      </div>

      <div className="flex gap-1 rounded-md bg-muted p-0.5">
        {MODES.map((option) => (
          <button
            key={option.id}
            onClick={() => setMode(option.id)}
            title={option.hint}
            className={cn(
              "flex-1 rounded px-2 py-1 text-[11px] transition-colors",
              mode === option.id
                ? "bg-card font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {zones.map((zone) => {
          const value = valueFor(zone, mode);
          const isActive = zoneFilters.includes(zone.zone);
          const isDimmed = zoneFilters.length > 0 && !isActive;

          return (
            <button
              key={zone.zone}
              onClick={() => toggleZone(zone.zone)}
              className={cn(
                "w-full space-y-1 rounded-md px-1.5 py-1 text-left transition-opacity hover:bg-accent",
                isDimmed && "opacity-40"
              )}
            >
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className={cn("truncate", isActive && "font-semibold")}>{zone.label}</span>
                <span className="tabular font-semibold">{formatValue(value, mode)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%`,
                    backgroundColor: zone.colour,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {zone.statesWithEditions}/{zone.states} states ·{" "}
                  {zone.averagePoverty !== null ? `${zone.averagePoverty.toFixed(0)}% poor` : "—"}
                </span>
                <span className="tabular">{formatNumber(zone.couples)} couples</span>
              </div>
            </button>
          );
        })}
      </div>

      {total > 0 && (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-orange-500"
              style={{ width: `${(northEditions / total) * 100}%` }}
            />
            <div className="bg-cyan-400" style={{ width: `${(southEditions / total) * 100}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-orange-400">
              {((northEditions / total) * 100).toFixed(0)}%
            </span>{" "}
            of recorded ceremonies are in the three northern zones,{" "}
            <span className="font-semibold text-cyan-400">
              {((southEditions / total) * 100).toFixed(0)}%
            </span>{" "}
            in the three southern ones — across{" "}
            {formatNumber(north.reduce((sum, zone) => sum + zone.population, 0) / 1_000_000)}m and{" "}
            {formatNumber(south.reduce((sum, zone) => sum + zone.population, 0) / 1_000_000)}m
            residents respectively.
          </p>
        </div>
      )}
    </div>
  );
}
