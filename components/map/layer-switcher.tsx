"use client";

import { useState } from "react";
import { Globe2, Layers, Map as MapIcon, MapPin, Tag, RotateCcw, X } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import { cn } from "@/lib/utils";
import { choroplethLabels, choroplethVintages, type ChoroplethLayer } from "@/types";

/** Wedding activity first, then the context layers you compare it against. */
const LAYER_GROUPS: Array<{ heading: string; layers: ChoroplethLayer[] }> = [
  { heading: "Programme", layers: ["weddings"] },
  { heading: "Context", layers: ["poverty", "marriageAge", "electricity", "population", "allocation"] },
  { heading: "Off", layers: ["none"] },
];

export function LayerSwitcher() {
  const {
    choropleth,
    setChoropleth,
    showBubbles,
    toggleBubbles,
    showLabels,
    toggleLabels,
    projection,
    setProjection,
    resetView,
  } = useMapStore();

  // A permanently open panel would cover most of a phone screen, so below md it
  // collapses to a button. From md up it is always open and the toggle is hidden.
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Map layers"
        className={cn(
          "absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs backdrop-blur md:hidden",
          isOpen && "hidden"
        )}
      >
        <Layers className="h-3.5 w-3.5" />
        Layers
      </button>

      <div
        className={cn(
          "absolute rounded-lg border border-border bg-card/95 p-3 backdrop-blur",
          "inset-x-3 top-3 max-h-[70%] overflow-y-auto md:inset-x-auto md:right-4 md:top-4 md:max-h-none md:w-64 md:overflow-visible",
          !isOpen && "hidden md:block"
        )}
      >
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Layers className="h-3.5 w-3.5 text-primary" />
        Fill states by
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close layers"
          className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {LAYER_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.layers.map((layer) => (
                <button
                  key={layer}
                  onClick={() => setChoropleth(layer)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-1 rounded px-2 py-1 text-left text-xs transition-colors",
                    choropleth === layer
                      ? "bg-primary/15 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className="truncate">{choroplethLabels[layer]}</span>
                  {choroplethVintages[layer] && (
                    <span className="tabular shrink-0 text-[9px] opacity-60">
                      {choroplethVintages[layer]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-2">
        <div className="flex gap-1 rounded-md bg-muted p-0.5">
          <button
            onClick={() => setProjection("mercator")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[10px] transition-colors",
              projection === "mercator"
                ? "bg-card font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapIcon className="h-3 w-3" />
            Flat
          </button>
          <button
            onClick={() => setProjection("globe")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[10px] transition-colors",
              projection === "globe"
                ? "bg-card font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe2 className="h-3 w-3" />
            Globe
          </button>
        </div>

        <Toggle icon={MapPin} label="Markers" active={showBubbles} onClick={toggleBubbles} />
        <Toggle icon={Tag} label="State names" active={showLabels} onClick={toggleLabels} />
        <button
          onClick={resetView}
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset view
        </button>
      </div>
      </div>
    </>
  );
}

function Toggle({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MapPin;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
        "hover:bg-accent"
      )}
    >
      <Icon className={cn("h-3 w-3", active && "text-primary")} />
      {label}
      <span
        className={cn(
          "ml-auto h-3 w-6 rounded-full transition-colors",
          active ? "bg-primary/70" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "block h-3 w-3 rounded-full bg-foreground transition-transform",
            active && "translate-x-3"
          )}
        />
      </span>
    </button>
  );
}
