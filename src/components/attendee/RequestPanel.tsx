"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Info, Loader2, Send, TriangleAlert } from "lucide-react";
import {
  AccessibilityRequest,
  confirmRequest,
  createRequest,
  EventDetail,
  getErrorMessage,
  getNeeds,
  isApiError,
  listRequests,
  NeedProfile,
} from "@/lib/api";
import {
  decisionLabel,
  formatDateTime,
  fromLocalInputValue,
  needSummary,
  requestTone,
  statusLabel,
  toLocalInputValue,
  walkingLabel,
} from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { JourneyStepper, journeyStep } from "@/components/attendee/JourneyStepper";

type PanelEvent = Pick<EventDetail, "id" | "title" | "starts_at" | "ends_at" | "status">;

const ACTIVE = ["pending", "responded", "confirmed"];

function requestErrorMessage(err: unknown) {
  if (isApiError(err, "ACTIVE_REQUEST_EXISTS")) return "Kamu sudah punya permintaan aktif untuk event ini.";
  if (isApiError(err, "EVENT_NOT_UPCOMING")) return "Event ini sudah selesai, permintaan tidak bisa dikirim.";
  if (isApiError(err, "NEED_PROFILE_MISSING")) return "Simpan profil kebutuhan aksesibilitasmu dulu sebelum mengirim permintaan.";
  if (isApiError(err, "VALIDATION_ERROR")) return "Perkiraan waktu tiba atau pesan belum valid. Pesan wajib diisi, maksimal 500 karakter.";
  return getErrorMessage(err, "Gagal mengirim permintaan.");
}

// Collapsed by default: the full need list is long and rarely needs re-reading.
function NeedsDetails({ title, profile, footnote, action }: { title: string; profile: NeedProfile; footnote?: string; action?: React.ReactNode }) {
  const facilities = needSummary(profile).length - 1;

  return (
    <details className="group rounded-xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-navy-900">
        <span>
          {title} <span className="font-normal text-ink-500">· {facilities} fasilitas, jarak {walkingLabel(profile.walking_distance).toLowerCase()}</span>
        </span>
        <span className="flex items-center gap-3">
          {action}
          <ChevronDown className="size-4 text-ink-500 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-line px-3 py-2.5">
        <ul className="flex flex-wrap gap-1.5">
          {needSummary(profile).map((label) => (
            <li key={label} className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-bold text-navy-900">
              {label}
            </li>
          ))}
        </ul>
        {footnote && <p className="mt-2 text-xs text-ink-500">{footnote}</p>}
      </div>
    </details>
  );
}

interface RequestPanelProps {
  event: PanelEvent;
  // Lets a parent (e.g. the /request event list) refresh when this panel changes a request.
  onChange?: () => void;
}

export function RequestPanel({ event, onChange }: RequestPanelProps) {
  const [profile, setProfile] = useState<NeedProfile | null>(null);
  const [request, setRequest] = useState<AccessibilityRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [arrival, setArrival] = useState(toLocalInputValue(event.starts_at));
  const [note, setNote] = useState(`Mohon konfirmasi dukungan aksesibilitas untuk ${event.title}.`);
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState(false);
  const [confirmingDecline, setConfirmingDecline] = useState(false);
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
      await createRequest(event.id, { arrival_estimate: fromLocalInputValue(arrival), note });
      await load();
      onChange?.();
    } catch (err: unknown) {
      setError(requestErrorMessage(err));
      if (isApiError(err, "ACTIVE_REQUEST_EXISTS")) await load();
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (accepted: boolean) => {
    if (!request) return;
    setActing(true);
    setError("");

    try {
      await confirmRequest(request.id, accepted);
      setConfirmingDecline(false);
      await load();
      onChange?.();
    } catch (err: unknown) {
      if (isApiError(err, "INVALID_REQUEST_STATE") || isApiError(err, "CANNOT_FULFILL")) {
        setError("Status permintaan sudah berubah. Tampilan diperbarui.");
        await load();
      } else {
        setError(getErrorMessage(err, "Gagal memperbarui permintaan."));
      }
    } finally {
      setActing(false);
    }
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
  const arrivalDate = new Date(arrival);
  const arrivalWarning =
    arrival && arrivalDate.getTime() > new Date(event.ends_at).getTime()
      ? "Waktu ini setelah event berakhir."
      : arrival && arrivalDate.getTime() < Date.now()
        ? "Waktu ini sudah lewat."
        : "";

  return (
    <div className="flex flex-col gap-3">
      <JourneyStepper compact current={journeyStep(stepStatus, profile !== null)} />
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
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", requestTone(active.status))}>
              Permintaanmu: {statusLabel(active.status)}
            </span>
            <p className="text-xs text-ink-500">Dikirim {formatDateTime(active.created_at)}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-stretch text-sm">
            <div className="rounded-xl bg-white border border-line px-3 py-2 h-full">
              <dt className="text-[11px] font-bold text-ink-500 uppercase">Perkiraan tiba di lokasi</dt>
              <dd className="mt-0.5 text-navy-900">{formatDateTime(active.arrival_estimate)}</dd>
            </div>
            <div className="rounded-xl bg-white border border-line px-3 py-2 h-full">
              <dt className="text-[11px] font-bold text-ink-500 uppercase">Pesanmu</dt>
              <dd className="mt-0.5 text-navy-900">{active.note}</dd>
            </div>
          </dl>

          <NeedsDetails title="Kebutuhan yang dikirim" profile={active.needs_snapshot} footnote="Salinan profilmu saat permintaan dikirim." />

          {active.status === "pending" && (
            <p className="text-sm text-ink-500">Menunggu respons penyelenggara. Kamu tidak perlu mengirim ulang.</p>
          )}

          {active.response && (
            <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
              <p className="text-[11px] font-bold text-ink-500 uppercase">Respons penyelenggara</p>
              <p className="mt-0.5 font-bold text-navy-900">{decisionLabel(active.response.decision)}</p>
              <p className="text-ink-700 mt-0.5">{active.response.note}</p>
              <p className="text-[11px] text-ink-500 mt-1">{formatDateTime(active.response.responded_at)}</p>
            </div>
          )}

          {active.status === "responded" && (
            <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-500 flex-1">
                Terima untuk menyimpan respons ini sebagai komitmen yang nanti kamu verifikasi, atau tolak untuk menutup permintaan.
              </p>
              {confirmingDecline ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-navy-900">Tolak dan tutup?</span>
                  <button
                    onClick={() => respond(false)}
                    disabled={acting}
                    className="rounded-xl bg-navy-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70"
                  >
                    Ya, tolak
                  </button>
                  <button
                    onClick={() => setConfirmingDecline(false)}
                    className="rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-bold text-navy-900 hover:bg-bg-soft"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(true)}
                    disabled={acting}
                    className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                  >
                    {acting && <Loader2 className="size-4 animate-spin" />}
                    Terima
                  </button>
                  <button
                    onClick={() => setConfirmingDecline(true)}
                    disabled={acting}
                    className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft disabled:opacity-70"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          )}

          {active.status === "confirmed" &&
            (event.status === "completed" ? (
              <div className="flex flex-col gap-2 rounded-xl border border-navy-500/30 bg-navy-50 px-3 py-2.5 text-sm text-ink-700 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  <strong>Event sudah selesai.</strong> Bandingkan komitmen di atas dengan pengalaman aslimu.
                </p>
                <Link
                  href={`/verification?request=${active.id}`}
                  className="rounded-xl bg-navy-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-800 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                >
                  Verifikasi permintaan ini
                </Link>
              </div>
            ) : (
              <p className="text-xs text-ink-500 border-t border-line pt-3">
                Komitmen tersimpan. Setelah event berakhir ({formatDateTime(event.ends_at)}), kamu bisa memverifikasinya dari sini.
              </p>
            ))}
        </div>
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 items-stretch">
            <div className="flex flex-col gap-1">
              <label htmlFor="arrival" className="text-sm font-semibold text-navy-900">
                Perkiraan waktu tiba
              </label>
              <input
                id="arrival"
                type="datetime-local"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="px-3 py-2 rounded-xl border border-line bg-bg text-sm focus:outline-none focus:border-navy-500"
                required
              />
              <p className="text-xs text-ink-500">
                Kapan kamu perkirakan tiba di lokasi, agar penyelenggara bisa menyiapkan bantuan. Event: {formatDateTime(event.starts_at)} –{" "}
                {formatDateTime(event.ends_at)}.
              </p>
              {arrivalWarning && <p className="text-xs font-bold text-ink-700">⚠ {arrivalWarning}</p>}
            </div>
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
                className="flex-1 px-3 py-2 rounded-xl border border-line bg-bg text-sm resize-none focus:outline-none focus:border-navy-500"
                required
              />
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-ink-500">Sebut bantuan yang kamu butuhkan, mis. ramp atau drop-off.</p>
                <p className="text-xs text-ink-300 shrink-0">{note.length}/500</p>
              </div>
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
