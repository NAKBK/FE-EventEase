"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessibilityRequest, confirmRequest, getErrorMessage, isApiError, listRequests, RequestStatus } from "@/lib/api";
import { decisionLabel, formatDateTime, needSummary, requestTone, statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionArticle, MotionCardGrid } from "@/components/ui/motion-card";

type Filter = "all" | RequestStatus;

const filters: Filter[] = ["all", "pending", "responded", "confirmed", "closed", "verified"];

const nextStep: Record<RequestStatus, string> = {
  pending: "Menunggu respons penyelenggara.",
  responded: "Penyelenggara sudah merespons. Setuju untuk menyimpannya sebagai komitmen, atau tolak untuk menutup permintaan.",
  confirmed: "Komitmen tersimpan. Setelah event selesai, permintaan ini bisa kamu verifikasi.",
  closed: "Permintaan ditutup. Kamu bisa mengirim permintaan baru dari halaman event.",
  verified: "Sudah diverifikasi. Terima kasih atas umpan baliknya.",
};

export default function HistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessibilityRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      // One fetch of everything; filtering client-side gives instant tabs and per-status counts.
      const data = await listRequests();
      setRequests(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil riwayat."));
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

    void fetchRequests();
  }, [fetchRequests, router]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: requests.length };
    requests.forEach((request) => {
      result[request.status] = (result[request.status] ?? 0) + 1;
    });
    return result;
  }, [requests]);

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((request) => request.status === filter)),
    [requests, filter],
  );

  const handleConfirm = async (requestId: string, accepted: boolean) => {
    setActingId(requestId);
    setError("");
    setMessage("");

    try {
      await confirmRequest(requestId, accepted);
      setDecliningId(null);
      setMessage(accepted ? "Komitmen penyelenggara tersimpan." : "Permintaan ditutup.");
      await fetchRequests();
    } catch (err: unknown) {
      if (isApiError(err, "INVALID_REQUEST_STATE")) {
        setError("Status permintaan sudah berubah. Daftar diperbarui.");
        await fetchRequests();
      } else {
        setError(getErrorMessage(err, "Gagal memperbarui permintaan."));
      }
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <header>
            <h1 className="font-serif text-3xl text-navy-900 mb-1">Riwayat Permintaan</h1>
            <p className="text-sm text-ink-500">
              Semua permintaan aksesibilitas yang kamu kirim, respons penyelenggara, dan langkah berikutnya.
            </p>
          </header>

          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter status">
            {filters.map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={filter === item}
                onClick={() => setFilter(item)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border whitespace-nowrap",
                  filter === item ? "bg-navy-900 text-white border-navy-900" : "bg-white text-ink-500 border-line hover:text-navy-900",
                )}
              >
                {item === "all" ? "Semua" : statusLabel(item)}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    filter === item ? "bg-white text-navy-900" : "bg-bg-soft text-ink-500",
                  )}
                >
                  {counts[item] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {message && (
            <div className="rounded-xl border border-green-500/20 bg-green-50 px-4 py-3 text-sm font-semibold text-ink-700">{message}</div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>
          )}
          {!loading && total > requests.length && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-2 text-xs text-ink-700">
              Menampilkan {requests.length} dari {total} permintaan terbaru.
            </p>
          )}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : visible.length > 0 ? (
            <MotionCardGrid key={filter} className="flex flex-col gap-3">
              {visible.map((request) => (
                <MotionArticle
                  key={request.id}
                  className="bg-white border border-line rounded-2xl p-4 shadow-sm hover:border-navy-100 flex flex-col gap-3"
                  lift={false}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold mb-1.5", requestTone(request.status))}>
                        {statusLabel(request.status)}
                      </span>
                      <h2 className="text-base font-bold text-navy-900 leading-snug">
                        <Link href={`/events/${request.event_id}`} className="hover:underline">
                          {request.event_title}
                        </Link>
                      </h2>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-ink-500 sm:items-end shrink-0">
                      <span className="flex items-center gap-1.5" title="Waktu permintaan ini dikirim ke penyelenggara.">
                        <Clock className="size-3.5" /> Diajukan {formatDateTime(request.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div className="rounded-xl bg-bg-soft p-3 h-full">
                      <p className="text-[11px] font-bold text-ink-500 uppercase mb-1">Pesanmu</p>
                      <p className="text-sm text-navy-900 leading-relaxed">{request.note || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-bg-soft p-3 h-full">
                      <p className="text-[11px] font-bold text-ink-500 uppercase mb-1">Respons penyelenggara</p>
                      {request.response ? (
                        <>
                          <p className="text-sm font-bold text-navy-900">{decisionLabel(request.response.decision)}</p>
                          <p className="text-sm text-ink-700 mt-0.5 leading-relaxed">{request.response.note}</p>
                          <p className="text-[11px] text-ink-500 mt-1">{formatDateTime(request.response.responded_at)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-ink-500">Belum ada respons.</p>
                      )}
                    </div>
                  </div>

                  <ul className="flex flex-wrap gap-1.5" aria-label="Kebutuhan yang dikirim">
                    {needSummary(request.needs_snapshot).map((label) => (
                      <li key={label} className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-bold text-navy-900">
                        {label}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-line pt-3">
                    <p className="text-xs text-ink-500 flex-1">{nextStep[request.status]}</p>

                    {request.status === "confirmed" && (
                      <Link
                        href={`/verification?request=${request.id}`}
                        className="rounded-xl border border-line bg-white px-4 py-2 text-center text-sm font-bold text-navy-900 hover:bg-bg-soft"
                      >
                        Verifikasi permintaan ini
                      </Link>
                    )}

                    {request.status === "responded" &&
                      (decliningId === request.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-navy-900">Tolak dan tutup?</span>
                          <button
                            onClick={() => handleConfirm(request.id, false)}
                            disabled={actingId === request.id}
                            className="rounded-xl bg-navy-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70"
                          >
                            Ya, tolak
                          </button>
                          <button
                            onClick={() => setDecliningId(null)}
                            className="rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-bold text-navy-900 hover:bg-bg-soft"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(request.id, true)}
                            disabled={actingId === request.id}
                            className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                          >
                            Terima
                          </button>
                          <button
                            onClick={() => setDecliningId(request.id)}
                            disabled={actingId === request.id}
                            className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                          >
                            Tolak
                          </button>
                        </div>
                      ))}
                  </div>
                </MotionArticle>
              ))}
            </MotionCardGrid>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-10 text-center">
              <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
              <h2 className="font-bold text-navy-900">
                {filter === "all" ? "Riwayat masih kosong" : `Tidak ada permintaan berstatus ${statusLabel(filter).toLowerCase()}`}
              </h2>
              <p className="text-sm text-ink-500 mt-1">
                {filter === "all" ? (
                  <>
                    Kirim permintaan dari halaman detail event.{" "}
                    <Link href="/" className="font-bold text-navy-700 underline">
                      Cari event
                    </Link>
                  </>
                ) : (
                  "Coba filter status lain."
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
