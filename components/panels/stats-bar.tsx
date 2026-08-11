"use client";

import { useMemo } from "react";
import { CalendarDays, Coins, HeartHandshake, MapPinned } from "lucide-react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { formatCompact, formatNaira, formatNumber } from "@/lib/metrics";
import { WINDOW_LABEL, WINDOW_YEARS } from "@/lib/window";

/** The headline numbers, recomputed against whatever filters are active. */
export function StatsBar() {
  const { filteredEvents } = useWeddingsStore();

  const stats = useMemo(() => {
    const couples = filteredEvents.reduce((sum, event) => sum + (event.couples ?? 0), 0);
    const spend = filteredEvents.reduce((sum, event) => sum + (event.costNaira ?? 0), 0);
    const states = new Set(filteredEvents.map((event) => event.state));
    const years = new Set(filteredEvents.map((event) => event.year));
    // Only ceremonies that actually took place — an announced figure is not a record.
    const biggest = filteredEvents.reduce<number>(
      (max, event) => (event.held ? Math.max(max, event.couples ?? 0) : max),
      0
    );

    return {
      editions: filteredEvents.length,
      couples,
      spend,
      states: states.size,
      years: years.size,
      biggest,
    };
  }, [filteredEvents]);

  const items = [
    {
      icon: CalendarDays,
      label: "Ceremonies",
      value: formatNumber(stats.editions),
      hint: `${WINDOW_LABEL} · ${WINDOW_YEARS}-year window`,
    },
    {
      icon: HeartHandshake,
      label: "Couples married",
      value: formatCompact(stats.couples),
      hint: `largest edition: ${formatCompact(stats.biggest)}`,
    },
    {
      icon: MapPinned,
      label: "States involved",
      value: `${stats.states}`,
      hint: "of 36 states + FCT",
    },
    {
      icon: Coins,
      label: "Reported spend",
      value: formatNaira(stats.spend),
      hint: "where a cost was published",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px border-b border-border bg-border [@media(max-height:500px)]:hidden md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <item.icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.label}</span>
          </div>
          <p className="tabular mt-1 text-lg font-semibold leading-none md:text-xl">{item.value}</p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
