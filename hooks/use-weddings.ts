"use client";

import { useCallback, useEffect } from "react";
import { useWeddingsStore } from "@/stores/weddings-store";
import type { WeddingDataset } from "@/types";

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
    error,
    setDataset,
    setLoading,
    setRebuilding,
    setError,
  } = useWeddingsStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/weddings");
      const data = await response.json();

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
  }, [setDataset, setError, setLoading]);

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
      const data = await response.json();

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
  }, [setDataset, setError, setRebuilding]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, filteredEvents, stats, builtAt, isLoading, isRebuilding, error, reload: load, rebuild };
}
