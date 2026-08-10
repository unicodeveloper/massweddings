"use client";

import { useMemo } from "react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { formatNumber } from "@/lib/metrics";
import { FIRST_YEAR, LAST_YEAR } from "@/lib/window";
import { cn } from "@/lib/utils";

/**
 * Year-by-year cadence, doubling as the time filter. It floats over the map
 * rather than sitting in a footer — the footer belongs to the markets panel.
 * Clicking a year isolates it; clicking again clears back to the full decade.
 */
export function TimelineOverlay() {
  const { events, yearRange, setYearRange } = useWeddingsStore();

  // Every year in the window gets a bar, including the empty ones — a quiet year
  // is information, and a gap-free axis makes the cadence readable.
  const years = useMemo(() => {
    if (events.length === 0) return [];

    return Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) => {
      const year = FIRST_YEAR + index;
      const inYear = events.filter((event) => event.year === year);
      return {
        year,
        editions: inYear.length,
        couples: inYear.reduce((sum, event) => sum + (event.couples ?? 0), 0),
      };
    });
  }, [events]);

  if (years.length === 0) return null;

  const maxEditions = Math.max(...years.map((entry) => entry.editions), 1);
  const isSelected = (year: number) => yearRange?.[0] === year && yearRange?.[1] === year;

  return (
    // On phones this sits along the bottom of the map, out of the way of the
    // Layers button in the top corner; from md up it returns to the top left.
    <div className="absolute inset-x-3 bottom-3 rounded-lg border border-border bg-card/95 p-3 backdrop-blur md:inset-x-auto md:bottom-auto md:left-4 md:top-4 md:w-64">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {years[0].year}–{years[years.length - 1].year}
        </span>
        {yearRange && (
          <button
            onClick={() => setYearRange(null)}
            className="text-[10px] text-primary hover:underline"
          >
            all years
          </button>
        )}
      </div>

      <div className="flex h-12 items-end gap-0.5">
        {years.map((entry) => (
          <button
            key={entry.year}
            onClick={() => setYearRange(isSelected(entry.year) ? null : [entry.year, entry.year])}
            title={`${entry.year}: ${entry.editions} ceremonies, ${formatNumber(entry.couples)} couples`}
            className="group flex flex-1 flex-col justify-end"
          >
            <div
              className={cn(
                "w-full rounded-sm transition-all",
                isSelected(entry.year)
                  ? "bg-primary"
                  : yearRange
                    ? "bg-muted group-hover:bg-primary/50"
                    : "bg-primary/50 group-hover:bg-primary/80"
              )}
              style={{ height: `${Math.max((entry.editions / maxEditions) * 40, 3)}px` }}
            />
          </button>
        ))}
      </div>

      <div className="mt-1 flex gap-0.5">
        {years.map((entry) => (
          <span
            key={entry.year}
            className={cn(
              "tabular flex-1 text-center text-[8px]",
              isSelected(entry.year) ? "font-semibold text-primary" : "text-muted-foreground"
            )}
          >
            {String(entry.year).slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
