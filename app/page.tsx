"use client";

import { Loader2 } from "lucide-react";
import { useWeddings } from "@/hooks/use-weddings";
import { useWeddingsStore } from "@/stores/weddings-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { NigeriaMap } from "@/components/map/nigeria-map";
import { LayerSwitcher } from "@/components/map/layer-switcher";
import { TimelineOverlay } from "@/components/map/timeline-overlay";
import { Sidebar } from "@/components/panels/sidebar";
import { StatsBar } from "@/components/panels/stats-bar";
import { StatePanel } from "@/components/panels/state-panel";
import { MarketsFooter } from "@/components/panels/markets-footer";
import { MobileNav } from "@/components/mobile-nav";
import { CreditErrorBanner } from "@/components/credit-error-banner";
import { AuthInitializer } from "@/components/auth";

export default function Home() {
  const { rebuild, isLoading, isRebuilding } = useWeddings();
  const { events, error } = useWeddingsStore();
  const mobileView = useUiStore((state) => state.mobileView);

  const isEmpty = !isLoading && events.length === 0;

  return (
    <AuthInitializer>
      {/* dvh rather than vh: iOS Safari's collapsing toolbar makes vh overshoot. */}
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <CreditErrorBanner />
        <Header onRebuild={rebuild} />
        <StatsBar />

        <div className="relative flex min-h-0 flex-1">
          <div
            className={cn(
              "relative min-w-0 flex-1",
              // On phones the map yields to whichever panel is open.
              mobileView === "panel" && "hidden md:block"
            )}
          >
            {isEmpty ? (
              <EmptyState onRebuild={rebuild} isRebuilding={isRebuilding} message={error} />
            ) : (
              <>
                <NigeriaMap />
                <TimelineOverlay />
                <LayerSwitcher />
              </>
            )}
            <StatePanel />
          </div>

          <Sidebar className={cn(mobileView === "map" && "hidden md:flex")} />
        </div>

        <MarketsFooter />
        <MobileNav />
      </div>
    </AuthInitializer>
  );
}

function EmptyState({
  onRebuild,
  isRebuilding,
  message,
}: {
  onRebuild: () => void;
  isRebuilding: boolean;
  message: string | null;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <h2 className="text-lg font-semibold">No dataset yet</h2>
        <p className="text-sm text-muted-foreground">
          {message ??
            "The map reads a cached dataset built by the Valyu pipeline. Run the build once to populate it."}
        </p>
        <button
          onClick={onRebuild}
          disabled={isRebuilding}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isRebuilding && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRebuilding ? "Building — this takes a few minutes…" : "Build the dataset"}
        </button>
        <p className="text-xs text-muted-foreground">
          Roughly 60 searches plus a per-state sweep. You can also run{" "}
          <code className="rounded bg-muted px-1">npm run seed</code>.
        </p>
      </div>
    </div>
  );
}
