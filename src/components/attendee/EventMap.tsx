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

function pinIcon(score: number | null, highlighted: boolean) {
  const tier = matchTier(score);
  const size = highlighted ? 44 : 36;
  const textColor = tier.key === "none" ? "var(--ink-900)" : "#FFFFFF";
  const ring = highlighted ? "0 0 0 3px var(--navy-900)," : "";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${tier.color};color:${textColor};border:3px solid #FFFFFF;box-shadow:${ring} var(--shadow-md);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${highlighted ? 14 : 12}px;font-family:var(--font-sans)">${score ?? "–"}</div>`,
  });
}

function FitBounds({ events }: { events: MapEvent[] }) {
  const map = useMap();

  useEffect(() => {
    if (events.length === 0) return;
    if (events.length === 1) {
      map.setView([events[0].lat, events[0].lng], 14);
      return;
    }
    map.fitBounds(
      L.latLngBounds(events.map((event) => [event.lat, event.lng] as [number, number])),
      { padding: [48, 48], maxZoom: 15 },
    );
  }, [events, map]);

  return null;
}

export default function EventMap({ events, highlightedId, onSelect }: EventMapProps) {
  const icons = useMemo(
    () =>
      new Map(events.map((event) => [event.id, pinIcon(event.score, event.id === highlightedId)])),
    [events, highlightedId],
  );

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
      <FitBounds events={events} />
      {events.map((event) => {
        const tier = matchTier(event.score);
        return (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={icons.get(event.id)}
            zIndexOffset={event.id === highlightedId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect?.(event.id) }}
            title={`${event.title} — ${event.score ?? "belum ada"} skor`}
          >
            <Popup>
              <div className="flex min-w-44 flex-col gap-1.5">
                <p className="text-sm font-bold text-navy-900 leading-snug">{event.title}</p>
                <p className="text-xs text-ink-500">{event.venueName}</p>
                <p className="text-xs font-bold text-ink-700">
                  {event.score !== null ? `Skor ${event.score} · ${tier.label}` : tier.label}
                </p>
                <Link href={`/events/${event.id}`} className="text-xs font-bold text-navy-700 underline">
                  Lihat detail
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
