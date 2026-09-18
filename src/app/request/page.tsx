"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, MapPin, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { createRequest, EventListItem, getErrorMessage, listEvents } from "@/lib/api";
import { formatDateTime, fromLocalInputValue, toLocalInputValue } from "@/lib/attendee-ui";
import { MotionAside, MotionCardGrid, MotionForm } from "@/components/ui/motion-card";

export default function RequestPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [arrival, setArrival] = useState(toLocalInputValue());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listEvents({ status: "upcoming", limit: 50, offset: 0 });
      setEvents(data.items);
      if (data.items[0]) {
        setEventId(data.items[0].id);
        setArrival(toLocalInputValue(data.items[0].starts_at));
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil daftar event."));
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

    loadEvents();
  }, [loadEvents, router]);

  const selectedEvent = events.find((event) => event.id === eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await createRequest(eventId, {
        arrival_estimate: fromLocalInputValue(arrival),
        note,
      });
      setMessage("Permintaan aksesibilitas berhasil dikirim.");
      setNote("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengirim permintaan."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-bg-soft">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <header>
            <h1 className="font-serif text-4xl text-navy-900 mb-2">Permintaan Aksesibilitas</h1>
            <p className="text-sm text-ink-500">Kirim kebutuhan spesifik ke organizer untuk event yang ingin kamu hadiri.</p>
          </header>

          {message && <div className="rounded-xl border border-green-500/20 bg-green-50 px-4 py-3 text-sm font-semibold text-ink-700">{message}</div>}
          {error && <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-8 animate-spin text-navy-900" />
            </div>
          ) : (
            <MotionCardGrid className="grid grid-cols-1 lg:grid-cols-[1fr_0.75fr] gap-6">
              <MotionForm onSubmit={handleSubmit} className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-5 hover:border-navy-100" lift={false}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy-900">Pilih event</label>
                  <select
                    value={eventId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const nextEvent = events.find((event) => event.id === nextId);
                      setEventId(nextId);
                      if (nextEvent) setArrival(toLocalInputValue(nextEvent.starts_at));
                    }}
                    className="rounded-xl border border-line bg-bg px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:border-navy-500"
                    required
                  >
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy-900">Estimasi tiba</label>
                  <input
                    type="datetime-local"
                    value={arrival}
                    onChange={(e) => setArrival(e.target.value)}
                    className="rounded-xl border border-line bg-bg px-4 py-3 text-sm focus:outline-none focus:border-navy-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-navy-900">Catatan untuk organizer</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    rows={6}
                    placeholder="Contoh: Mohon konfirmasi pintu masuk tanpa tangga dan area drop-off."
                    className="rounded-xl border border-line bg-bg px-4 py-3 text-sm resize-none focus:outline-none focus:border-navy-500"
                    required
                  />
                  <p className="text-xs text-ink-300 text-right">{note.length}/500</p>
                </div>

                <button
                  disabled={submitting || !eventId}
                  className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Kirim permintaan
                </button>
              </MotionForm>

              <MotionAside className="bg-white border border-line rounded-[2rem] p-6 shadow-sm h-fit hover:border-navy-100">
                <h2 className="text-lg font-bold text-navy-900 mb-4">Ringkasan event</h2>
                {selectedEvent ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-navy-700 uppercase mb-2">Upcoming</p>
                      <h3 className="text-xl font-bold text-navy-900">{selectedEvent.title}</h3>
                    </div>
                    <div className="space-y-2 text-sm text-ink-500">
                      <p className="flex items-center gap-2"><Calendar className="size-4" /> {formatDateTime(selectedEvent.starts_at)}</p>
                      <p className="flex items-center gap-2"><MapPin className="size-4" /> {selectedEvent.venue.name}, {selectedEvent.venue.city}</p>
                    </div>
                    <div className="rounded-xl bg-bg-soft p-4">
                      <p className="text-xs font-bold text-ink-500 uppercase mb-1">Organizer</p>
                      <p className="text-sm font-bold text-navy-900">{selectedEvent.organizer.name}</p>
                      <p className="text-xs text-ink-500 mt-1">Reliability {selectedEvent.organizer.reliability_score ?? "-"} dari {selectedEvent.organizer.sample_count} sampel</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ink-500">Belum ada event upcoming tersedia.</p>
                )}
              </MotionAside>
            </MotionCardGrid>
          )}
        </div>
      </div>
    </>
  );
}
