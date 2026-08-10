"use client";

import { useMapStore } from "@/stores/map-store";
import { formatMetric, NO_DATA_COLOUR, type Scale } from "@/lib/metrics";
import { choroplethLabels, sponsorColors, sponsorLabels, type SponsorType } from "@/types";

/** Sponsor types worth explaining on the map itself; the rest live in the filters. */
const LEGEND_SPONSORS: SponsorType[] = ["state-government", "hisbah", "emirate", "philanthropist"];

export function MapLegend({ scale }: { scale: Scale | null }) {
  const { choropleth, showBubbles } = useMapStore();

  return (
    // Hidden on phones: the timeline already occupies the bottom of the map, and
    // two stacked legend cards would cover most of the country. The popup carries
    // the same information per ceremony.
    <div className="pointer-events-none absolute bottom-8 left-4 hidden space-y-2 lg:block">
      {choropleth !== "none" && scale && scale.stops.length > 0 && (
        <div className="pointer-events-auto w-60 rounded-lg border border-border bg-card/95 p-3 backdrop-blur">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {choroplethLabels[choropleth]}
          </p>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full">
            {scale.colours.map((colour) => (
              <div key={colour} className="flex-1" style={{ backgroundColor: colour }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular text-muted-foreground">
            <span>{formatMetric(choropleth, scale.min)}</span>
            <span>{formatMetric(choropleth, scale.max)}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-border"
              style={{ backgroundColor: NO_DATA_COLOUR }}
            />
            no data
          </div>
        </div>
      )}

      {showBubbles && (
        <div className="pointer-events-auto w-60 rounded-lg border border-border bg-card/95 p-3 backdrop-blur">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Ceremonies · circle area = couples
          </p>
          <ul className="mt-2 space-y-1">
            {LEGEND_SPONSORS.map((sponsor) => (
              <li key={sponsor} className="flex items-center gap-2 text-[11px]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: sponsorColors[sponsor] }}
                />
                {sponsorLabels[sponsor]}
              </li>
            ))}
            <li className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-transparent" />
              announced only
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
