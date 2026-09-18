"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { matchTier } from "@/lib/attendee-ui";

export interface MapEvent {
  id: string;
  title: string;
  venueName: string;
  lat: number;
  lng: number;
  score: number | null;
}

interface EventMapProps {
  events: MapEvent[];
  highlightedId?: string | null;
  onSelect?: (id: string) => void;
}

interface Place {
  key: string;
  lat: number;
  lng: number;
  venueName: string;
  events: MapEvent[];
  bestScore: number | null;
}

// Events at the same venue share identical coordinates, so their pins would sit on top of
// each other. Group them into one pin per place instead of hiding all but one.
function groupByPlace(events: MapEvent[]): Place[] {
  const places = new Map<string, Place>();

  for (const event of events) {
    const key = `${event.lat.toFixed(5)},${event.lng.toFixed(5)}`;
    const place = places.get(key);
    if (place) {
      place.events.push(event);
      if (event.score !== null && (place.bestScore === null || event.score > place.bestScore)) {
        place.bestScore = event.score;
      }
    } else {
      places.set(key, { key, lat: event.lat, lng: event.lng, venueName: event.venueName, events: [event], bestScore: event.score });
    }
  }

  return [...places.values()];
}

function pinIcon(score: number | null, count: number, highlighted: boolean) {
  const tier = matchTier(score);
  const size = highlighted ? 44 : 36;
  const textColor = tier.key === "none" ? "var(--ink-900)" : "#FFFFFF";
  const ring = highlighted ? "0 0 0 3px var(--navy-900)," : "";
  const badge =
    count > 1
      ? `<span style="position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9999px;background:var(--navy-900);color:#FFFFFF;border:2px solid #FFFFFF;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${count}</span>`
      : "";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px"><div style="width:${size}px;height:${size}px;border-radius:9999px;background:${tier.color};color:${textColor};border:3px solid #FFFFFF;box-shadow:${ring} var(--shadow-md);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${highlighted ? 14 : 12}px;font-family:var(--font-sans)">${score ?? "–"}</div>${badge}</div>`,
  });
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) return;
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14);
      return;
    }
    map.fitBounds(
      L.latLngBounds(places.map((place) => [place.lat, place.lng] as [number, number])),
      { padding: [48, 48], maxZoom: 15 },
    );
  }, [places, map]);

  return null;
}

export default function EventMap({ events, highlightedId, onSelect }: EventMapProps) {
  const places = useMemo(() => groupByPlace(events), [events]);

  return (
    <MapContainer
      center={[-6.2088, 106.8456]}
      zoom={11}
      scrollWheelZoom={false}
      className="h-full w-full"
      aria-label="Peta lokasi event"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="eventease-tiles"
        maxZoom={19}
      />
      <FitBounds places={places} />
      {places.map((place) => {
        const highlighted = place.events.some((event) => event.id === highlightedId);
        return (
          <Marker
            key={place.key}
            position={[place.lat, place.lng]}
            icon={pinIcon(place.bestScore, place.events.length, highlighted)}
            zIndexOffset={highlighted ? 1000 : 0}
            eventHandlers={{ click: () => onSelect?.(place.events[0].id) }}
            title={`${place.venueName} — ${place.events.length} event`}
          >
            <Popup>
              <div className="flex min-w-52 flex-col gap-2">
                <p className="text-xs font-bold text-ink-500 uppercase">
                  {place.venueName} · {place.events.length} event
                </p>
                <ul className="flex flex-col gap-2">
                  {place.events.map((event) => {
                    const tier = matchTier(event.score);
                    return (
                      <li key={event.id} className="flex items-start justify-between gap-3">
                        <Link href={`/events/${event.id}`} className="text-sm font-bold text-navy-900 leading-snug underline">
                          {event.title}
                        </Link>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tier.tone}`}>
                          {event.score ?? "–"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
