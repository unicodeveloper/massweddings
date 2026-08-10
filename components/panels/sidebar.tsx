"use client";

import { useState } from "react";
import { BarChart3, FileSearch, ListOrdered, Newspaper, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventFeed } from "./event-feed";
import { RegionBreakdown } from "./region-breakdown";
import { StateRanking } from "./state-ranking";
import { DataProvenance } from "./data-provenance";
import { LiveFeed } from "./live-feed";
import { Intel } from "./intel";

type Tab = "regions" | "states" | "ceremonies" | "live" | "intel";

const TABS: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: "regions", label: "Regions", icon: BarChart3 },
  { id: "states", label: "States", icon: ListOrdered },
  { id: "ceremonies", label: "Records", icon: Newspaper },
  { id: "live", label: "Live", icon: Radio },
  { id: "intel", label: "Intel", icon: FileSearch },
];

export function Sidebar() {
  const [tab, setTab] = useState<Tab>("regions");

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex border-b border-border">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setTab(entry.id)}
            title={entry.label}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              tab === entry.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <entry.icon className="h-3.5 w-3.5" />
            {entry.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "regions" && (
          <>
            <RegionBreakdown />
            <DataProvenance />
          </>
        )}
        {tab === "states" && <StateRanking />}
        {tab === "ceremonies" && <EventFeed />}
        {tab === "live" && <LiveFeed />}
        {tab === "intel" && <Intel />}
      </div>
    </aside>
  );
}
