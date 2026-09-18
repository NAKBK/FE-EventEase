"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EventDetail, EventListItem, getErrorMessage, getEvent, listEvents } from "@/lib/api";
import { formatDateTime } from "@/lib/attendee-ui";
import { MotionSection } from "@/components/ui/motion-card";
import { RequestPanel } from "@/components/attendee/RequestPanel";

export default function RequestPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
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

    (async () => {
      try {
        const data = await listEvents({ status: "upcoming", limit: 50, offset: 0 });
        setEvents(data.items);
        setEventId(data.items[0]?.id ?? "");
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Gagal mengambil daftar event."));
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <header>
            <h1 className="font-serif text-3xl text-navy-900 mb-1">Permintaan Aksesibilitas</h1>
            <p className="text-sm text-ink-500">
              Minta konfirmasi dukungan aksesibilitas ke penyelenggara. Satu event hanya punya satu permintaan aktif.
            </p>
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
            <MotionSection className="bg-white border border-line rounded-[2rem] p-6 shadow-sm flex flex-col gap-4" lift={false}>
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
                      {event.title} · {formatDateTime(event.starts_at)}
                    </option>
                  ))}
                </select>
              </div>

              {detailLoading || !detail || detail.id !== eventId ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-navy-900" />
                </div>
              ) : (
                <RequestPanel key={detail.id} event={detail} />
              )}
            </MotionSection>
          )}
        </div>
      </div>
    </>
  );
}
