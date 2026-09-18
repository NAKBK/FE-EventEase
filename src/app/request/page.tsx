"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EventDetail, EventListItem, getErrorMessage, getEvent, listEvents, listRequests, RequestStatus } from "@/lib/api";
import { formatDateTime, requestTone, statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionCardGrid, MotionSection } from "@/components/ui/motion-card";
import { RequestPanel } from "@/components/attendee/RequestPanel";

const ACTIVE: RequestStatus[] = ["pending", "responded", "confirmed"];

export default function RequestPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>({});
  const [eventId, setEventId] = useState("");
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  // Latest request status per event, preferring an active one, so the list shows where each event stands.
  const loadStatuses = useCallback(async () => {
    try {
      const data = await listRequests();
      const map: Record<string, RequestStatus> = {};
      [...data.items]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .forEach((request) => {
          if (ACTIVE.includes(request.status) || !map[request.event_id] || !ACTIVE.includes(map[request.event_id])) {
            map[request.event_id] = request.status;
          }
        });
      setStatuses(map);
    } catch {
      // The panel reports its own load errors; the list simply shows no status chips.
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

    (async () => {
      try {
        const data = await listEvents({ status: "upcoming", limit: 50, offset: 0 });
        setEvents(data.items);
        setEventId(data.items[0]?.id ?? "");
        await loadStatuses();
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Gagal mengambil daftar event."));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, loadStatuses]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    (async () => {
      setDetailLoading(true);
      try {
        const data = await getEvent(eventId);
        if (!cancelled) {
          setDetail(data);
          setError("");
        }
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Gagal memuat event."));
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <header>
            <h1 className="font-serif text-3xl text-navy-900 mb-1">Permintaan Aksesibilitas</h1>
            <p className="text-sm text-ink-500">Pilih event, lalu minta konfirmasi dukungan aksesibilitas ke penyelenggara.</p>
          </header>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white border border-line rounded-2xl p-10 text-center text-sm text-ink-500">
              Belum ada event yang akan datang untuk diajukan permintaan.
            </div>
          ) : (
            <MotionCardGrid className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-4 items-stretch">
              <MotionSection className="bg-white border border-line rounded-[2rem] p-4 shadow-sm h-full" lift={false}>
                <h2 className="text-sm font-bold text-navy-900 px-1 mb-2">Pilih event ({events.length})</h2>
                <ul className="flex flex-col gap-1.5 max-h-[34rem] overflow-y-auto pr-1">
                  {events.map((event) => {
                    const status = statuses[event.id];
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => setEventId(event.id)}
                          aria-pressed={eventId === event.id}
                          className={cn(
                            "w-full text-left rounded-xl border px-3 py-2.5 transition-colors",
                            eventId === event.id ? "border-navy-900 bg-navy-50" : "border-line bg-white hover:bg-bg-soft",
                          )}
                        >
                          <p className="text-sm font-bold text-navy-900 leading-snug line-clamp-2">{event.title}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-xs text-ink-500">{formatDateTime(event.starts_at)}</span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                status ? requestTone(status) : "bg-bg-soft text-ink-500",
                              )}
                            >
                              {status ? statusLabel(status) : "Belum diminta"}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </MotionSection>

              <MotionSection className="bg-white border border-line rounded-[2rem] p-5 shadow-sm h-full" lift={false}>
                {detailLoading || !detail || detail.id !== eventId ? (
                  <div className="py-16 flex justify-center">
                    <Loader2 className="size-6 animate-spin text-navy-900" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-navy-900 leading-tight">{detail.title}</h2>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-ink-500 sm:flex-row sm:gap-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" /> {formatDateTime(detail.starts_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" /> {detail.venue.name}
                        </span>
                      </div>
                    </div>
                    <RequestPanel key={detail.id} event={detail} onChange={loadStatuses} />
                  </div>
                )}
              </MotionSection>
            </MotionCardGrid>
          )}
        </div>
      </div>
    </>
  );
}
