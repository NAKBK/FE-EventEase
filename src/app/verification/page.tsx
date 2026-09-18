"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, ClipboardCheck, Loader2, Minus, Send, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  AccessibilityRequest,
  Claim,
  getErrorMessage,
  getEvent,
  isApiError,
  listRequests,
  NeedProfile,
  submitVerification,
  VerificationValue,
} from "@/lib/api";
import { claimLabel, formatDateTime, needLabels, verificationLabel, walkingLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionCardButton, MotionForm, MotionSection } from "@/components/ui/motion-card";
import { PageBackdrop } from "@/components/attendee/PageBackdrop";

type Choice = VerificationValue | "";

const attributeKeys = [
  "step_free_entrance",
  "elevator_or_ramp",
  "accessible_restroom",
  "accessible_seating",
  "rest_area",
  "parking_or_dropoff",
  "walking_distance",
] as Array<keyof NeedProfile>;

const emptyAnswers = Object.fromEntries(attributeKeys.map((key) => [key, ""])) as Record<keyof NeedProfile, Choice>;

const options: Array<{ value: VerificationValue; short: string; hint: string; icon: typeof Check; iconTone: string }> = [
  { value: "fulfilled", short: "Terpenuhi", hint: "Sesuai yang dijanjikan.", icon: Check, iconTone: "text-green-500" },
  { value: "partially_fulfilled", short: "Sebagian", hint: "Ada, tapi kurang dari janji.", icon: Minus, iconTone: "text-amber-500" },
  { value: "not_fulfilled", short: "Tidak", hint: "Tidak ada atau tidak bisa dipakai.", icon: X, iconTone: "text-red-500" },
];

interface VerifiableRequest extends AccessibilityRequest {
  eventStatus: "upcoming" | "completed" | "unknown";
  eventEndsAt: string | null;
  claim: Claim | null;
}

function verificationErrorMessage(err: unknown) {
  if (isApiError(err, "EVENT_NOT_COMPLETED")) return "Event ini belum selesai, jadi belum bisa diverifikasi.";
  if (isApiError(err, "ALREADY_VERIFIED")) return "Permintaan ini sudah pernah diverifikasi.";
  if (isApiError(err, "INVALID_REQUEST_STATE")) return "Status permintaan ini tidak memungkinkan verifikasi.";
  if (isApiError(err, "VALIDATION_ERROR")) return "Semua tujuh atribut harus diisi sebelum dikirim.";
  return getErrorMessage(err, "Gagal mengirim verifikasi.");
}

// What the organizer claimed for this attribute, shown next to the answer so the comparison is direct.
function claimText(claim: Claim | null, key: keyof NeedProfile) {
  if (!claim) return "Tidak tersedia";
  if (key === "walking_distance") return claim.walking_distance_m !== null ? `${claim.walking_distance_m} m` : "Belum diketahui";
  return claimLabel(claim[key]);
}

function VerificationContent() {
  const router = useRouter();
  const preferredId = useSearchParams().get("request");
  const [requests, setRequests] = useState<VerifiableRequest[]>([]);
  const [requestId, setRequestId] = useState("");
  const [answers, setAnswers] = useState(emptyAnswers);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number | null; sampleCount: number } | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await listRequests("confirmed");
      const withStatus = await Promise.all(
        data.items.map(async (request): Promise<VerifiableRequest> => {
          try {
            const event = await getEvent(request.event_id);
            return { ...request, eventStatus: event.status, eventEndsAt: event.ends_at, claim: event.claim };
          } catch {
            return { ...request, eventStatus: "unknown", eventEndsAt: null, claim: null };
          }
        }),
      );

      setRequests(withStatus);
      setRequestId((current) => {
        const ready = (id: string | null) => withStatus.some((item) => item.id === id && item.eventStatus === "completed");
        if (ready(current)) return current;
        if (ready(preferredId)) return preferredId as string;
        return withStatus.find((item) => item.eventStatus === "completed")?.id ?? "";
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil daftar verifikasi."));
    } finally {
      setLoading(false);
    }
  }, [preferredId]);

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

    void loadRequests();
  }, [loadRequests, router]);

  const selectedRequest = requests.find((request) => request.id === requestId);
  const answered = attributeKeys.filter((key) => answers[key] !== "").length;
  const allAnswered = answered === attributeKeys.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      setError("Pilih kondisi aktual untuk semua tujuh atribut.");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const data = await submitVerification(requestId, answers as Record<keyof NeedProfile, VerificationValue>);
      setResult({ score: data.organizer_reliability.score, sampleCount: data.organizer_reliability.sample_count });
      setAnswers(emptyAnswers);
      await loadRequests();
    } catch (err: unknown) {
      setError(verificationErrorMessage(err));
      if (isApiError(err, "ALREADY_VERIFIED")) await loadRequests();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative isolate min-h-screen overflow-hidden pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
      <PageBackdrop variant="verification" />
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <header>
            <h1 className="font-serif text-3xl text-navy-900 mb-1">Verifikasi Pengalaman</h1>
            <p className="text-sm text-ink-500">
              Verifikasi hanya untuk <strong>permintaan aksesibilitas yang kamu kirim</strong> dan sudah dikonfirmasi penyelenggara. Setelah
              event selesai, bandingkan komitmen mereka dengan pengalaman aslimu.
            </p>
          </header>

          <MotionSection className="bg-white border border-line rounded-[2rem] p-5 shadow-sm" lift={false}>
            <h2 className="text-sm font-bold text-navy-900">Cara menilai</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 items-stretch">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <li key={option.value} className="flex items-start gap-2.5 rounded-xl bg-bg-soft px-3 py-2.5 h-full">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", option.iconTone)} />
                    <span className="text-xs text-ink-700">
                      <strong className="block text-sm text-navy-900">{verificationLabel(option.value)}</strong>
                      {option.hint}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              Nilai sesuai yang kamu alami sendiri. Jawabanmu ikut membentuk skor keandalan penyelenggara, yang merupakan indikator dari
              umpan balik peserta, bukan sertifikasi independen.
            </p>
          </MotionSection>

          {result && (
            <div className="rounded-xl border border-green-500/20 bg-green-50 px-4 py-3 text-sm text-ink-700">
              <p className="font-bold">Verifikasi terkirim. Terima kasih.</p>
              <p className="mt-0.5">
                {result.score !== null
                  ? `Indikator penyelenggara sekarang ${result.score} dari ${result.sampleCount} verifikasi.`
                  : "Penyelenggara belum memiliki cukup verifikasi untuk skor."}
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : requests.length > 0 ? (
            <>
              <MotionSection className="bg-white border border-line rounded-[2rem] p-5 shadow-sm" lift={false}>
                <h2 className="text-sm font-bold text-navy-900 mb-3">Dari permintaanmu</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 items-stretch">
                  {requests.map((request) => {
                    const ready = request.eventStatus === "completed";
                    return (
                      <MotionCardButton
                        key={request.id}
                        type="button"
                        disabled={!ready}
                        onClick={() => {
                          setRequestId(request.id);
                          setError("");
                        }}
                        className={cn(
                          "h-full w-full text-left rounded-2xl border p-3 transition-colors",
                          requestId === request.id ? "border-navy-900 bg-navy-50" : "border-line bg-white",
                          ready ? "hover:bg-bg-soft" : "opacity-60 cursor-not-allowed",
                        )}
                        lift={false}
                      >
                        <p className="text-sm font-bold text-navy-900 leading-snug">{request.event_title}</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {ready
                            ? `Event selesai ${formatDateTime(request.eventEndsAt)}`
                            : request.eventStatus === "upcoming"
                              ? "Belum selesai. Verifikasi tersedia setelah event berakhir."
                              : "Status event tidak dapat dimuat."}
                        </p>
                      </MotionCardButton>
                    );
                  })}
                </div>
              </MotionSection>

              {selectedRequest ? (
                <MotionForm onSubmit={handleSubmit} className="bg-white border border-line rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col gap-4" lift={false}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="size-5 text-navy-700" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-navy-900 leading-tight">{selectedRequest.event_title}</h2>
                        <p className="text-xs text-ink-500 mt-0.5">Pilih kondisi aktual yang kamu alami untuk tiap atribut.</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-bg-soft px-3 py-1 text-xs font-bold text-ink-700">
                      {answered}/{attributeKeys.length} terisi
                    </span>
                  </div>

                  {selectedRequest.response && (
                    <div className="rounded-xl bg-bg-soft px-4 py-3 text-sm text-ink-700">
                      <p className="text-[11px] font-bold text-ink-500 uppercase mb-0.5">Komitmen penyelenggara</p>
                      {selectedRequest.response.note}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {attributeKeys.map((key) => {
                      const needed =
                        key === "walking_distance"
                          ? `Toleransi: ${walkingLabel(selectedRequest.needs_snapshot.walking_distance)}`
                          : selectedRequest.needs_snapshot[key] === true
                            ? "Kamu perlukan"
                            : "Tidak wajib";
                      return (
                        <fieldset
                          key={key}
                          className="rounded-2xl border border-line bg-bg px-3 py-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_17rem] sm:items-center"
                        >
                          <legend className="sr-only">{needLabels[key]}</legend>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-navy-900">{needLabels[key]}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white border border-line px-2 py-0.5 text-[11px] font-bold text-ink-700">{needed}</span>
                              <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-bold text-navy-900">
                                Klaim: {claimText(selectedRequest.claim, key)}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {options.map((option) => {
                              const Icon = option.icon;
                              return (
                                <label key={option.value} className="cursor-pointer" title={verificationLabel(option.value)}>
                                  <input
                                    type="radio"
                                    name={`v-${key}`}
                                    value={option.value}
                                    checked={answers[key] === option.value}
                                    onChange={() => setAnswers((current) => ({ ...current, [key]: option.value }))}
                                    className="peer sr-only"
                                  />
                                  <span className="flex items-center justify-center gap-1 rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-bold text-ink-700 hover:bg-bg-soft peer-checked:border-navy-900 peer-checked:bg-navy-900 peer-checked:text-white peer-checked:hover:bg-navy-900 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-500">
                                    <Icon className="size-3.5" />
                                    {option.short}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-line pt-3">
                    <p className="text-xs text-ink-500">Verifikasi hanya bisa dikirim sekali per permintaan.</p>
                    <button
                      disabled={submitting || !allAnswered}
                      className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-60 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                    >
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Kirim verifikasi
                    </button>
                  </div>
                </MotionForm>
              ) : (
                <div className="bg-white border border-line rounded-[2rem] p-10 text-center shadow-sm">
                  <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
                  <h2 className="font-bold text-navy-900">Belum ada event yang selesai</h2>
                  <p className="text-sm text-ink-500 mt-1">Verifikasi bisa dikirim setelah event dari permintaanmu berakhir.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-10 text-center">
              <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
              <h2 className="font-bold text-navy-900">Belum ada permintaan yang bisa diverifikasi</h2>
              <p className="text-sm text-ink-500 mt-1 max-w-xl mx-auto">
                Daftar ini berasal dari permintaan aksesibilitas yang kamu kirim, sudah direspons penyelenggara, dan sudah kamu
                konfirmasi. Kirim permintaan dari halaman detail event, lalu kembali ke sini setelah event selesai.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">
                  Cari event
                </Link>
                <Link href="/history" className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft">
                  Lihat permintaanmu
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={null}>
      <VerificationContent />
    </Suspense>
  );
}
