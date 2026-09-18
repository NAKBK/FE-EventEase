"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EventDetail, EventListItem, getErrorMessage, getEvent, listEvents, listRequests, RequestStatus } from "@/lib/api";
import { formatDateTime, requestTone, statusLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionSection } from "@/components/ui/motion-card";
import { RequestPanel } from "@/components/attendee/RequestPanel";
import { PageBackdrop } from "@/components/attendee/PageBackdrop";

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

  // Latest request status per event, preferring an active one, so the picker shows where each event stands.
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
      // The panel reports its own load errors; the picker simply shows no status.
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

  const currentStatus = statuses[eventId];

  return (
    <>
      <Navbar />
      <div className="relative isolate min-h-screen overflow-hidden pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
      <PageBackdrop />
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
            <MotionSection className="bg-white border border-line rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col gap-5" lift={false}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="event" className="text-sm font-bold text-navy-900">
                  Pilih event
                </label>
                <select
                  id="event"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="rounded-xl border border-line bg-bg px-4 py-2.5 text-sm font-semibold text-navy-900 focus:outline-none focus:border-navy-500"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {formatDateTime(event.starts_at)} · {statuses[event.id] ? statusLabel(statuses[event.id]) : "Belum diminta"}
                    </option>
                  ))}
                </select>
              </div>

              {detailLoading || !detail || detail.id !== eventId ? (
                <div className="py-10 flex justify-center border-t border-line">
                  <Loader2 className="size-6 animate-spin text-navy-900" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 border-t border-line pt-5">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
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
                    <span
                      className={cn(
                        "shrink-0 self-start rounded-full px-2.5 py-0.5 text-xs font-bold",
                        currentStatus ? requestTone(currentStatus) : "bg-bg-soft text-ink-500",
                      )}
                    >
                      {currentStatus ? statusLabel(currentStatus) : "Belum diminta"}
                    </span>
                  </div>
                  <RequestPanel key={detail.id} event={detail} onChange={loadStatuses} />
                </div>
              )}
            </MotionSection>
          )}
        </div>
      </div>
    </>
  );
}
