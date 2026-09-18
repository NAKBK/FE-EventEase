"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accessibility,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  createRequest,
  EventDetail,
  EventListItem,
  getErrorMessage,
  getDashboard,
  getEvent,
  getEventMatch,
  listEvents,
  MatchResponse,
} from "@/lib/api";
import {
  claimLabel,
  claimTone,
  formatDateTime,
  fromLocalInputValue,
  needLabels,
  statusLabel,
  toLocalInputValue,
} from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";

interface EventWithMatch extends EventListItem {
  match?: MatchResponse | null;
}

export function AttendeeHome() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithMatch[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeEventTitle, setActiveEventTitle] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"starts_at" | "match_score">("starts_at");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<EventDetail | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(null);
  const [arrival, setArrival] = useState(toLocalInputValue());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const visibleClaims = useMemo(
    () =>
      [
        "step_free_entrance",
        "elevator_or_ramp",
        "accessible_restroom",
        "accessible_seating",
        "rest_area",
        "parking_or_dropoff",
      ] as const,
    [],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventData, dashboardData] = await Promise.allSettled([
        listEvents({ status: "upcoming", q: query, limit: 20, offset: 0, sort }),
        getDashboard(),
      ]);

      if (dashboardData.status === "fulfilled") {
        setPendingCount(dashboardData.value.pending_requests_count);
        setActiveEventTitle(dashboardData.value.active_event?.event.title || null);
      }

      if (eventData.status === "rejected") throw eventData.reason;

      const matched = await Promise.all(
        eventData.value.items.map(async (event) => {
          try {
            const match = await getEventMatch(event.id);
            return { ...event, match };
          } catch {
            return { ...event, match: null };
          }
        }),
      );

      setEvents(matched);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil event."));
    } finally {
      setLoading(false);
    }
  }, [query, sort]);

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

    fetchData();
  }, [fetchData, router]);

  const openEvent = async (eventId: string) => {
    setSuccess("");
    setError("");
    try {
      const [detail, match] = await Promise.allSettled([getEvent(eventId), getEventMatch(eventId)]);
      if (detail.status === "rejected") throw detail.reason;
      setSelected(detail.value);
      setSelectedMatch(match.status === "fulfilled" ? match.value : null);
      setArrival(toLocalInputValue(detail.value.starts_at));
      setNote(`Mohon konfirmasi dukungan aksesibilitas untuk ${detail.value.title}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal membuka detail event."));
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      await createRequest(selected.id, {
        arrival_estimate: fromLocalInputValue(arrival),
        note,
      });

      setSuccess("Permintaan aksesibilitas berhasil dikirim.");
      setSelected(null);
      fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengirim permintaan."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30">
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
              <Clock className="size-5 text-gold-600 mb-4" />
              <p className="text-3xl font-bold text-navy-900">{pendingCount}</p>
              <p className="text-xs font-bold text-ink-500 uppercase mt-1">Permintaan pending</p>
            </div>
            <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
              <ShieldCheck className="size-5 text-green-600 mb-4" />
              <p className="text-base font-bold text-navy-900 line-clamp-2 min-h-12">{activeEventTitle || "Belum ada"}</p>
              <p className="text-xs font-bold text-ink-500 uppercase mt-1">Event aktif</p>
            </div>
          </section>
        </div>

        {success && (
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy-900">Event untuk kamu</h2>
              <p className="text-sm text-ink-500">Skor cocok dihitung dari profil kebutuhanmu.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchData();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative">
                <Search className="size-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari event"
                  className="pl-9 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm w-full sm:w-64 focus:outline-none focus:border-navy-500"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "starts_at" | "match_score")}
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
              {events.map((event) => (
                <article key={event.id} className="bg-white border border-line rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gold-600 uppercase mb-2">{statusLabel(event.status)}</p>
                      <h3 className="text-lg font-bold text-navy-900 leading-snug">{event.title}</h3>
                    </div>
                    <div className="size-14 rounded-2xl bg-navy-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-navy-900">{event.match?.score ?? "-"}</span>
                      <span className="text-[10px] font-bold text-ink-500">MATCH</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-ink-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-ink-400" />
                      {formatDateTime(event.starts_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-ink-400" />
                      {event.venue.name}, {event.venue.city}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-ink-400" />
                      {event.organizer.name} · skor {event.organizer.reliability_score ?? "-"}
                    </div>
                  </div>

                  <button
                    onClick={() => openEvent(event.id)}
                    className="mt-auto w-full rounded-xl bg-navy-900 px-4 py-3 text-sm font-bold text-white hover:bg-navy-800"
                  >
                    Lihat & ajukan bantuan
                  </button>
                </article>
              ))}
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

      {selected && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl border border-line max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-line flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif text-navy-900">{selected.title}</h2>
                <p className="text-sm text-ink-500 mt-1">{selected.venue.name}, {selected.venue.city}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-ink-50">
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-4">
                <div className="rounded-2xl bg-navy-900 text-white p-5">
                  <p className="text-sm text-navy-100 mb-2">Skor kecocokan</p>
                  <p className="text-5xl font-bold">{selectedMatch?.score ?? "-"}</p>
                  <p className="text-xs text-navy-100 mt-3">{selectedMatch?.summary || "Simpan profil kebutuhan agar skor dapat dihitung."}</p>
                </div>
                <div className="rounded-2xl border border-line p-5">
                  <h3 className="font-bold text-navy-900 mb-3">Klaim aksesibilitas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visibleClaims.map((key) => (
                      <div key={key} className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2">
                        <span className="text-xs font-semibold text-ink-600">{needLabels[key]}</span>
                        <span className={cn("text-[10px] font-bold rounded-full px-2 py-1", claimTone(selected.claim[key]))}>
                          {claimLabel(selected.claim[key])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink-500 mt-3">
                    Jarak jalan kaki: {selected.claim.walking_distance_m ?? "-"} m · sumber {selected.claim.source}
                  </p>
                </div>
              </div>

              <form onSubmit={submitRequest} className="rounded-2xl border border-line p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-navy-900">Ajukan permintaan aksesibilitas</h3>
                  <p className="text-sm text-ink-500">Permintaan akan menyertakan snapshot profil kebutuhanmu.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-navy-900">Estimasi tiba</label>
                    <input
                      type="datetime-local"
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-line bg-bg text-sm focus:outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-navy-900">Catatan</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="px-4 py-3 rounded-xl border border-line bg-bg text-sm resize-none focus:outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </div>
                <button
                  disabled={submitting}
                  className="w-full rounded-xl bg-navy-900 px-4 py-3 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Kirim permintaan
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
