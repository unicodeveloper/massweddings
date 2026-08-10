"use client";

import { BarChart3, FileSearch, ListOrdered, Map as MapIcon, Newspaper, Radio } from "lucide-react";
import { useUiStore, type PanelTab } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const ITEMS: Array<{ id: PanelTab | "map"; label: string; icon: typeof MapIcon }> = [
  { id: "map", label: "Map", icon: MapIcon },
  { id: "regions", label: "Regions", icon: BarChart3 },
  { id: "states", label: "States", icon: ListOrdered },
  { id: "ceremonies", label: "Records", icon: Newspaper },
  { id: "live", label: "Live", icon: Radio },
  { id: "intel", label: "Intel", icon: FileSearch },
];

/**
 * Bottom navigation for phones. The desktop layout shows the map and the panels
 * side by side; at this width they take turns, and this is the switch.
 */
export function MobileNav() {
  const { panelTab, mobileView, setPanelTab, showMap } = useUiStore();

  const activeId = mobileView === "map" ? "map" : panelTab;

  return (
    <nav className="flex shrink-0 border-t border-border bg-card md:hidden">
      {ITEMS.map((item) => {
        const isActive = activeId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => (item.id === "map" ? showMap() : setPanelTab(item.id as PanelTab))}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive && "text-foreground")} />
            <span className="text-[9px] leading-none">{item.label}</span>
            <span
              className={cn(
                "mt-0.5 h-0.5 w-5 rounded-full transition-colors",
                isActive ? "bg-foreground" : "bg-transparent"
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
