"use client";

import React, { useState } from "react";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { needLabels } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";

export const facilityKeys = [
  "step_free_entrance",
  "elevator_or_ramp",
  "accessible_restroom",
  "accessible_seating",
  "rest_area",
  "parking_or_dropoff",
] as const;

export type FacilityKey = (typeof facilityKeys)[number];
export type ClaimFilter = "" | "1" | "0.5" | "0";
export type SortMode = "starts_at" | "match_score";
export type StatusFilter = "upcoming" | "completed" | "all";

export interface EventFilterState {
  q: string;
  status: StatusFilter;
  dateFrom: string;
  dateTo: string;
  sort: SortMode;
  attrs: Record<FacilityKey, ClaimFilter>;
}

export const emptyFilters: EventFilterState = {
  q: "",
  status: "upcoming",
  dateFrom: "",
  dateTo: "",
  sort: "starts_at",
  attrs: {
    step_free_entrance: "",
    elevator_or_ramp: "",
    accessible_restroom: "",
    accessible_seating: "",
    rest_area: "",
    parking_or_dropoff: "",
  },
};

const claimOptions: Array<{ value: ClaimFilter; label: string }> = [
  { value: "", label: "Semua" },
  { value: "1", label: "Tersedia penuh" },
  { value: "0.5", label: "Sebagian" },
  { value: "0", label: "Tidak tersedia" },
];

const claimText: Record<string, string> = { "1": "Tersedia penuh", "0.5": "Sebagian", "0": "Tidak tersedia" };

// Validates the combination the API rejects with 422 so the user is told before a request goes out.
export function validateFilters(filters: EventFilterState) {
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return "Tanggal mulai tidak boleh setelah tanggal akhir.";
  }
  return "";
}

export function filtersToQuery(filters: EventFilterState) {
  const query: Record<string, string | number | undefined> = {
    limit: 50,
    offset: 0,
    q: filters.q.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    sort: filters.sort,
  };

  facilityKeys.forEach((key) => {
    if (filters.attrs[key]) query[key] = filters.attrs[key];
  });

  return query;
}

interface EventFiltersProps {
  value: EventFilterState;
  onApply: (next: EventFilterState) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:border-navy-500";

export function EventFilters({ value, onApply, disabled }: EventFiltersProps) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const activeAttrs = facilityKeys.filter((key) => value.attrs[key]);
  const advancedCount =
    activeAttrs.length + (value.dateFrom ? 1 : 0) + (value.dateTo ? 1 : 0) + (value.status !== "upcoming" ? 1 : 0);

  const apply = (next: EventFilterState) => {
    const message = validateFilters(next);
    setError(message);
    if (message) return;
    onApply(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    apply(draft);
  };

  const reset = () => {
    setDraft(emptyFilters);
    setError("");
    onApply(emptyFilters);
  };

  const removeAttr = (key: FacilityKey) => {
    const next = { ...value, attrs: { ...value.attrs, [key]: "" as ClaimFilter } };
    setDraft(next);
    onApply(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submit} className="flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="size-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            placeholder="Cari judul event"
            aria-label="Cari judul event"
            maxLength={100}
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select
          value={draft.sort}
          onChange={(e) => setDraft({ ...draft, sort: e.target.value as SortMode })}
          aria-label="Urutkan event"
          className={cn(inputClass, "lg:w-48 font-semibold")}
        >
          <option value="starts_at">Tanggal terdekat</option>
          <option value="match_score">Skor cocok tertinggi</option>
        </select>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft"
        >
          <SlidersHorizontal className="size-4" />
          Filter lanjutan
          {advancedCount > 0 && (
            <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[10px] text-white">{advancedCount}</span>
          )}
        </button>
        <button
          disabled={disabled}
          className="rounded-xl bg-navy-900 px-5 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
        >
          Terapkan
        </button>
      </form>

      {open && (
        <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-4 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold text-ink-500">
              Status event
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as StatusFilter })}
                className={inputClass}
              >
                <option value="upcoming">Akan datang</option>
                <option value="completed">Selesai</option>
                <option value="all">Semua</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-ink-500">
              Mulai dari tanggal
              <input
                type="date"
                value={draft.dateFrom}
                onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-ink-500">
              Sampai tanggal
              <input
                type="date"
                value={draft.dateTo}
                onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-bold text-ink-500 mb-2">
              Klaim fasilitas <span className="font-normal">(cocok persis dengan klaim penyelenggara; klaim &quot;belum diketahui&quot; tidak ikut)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {facilityKeys.map((key) => (
                <label key={key} className="flex flex-col gap-1 text-xs font-bold text-navy-900">
                  {needLabels[key]}
                  <select
                    value={draft.attrs[key]}
                    onChange={(e) => setDraft({ ...draft, attrs: { ...draft.attrs, [key]: e.target.value as ClaimFilter } })}
                    className={inputClass}
                  >
                    {claimOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm font-semibold text-ink-700">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">Terapkan filter</button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft"
            >
              <RotateCcw className="size-4" />
              Reset
            </button>
          </div>
        </form>
      )}

      {!open && error && <p className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm font-semibold text-ink-700">{error}</p>}

      {(activeAttrs.length > 0 || value.dateFrom || value.dateTo || value.q) && (
        <ul className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy-900">
          {value.q && <li className="rounded-full bg-navy-50 px-3 py-1">Judul: {value.q}</li>}
          {value.dateFrom && <li className="rounded-full bg-navy-50 px-3 py-1">Dari {value.dateFrom}</li>}
          {value.dateTo && <li className="rounded-full bg-navy-50 px-3 py-1">Sampai {value.dateTo}</li>}
          {activeAttrs.map((key) => (
            <li key={key} className="flex items-center gap-1 rounded-full bg-navy-50 py-1 pl-3 pr-1">
              {needLabels[key]}: {claimText[value.attrs[key]]}
              <button
                type="button"
                onClick={() => removeAttr(key)}
                aria-label={`Hapus filter ${needLabels[key]}`}
                className="rounded-full p-1 hover:bg-white"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={reset} className="underline text-ink-500 hover:text-navy-900">
              Reset semua
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
