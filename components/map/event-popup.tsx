"use client";

import { ExternalLink } from "lucide-react";
import { formatEventDate, formatNaira, formatNumber } from "@/lib/metrics";
import { beneficiaryLabels, sponsorColors, sponsorLabels, type WeddingEvent } from "@/types";

export function EventPopup({ event }: { event: WeddingEvent }) {
  return (
    <div className="w-[320px] text-sm">
      <div
        className="h-1 w-full"
        style={{ backgroundColor: sponsorColors[event.sponsorType] }}
      />

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatEventDate(event.date, event.datePrecision)}</span>
            {!event.held && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                announced, not confirmed held
              </span>
            )}
          </div>
          <h3 className="font-semibold leading-snug">{event.title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/60 p-3">
          <Figure label="Couples" value={event.couples ? formatNumber(event.couples) : "not reported"} />
          <Figure label="Location" value={event.city ? `${event.city}, ${event.state}` : event.state} />
          {event.costNaira ? <Figure label="Reported cost" value={formatNaira(event.costNaira)} /> : null}
          {event.dowryPerBrideNaira ? (
            <Figure label="Dowry per bride" value={formatNaira(event.dowryPerBrideNaira)} />
          ) : null}
        </div>

        {event.summary && (
          <p className="text-xs leading-relaxed text-muted-foreground">{event.summary}</p>
        )}

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: sponsorColors[event.sponsorType] }}
            />
            <span className="text-muted-foreground">{sponsorLabels[event.sponsorType]}</span>
            <span className="truncate">· {event.sponsor}</span>
          </div>
          <div className="text-muted-foreground">
            Beneficiaries: {beneficiaryLabels[event.beneficiaries]}
          </div>
        </div>

        {event.sources.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {event.sources.length} source{event.sources.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-1">
              {event.sources.slice(0, 4).map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1 text-xs text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
                  >
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{source.outlet || source.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="tabular text-sm font-semibold">{value}</p>
    </div>
  );
}
