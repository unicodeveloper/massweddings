"use client";

import { ExternalLink } from "lucide-react";
import { DATA_SOURCES, DHS_META, FAAC_META, NATIONAL } from "@/lib/state-data";
import { useWeddingsStore } from "@/stores/weddings-store";

/**
 * Where every number on this map comes from. Kept visible rather than buried in
 * a README — the whole point is that a reader can check the figures.
 */
export function DataProvenance() {
  const { builtAt, stats } = useWeddingsStore();

  return (
    <div className="space-y-3 border-t border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
      <h3 className="text-xs font-semibold text-foreground">Where this comes from</h3>

      <Entry
        label="Ceremonies"
        body={
          stats
            ? `${stats.articlesScanned} articles searched through Valyu, ${stats.editions} distinct ceremonies after de-duplication. Every record links its sources.`
            : "Nigerian and international news, searched through Valyu."
        }
        note={builtAt ? `Last rebuilt ${new Date(builtAt).toLocaleDateString("en-GB")}` : undefined}
      />

      <Entry
        label="Population"
        body={`${DATA_SOURCES.population.publisher} — ${DATA_SOURCES.population.name}.`}
        href={DATA_SOURCES.population.url}
      />

      <Entry
        label="Poverty"
        body={`${DATA_SOURCES.poverty.publisher}. ${DATA_SOURCES.poverty.note ?? ""} National headcount: ${NATIONAL?.povertyHeadcount?.toFixed(1)}%.`}
        href={DATA_SOURCES.poverty.url}
      />

      <Entry
        label="Marriage age, electricity, literacy"
        body={`${DHS_META.publisher} — ${DHS_META.name}. ${DHS_META.note}`}
        href={DHS_META.url}
      />

      <Entry label={`FAAC ${FAAC_META.year}`} body={FAAC_META.caveat} />

      <Entry
        label="Boundaries"
        body="geoBoundaries (GRID3 Nigeria state boundaries), CC BY 4.0."
        href="https://www.geoboundaries.org/"
      />

      <p className="border-t border-border pt-3">
        A state with no ceremonies means none surfaced in the sources searched — read it as absence
        of coverage, not proof of absence.
      </p>

      <p>
        Layers carry the year of their source. The poverty index is the most recent state-level MPI
        that exists — nobody has published one from the 2023–24 survey yet — so it sits alongside the
        2024 survey indicators rather than being passed off as current.
      </p>
    </div>
  );
}

function Entry({
  label,
  body,
  href,
  note,
}: {
  label: string;
  body: string;
  href?: string;
  note?: string;
}) {
  return (
    <div>
      <p className="font-medium text-foreground">{label}</p>
      <p>{body}</p>
      {note && <p className="text-[10px]">{note}</p>}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
        >
          dataset
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}
