"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AccessibilityRequest, EventListItem, getErrorMessage, listEvents, listRequests, RequestStatus } from "@/lib/api";
import { statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionArticle, MotionCardGrid } from "@/components/ui/motion-card";
import { PageBackdrop } from "@/components/attendee/PageBackdrop";
import { RequestCard } from "@/components/attendee/RequestCard";

type Filter = "all" | RequestStatus;

const filters: Filter[] = ["all", "pending", "responded", "confirmed", "closed", "verified"];

export default function HistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessibilityRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [eventsById, setEventsById] = useState<Record<string, EventListItem>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      // One fetch of everything; filtering client-side gives instant tabs and per-status counts.
      // Event date/venue and whether it has ended are not part of a request, so they come from the events list.
      const [data, events] = await Promise.all([listRequests(), listEvents({ limit: 50, offset: 0 }).catch(() => null)]);
      setRequests(data.items);
      setTotal(data.total);
      if (events) setEventsById(Object.fromEntries(events.items.map((event) => [event.id, event])));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil permintaan."));
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

  return (
    <>
      <Navbar />
      <div className="relative isolate min-h-screen overflow-hidden pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
        <PageBackdrop variant="history" />
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl text-navy-900 mb-1">Riwayat Permintaan</h1>
              <p className="text-sm text-ink-500">
                Pantau dan kelola permintaan yang sudah kamu kirim: respons penyelenggara, konfirmasi, dan verifikasi setelah event.
              </p>
            </div>
            <Link
              href="/request"
              className="shrink-0 rounded-xl border border-line bg-white px-4 py-2 text-center text-sm font-bold text-navy-900 hover:bg-bg-soft"
            >
              + Ajukan permintaan baru
            </Link>
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
            <MotionCardGrid key={filter} className="flex flex-col gap-4">
              {visible.map((request) => (
                <MotionArticle
                  key={request.id}
                  className="bg-white border border-line rounded-[2rem] p-5 sm:p-6 shadow-sm hover:border-navy-100"
                  lift={false}
                >
                  <RequestCard
                    request={request}
                    event={eventsById[request.event_id]}
                    showEvent
                    variant="list"
                    onChanged={() => void fetchRequests()}
                  />
                </MotionArticle>
              ))}
            </MotionCardGrid>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-10 text-center">
              <CheckCircle2 className="size-10 text-ink-300 mx-auto mb-3" />
              <h2 className="font-bold text-navy-900">
                {filter === "all" ? "Belum ada permintaan" : `Tidak ada permintaan berstatus ${statusLabel(filter).toLowerCase()}`}
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
