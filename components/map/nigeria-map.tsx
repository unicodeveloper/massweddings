"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Aliased: the default export would otherwise shadow the global Map constructor.
import MapGL, {
  Layer,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  type LayerProps,
  type MapMouseEvent,
  type MapRef,
} from "react-map-gl/mapbox";
import { useMapStore, NIGERIA_BOUNDS } from "@/stores/map-store";
import { useWeddingsStore } from "@/stores/weddings-store";
import { buildScale, computeStateMetrics, metricValue, NO_DATA_COLOUR } from "@/lib/metrics";
import { normaliseBoundaryName } from "@/lib/nigeria";
import { sponsorColors } from "@/types";
import { EventPopup } from "./event-popup";
import { MapLegend } from "./map-legend";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BoundaryFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

interface BoundaryCollection {
  type: "FeatureCollection";
  features: BoundaryFeature[];
}

/** react-map-gl's event features are loosely typed; this is the shape we read. */
interface ClickedFeature {
  layer?: { id?: string };
  properties?: Record<string, unknown> | null;
}

function readFeatures(event: MapMouseEvent): ClickedFeature[] {
  return (event.features ?? []) as unknown as ClickedFeature[];
}

export function NigeriaMap() {
  const mapRef = useRef<MapRef>(null);
  const [boundaries, setBoundaries] = useState<BoundaryCollection | null>(null);
  const [boundaryError, setBoundaryError] = useState(false);

  const {
    viewport,
    setViewport,
    choropleth,
    showBubbles,
    showLabels,
    hoveredState,
    setHoveredState,
    projection,
  } = useMapStore();
  const { filteredEvents, selectedEvent, selectEvent, selectState } = useWeddingsStore();

  useEffect(() => {
    fetch("/nigeria-states.geojson")
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: BoundaryCollection) => setBoundaries(data))
      .catch(() => setBoundaryError(true));
  }, []);

  const stateMetrics = useMemo(() => computeStateMetrics(filteredEvents), [filteredEvents]);

  /** Boundary polygons carrying the value of whichever layer is selected. */
  const choroplethData = useMemo(() => {
    if (!boundaries) return null;

    return {
      type: "FeatureCollection" as const,
      features: boundaries.features.map((feature) => {
        const name = normaliseBoundaryName(String(feature.properties.shapeName ?? ""));
        const metrics = stateMetrics.get(name);
        const value = metrics && choropleth !== "none" ? metricValue(choropleth, metrics) : null;

        return {
          ...feature,
          id: name,
          properties: {
            ...feature.properties,
            state: name,
            value: value ?? -1,
            hasValue: value !== null,
            editions: metrics?.editions ?? 0,
          },
        };
      }),
    };
  }, [boundaries, stateMetrics, choropleth]);

  const scale = useMemo(() => {
    if (choropleth === "none") return null;
    const values = [...stateMetrics.values()]
      .map((metrics) => metricValue(choropleth, metrics))
      .filter((value): value is number => value !== null && value > 0);
    return buildScale(values, choropleth);
  }, [stateMetrics, choropleth]);

  /** One point per edition, offset when a state has several in the same spot. */
  const bubbleData = useMemo(() => {
    const usedCoordinates = new Map<string, number>();

    return {
      type: "FeatureCollection" as const,
      features: filteredEvents.map((event) => {
        const key = `${event.location.latitude.toFixed(3)},${event.location.longitude.toFixed(3)}`;
        const seen = usedCoordinates.get(key) ?? 0;
        usedCoordinates.set(key, seen + 1);

        // Spiral successive editions outward so stacked years stay clickable.
        const angle = (seen * 137.5 * Math.PI) / 180;
        const radius = seen === 0 ? 0 : 0.12 + seen * 0.05;

        return {
          type: "Feature" as const,
          id: event.id,
          properties: {
            id: event.id,
            state: event.state,
            couples: event.couples ?? 0,
            year: event.year,
            sponsorType: event.sponsorType,
            colour: sponsorColors[event.sponsorType],
            held: event.held ? 1 : 0,
            label: event.couples ? `${event.couples.toLocaleString()}` : "?",
          },
          geometry: {
            type: "Point" as const,
            coordinates: [
              event.location.longitude + radius * Math.cos(angle),
              event.location.latitude + radius * Math.sin(angle),
            ],
          },
        };
      }),
    };
  }, [filteredEvents]);

  const fillLayer: LayerProps = useMemo(
    () => ({
      id: "state-fill",
      type: "fill",
      paint: {
        "fill-color":
          scale && scale.stops.length > 0
            ? ([
                "case",
                ["!", ["get", "hasValue"]],
                NO_DATA_COLOUR,
                ["step", ["get", "value"], scale.colours[0], ...scale.stops.flatMap((stop, index) => [stop, scale.colours[index + 1]])],
              ] as unknown as string)
            : NO_DATA_COLOUR,
        "fill-opacity": choropleth === "none" ? 0.15 : 0.72,
      },
    }),
    [scale, choropleth]
  );

  const outlineLayer: LayerProps = useMemo(
    () => ({
      id: "state-outline",
      type: "line",
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "state"], hoveredState ?? ""],
          "#ffffff",
          "rgba(148, 163, 184, 0.45)",
        ] as unknown as string,
        "line-width": [
          "case",
          ["==", ["get", "state"], hoveredState ?? ""],
          2.2,
          0.7,
        ] as unknown as number,
      },
    }),
    [hoveredState]
  );

  const stateLabelLayer: LayerProps = {
    id: "state-label",
    type: "symbol",
    layout: {
      "text-field": ["get", "state"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 5, 9, 8, 13],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": "rgba(226, 232, 240, 0.85)",
      "text-halo-color": "rgba(2, 6, 23, 0.9)",
      "text-halo-width": 1.4,
    },
  };

  const bubbleLayer = {
    id: "wedding-bubbles",
    type: "circle",
    paint: {
      // Area-proportional: sqrt keeps a 1,800-couple edition from swallowing the map.
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4,
        ["max", 4, ["*", 0.28, ["sqrt", ["max", ["get", "couples"], 1]]]],
        9,
        ["max", 8, ["*", 0.85, ["sqrt", ["max", ["get", "couples"], 1]]]],
      ],
      "circle-color": ["get", "colour"],
      "circle-opacity": 0.72,
      "circle-stroke-width": ["case", ["==", ["get", "held"], 0], 2, 1.4],
      "circle-stroke-color": ["case", ["==", ["get", "held"], 0], "#f8fafc", "rgba(255,255,255,0.85)"],
    },
  } as unknown as LayerProps;

  const bubbleLabelLayer: LayerProps = {
    id: "wedding-bubble-labels",
    type: "symbol",
    minzoom: 6,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 10,
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(2, 6, 23, 0.85)",
      "text-halo-width": 1.2,
    },
  };

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      const features = readFeatures(event);

      const bubble = features.find((feature) => feature.layer?.id === "wedding-bubbles");
      if (bubble) {
        const id = bubble.properties?.id as string | undefined;
        const match = filteredEvents.find((candidate) => candidate.id === id);
        if (match) {
          selectEvent(match);
          return;
        }
      }

      const polygon = features.find((feature) => feature.layer?.id === "state-fill");
      if (polygon) {
        selectState(String(polygon.properties?.state ?? ""));
        selectEvent(null);
      }
    },
    [filteredEvents, selectEvent, selectState]
  );

  const handleMouseMove = useCallback(
    (event: MapMouseEvent) => {
      const polygon = readFeatures(event).find((feature) => feature.layer?.id === "state-fill");
      setHoveredState(polygon ? String(polygon.properties?.state ?? "") : null);
    },
    [setHoveredState]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-card p-8 text-center">
        <div className="max-w-md space-y-2">
          <p className="font-semibold">Mapbox token missing</p>
          <p className="text-sm text-muted-foreground">
            Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> in
            <code className="ml-1 rounded bg-muted px-1">.env.local</code> to render the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapGL
        ref={mapRef}
        {...viewport}
        onMove={(event) => setViewport(event.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: projection }}
        // Globe needs the surrounding world visible, so the leash comes off.
        maxBounds={projection === "globe" ? undefined : NIGERIA_BOUNDS}
        minZoom={projection === "globe" ? 1.6 : 4.6}
        maxZoom={11}
        interactiveLayerIds={["state-fill", "wedding-bubbles"]}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredState(null)}
        cursor={hoveredState ? "pointer" : "default"}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <ScaleControl position="bottom-left" />

        {choroplethData && (
          <Source id="states" type="geojson" data={choroplethData}>
            <Layer {...fillLayer} />
            <Layer {...outlineLayer} />
            {showLabels && <Layer {...stateLabelLayer} />}
          </Source>
        )}

        {showBubbles && (
          <Source id="weddings" type="geojson" data={bubbleData}>
            <Layer {...bubbleLayer} />
            <Layer {...bubbleLabelLayer} />
          </Source>
        )}

        {selectedEvent && (
          <Popup
            longitude={selectedEvent.location.longitude}
            latitude={selectedEvent.location.latitude}
            anchor="bottom"
            onClose={() => selectEvent(null)}
            closeOnClick={false}
            maxWidth="340px"
          >
            <EventPopup event={selectedEvent} />
          </Popup>
        )}
      </MapGL>

      {boundaryError && (
        <div className="absolute left-4 top-4 rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-xs">
          State boundaries failed to load — ceremonies still plot, but the choropleth is hidden.
        </div>
      )}

      <MapLegend scale={scale} />
    </div>
  );
}
