"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMapStore } from "@/stores/map-store";
import { useUiStore } from "@/stores/ui-store";
import { useWeddingsStore } from "@/stores/weddings-store";
import { decodeViewState, encodeViewState } from "@/lib/url-state";

/**
 * Two-way sync between the URL and the core view (layer, projection, selected
 * state, year range, panel tab) so any specific finding is a link rather than
 * a screenshot. Hydrates once from whatever URL the app was opened with, then
 * keeps the URL in step with the stores — using `replace`, since filter clicks
 * happen many times a session and shouldn't fill up the back button.
 */
export function useUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydrated = useRef(false);
  // Refs are exempt from exhaustive-deps: this snapshot is read exactly once,
  // by the hydration effect below, regardless of later navigations.
  const initialParams = useRef(searchParams);

  const choropleth = useMapStore((state) => state.choropleth);
  const projection = useMapStore((state) => state.projection);
  const selectedState = useWeddingsStore((state) => state.selectedState);
  const yearRange = useWeddingsStore((state) => state.yearRange);
  const panelTab = useUiStore((state) => state.panelTab);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const parsed = decodeViewState(initialParams.current);
    if (parsed.choropleth) useMapStore.getState().setChoropleth(parsed.choropleth);
    if (parsed.projection) useMapStore.getState().setProjection(parsed.projection);
    if (parsed.selectedState) useWeddingsStore.getState().selectState(parsed.selectedState);
    if (parsed.yearRange) useWeddingsStore.getState().setYearRange(parsed.yearRange);
    if (parsed.panelTab) useUiStore.getState().setPanelTab(parsed.panelTab);
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;

    const qs = encodeViewState({ choropleth, projection, selectedState, yearRange, panelTab }).toString();
    if (qs === searchParams.toString()) return;

    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [choropleth, projection, selectedState, yearRange, panelTab, pathname, router, searchParams]);
}
