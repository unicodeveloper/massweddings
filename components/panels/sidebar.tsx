"use client";

import { BarChart3, FileSearch, ListOrdered, Newspaper, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore, type PanelTab } from "@/stores/ui-store";
import { EventFeed } from "./event-feed";
import { RegionBreakdown } from "./region-breakdown";
import { StateRanking } from "./state-ranking";
import { DataProvenance } from "./data-provenance";
import { LiveFeed } from "./live-feed";
import { Intel } from "./intel";

const TABS: Array<{ id: PanelTab; label: string; icon: typeof BarChart3 }> = [
  { id: "regions", label: "Regions", icon: BarChart3 },
  { id: "states", label: "States", icon: ListOrdered },
  { id: "ceremonies", label: "Records", icon: Newspaper },
  { id: "live", label: "Live", icon: Radio },
  { id: "intel", label: "Intel", icon: FileSearch },
];

export function Sidebar({ className }: { className?: string }) {
  const { panelTab, setPanelTab } = useUiStore();

  return (
    <aside
      className={cn(
        // Full width on phones, a fixed rail from md up.
        "flex h-full w-full shrink-0 flex-col bg-card md:w-[380px] md:border-l md:border-border",
        className
      )}
    >
      {/* The mobile bottom nav already switches panels, so this row is desktop-only. */}
      <div className="hidden border-b border-border md:flex">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setPanelTab(entry.id)}
            title={entry.label}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              panelTab === entry.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <entry.icon className="h-3.5 w-3.5" />
            {entry.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {panelTab === "regions" && (
          <>
            <RegionBreakdown />
            <DataProvenance />
          </>
        )}
        {panelTab === "states" && <StateRanking />}
        {panelTab === "ceremonies" && <EventFeed />}
        {panelTab === "live" && <LiveFeed />}
        {panelTab === "intel" && <Intel />}
      </div>
    </aside>
  );
}
