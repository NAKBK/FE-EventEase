"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Accessibility,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  EventListItem,
  getDashboard,
  getErrorMessage,
  getEventMatch,
  isApiError,
  listEvents,
  MatchResponse,
} from "@/lib/api";
import { formatDateTime, matchTier, statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import type { MapEvent } from "@/components/attendee/EventMap";

const EventMap = dynamic(() => import("@/components/attendee/EventMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-bg-soft">
      <Loader2 className="size-6 animate-spin text-navy-900" />
    </div>
  ),
});

interface EventWithMatch extends EventListItem {
  match?: MatchResponse | null;
}

type SortMode = "starts_at" | "match_score";

const legend = [
  { score: 80, label: "Cocok (75+)" },
  { score: 60, label: "Sebagian (50–74)" },
  { score: 20, label: "Kurang cocok (<50)" },
  { score: null, label: "Belum dihitung" },
];

export function AttendeeHome() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithMatch[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeEvent, setActiveEvent] = useState<{ id: string; title: string; score: number } | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("starts_at");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchData = useCallback(async (nextQuery: string, nextSort: SortMode) => {
    try {
      const dashboardPromise = getDashboard().catch(() => null);
      let missingProfile = false;
      let effectiveSort = nextSort;

      let eventData;
      try {
        eventData = await listEvents({ status: "upcoming", q: nextQuery, limit: 20, offset: 0, sort: effectiveSort });
      } catch (err: unknown) {
        // Sorting by match score needs a saved profile; fall back instead of failing the whole list.
        if (nextSort === "match_score" && isApiError(err, "NEED_PROFILE_MISSING")) {
          missingProfile = true;
          effectiveSort = "starts_at";
          eventData = await listEvents({ status: "upcoming", q: nextQuery, limit: 20, offset: 0, sort: effectiveSort });
        } else {
          throw err;
        }
      }

      const matched = await Promise.all(
        eventData.items.map(async (event) => {
          try {
            const match = await getEventMatch(event.id);
            return { ...event, match };
          } catch (err: unknown) {
            if (isApiError(err, "NEED_PROFILE_MISSING")) missingProfile = true;
            return { ...event, match: null };
          }
        }),
      );

      const dashboard = await dashboardPromise;
      if (dashboard) {
        setPendingCount(dashboard.pending_requests_count);
        setActiveEvent(
          dashboard.active_event
            ? {
                id: dashboard.active_event.event.id,
                title: dashboard.active_event.event.title,
                score: dashboard.active_event.match.score,
              }
            : null,
        );
      }

      setNeedsProfile(missingProfile);
      setEvents(matched);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil event."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "attendee") {
      router.push("/dashboard");
      return;
    }

    // Initial load only; later searches go through the form submit handler.
    void fetchData("", "starts_at");
  }, [fetchData, router]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    void fetchData(query, sort);
  };

  const mapEvents = useMemo<MapEvent[]>(
    () =>
      events.flatMap((event) =>
        typeof event.venue.lat === "number" && typeof event.venue.lng === "number"
          ? [
              {
                id: event.id,
                title: event.title,
                venueName: event.venue.name,
                lat: event.venue.lat,
                lng: event.venue.lng,
                score: event.match?.score ?? null,
              },
            ]
          : [],
      ),
    [events],
  );

  const withoutCoordinates = events.length - mapEvents.length;

  const focusCard = (id: string) => {
    setHighlightedId(id);
    document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-bg-soft">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">
          <section className="bg-navy-900 rounded-[2rem] p-8 text-white border border-navy-800 shadow-xl overflow-hidden relative">
            <div className="absolute -right-24 -top-24 size-72 bg-white/10 rounded-full blur-[80px]" />
            <div className="relative">
              <p className="text-gold-400 text-sm font-bold uppercase tracking-wider mb-3">Dashboard pengguna</p>
              <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-4">Temukan event yang cocok dengan kebutuhanmu.</h1>
              <p className="text-navy-100 max-w-2xl text-sm sm:text-base leading-relaxed">
                Semua rekomendasi membaca profil kebutuhanmu, klaim aksesibilitas venue, dan respons penyelenggara.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
              <Clock className="size-5 text-gold-500 mb-4" />
              <p className="text-3xl font-bold text-navy-900">{pendingCount}</p>
              <p className="text-xs font-bold text-ink-500 uppercase mt-1">Permintaan pending</p>
            </div>
            <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
              <ShieldCheck className="size-5 text-green-500 mb-4" />
              {activeEvent ? (
                <Link href={`/events/${activeEvent.id}`} className="block">
                  <p className="text-base font-bold text-navy-900 line-clamp-2 min-h-12 hover:underline">{activeEvent.title}</p>
                </Link>
              ) : (
                <p className="text-base font-bold text-navy-900 line-clamp-2 min-h-12">Belum ada</p>
              )}
              <p className="text-xs font-bold text-ink-500 uppercase mt-1">
                Event aktif{activeEvent ? ` · skor ${activeEvent.score}` : ""}
              </p>
            </div>
          </section>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">
            {error}
          </div>
        )}

        {needsProfile && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-3 text-sm text-ink-700">
            <div className="flex items-start gap-3">
              <TriangleAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Profil kebutuhanmu belum disimpan,</strong> jadi skor kecocokan belum bisa dihitung.
              </p>
            </div>
            <Link href="/profile" className="rounded-xl bg-navy-900 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-navy-800">
              Isi profil kebutuhan
            </Link>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Peta event</h2>
            <p className="text-sm text-ink-500">Warna pin menunjukkan skor kecocokan dari profil kebutuhanmu.</p>
          </div>
          <div className="relative isolate h-[380px] overflow-hidden rounded-[2rem] border border-line shadow-sm bg-white">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-navy-900" />
              </div>
            ) : mapEvents.length > 0 ? (
              <EventMap events={mapEvents} highlightedId={highlightedId} onSelect={focusCard} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <MapPin className="size-10 text-ink-300 mb-3" />
                <h3 className="font-bold text-navy-900">Belum ada event dengan koordinat</h3>
                <p className="text-sm text-ink-500 mt-1">Lokasi event yang punya koordinat akan tampil di sini.</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-500">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {legend.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full border border-white shadow-sm"
                    style={{ background: matchTier(item.score).color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
            {!loading && withoutCoordinates > 0 && (
              <p>{withoutCoordinates} event belum punya koordinat dan tidak tampil di peta.</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy-900">Event untuk kamu</h2>
              <p className="text-sm text-ink-500">Skor cocok dihitung dari profil kebutuhanmu.</p>
            </div>
            <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="size-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari event"
                  aria-label="Cari event"
                  maxLength={100}
                  className="pl-9 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm w-full sm:w-64 focus:outline-none focus:border-navy-500"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                aria-label="Urutkan event"
                className="px-4 py-2.5 rounded-xl border border-line bg-white text-sm font-semibold text-navy-900"
              >
                <option value="starts_at">Tanggal terdekat</option>
                <option value="match_score">Skor cocok</option>
              </select>
              <button className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold hover:bg-navy-800">
                Terapkan
              </button>
            </form>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event) => {
                const tier = matchTier(event.match?.score);
                return (
                  <article
                    key={event.id}
                    id={`event-${event.id}`}
                    onMouseEnter={() => setHighlightedId(event.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                    className={cn(
                      "bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 transition-colors",
                      highlightedId === event.id ? "border-navy-500" : "border-line",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-navy-700 uppercase mb-2">{statusLabel(event.status)}</p>
                        <h3 className="text-lg font-bold text-navy-900 leading-snug">{event.title}</h3>
                      </div>
                      <div className={cn("size-14 rounded-2xl flex flex-col items-center justify-center shrink-0", tier.tone)}>
                        <span className="text-lg font-bold text-navy-900">{event.match?.score ?? "-"}</span>
                        <span className="text-[10px] font-bold text-ink-500">MATCH</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-ink-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-ink-300" />
                        {formatDateTime(event.starts_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-ink-300" />
                        {event.venue.name}, {event.venue.city}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-ink-300" />
                        {event.organizer.name} ·{" "}
                        {event.organizer.reliability_score !== null
                          ? `skor ${event.organizer.reliability_score} (${event.organizer.sample_count} verifikasi)`
                          : "belum ada verifikasi"}
                      </div>
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className="mt-auto w-full rounded-xl bg-navy-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-navy-800"
                    >
                      Lihat detail & ajukan bantuan
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-line p-12 text-center">
              <Accessibility className="size-10 text-ink-300 mx-auto mb-3" />
              <h3 className="font-bold text-navy-900">Belum ada event ditemukan</h3>
              <p className="text-sm text-ink-500 mt-1">Coba ubah kata kunci pencarianmu.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
