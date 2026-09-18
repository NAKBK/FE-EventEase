"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, Clock, Loader2, MessageSquareText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessibilityRequest, confirmRequest, getErrorMessage, listRequests, RequestStatus } from "@/lib/api";
import { formatDateTime, requestTone, statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionArticle, MotionCardGrid } from "@/components/ui/motion-card";

const filters: Array<"all" | RequestStatus> = ["all", "pending", "responded", "confirmed", "closed", "verified"];

export default function HistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessibilityRequest[]>([]);
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listRequests(filter === "all" ? undefined : filter);
      setRequests(data.items);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil riwayat."));
    } finally {
      setLoading(false);
    }
  }, [filter]);

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

    fetchRequests();
  }, [fetchRequests, router]);

  const handleConfirm = async (requestId: string, accepted: boolean) => {
    setActingId(requestId);
    setError("");
    setMessage("");

    try {
      await confirmRequest(requestId, accepted);
      setMessage(accepted ? "Respons penyelenggara berhasil dikonfirmasi." : "Permintaan ditutup.");
      fetchRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal memperbarui permintaan."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <header>
            <h1 className="font-serif text-4xl text-navy-900 mb-2">Riwayat Permintaan</h1>
            <p className="text-sm text-ink-500">Pantau semua request aksesibilitas dan respons penyelenggara.</p>
          </header>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap",
                  filter === item ? "bg-navy-900 text-white border-navy-900" : "bg-white text-ink-600 border-line hover:text-navy-900",
                )}
              >
                {item === "all" ? "Semua" : statusLabel(item)}
              </button>
            ))}
          </div>

          {message && <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{message}</div>}
          {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : requests.length > 0 ? (
            <MotionCardGrid className="space-y-4">
              {requests.map((request) => (
                <MotionArticle key={request.id} className="bg-white border border-line rounded-2xl p-5 shadow-sm hover:border-navy-200">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="size-11 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                        <MessageSquareText className="size-5 text-navy-700" />
                      </div>
                      <div>
                        <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold mb-2", requestTone(request.status))}>
                          {statusLabel(request.status)}
                        </span>
                        <h2 className="text-lg font-bold text-navy-900">{request.event_title}</h2>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-ink-500 mt-2">
                          <span className="flex items-center gap-1.5"><Calendar className="size-4" /> Tiba {formatDateTime(request.arrival_estimate)}</span>
                          <span className="flex items-center gap-1.5"><Clock className="size-4" /> Dibuat {formatDateTime(request.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {request.status === "responded" && (
                      <div className="flex flex-col sm:flex-row gap-2 lg:justify-end">
                        <button
                          onClick={() => handleConfirm(request.id, true)}
                          disabled={actingId === request.id}
                          className="rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() => handleConfirm(request.id, false)}
                          disabled={actingId === request.id}
                          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-ink-50 disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-ink-50 p-4">
                      <p className="text-xs font-bold text-ink-500 uppercase mb-2">Catatan kamu</p>
                      <p className="text-sm text-navy-900 leading-relaxed">{request.note || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-ink-50 p-4">
                      <p className="text-xs font-bold text-ink-500 uppercase mb-2">Respons organizer</p>
                      {request.response ? (
                        <div>
                          <p className="text-sm font-bold text-navy-900">{request.response.decision.replaceAll("_", " ")}</p>
                          <p className="text-sm text-ink-600 mt-1">{request.response.note}</p>
                          <p className="text-xs text-ink-400 mt-2">{formatDateTime(request.response.responded_at)}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-ink-500">Belum ada respons.</p>
                      )}
                    </div>
                  </div>
                </MotionArticle>
              ))}
            </MotionCardGrid>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-12 text-center">
              <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
              <h2 className="font-bold text-navy-900">Riwayat masih kosong</h2>
              <p className="text-sm text-ink-500 mt-1">Permintaan yang kamu kirim dari Home akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
