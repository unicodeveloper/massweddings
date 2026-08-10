import { create } from "zustand";
import type { GeopoliticalZone } from "@/lib/nigeria";
import { getStateProfile } from "@/lib/state-data";
import type { SponsorType, WeddingDataset, WeddingEvent } from "@/types";

interface WeddingsState {
  events: WeddingEvent[];
  filteredEvents: WeddingEvent[];
  /**
   * Everything the filters allow *except* the zone filter. The regional
   * breakdown reads this, so selecting a zone highlights it instead of
   * collapsing every other bar to zero.
   */
  eventsBeforeZoneFilter: WeddingEvent[];
  builtAt: string | null;
  stats: WeddingDataset["stats"] | null;
  isLoading: boolean;
  isRebuilding: boolean;
  error: string | null;

  selectedEvent: WeddingEvent | null;
  /** State whose detail panel is open, if any. */
  selectedState: string | null;

  yearRange: [number, number] | null;
  zoneFilters: GeopoliticalZone[];
  sponsorFilters: SponsorType[];
  /** Hide editions that were only announced, never confirmed as held. */
  heldOnly: boolean;
  searchQuery: string;

  setDataset: (dataset: WeddingDataset) => void;
  setLoading: (loading: boolean) => void;
  setRebuilding: (rebuilding: boolean) => void;
  setError: (error: string | null) => void;
  selectEvent: (event: WeddingEvent | null) => void;
  selectState: (state: string | null) => void;
  setYearRange: (range: [number, number] | null) => void;
  toggleZone: (zone: GeopoliticalZone) => void;
  toggleSponsor: (sponsor: SponsorType) => void;
  setHeldOnly: (heldOnly: boolean) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

/** Every filter except the zone filter. */
function applyNonZoneFilters(state: WeddingsState): WeddingEvent[] {
  let filtered = state.events;

  if (state.yearRange) {
    const [start, end] = state.yearRange;
    filtered = filtered.filter((event) => event.year >= start && event.year <= end);
  }

  if (state.heldOnly) {
    filtered = filtered.filter((event) => event.held);
  }

  if (state.sponsorFilters.length > 0) {
    filtered = filtered.filter((event) => state.sponsorFilters.includes(event.sponsorType));
  }

  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.summary.toLowerCase().includes(query) ||
        event.state.toLowerCase().includes(query) ||
        event.sponsor.toLowerCase().includes(query) ||
        (event.city ?? "").toLowerCase().includes(query)
    );
  }

  return filtered;
}

/** Recompute both derived views after any change that could affect them. */
function withFilters(state: WeddingsState): Partial<WeddingsState> {
  const beforeZone = applyNonZoneFilters(state);

  const filtered =
    state.zoneFilters.length === 0
      ? beforeZone
      : beforeZone.filter((event) => {
          const zone = getStateProfile(event.state)?.zone;
          return zone ? state.zoneFilters.includes(zone) : false;
        });

  return { filteredEvents: filtered, eventsBeforeZoneFilter: beforeZone };
}

export const useWeddingsStore = create<WeddingsState>((set, get) => ({
  events: [],
  filteredEvents: [],
  eventsBeforeZoneFilter: [],
  builtAt: null,
  stats: null,
  isLoading: true,
  isRebuilding: false,
  error: null,
  selectedEvent: null,
  selectedState: null,
  yearRange: null,
  zoneFilters: [],
  sponsorFilters: [],
  heldOnly: false,
  searchQuery: "",

  setDataset: (dataset) => {
    set({
      events: dataset.events,
      builtAt: dataset.builtAt,
      stats: dataset.stats,
      error: null,
    });
    set(withFilters(get()));
  },

  setLoading: (isLoading) => set({ isLoading }),
  setRebuilding: (isRebuilding) => set({ isRebuilding }),
  setError: (error) => set({ error }),
  selectEvent: (selectedEvent) => set({ selectedEvent }),
  selectState: (selectedState) => set({ selectedState }),

  setYearRange: (yearRange) => {
    set({ yearRange });
    set(withFilters(get()));
  },

  toggleZone: (zone) => {
    const current = get().zoneFilters;
    set({
      zoneFilters: current.includes(zone)
        ? current.filter((value) => value !== zone)
        : [...current, zone],
    });
    set(withFilters(get()));
  },

  toggleSponsor: (sponsor) => {
    const current = get().sponsorFilters;
    set({
      sponsorFilters: current.includes(sponsor)
        ? current.filter((value) => value !== sponsor)
        : [...current, sponsor],
    });
    set(withFilters(get()));
  },

  setHeldOnly: (heldOnly) => {
    set({ heldOnly });
    set(withFilters(get()));
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    set(withFilters(get()));
  },

  clearFilters: () => {
    set({
      yearRange: null,
      zoneFilters: [],
      sponsorFilters: [],
      heldOnly: false,
      searchQuery: "",
    });
    set(withFilters(get()));
  },
}));
