"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck, Loader2, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessibilityRequest, getErrorMessage, listRequests, NeedProfile, submitVerification, VerificationValue } from "@/lib/api";
import { formatDateTime, needLabels, verificationLabel } from "@/lib/attendee-ui";

const initialAttributes: Record<keyof NeedProfile, VerificationValue> = {
  step_free_entrance: "fulfilled",
  elevator_or_ramp: "fulfilled",
  accessible_restroom: "fulfilled",
  accessible_seating: "fulfilled",
  rest_area: "fulfilled",
  parking_or_dropoff: "fulfilled",
  walking_distance: "fulfilled",
};

const options: VerificationValue[] = ["fulfilled", "partially_fulfilled", "not_fulfilled"];

export default function VerificationPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessibilityRequest[]>([]);
  const [requestId, setRequestId] = useState("");
  const [attributes, setAttributes] = useState(initialAttributes);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listRequests("confirmed");
      setRequests(data.items);
      if (data.items[0]) setRequestId(data.items[0].id);
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

    loadRequests();
  }, [loadRequests, router]);

  const selectedRequest = requests.find((request) => request.id === requestId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const data = await submitVerification(requestId, attributes);
      setMessage(`Verifikasi terkirim. Skor organizer sekarang ${data.organizer_reliability.score ?? "-"} dari ${data.organizer_reliability.sample_count} sampel.`);
      setAttributes(initialAttributes);
      loadRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengirim verifikasi."));
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

          {message && <div className="rounded-xl border border-green-500/20 bg-green-50 px-4 py-3 text-sm font-semibold text-ink-700">{message}</div>}
          {error && <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
              <aside className="bg-white border border-line rounded-[2rem] p-6 shadow-sm h-fit">
                <h2 className="text-lg font-bold text-navy-900 mb-4">Request siap diverifikasi</h2>
                <div className="space-y-3">
                  {requests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setRequestId(request.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                        requestId === request.id ? "border-navy-900 bg-navy-50" : "border-line bg-white hover:bg-bg-soft"
                      }`}
                    >
                      <p className="text-sm font-bold text-navy-900">{request.event_title}</p>
                      <p className="text-xs text-ink-500 mt-1">{formatDateTime(request.arrival_estimate)}</p>
                    </button>
                  ))}
                </div>
              </aside>

              <form onSubmit={handleSubmit} className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-2xl bg-navy-50 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="size-6 text-navy-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-navy-900">{selectedRequest?.event_title}</h2>
                    <p className="text-sm text-ink-500 mt-1">Pilih kondisi aktual untuk tujuh atribut aksesibilitas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.keys(initialAttributes) as Array<keyof NeedProfile>).map((key) => (
                    <div key={key} className="rounded-2xl border border-line bg-bg p-4">
                      <label className="block text-sm font-bold text-navy-900 mb-3">{needLabels[key]}</label>
                      <select
                        value={attributes[key]}
                        onChange={(e) => setAttributes((current) => ({ ...current, [key]: e.target.value as VerificationValue }))}
                        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:border-navy-500"
                      >
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
                  disabled={submitting || !requestId}
                  className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Kirim verifikasi
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-12 text-center">
              <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
              <h2 className="font-bold text-navy-900">Belum ada request yang siap diverifikasi</h2>
              <p className="text-sm text-ink-500 mt-1">Request berstatus dikonfirmasi akan muncul di sini setelah organizer merespons dan kamu menerimanya.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
