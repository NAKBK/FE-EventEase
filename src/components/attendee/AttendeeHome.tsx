"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Accessibility,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ImageOff,
  Loader2,
  MapPin,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  EventListItem,
  getDashboard,
  getErrorMessage,
  getEvent,
  getEventMatch,
  isApiError,
  listEvents,
  MatchResponse,
} from "@/lib/api";
import { formatDateTime, matchTier, statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import type { MapEvent } from "@/components/attendee/EventMap";
import { MotionArticle, MotionCard, MotionCardGrid, MotionSection } from "@/components/ui/motion-card";
import { EventFilters, EventFilterState, emptyFilters, filtersToQuery } from "@/components/attendee/EventFilters";
import { JourneyStepper } from "@/components/attendee/JourneyStepper";

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

const PAGE_SIZE = 6;
const API_LIMIT = 50;

const legend = [
  { score: 80, label: "Cocok (75+)" },
  { score: 60, label: "Sebagian (50–74)" },
  { score: 20, label: "Kurang cocok (<50)" },
  { score: null, label: "Belum dihitung" },
];

export function AttendeeHome() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeEvent, setActiveEvent] = useState<{ id: string; title: string; score: number } | null>(null);
  const [filters, setFilters] = useState<EventFilterState>(emptyFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  // Photos only exist on the detail endpoint (API-005), so covers are fetched lazily for visible cards.
  const [covers, setCovers] = useState<Record<string, { url: string; count: number } | null>>({});
  const requestedCovers = useRef<Set<string>>(new Set());

  const fetchData = useCallback(async (next: EventFilterState) => {
    try {
      const dashboardPromise = getDashboard().catch(() => null);
      let missingProfile = false;
      let fallbackNotice = "";
      let query = filtersToQuery(next);

      let eventData;
      try {
        eventData = await listEvents(query);
      } catch (err: unknown) {
        // Sorting by match score needs a saved profile; fall back instead of failing the whole list.
        if (next.sort === "match_score" && isApiError(err, "NEED_PROFILE_MISSING")) {
          missingProfile = true;
          fallbackNotice = "Urutan skor cocok butuh profil kebutuhan, jadi daftar diurutkan menurut tanggal.";
          query = { ...query, sort: "starts_at" };
          eventData = await listEvents(query);
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
      setNotice(fallbackNotice);
      setTotal(eventData.total);
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

    void fetchData(emptyFilters);
  }, [fetchData, router]);

  const applyFilters = (next: EventFilterState) => {
    setFilters(next);
    setPage(1);
    setError("");
    setLoading(true);
    void fetchData(next);
  };

  const { mapEvents, unmapped } = useMemo(() => {
    const mapped: MapEvent[] = [];
    const missing: EventWithMatch[] = [];

    events.forEach((event) => {
      if (typeof event.venue.lat === "number" && typeof event.venue.lng === "number") {
        mapped.push({
          id: event.id,
          title: event.title,
          venueName: event.venue.name,
          lat: event.venue.lat,
          lng: event.venue.lng,
          score: event.match?.score ?? null,
        });
      } else {
        missing.push(event);
      }
    });

    return { mapEvents: mapped, unmapped: missing };
  }, [events]);

  const placeCount = useMemo(
    () => new Set(mapEvents.map((event) => `${event.lat.toFixed(5)},${event.lng.toFixed(5)}`)).size,
    [mapEvents],
  );

  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const visibleEvents = useMemo(
    () => events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [events, page],
  );

  useEffect(() => {
    const missing = visibleEvents.filter((event) => !requestedCovers.current.has(event.id));
    if (missing.length === 0) return;
    missing.forEach((event) => requestedCovers.current.add(event.id));

    (async () => {
      const entries = await Promise.all(
        missing.map(async (event): Promise<[string, { url: string; count: number } | null]> => {
          try {
            const detail = await getEvent(event.id);
            return [event.id, detail.media[0] ? { url: detail.media[0].url, count: detail.media.length } : null];
          } catch {
            return [event.id, null];
          }
        }),
      );
      setCovers((current) => ({ ...current, ...Object.fromEntries(entries) }));
    })();
  }, [visibleEvents]);

  const focusCard = (id: string) => {
    const index = events.findIndex((event) => event.id === id);
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
    setHighlightedId(id);
    window.setTimeout(() => {
      document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <MotionCardGrid className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-stretch">
          <MotionSection className="bg-navy-900 rounded-[2rem] p-6 sm:p-7 text-white border border-navy-800 shadow-xl overflow-hidden relative h-full flex flex-col justify-center">
            <div className="absolute -right-24 -top-24 size-72 bg-white/10 rounded-full blur-[80px]" />
            <div className="relative">
              <p className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-2">Dashboard pengguna</p>
              <h1 className="font-serif text-3xl sm:text-4xl leading-tight mb-2">Temukan event yang cocok dengan kebutuhanmu.</h1>
              <p className="text-navy-100 max-w-2xl text-sm leading-relaxed">
                Rekomendasi membaca profil kebutuhanmu, klaim aksesibilitas venue, dan respons penyelenggara.
              </p>
            </div>
          </MotionSection>

          <div className="grid grid-cols-2 gap-4 h-full">
            <MotionCard className="bg-white border border-line rounded-2xl p-4 shadow-sm hover:border-navy-100 h-full flex flex-col justify-between">
              <Clock className="size-5 text-gold-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/ee-card:-translate-y-0.5 motion-safe:group-hover/ee-card:scale-105" />
              <div>
                <p className="text-3xl font-bold text-navy-900">{pendingCount}</p>
                <p className="text-xs font-bold text-ink-500 uppercase mt-1">Permintaan pending</p>
              </div>
            </MotionCard>
            <MotionCard className="bg-white border border-line rounded-2xl p-4 shadow-sm hover:border-navy-100 h-full flex flex-col justify-between">
              <ShieldCheck className="size-5 text-green-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/ee-card:-translate-y-0.5 motion-safe:group-hover/ee-card:scale-105" />
              <div>
                {activeEvent ? (
                  <Link href={`/events/${activeEvent.id}`} className="block">
                    <p className="text-sm font-bold text-navy-900 line-clamp-2 hover:underline">{activeEvent.title}</p>
                  </Link>
                ) : (
                  <p className="text-sm font-bold text-navy-900">Belum ada</p>
                )}
                <p className="text-xs font-bold text-ink-500 uppercase mt-1">
                  Event aktif{activeEvent ? ` · skor ${activeEvent.score}` : ""}
                </p>
              </div>
            </MotionCard>
          </div>
        </MotionCardGrid>

        <details className="group rounded-2xl border border-line bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-navy-900">
            Bagaimana alur di EventEase?
            <ChevronDown className="size-4 text-ink-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-3 border-t border-line px-4 py-4">
            <JourneyStepper current={-1} />
            <p className="text-xs text-ink-500 leading-relaxed">
              EventEase membantu menilai <strong>kecocokan</strong> event dengan kebutuhanmu. Kamu tidak perlu menunggu konfirmasi untuk
              datang: <strong>permintaan bersifat opsional</strong> dan gunanya untuk mendapat komitmen tertulis penyelenggara soal
              dukungan aksesibilitas. Tiket atau pendaftaran mengikuti ketentuan penyelenggara, bukan EventEase. Setelah event selesai,
              peserta yang punya komitmen terkonfirmasi bisa <strong>memverifikasi</strong> pengalamannya, dan hasilnya membentuk skor
              keandalan penyelenggara.
            </p>
          </div>
        </details>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>
        )}

        {needsProfile && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-3 text-sm text-ink-700">
            <div className="flex items-start gap-3">
              <TriangleAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Profil kebutuhanmu belum disimpan,</strong> jadi skor kecocokan belum bisa dihitung.
              </p>
            </div>
            <Link href="/profile" className="rounded-xl bg-navy-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-800">
              Isi profil kebutuhan
            </Link>
          </div>
        )}

        <EventFilters value={filters} onApply={applyFilters} disabled={loading} />

        {notice && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-2 text-sm text-ink-700">{notice}</div>
        )}

        <section className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900">Peta event</h2>
              <p className="text-xs text-ink-500">Warna pin menunjukkan skor kecocokan dari profil kebutuhanmu.</p>
            </div>
            {!loading && (
              <p className="text-xs font-bold text-ink-500">
                {events.length} event · {placeCount} lokasi di peta
                {unmapped.length > 0 ? ` · ${unmapped.length} tanpa koordinat` : ""}
              </p>
            )}
          </div>
          <div className="relative isolate h-[300px] overflow-hidden rounded-[2rem] border border-line shadow-sm bg-white">
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
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
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
            <li className="flex items-center gap-2">
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white" aria-hidden="true">
                2
              </span>
              Beberapa event di venue yang sama
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900">Event untuk kamu</h2>
              <p className="text-xs text-ink-500">Skor cocok dihitung dari profil kebutuhanmu.</p>
            </div>
            {!loading && events.length > 0 && (
              <p className="text-xs font-bold text-ink-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, events.length)} dari {total}
              </p>
            )}
          </div>

          {!loading && total > API_LIMIT && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-2 text-xs text-ink-700">
              Menampilkan {API_LIMIT} dari {total} event. Persempit dengan filter agar hasilnya lengkap.
            </p>
          )}

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : events.length > 0 ? (
            <>
              <MotionCardGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4">
                {visibleEvents.map((event) => {
                  const tier = matchTier(event.match?.score);
                  return (
                    <MotionArticle
                      key={event.id}
                      id={`event-${event.id}`}
                      onMouseEnter={() => setHighlightedId(event.id)}
                      onMouseLeave={() => setHighlightedId(null)}
                      className={cn(
                        "bg-white border rounded-2xl p-4 shadow-sm flex h-full flex-col gap-3",
                        highlightedId === event.id ? "border-navy-500" : "border-line",
                      )}
                    >
                      <div className="relative -mx-4 -mt-4 h-28 overflow-hidden rounded-t-2xl bg-bg-soft">
                        {covers[event.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={covers[event.id]!.url}
                            alt={`Foto fasilitas ${event.title}`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1 text-ink-300">
                            <ImageOff className="size-5" />
                            <span className="text-[11px] font-bold">
                              {event.id in covers ? "Belum ada foto" : "Memuat foto"}
                            </span>
                          </div>
                        )}
                        {covers[event.id] && covers[event.id]!.count > 1 && (
                          <span className="absolute bottom-2 right-2 rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-bold text-white">
                            {covers[event.id]!.count} foto
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-navy-700 uppercase mb-1">{statusLabel(event.status)}</p>
                          <h3 className="text-base font-bold text-navy-900 leading-snug line-clamp-2 min-h-[2.75rem]">{event.title}</h3>
                        </div>
                        <div
                          className={cn(
                            "size-12 rounded-xl flex flex-col items-center justify-center shrink-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/ee-card:scale-105",
                            tier.tone,
                          )}
                        >
                          <span className="text-base font-bold text-navy-900 leading-none">{event.match?.score ?? "-"}</span>
                          <span className="text-[9px] font-bold text-ink-500 mt-0.5">MATCH</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-ink-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 shrink-0 text-ink-300" />
                          <span className="truncate">{formatDateTime(event.starts_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 shrink-0 text-ink-300" />
                          <span className="truncate">
                            {event.venue.name}, {event.venue.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 shrink-0 text-ink-300" />
                          <span className="truncate">
                            {event.organizer.name} ·{" "}
                            {event.organizer.reliability_score !== null
                              ? `skor ${event.organizer.reliability_score} (${event.organizer.sample_count})`
                              : "belum ada verifikasi"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/events/${event.id}`}
                        className="mt-auto w-full rounded-xl bg-navy-900 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-navy-800 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                      >
                        Lihat detail & ajukan bantuan
                      </Link>
                    </MotionArticle>
                  );
                })}
              </MotionCardGrid>

              {pageCount > 1 && (
                <nav className="flex items-center justify-center gap-2" aria-label="Halaman event">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-sm font-bold text-ink-500">
                    {page} / {pageCount}
                  </span>
                  <button
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page === pageCount}
                    className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-line p-10 text-center">
              <Accessibility className="size-10 text-ink-300 mx-auto mb-3" />
              <h3 className="font-bold text-navy-900">Belum ada event ditemukan</h3>
              <p className="text-sm text-ink-500 mt-1">Coba ubah kata kunci atau longgarkan filter.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
