"use client";

import { Loader2 } from "lucide-react";
import { useWeddings } from "@/hooks/use-weddings";
import { useWeddingsStore } from "@/stores/weddings-store";
import { Header } from "@/components/header";
import { NigeriaMap } from "@/components/map/nigeria-map";
import { LayerSwitcher } from "@/components/map/layer-switcher";
import { TimelineOverlay } from "@/components/map/timeline-overlay";
import { Sidebar } from "@/components/panels/sidebar";
import { StatsBar } from "@/components/panels/stats-bar";
import { StatePanel } from "@/components/panels/state-panel";
import { MarketsFooter } from "@/components/panels/markets-footer";
import { CreditErrorBanner } from "@/components/credit-error-banner";
import { AuthInitializer } from "@/components/auth";

export default function Home() {
  const { rebuild, isLoading, isRebuilding } = useWeddings();
  const { events, error } = useWeddingsStore();

  const isEmpty = !isLoading && events.length === 0;

  return (
    <AuthInitializer>
      <div className="flex h-screen flex-col overflow-hidden">
        <CreditErrorBanner />
        <Header onRebuild={rebuild} />
        <StatsBar />

        <div className="relative flex min-h-0 flex-1">
          <div className="relative min-w-0 flex-1">
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

          <Sidebar />
        </div>

        <MarketsFooter />
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
    <div className="flex h-full items-center justify-center p-8">
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
