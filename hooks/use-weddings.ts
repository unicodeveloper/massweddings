"use client";

import { useCallback, useEffect } from "react";
import { useWeddingsStore } from "@/stores/weddings-store";
import type { WeddingDataset } from "@/types";

type WeddingsResponse = WeddingDataset & { rebuildAllowed?: boolean };

/**
 * Loads the cached dataset on mount. The map reads a file the pipeline wrote,
 * so first paint is instant — rebuilding is an explicit, separate action.
 */
export function useWeddings() {
  const {
    events,
    filteredEvents,
    stats,
    builtAt,
    isLoading,
    isRebuilding,
    rebuildAllowed,
    error,
    setDataset,
    setLoading,
    setRebuilding,
    setRebuildAllowed,
    setError,
  } = useWeddingsStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/weddings");
      const data = (await response.json()) as Partial<WeddingsResponse> & {
        error?: string;
        message?: string;
      };

      if (typeof data.rebuildAllowed === "boolean") {
        setRebuildAllowed(data.rebuildAllowed);
      }

      if (!response.ok) {
        setError(data.message || data.error || "Could not load the dataset");
        return;
      }

      setDataset(data as WeddingDataset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the dataset");
    } finally {
      setLoading(false);
    }
  }, [setDataset, setError, setLoading, setRebuildAllowed]);

  /** Re-runs the whole Valyu pipeline. Slow and deliberate — minutes, not seconds. */
  const rebuild = useCallback(async () => {
    setRebuilding(true);
    setError(null);
    try {
      const response = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as Partial<WeddingsResponse> & { error?: string };

      if (typeof data.rebuildAllowed === "boolean") {
        setRebuildAllowed(data.rebuildAllowed);
      }

      if (!response.ok) {
        setError(data.error || "Rebuild failed");
        return;
      }

      setDataset(data as WeddingDataset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rebuild failed");
    } finally {
      setRebuilding(false);
    }
  }, [setDataset, setError, setRebuildAllowed, setRebuilding]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    events,
    filteredEvents,
    stats,
    builtAt,
    isLoading,
    isRebuilding,
    error,
    rebuildAllowed,
    reload: load,
    rebuild,
  };
}
