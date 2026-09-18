"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, Loader2, Send, TriangleAlert } from "lucide-react";
import {
  AccessibilityRequest,
  createRequest,
  EventDetail,
  getErrorMessage,
  getNeeds,
  isApiError,
  listRequests,
  NeedProfile,
} from "@/lib/api";
import { statusLabel } from "@/lib/attendee-ui";
import { JourneyStepper, journeyStep } from "@/components/attendee/JourneyStepper";
import { NeedsDetails, RequestCard } from "@/components/attendee/RequestCard";

type PanelEvent = Pick<EventDetail, "id" | "title" | "starts_at" | "ends_at" | "status">;

const ACTIVE = ["pending", "responded", "confirmed"];

function requestErrorMessage(err: unknown) {
  if (isApiError(err, "ACTIVE_REQUEST_EXISTS")) return "Kamu sudah punya permintaan aktif untuk event ini.";
  if (isApiError(err, "EVENT_NOT_UPCOMING")) return "Event ini sudah selesai, permintaan tidak bisa dikirim.";
  if (isApiError(err, "NEED_PROFILE_MISSING")) return "Simpan profil kebutuhan aksesibilitasmu dulu sebelum mengirim permintaan.";
  if (isApiError(err, "VALIDATION_ERROR")) return "Pesan belum valid. Pesan wajib diisi, maksimal 500 karakter.";
  return getErrorMessage(err, "Gagal mengirim permintaan.");
}

interface RequestPanelProps {
  event: PanelEvent;
  // Lets a parent (e.g. the /request event picker) refresh when this panel changes a request.
  onChange?: () => void;
}

export function RequestPanel({ event, onChange }: RequestPanelProps) {
  const [profile, setProfile] = useState<NeedProfile | null>(null);
  const [request, setRequest] = useState<AccessibilityRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [note, setNote] = useState(`Mohon konfirmasi dukungan aksesibilitas untuk ${event.title}.`);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [needs, requests] = await Promise.all([getNeeds(), listRequests()]);
      const forEvent = requests.items
        .filter((item) => item.event_id === event.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      setProfile(needs.profile);
      // Prefer the active request; otherwise show the latest one (closed/verified) for context.
      setRequest(forEvent.find((item) => ACTIVE.includes(item.status)) ?? forEvent[0] ?? null);
      setLoadError("");
    } catch (err: unknown) {
      setLoadError(getErrorMessage(err, "Gagal memuat status permintaan."));
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // API-008 requires arrival_estimate, but attendees can come any time, so it is not asked in the UI;
      // the event start is sent as a neutral value.
      await createRequest(event.id, { arrival_estimate: new Date(event.starts_at).toISOString(), note });
      await load();
      onChange?.();
    } catch (err: unknown) {
      setError(requestErrorMessage(err));
      if (isApiError(err, "ACTIVE_REQUEST_EXISTS")) await load();
    } finally {
      setSubmitting(false);
    }
  };

  const refresh = () => {
    void load();
    onChange?.();
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="size-6 animate-spin text-navy-900" />
      </div>
    );
  }

  const active = request && ACTIVE.includes(request.status) ? request : null;
  const stepStatus = request && (ACTIVE.includes(request.status) || request.status === "verified") ? request.status : null;

  return (
    <div className="flex flex-col gap-3">
      {!active && <JourneyStepper compact current={journeyStep(stepStatus, profile !== null)} />}
      <p className="text-xs text-ink-500">
        Kamu dapat datang kapan pun. Alur ini hanya untuk mendapat komitmen tertulis soal dukungan aksesibilitas.
      </p>

      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-2.5 text-sm font-semibold text-ink-700">{loadError}</div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-2.5 text-sm font-semibold text-ink-700">{error}</div>
      )}

      {active ? (
        <RequestCard request={active} event={event} onChanged={refresh} />
      ) : event.status !== "upcoming" ? (
        <div className="flex items-start gap-3 rounded-xl bg-bg-soft px-4 py-3 text-sm text-ink-700">
          <Info className="size-4 text-ink-300 shrink-0 mt-0.5" />
          <p>
            Event ini sudah selesai, jadi permintaan baru tidak bisa dikirim.
            {request?.status === "verified" && <> Kamu sudah memverifikasi permintaanmu untuk event ini. Terima kasih.</>}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          {request && (
            <div className="rounded-xl bg-bg-soft px-3 py-2 text-xs text-ink-700">
              Permintaan sebelumnya untuk event ini: <strong>{statusLabel(request.status)}</strong>. Kamu boleh mengirim permintaan baru.
            </div>
          )}

          {profile ? (
            <NeedsDetails
              title="Kebutuhan yang akan dikirim"
              profile={profile}
              footnote="Disalin dari profilmu saat dikirim. Perubahan profil setelahnya tidak mengubah permintaan ini."
              action={
                <Link href="/profile" className="font-bold text-navy-700 underline" onClick={(e) => e.stopPropagation()}>
                  Ubah
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-50 px-3 py-2.5 text-sm text-ink-700">
              <div className="flex items-start gap-2.5">
                <TriangleAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p>Profil kebutuhanmu belum disimpan. Isi dulu agar kebutuhanmu ikut terkirim.</p>
              </div>
              <Link href="/profile" className="rounded-xl bg-navy-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-800">
                Isi profil
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="note" className="text-sm font-semibold text-navy-900">
              Pesan untuk penyelenggara
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              className="px-3 py-2 rounded-xl border border-line bg-bg text-sm resize-none focus:outline-none focus:border-navy-500"
              required
            />
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-ink-500">Sebut bantuan yang kamu butuhkan, mis. ramp atau drop-off.</p>
              <p className="text-xs text-ink-300 shrink-0">{note.length}/500</p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 border-t border-line pt-3">
            <p className="text-xs text-ink-500">Satu event hanya punya satu permintaan aktif.</p>
            <button
              disabled={submitting || !profile || !note.trim()}
              className="w-full sm:w-fit rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Kirim permintaan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
