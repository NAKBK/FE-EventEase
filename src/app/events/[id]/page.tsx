"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CircleHelp,
  Info,
  Loader2,
  MapPin,
  Minus,
  Send,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  createRequest,
  EventDetail,
  getErrorMessage,
  getEvent,
  getEventMatch,
  getOrganizer,
  isApiError,
  MatchResponse,
  OrganizerProfile,
  ApiError,
} from "@/lib/api";
import {
  claimLabel,
  claimSourceLabel,
  claimTone,
  formatDateTime,
  fromLocalInputValue,
  matchLabel,
  matchLabelTone,
  matchTier,
  needLabels,
  statusLabel,
  toLocalInputValue,
} from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionCard, MotionSection } from "@/components/ui/motion-card";

const labelIcon = {
  fulfilled: Check,
  partially_fulfilled: Minus,
  not_fulfilled: X,
  unknown: CircleHelp,
} as const;

function requestErrorMessage(err: unknown) {
  if (isApiError(err, "ACTIVE_REQUEST_EXISTS")) {
    return "Kamu sudah punya permintaan aktif untuk event ini. Lihat statusnya di Riwayat.";
  }
  if (isApiError(err, "EVENT_NOT_UPCOMING")) return "Event ini sudah selesai, permintaan tidak bisa dikirim.";
  if (isApiError(err, "NEED_PROFILE_MISSING")) {
    return "Simpan profil kebutuhan aksesibilitasmu dulu sebelum mengirim permintaan.";
  }
  if (isApiError(err, "VALIDATION_ERROR")) return "Estimasi tiba atau catatan belum valid. Catatan maksimal 500 karakter.";
  return getErrorMessage(err, "Gagal mengirim permintaan.");
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [arrival, setArrival] = useState(toLocalInputValue());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestDone, setRequestDone] = useState(false);
  const [requestNeedsProfile, setRequestNeedsProfile] = useState(false);

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

    let cancelled = false;

    (async () => {
      try {
        const detail = await getEvent(eventId);
        const [matchResult, organizerResult] = await Promise.allSettled([
          getEventMatch(eventId),
          getOrganizer(detail.organizer.id),
        ]);
        if (cancelled) return;

        setEvent(detail);
        setArrival(toLocalInputValue(detail.starts_at));
        setNote(`Mohon konfirmasi dukungan aksesibilitas untuk ${detail.title}.`);

        if (matchResult.status === "fulfilled") setMatch(matchResult.value);
        else if (isApiError(matchResult.reason, "NEED_PROFILE_MISSING")) setNeedsProfile(true);

        if (organizerResult.status === "fulfilled") setOrganizer(organizerResult.value);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setError("Event tidak ditemukan.");
        else setError(getErrorMessage(err, "Gagal membuka detail event."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setSubmitting(true);
    setRequestError("");
    setRequestNeedsProfile(false);

    try {
      await createRequest(event.id, { arrival_estimate: fromLocalInputValue(arrival), note });
      setRequestDone(true);
    } catch (err: unknown) {
      setRequestNeedsProfile(isApiError(err, "NEED_PROFILE_MISSING"));
      setRequestError(requestErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const tier = matchTier(match?.score);
  const reliability = organizer?.reliability ?? null;
  const reliabilityScore = reliability ? reliability.score : event?.organizer.reliability_score ?? null;
  const reliabilityCount = reliability ? reliability.sample_count : event?.organizer.sample_count ?? 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-bg-soft">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-navy-900 w-fit">
            <ArrowLeft className="size-4" />
            Kembali ke daftar event
          </Link>

          {loading ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : error || !event ? (
            <div className="bg-white border border-line rounded-2xl p-12 text-center">
              <TriangleAlert className="size-10 text-ink-300 mx-auto mb-3" />
              <h1 className="font-bold text-navy-900">{error || "Event tidak ditemukan."}</h1>
              <Link href="/" className="inline-block mt-4 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-navy-800">
                Kembali ke Home
              </Link>
            </div>
          ) : (
            <>
              <MotionSection className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm" lift={false}>
                <span className="inline-flex rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700 mb-3">
                  {statusLabel(event.status)}
                </span>
                <h1 className="font-serif text-4xl text-navy-900 leading-tight">{event.title}</h1>
                <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-6 text-sm text-ink-500">
                  <span className="flex items-center gap-2">
                    <Calendar className="size-4 text-ink-300" />
                    {formatDateTime(event.starts_at)} – {formatDateTime(event.ends_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-ink-300" />
                    {event.venue.name}, {event.venue.address || event.venue.city}
                  </span>
                </div>
                {event.description && <p className="mt-4 text-sm text-ink-700 leading-relaxed">{event.description}</p>}
              </MotionSection>

              <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
                <section className="flex flex-col gap-6">
                  <MotionCard className="rounded-[2rem] bg-navy-900 text-white p-6 shadow-sm">
                    <p className="text-sm text-navy-100 mb-2">Skor kecocokan untukmu</p>
                    <div className="flex items-end gap-3">
                      <p className="text-6xl font-bold">{match?.score ?? "-"}</p>
                      <span className="mb-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-navy-900">
                        {tier.label}
                      </span>
                    </div>
                    {match ? (
                      <>
                        <p className="text-sm text-navy-100 mt-4 leading-relaxed">{match.summary}</p>
                        <p className="text-xs text-navy-100 mt-3">
                          Bobot {match.weight_version} (sementara). Skor dihitung server dan bukan jaminan.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-navy-100 mt-4 leading-relaxed">
                        {needsProfile
                          ? "Skor belum bisa dihitung karena profil kebutuhanmu belum disimpan."
                          : "Skor kecocokan belum tersedia untuk event ini."}
                      </p>
                    )}
                    {needsProfile && (
                      <Link
                        href="/profile"
                        className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-navy-50"
                      >
                        Isi profil kebutuhan
                      </Link>
                    )}
                  </MotionCard>

                  <MotionCard className="rounded-[2rem] bg-white border border-line p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-xl bg-navy-50 flex items-center justify-center">
                        <ShieldCheck className="size-5 text-navy-700" />
                      </div>
                      <div>
                        <h2 className="font-bold text-navy-900">{event.organizer.name}</h2>
                        <p className="text-xs text-ink-500">Indikator umpan balik penyelenggara</p>
                      </div>
                    </div>
                    {reliabilityScore !== null ? (
                      <>
                        <p className="text-3xl font-bold text-navy-900">{reliabilityScore}</p>
                        <p className="text-xs text-ink-500 mt-1">
                          Dari {reliabilityCount} verifikasi peserta
                          {reliability ? ` (maks. ${reliability.window_size} terbaru)` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-ink-500">Belum ada verifikasi</p>
                    )}
                    <p className="text-xs text-ink-500 mt-3 leading-relaxed">
                      Ini indikator dari verifikasi peserta, bukan sertifikasi independen.
                    </p>
                  </MotionCard>
                </section>

                <MotionSection className="rounded-[2rem] bg-white border border-line p-6 sm:p-8 shadow-sm" lift={false}>
                  <h2 className="text-xl font-bold text-navy-900">Rincian kecocokan</h2>
                  <p className="text-sm text-ink-500 mt-1 mb-5">
                    Kebutuhanmu dibandingkan dengan klaim penyelenggara untuk tiap atribut.
                  </p>

                  {match ? (
                    <ul className="flex flex-col gap-2">
                      {match.breakdown.map((row) => {
                        const Icon = labelIcon[row.label];
                        const isDistance = row.attribute === "walking_distance";
                        return (
                          <li key={row.attribute} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-navy-900">{needLabels[row.attribute]}</p>
                              <p className="text-xs text-ink-500 mt-0.5">
                                {row.required ? "Kamu perlukan" : "Tidak wajib"}
                                {isDistance && event.claim.walking_distance_m !== null
                                  ? ` · klaim ${event.claim.walking_distance_m} m`
                                  : ""}
                              </p>
                            </div>
                            <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", matchLabelTone(row.label))}>
                              <Icon className="size-3.5" />
                              {matchLabel(row.label)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {(
                        [
                          "step_free_entrance",
                          "elevator_or_ramp",
                          "accessible_restroom",
                          "accessible_seating",
                          "rest_area",
                          "parking_or_dropoff",
                        ] as const
                      ).map((key) => (
                        <li key={key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3">
                          <p className="text-sm font-bold text-navy-900">{needLabels[key]}</p>
                          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", claimTone(event.claim[key]))}>
                            {claimLabel(event.claim[key])}
                          </span>
                        </li>
                      ))}
                      <li className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3">
                        <p className="text-sm font-bold text-navy-900">{needLabels.walking_distance}</p>
                        <span className="text-xs font-bold text-ink-500">
                          {event.claim.walking_distance_m !== null ? `${event.claim.walking_distance_m} m` : "Belum diketahui"}
                        </span>
                      </li>
                    </ul>
                  )}

                  {match && match.unknown_attributes.length > 0 && (
                    <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-3 text-sm text-ink-700">
                      <TriangleAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <p>
                        Informasi belum diketahui untuk:{" "}
                        <strong>{match.unknown_attributes.map((key) => needLabels[key as keyof typeof needLabels] ?? key).join(", ")}</strong>
                        . Data yang belum diketahui dihitung sebagai belum terpenuhi. Hubungi penyelenggara lewat permintaan aksesibilitas.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3 rounded-xl bg-bg-soft px-4 py-3 text-xs text-ink-500">
                    <Info className="size-4 text-ink-300 shrink-0 mt-0.5" />
                    <p>
                      Sumber: {claimSourceLabel(event.claim.source)}, dicatat {formatDateTime(event.claim.checked_at)}.
                      Klaim ini bukan hasil audit independen.
                    </p>
                  </div>
                </MotionSection>
              </div>

              {event.media.length > 0 && (
                <MotionSection className="rounded-[2rem] bg-white border border-line p-6 sm:p-8 shadow-sm" lift={false}>
                  <h2 className="text-xl font-bold text-navy-900">Foto bukti klaim</h2>
                  <p className="text-sm text-ink-500 mt-1 mb-4">Foto dari penyelenggara sebagai bukti, bukan sertifikasi.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {event.media.map((item, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.id}
                        src={item.url}
                        alt={`Foto fasilitas ${event.title} ${index + 1}`}
                        className="aspect-square w-full rounded-xl border border-line object-cover"
                      />
                    ))}
                  </div>
                </MotionSection>
              )}

              {event.status === "upcoming" && (
                <MotionSection className="rounded-[2rem] bg-white border border-line p-6 sm:p-8 shadow-sm" lift={false}>
                  <h2 className="text-xl font-bold text-navy-900">Ajukan permintaan aksesibilitas</h2>
                  <p className="text-sm text-ink-500 mt-1 mb-5">Permintaan menyertakan snapshot profil kebutuhanmu saat ini.</p>

                  {requestDone ? (
                    <div className="rounded-xl border border-green-500/20 bg-green-50 px-4 py-4 text-sm text-ink-700">
                      <p className="font-bold">Permintaan berhasil dikirim.</p>
                      <p className="mt-1">Penyelenggara akan merespons. Pantau statusnya di Riwayat.</p>
                      <Link href="/history" className="inline-flex mt-3 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-800">
                        Lihat riwayat
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={submitRequest} className="flex flex-col gap-4">
                      {requestError && (
                        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">
                          {requestError}{" "}
                          {requestNeedsProfile && (
                            <Link href="/profile" className="underline text-navy-700">
                              Isi profil
                            </Link>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="arrival" className="text-sm font-semibold text-navy-900">Estimasi tiba</label>
                          <input
                            id="arrival"
                            type="datetime-local"
                            value={arrival}
                            onChange={(e) => setArrival(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-line bg-bg text-sm focus:outline-none focus:border-navy-500"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="note" className="text-sm font-semibold text-navy-900">Catatan</label>
                          <textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="px-4 py-3 rounded-xl border border-line bg-bg text-sm resize-none focus:outline-none focus:border-navy-500"
                            required
                          />
                          <p className="text-xs text-ink-300 text-right">{note.length}/500</p>
                        </div>
                      </div>
                      <button
                        disabled={submitting}
                        className="w-full sm:w-fit rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                      >
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        Kirim permintaan
                      </button>
                    </form>
                  )}
                </MotionSection>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
