"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck, Loader2, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  AccessibilityRequest,
  getErrorMessage,
  getEvent,
  isApiError,
  listRequests,
  NeedProfile,
  submitVerification,
  VerificationValue,
} from "@/lib/api";
import { formatDateTime, needLabels, verificationLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionAside, MotionCardButton, MotionCardGrid, MotionForm } from "@/components/ui/motion-card";

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

const options: VerificationValue[] = ["fulfilled", "partially_fulfilled", "not_fulfilled"];

interface VerifiableRequest extends AccessibilityRequest {
  eventStatus: "upcoming" | "completed" | "unknown";
  eventEndsAt: string | null;
}

function verificationErrorMessage(err: unknown) {
  if (isApiError(err, "EVENT_NOT_COMPLETED")) return "Event ini belum selesai, jadi belum bisa diverifikasi.";
  if (isApiError(err, "ALREADY_VERIFIED")) return "Permintaan ini sudah pernah diverifikasi.";
  if (isApiError(err, "INVALID_REQUEST_STATE")) return "Status permintaan ini tidak memungkinkan verifikasi.";
  if (isApiError(err, "VALIDATION_ERROR")) return "Semua tujuh atribut harus diisi sebelum dikirim.";
  return getErrorMessage(err, "Gagal mengirim verifikasi.");
}

export default function VerificationPage() {
  const router = useRouter();
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
            return { ...request, eventStatus: event.status, eventEndsAt: event.ends_at };
          } catch {
            return { ...request, eventStatus: "unknown", eventEndsAt: null };
          }
        }),
      );

      setRequests(withStatus);
      setRequestId((current) => {
        if (withStatus.some((item) => item.id === current && item.eventStatus === "completed")) return current;
        return withStatus.find((item) => item.eventStatus === "completed")?.id ?? "";
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil daftar verifikasi."));
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

    void loadRequests();
  }, [loadRequests, router]);

  const selectedRequest = requests.find((request) => request.id === requestId);
  const allAnswered = attributeKeys.every((key) => answers[key] !== "");

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
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-bg-soft">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <header>
            <h1 className="font-serif text-4xl text-navy-900 mb-2">Verifikasi Pengalaman</h1>
            <p className="text-sm text-ink-500">Bandingkan komitmen organizer dengan pengalaman aktual setelah event selesai.</p>
          </header>

          {result && (
            <div className="rounded-xl border border-green-500/20 bg-green-50 px-4 py-4 text-sm text-ink-700">
              <p className="font-bold">Verifikasi terkirim. Terima kasih.</p>
              <p className="mt-1">
                {result.score !== null
                  ? `Indikator penyelenggara sekarang ${result.score} dari ${result.sampleCount} verifikasi.`
                  : "Penyelenggara belum memiliki cukup verifikasi untuk skor."}{" "}
                Ini indikator dari umpan balik peserta, bukan sertifikasi independen.
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
            <MotionCardGrid className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
              <MotionAside className="bg-white border border-line rounded-[2rem] p-6 shadow-sm h-fit" lift={false}>
                <h2 className="text-lg font-bold text-navy-900 mb-4">Permintaan dikonfirmasi</h2>
                <div className="space-y-3">
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
                          "w-full text-left rounded-2xl border p-4 transition-colors",
                          requestId === request.id ? "border-navy-900 bg-navy-50" : "border-line bg-white",
                          ready ? "hover:bg-bg-soft" : "opacity-60 cursor-not-allowed",
                        )}
                      >
                        <p className="text-sm font-bold text-navy-900">{request.event_title}</p>
                        <p className="text-xs text-ink-500 mt-1">
                          {ready
                            ? `Event selesai ${formatDateTime(request.eventEndsAt)}`
                            : request.eventStatus === "upcoming"
                              ? "Event belum selesai. Verifikasi tersedia setelah event berakhir."
                              : "Status event tidak dapat dimuat."}
                        </p>
                      </MotionCardButton>
                    );
                  })}
                </div>
              </MotionAside>

              {selectedRequest ? (
                <MotionForm onSubmit={handleSubmit} className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-6" lift={false}>
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-2xl bg-navy-50 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="size-6 text-navy-700" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-900">{selectedRequest.event_title}</h2>
                      <p className="text-sm text-ink-500 mt-1">Pilih kondisi aktual untuk tujuh atribut aksesibilitas.</p>
                    </div>
                  </div>

                  {selectedRequest.response && (
                    <div className="rounded-xl bg-bg-soft px-4 py-3 text-sm text-ink-700">
                      <p className="text-xs font-bold text-ink-500 uppercase mb-1">Komitmen penyelenggara</p>
                      {selectedRequest.response.note}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attributeKeys.map((key) => (
                      <div key={key} className="rounded-2xl border border-line bg-bg p-4">
                        <label htmlFor={`v-${key}`} className="block text-sm font-bold text-navy-900 mb-3">
                          {needLabels[key]}
                        </label>
                        <select
                          id={`v-${key}`}
                          value={answers[key]}
                          onChange={(e) => setAnswers((current) => ({ ...current, [key]: e.target.value as Choice }))}
                          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:border-navy-500"
                          required
                        >
                          <option value="" disabled>
                            Pilih kondisi
                          </option>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {verificationLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={submitting || !allAnswered}
                    className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Kirim verifikasi
                  </button>
                </MotionForm>
              ) : (
                <div className="bg-white border border-line rounded-[2rem] p-10 text-center shadow-sm h-fit">
                  <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
                  <h2 className="font-bold text-navy-900">Belum ada event yang selesai</h2>
                  <p className="text-sm text-ink-500 mt-1">Verifikasi bisa dikirim setelah event yang kamu ikuti berakhir.</p>
                </div>
              )}
            </MotionCardGrid>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-12 text-center">
              <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
              <h2 className="font-bold text-navy-900">Belum ada request yang siap diverifikasi</h2>
              <p className="text-sm text-ink-500 mt-1">
                Request berstatus dikonfirmasi akan muncul di sini setelah organizer merespons dan kamu menerimanya.{" "}
                <Link href="/history" className="underline text-navy-700">
                  Lihat riwayat
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
