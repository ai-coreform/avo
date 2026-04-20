"use client";

import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { useCallback, useState } from "react";

const MAP_HEIGHT = 360;
const DEFAULT_ZOOM = 17;

interface VenueMapProps {
  latitude: number;
  longitude: number;
  onCoordinateChange: (lat: number, lng: number) => void;
}

function VenueMapInner({
  latitude,
  longitude,
  onCoordinateChange,
}: VenueMapProps) {
  const [center, setCenter] = useState({ lat: latitude, lng: longitude });

  const handleCameraChanged = useCallback(
    (ev: { detail: { center: { lat: number; lng: number } } }) => {
      const { lat, lng } = ev.detail.center;
      setCenter({ lat, lng });
      onCoordinateChange(lat, lng);
    },
    [onCoordinateChange]
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ height: MAP_HEIGHT }}
    >
      <GoogleMap
        center={center}
        defaultZoom={DEFAULT_ZOOM}
        disableDefaultUI
        gestureHandling="greedy"
        mapId="venue-location-map"
        onCameraChanged={handleCameraChanged}
        style={{ width: "100%", height: "100%" }}
        zoomControl
      />

      {/* Fixed centered pin */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-foreground p-2.5 shadow-lg">
            <MapPin className="size-5 text-background" />
          </div>
          <div className="-mt-1.5 size-3 rotate-45 bg-foreground" />
        </div>
      </div>
    </div>
  );
}

export function VenueMap(props: VenueMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border bg-muted/30"
        style={{ height: MAP_HEIGHT }}
      >
        <p className="text-muted-foreground text-sm">
          Mappa non disponibile (API key mancante)
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <VenueMapInner {...props} />
    </APIProvider>
  );
}
