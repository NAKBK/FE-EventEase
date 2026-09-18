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
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  ApiError,
  EventDetail,
  getErrorMessage,
  getEvent,
  getEventMatch,
  getOrganizer,
  isApiError,
  MatchResponse,
  OrganizerProfile,
} from "@/lib/api";
import {
  claimLabel,
  claimSourceLabel,
  claimTone,
  formatDateTime,
  matchLabel,
  matchLabelTone,
  matchTier,
  needLabels,
  statusLabel,
} from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionCard, MotionSection } from "@/components/ui/motion-card";
import { RequestPanel } from "@/components/attendee/RequestPanel";

const labelIcon = {
  fulfilled: Check,
  partially_fulfilled: Minus,
  not_fulfilled: X,
  unknown: CircleHelp,
} as const;

const facilityKeys = [
  "step_free_entrance",
  "elevator_or_ramp",
  "accessible_restroom",
  "accessible_seating",
  "rest_area",
  "parking_or_dropoff",
] as const;

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

  const tier = matchTier(match?.score);
  const reliability = organizer?.reliability ?? null;
  const reliabilityScore = reliability ? reliability.score : event?.organizer.reliability_score ?? null;
  const reliabilityCount = reliability ? reliability.sample_count : event?.organizer.sample_count ?? 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
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
              <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-stretch">
                <MotionSection className="bg-white border border-line rounded-[2rem] p-6 shadow-sm h-full" lift={false}>
                  <span className="inline-flex rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700 mb-2">
                    {statusLabel(event.status)}
                  </span>
                  <h1 className="font-serif text-3xl text-navy-900 leading-tight">{event.title}</h1>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-ink-500">
                    <span className="flex items-center gap-2">
                      <Calendar className="size-4 shrink-0 text-ink-300" />
                      {formatDateTime(event.starts_at)} – {formatDateTime(event.ends_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-ink-300" />
                      {event.venue.name}, {event.venue.address || event.venue.city}
                    </span>
                  </div>
                  {event.description && <p className="mt-3 text-sm text-ink-700 leading-relaxed">{event.description}</p>}
                </MotionSection>

                <MotionCard className="rounded-[2rem] bg-navy-900 text-white p-6 shadow-sm h-full flex flex-col justify-center">
                  <p className="text-sm text-navy-100 mb-1">Skor kecocokan untukmu</p>
                  <div className="flex items-end gap-3">
                    <p className="text-5xl font-bold leading-none">{match?.score ?? "-"}</p>
                    <span className="mb-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-navy-900">{tier.label}</span>
                  </div>
                  {match ? (
                    <p className="text-xs text-navy-100 mt-3 leading-relaxed">
                      {match.summary} Bobot {match.weight_version} (sementara), dihitung server, bukan jaminan.
                    </p>
                  ) : (
                    <p className="text-xs text-navy-100 mt-3 leading-relaxed">
                      {needsProfile
                        ? "Skor belum bisa dihitung karena profil kebutuhanmu belum disimpan."
                        : "Skor kecocokan belum tersedia untuk event ini."}
                    </p>
                  )}
                  {needsProfile && (
                    <Link
                      href="/profile"
                      className="mt-3 inline-flex w-fit rounded-xl bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-navy-50"
                    >
                      Isi profil kebutuhan
                    </Link>
                  )}
                </MotionCard>
              </div>

              <MotionSection className="rounded-[2rem] bg-white border border-line p-6 shadow-sm" lift={false}>
                <h2 className="text-lg font-bold text-navy-900">Rincian kecocokan</h2>
                <p className="text-xs text-ink-500 mt-0.5 mb-4">Kebutuhanmu dibandingkan dengan klaim penyelenggara untuk tiap atribut.</p>

                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 auto-rows-fr">
                  {match
                    ? match.breakdown.map((row) => {
                        const Icon = labelIcon[row.label];
                        const isDistance = row.attribute === "walking_distance";
                        return (
                          <li key={row.attribute} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-navy-900">{needLabels[row.attribute]}</p>
                              <p className="text-xs text-ink-500">
                                {row.required ? "Kamu perlukan" : "Tidak wajib"}
                                {isDistance && event.claim.walking_distance_m !== null ? ` · klaim ${event.claim.walking_distance_m} m` : ""}
                              </p>
                            </div>
                            <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", matchLabelTone(row.label))}>
                              <Icon className="size-3.5" />
                              {matchLabel(row.label)}
                            </span>
                          </li>
                        );
                      })
                    : [
                        ...facilityKeys.map((key) => (
                          <li key={key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3 py-2">
                            <p className="text-sm font-bold text-navy-900">{needLabels[key]}</p>
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", claimTone(event.claim[key]))}>
                              {claimLabel(event.claim[key])}
                            </span>
                          </li>
                        )),
                        <li key="walking" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3 py-2">
                          <p className="text-sm font-bold text-navy-900">{needLabels.walking_distance}</p>
                          <span className="text-xs font-bold text-ink-500">
                            {event.claim.walking_distance_m !== null ? `${event.claim.walking_distance_m} m` : "Belum diketahui"}
                          </span>
                        </li>,
                      ]}
                </ul>

                {match && match.unknown_attributes.length > 0 && (
                  <div className="mt-3 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-2.5 text-sm text-ink-700">
                    <TriangleAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                    <p>
                      Belum diketahui:{" "}
                      <strong>{match.unknown_attributes.map((key) => needLabels[key as keyof typeof needLabels] ?? key).join(", ")}</strong>.
                      Dihitung sebagai belum terpenuhi. Tanyakan lewat permintaan aksesibilitas di bawah.
                    </p>
                  </div>
                )}
              </MotionSection>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <MotionCard className="rounded-[2rem] bg-white border border-line p-5 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-9 rounded-xl bg-navy-50 flex items-center justify-center">
                      <ShieldCheck className="size-5 text-navy-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-navy-900 leading-tight">{event.organizer.name}</h2>
                      <p className="text-xs text-ink-500">Indikator umpan balik penyelenggara</p>
                    </div>
                  </div>
                  {reliabilityScore !== null ? (
                    <p className="text-sm text-ink-700">
                      <span className="text-2xl font-bold text-navy-900 mr-2">{reliabilityScore}</span>
                      dari {reliabilityCount} verifikasi peserta{reliability ? ` (maks. ${reliability.window_size} terbaru)` : ""}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-ink-500">Belum ada verifikasi</p>
                  )}
                  <p className="text-xs text-ink-500 mt-2">Ini indikator dari verifikasi peserta, bukan sertifikasi independen.</p>
                </MotionCard>

                <MotionCard className="rounded-[2rem] bg-white border border-line p-5 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-9 rounded-xl bg-navy-50 flex items-center justify-center">
                      <Info className="size-5 text-navy-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-navy-900 leading-tight">Sumber klaim</h2>
                      <p className="text-xs text-ink-500">Asal data fasilitas di atas</p>
                    </div>
                  </div>
                  <p className="text-sm text-ink-700">
                    <strong>{claimSourceLabel(event.claim.source)}</strong>, dicatat {formatDateTime(event.claim.checked_at)}.
                  </p>
                  <p className="text-xs text-ink-500 mt-2">Klaim ini bukan hasil audit independen. Konfirmasi lewat permintaan aksesibilitas.</p>
                </MotionCard>
              </div>

              {event.media.length > 0 && (
                <MotionSection className="rounded-[2rem] bg-white border border-line p-6 shadow-sm" lift={false}>
                  <h2 className="text-lg font-bold text-navy-900">Foto bukti klaim</h2>
                  <p className="text-xs text-ink-500 mt-0.5 mb-3">Foto dari penyelenggara sebagai bukti, bukan sertifikasi.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {event.media.map((item, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.id}
                        src={item.url}
                        alt={`Foto fasilitas ${event.title} ${index + 1}`}
                        className="aspect-[4/3] w-full rounded-xl border border-line object-cover"
                      />
                    ))}
                  </div>
                </MotionSection>
              )}

              <MotionSection className="rounded-[2rem] bg-white border border-line p-6 shadow-sm" lift={false}>
                <h2 className="text-lg font-bold text-navy-900">Ajukan permintaan aksesibilitas</h2>
                <p className="text-xs text-ink-500 mt-0.5 mb-4">
                  Cara ikut: kirim permintaan, tunggu respons tertulis penyelenggara, lalu konfirmasi. EventEase tidak menjual tiket,
                  ikuti ketentuan penyelenggara untuk tiket atau pendaftaran.
                </p>
                <RequestPanel event={event} />
              </MotionSection>
            </>
          )}
        </div>
      </div>
    </>
  );
}
