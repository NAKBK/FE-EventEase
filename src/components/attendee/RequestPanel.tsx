"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, Loader2, Send, TriangleAlert } from "lucide-react";
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

function NeedChips({ profile }: { profile: NeedProfile }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {needSummary(profile).map((label) => (
        <li key={label} className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-900">
          {label}
        </li>
      ))}
    </ul>
  );
}

export function RequestPanel({ event }: { event: PanelEvent }) {
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
    <div className="flex flex-col gap-4">
      <JourneyStepper current={journeyStep(stepStatus, profile !== null)} />
      <p className="text-xs text-ink-500">
        Kamu dapat datang kapan pun. Langkah 3 sampai 6 hanya untuk mendapat komitmen tertulis dukungan aksesibilitas dan
        memverifikasinya setelah event.
      </p>

      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{loadError}</div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>
      )}

      {active ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", requestTone(active.status))}>
              Permintaanmu: {statusLabel(active.status)}
            </span>
            <p className="text-xs text-ink-500">Dikirim {formatDateTime(active.created_at)}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs font-bold text-ink-500 uppercase mb-1">Perkiraan tiba</dt>
              <dd className="text-navy-900">{formatDateTime(active.arrival_estimate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-ink-500 uppercase mb-1">Pesanmu</dt>
              <dd className="text-navy-900">{active.note}</dd>
            </div>
          </dl>

          <div>
            <p className="text-xs font-bold text-ink-500 uppercase mb-1">Kebutuhan yang dikirim (snapshot)</p>
            <NeedChips profile={active.needs_snapshot} />
          </div>

          {active.status === "pending" && (
            <p className="text-sm text-ink-500">Menunggu respons penyelenggara. Kamu tidak perlu mengirim ulang.</p>
          )}

          {active.response && (
            <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
              <p className="text-xs font-bold text-ink-500 uppercase mb-1">Respons penyelenggara</p>
              <p className="font-bold text-navy-900">{decisionLabel(active.response.decision)}</p>
              <p className="text-ink-700 mt-1">{active.response.note}</p>
              <p className="text-xs text-ink-500 mt-2">{formatDateTime(active.response.responded_at)}</p>
            </div>
          )}

          {active.status === "responded" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-700">
                Terima respons ini untuk menyimpannya sebagai komitmen tertulis penyelenggara, atau tolak untuk menutup permintaan.
              </p>
              {confirmingDecline ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-navy-900">Tolak dan tutup permintaan ini?</span>
                  <button
                    onClick={() => respond(false)}
                    disabled={acting}
                    className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70"
                  >
                    Ya, tolak
                  </button>
                  <button
                    onClick={() => setConfirmingDecline(false)}
                    className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => respond(true)}
                    disabled={acting}
                    className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                  >
                    {acting && <Loader2 className="size-4 animate-spin" />}
                    Terima respons
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
              <div className="flex flex-col gap-2 rounded-xl border border-navy-500/30 bg-navy-50 px-4 py-3 text-sm text-ink-700 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  <strong>Event sudah selesai.</strong> Bandingkan komitmen penyelenggara di atas dengan pengalaman aslimu.
                </p>
                <Link
                  href={`/verification?request=${active.id}`}
                  className="rounded-xl bg-navy-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-800 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
                >
                  Verifikasi permintaan ini
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-700">
                Komitmen tersimpan. Setelah event berakhir ({formatDateTime(event.ends_at)}), permintaan ini bisa kamu verifikasi
                langsung dari sini.
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
        <form onSubmit={submit} className="flex flex-col gap-4">
          {request && (
            <div className="rounded-xl bg-bg-soft px-4 py-3 text-sm text-ink-700">
              Permintaan sebelumnya untuk event ini: <strong>{statusLabel(request.status)}</strong>. Kamu boleh mengirim permintaan baru.
            </div>
          )}

          {profile ? (
            <div className="rounded-xl border border-line bg-bg px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-xs font-bold text-ink-500 uppercase">Kebutuhan yang akan dikirim</p>
                <Link href="/profile" className="text-xs font-bold text-navy-700 underline">
                  Ubah profil
                </Link>
              </div>
              <NeedChips profile={profile} />
              <p className="text-xs text-ink-500 mt-2">
                Disalin dari profilmu saat permintaan dikirim. Perubahan profil setelahnya tidak mengubah permintaan ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-3 text-sm text-ink-700">
              <div className="flex items-start gap-3">
                <TriangleAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p>Profil kebutuhanmu belum disimpan. Permintaan membawa kebutuhanmu ke penyelenggara, jadi isi profil dulu.</p>
              </div>
              <Link href="/profile" className="rounded-xl bg-navy-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-800">
                Isi profil
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="arrival" className="text-sm font-semibold text-navy-900">
                Perkiraan waktu tiba di lokasi
              </label>
              <input
                id="arrival"
                type="datetime-local"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-line bg-bg text-sm focus:outline-none focus:border-navy-500"
                required
              />
              <p className="text-xs text-ink-500">
                Bukan jam tiket. Penyelenggara memakainya untuk menyiapkan bantuan, misalnya drop-off atau pendampingan, saat kamu tiba.
                Event berlangsung {formatDateTime(event.starts_at)} – {formatDateTime(event.ends_at)}.
              </p>
              {arrivalWarning && <p className="text-xs font-bold text-ink-700">⚠ {arrivalWarning}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="note" className="text-sm font-semibold text-navy-900">
                Pesan untuk penyelenggara
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={4}
                className="px-4 py-2.5 rounded-xl border border-line bg-bg text-sm resize-none focus:outline-none focus:border-navy-500"
                required
              />
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-ink-500">Sebutkan bantuan spesifik yang kamu butuhkan, misalnya jalur ramp atau area drop-off.</p>
                <p className="text-xs text-ink-300 shrink-0">{note.length}/500</p>
              </div>
            </div>
          </div>

          <button
            disabled={submitting || !profile || !note.trim()}
            className="w-full sm:w-fit rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Kirim permintaan
          </button>
        </form>
      )}
    </div>
  );
}
