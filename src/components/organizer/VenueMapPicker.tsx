"use client";

import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Trash2 } from "lucide-react";

export interface VenuePoint {
  lat: number | null;
  lng: number | null;
}

interface VenueMapPickerProps {
  value: VenuePoint;
  onChange: (point: VenuePoint) => void;
}

const JAKARTA: [number, number] = [-6.2088, 106.8456];

// Ranges the API enforces on venue.lat / venue.lng (BE-API-007); anything outside is a 422.
const LAT_RANGE = [-90, 90] as const;
const LNG_RANGE = [-180, 180] as const;

// A CSS pin instead of Leaflet's default image marker, which breaks under bundlers.
const pin = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<div style="width:28px;height:28px;border-radius:9999px;background:var(--navy-900);border:3px solid #FFFFFF;box-shadow:var(--shadow-md);display:flex;align-items:center;justify-content:center"><span style="width:8px;height:8px;border-radius:9999px;background:var(--gold-400)"></span></div>',
});

function round(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

function parse(text: string, [min, max]: readonly [number, number]) {
  if (text.trim() === "") return { value: null, error: "" };
  const number = Number(text);
  if (!Number.isFinite(number)) return { value: null, error: "Harus berupa angka." };
  if (number < min || number > max) return { value: null, error: `Harus antara ${min} dan ${max}.` };
  return { value: round(number), error: "" };
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function PanTo({ point }: { point: VenuePoint }) {
  const map = useMap();

  useEffect(() => {
    if (point.lat !== null && point.lng !== null) map.panTo([point.lat, point.lng]);
  }, [point.lat, point.lng, map]);

  return null;
}

const inputClass =
  "px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full";

// Optional venue location. Nothing is sent unless the organizer marks a point or types valid coordinates,
// so a missing location stays "unknown" instead of being guessed.
export default function VenueMapPicker({ value, onChange }: VenueMapPickerProps) {
  const [latText, setLatText] = useState(value.lat === null ? "" : String(value.lat));
  const [lngText, setLngText] = useState(value.lng === null ? "" : String(value.lng));

  const lat = parse(latText, LAT_RANGE);
  const lng = parse(lngText, LNG_RANGE);
  const partial = (latText.trim() === "") !== (lngText.trim() === "");
  const hasPoint = value.lat !== null && value.lng !== null;

  const emit = (nextLat: string, nextLng: string) => {
    const a = parse(nextLat, LAT_RANGE).value;
    const b = parse(nextLng, LNG_RANGE).value;
    // Only a complete, valid pair counts as a location.
    onChange(a !== null && b !== null ? { lat: a, lng: b } : { lat: null, lng: null });
  };

  const pick = (nextLat: number, nextLng: number) => {
    const a = String(round(nextLat));
    const b = String(round(nextLng));
    setLatText(a);
    setLngText(b);
    emit(a, b);
  };

  const clear = () => {
    setLatText("");
    setLngText("");
    onChange({ lat: null, lng: null });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-900">
            Titik lokasi di peta <span className="font-normal text-ink-500">(opsional)</span>
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            Klik peta atau geser pin untuk menandai venue. Tanpa titik, event tidak tampil di peta peserta.
          </p>
        </div>
        {(latText || lngText) && (
          <button
            type="button"
            onClick={clear}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-bg-soft"
          >
            <Trash2 className="size-3.5" />
            Hapus titik
          </button>
        )}
      </div>

      <div className="relative isolate h-64 overflow-hidden rounded-lg border border-line">
        <MapContainer
          center={hasPoint ? [value.lat as number, value.lng as number] : JAKARTA}
          zoom={hasPoint ? 15 : 11}
          scrollWheelZoom={false}
          className="h-full w-full"
          aria-label="Peta untuk memilih lokasi venue"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="grayscale"
            maxZoom={19}
          />
          <ClickToPick onPick={pick} />
          <PanTo point={value} />
          {hasPoint && (
            <Marker
              position={[value.lat as number, value.lng as number]}
              icon={pin}
              draggable
              eventHandlers={{
                dragend(event) {
                  const { lat: a, lng: b } = (event.target as L.Marker).getLatLng();
                  pick(a, b);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="venue_lat" className="text-sm font-medium text-navy-900">
            Latitude
          </label>
          <input
            id="venue_lat"
            type="text"
            inputMode="decimal"
            placeholder="-6.208800"
            className={inputClass}
            value={latText}
            onChange={(e) => {
              setLatText(e.target.value);
              emit(e.target.value, lngText);
            }}
          />
          {lat.error && <p className="text-xs font-semibold text-red-500">{lat.error}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="venue_lng" className="text-sm font-medium text-navy-900">
            Longitude
          </label>
          <input
            id="venue_lng"
            type="text"
            inputMode="decimal"
            placeholder="106.845600"
            className={inputClass}
            value={lngText}
            onChange={(e) => {
              setLngText(e.target.value);
              emit(latText, e.target.value);
            }}
          />
          {lng.error && <p className="text-xs font-semibold text-red-500">{lng.error}</p>}
        </div>
      </div>

      {partial && (
        <p className="text-xs font-semibold text-amber-500">Isi latitude dan longitude sekaligus, atau kosongkan keduanya. Koordinat belum dikirim.</p>
      )}
    </div>
  );
}
