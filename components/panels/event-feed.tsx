"use client";

import { Search, X } from "lucide-react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { useMapStore } from "@/stores/map-store";
import { formatEventDate, formatNaira, formatNumber } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { sponsorColors, sponsorLabels, type SponsorType } from "@/types";

const FILTERABLE_SPONSORS: SponsorType[] = [
  "state-government",
  "hisbah",
  "emirate",
  "philanthropist",
  "federal",
];

export function EventFeed() {
  const {
    filteredEvents,
    selectedEvent,
    selectEvent,
    searchQuery,
    setSearchQuery,
    sponsorFilters,
    toggleSponsor,
    heldOnly,
    setHeldOnly,
    clearFilters,
  } = useWeddingsStore();
  const { flyTo } = useMapStore();

  const hasFilters = searchQuery || sponsorFilters.length > 0 || heldOnly;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search state, sponsor, town…"
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-7 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {FILTERABLE_SPONSORS.map((sponsor) => (
            <button
              key={sponsor}
              onClick={() => toggleSponsor(sponsor)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                sponsorFilters.includes(sponsor)
                  ? "border-transparent text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              style={
                sponsorFilters.includes(sponsor)
                  ? { backgroundColor: sponsorColors[sponsor] }
                  : undefined
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: sponsorColors[sponsor] }}
              />
              {sponsorLabels[sponsor]}
            </button>
          ))}
          <button
            onClick={() => setHeldOnly(!heldOnly)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
              heldOnly
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            held only
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            No ceremonies match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filteredEvents.map((event) => (
              <li key={event.id}>
                <button
                  onClick={() => {
                    selectEvent(event);
                    flyTo(event.location.longitude, event.location.latitude, 7.5);
                  }}
                  className={cn(
                    "w-full space-y-1.5 p-3 text-left transition-colors hover:bg-accent",
                    selectedEvent?.id === event.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: sponsorColors[event.sponsorType] }}
                    />
                    <p className="line-clamp-2 flex-1 text-xs font-medium leading-snug">
                      {event.title}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-4 text-[10px] text-muted-foreground">
                    <span className="tabular">
                      {formatEventDate(event.date, event.datePrecision)}
                    </span>
                    <span>·</span>
                    <span>{event.city ? `${event.city}, ${event.state}` : event.state}</span>
                    {event.couples && (
                      <>
                        <span>·</span>
                        <span className="tabular font-semibold text-foreground">
                          {formatNumber(event.couples)} couples
                        </span>
                      </>
                    )}
                    {event.costNaira ? (
                      <>
                        <span>·</span>
                        <span className="tabular">{formatNaira(event.costNaira)}</span>
                      </>
                    ) : null}
                    {!event.held && (
                      <span className="rounded-full border border-amber-500/40 px-1.5 text-amber-300">
                        announced
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
