"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronDown, Clock, Loader2, MapPin } from "lucide-react";
import { AccessibilityRequest, confirmRequest, getErrorMessage, isApiError, NeedProfile } from "@/lib/api";
import { decisionLabel, formatDateTime, needSummary, requestTone, statusLabel, walkingLabel } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { JourneyStepper, journeyStep } from "@/components/attendee/JourneyStepper";

// Collapsed by default: the full need list is long and rarely needs re-reading.
export function NeedsDetails({
  title,
  profile,
  footnote,
  action,
}: {
  title: string;
  profile: NeedProfile;
  footnote?: string;
  action?: React.ReactNode;
}) {
  const facilities = needSummary(profile).length - 1;

  return (
    <details className="group rounded-xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-navy-900">
        <span>
          {title}{" "}
          <span className="font-normal text-ink-500">
            · {facilities} fasilitas, jarak {walkingLabel(profile.walking_distance).toLowerCase()}
          </span>
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

// Only what the card needs about the event; the list endpoint has no end time, so it is optional.
export interface CardEvent {
  status?: "upcoming" | "completed";
  ends_at?: string;
  starts_at?: string;
  venue?: { name: string; city?: string };
}

interface RequestCardProps {
  request: AccessibilityRequest;
  event?: CardEvent;
  // Show the event title and its date/venue, for lists where the event is not already the page subject.
  showEvent?: boolean;
  // "panel" sits inside another card (event page); "list" is a card of its own.
  variant?: "panel" | "list";
  onChanged?: () => void;
}

export function RequestCard({ request, event, showEvent = false, variant = "panel", onChanged }: RequestCardProps) {
  const [acting, setActing] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState("");

  const respond = async (accepted: boolean) => {
    setActing(true);
    setError("");

    try {
      await confirmRequest(request.id, accepted);
      setDeclining(false);
      onChanged?.();
    } catch (err: unknown) {
      if (isApiError(err, "INVALID_REQUEST_STATE") || isApiError(err, "CANNOT_FULFILL")) {
        setError("Status permintaan sudah berubah. Tampilan diperbarui.");
        onChanged?.();
      } else {
        setError(getErrorMessage(err, "Gagal memperbarui permintaan."));
      }
    } finally {
      setActing(false);
    }
  };

  const eventCompleted = event?.status === "completed";

  return (
    <div className={cn("flex flex-col gap-3", variant === "panel" && "rounded-2xl border border-line bg-bg p-3.5")}>
      {showEvent && (
        <div>
          <h3 className="text-lg font-bold text-navy-900 leading-snug">
            <Link href={`/events/${request.event_id}`} className="hover:underline">
              {request.event_title}
            </Link>
          </h3>
          {(event?.starts_at || event?.venue) && (
            <div className="mt-1 flex flex-col gap-0.5 text-xs text-ink-500 sm:flex-row sm:flex-wrap sm:gap-x-4">
              {event.starts_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> {formatDateTime(event.starts_at)}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {event.venue.name}
                  {event.venue.city ? `, ${event.venue.city}` : ""}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", requestTone(request.status))}>
          {variant === "panel" ? "Permintaanmu: " : ""}
          {statusLabel(request.status)}
        </span>
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Clock className="size-3.5" /> Dikirim {formatDateTime(request.created_at)}
        </p>
      </div>

      {request.status !== "closed" && <JourneyStepper compact current={journeyStep(request.status, true)} />}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm font-semibold text-ink-700">{error}</div>
      )}

      <div className="rounded-xl bg-white border border-line px-3 py-2 text-sm">
        <p className="text-[11px] font-bold text-ink-500 uppercase">Pesanmu</p>
        <p className="mt-0.5 text-navy-900">{request.note || "-"}</p>
      </div>

      <NeedsDetails title="Kebutuhan yang dikirim" profile={request.needs_snapshot} footnote="Salinan profilmu saat permintaan dikirim." />

      {request.status === "pending" && (
        <p className="text-sm text-ink-500">Menunggu respons penyelenggara. Kamu tidak perlu mengirim ulang.</p>
      )}

      {request.response && (
        <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
          <p className="text-[11px] font-bold text-ink-500 uppercase">Respons penyelenggara</p>
          <p className="mt-0.5 font-bold text-navy-900">{decisionLabel(request.response.decision)}</p>
          <p className="text-ink-700 mt-0.5">{request.response.note}</p>
          <p className="text-[11px] text-ink-500 mt-1">{formatDateTime(request.response.responded_at)}</p>
        </div>
      )}

      {request.status === "responded" && (
        <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500 flex-1">
            Terima untuk menyimpan respons ini sebagai komitmen yang nanti kamu verifikasi, atau tolak untuk menutup permintaan.
          </p>
          {declining ? (
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
                onClick={() => setDeclining(false)}
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
                onClick={() => setDeclining(true)}
                disabled={acting}
                className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-bg-soft disabled:opacity-70"
              >
                Tolak
              </button>
            </div>
          )}
        </div>
      )}

      {request.status === "confirmed" &&
        (event?.status === "upcoming" ? (
          <p className="text-xs text-ink-500 border-t border-line pt-3">
            Komitmen tersimpan. Setelah event berakhir{event.ends_at ? ` (${formatDateTime(event.ends_at)})` : ""}, kamu bisa memverifikasinya.
          </p>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-navy-500/30 bg-navy-50 px-3 py-2.5 text-sm text-ink-700 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {eventCompleted ? <strong>Event sudah selesai. </strong> : null}
              Bandingkan komitmen di atas dengan pengalaman aslimu.
            </p>
            <Link
              href={`/verification?request=${request.id}`}
              className="rounded-xl bg-navy-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-navy-800 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
            >
              Verifikasi permintaan ini
            </Link>
          </div>
        ))}

      {request.status === "closed" && (
        <p className="text-xs text-ink-500 border-t border-line pt-3">Permintaan ditutup. Kamu bisa mengirim permintaan baru dari halaman event.</p>
      )}
      {request.status === "verified" && (
        <p className="text-xs text-ink-500 border-t border-line pt-3">Sudah diverifikasi. Terima kasih atas umpan baliknya.</p>
      )}
    </div>
  );
}
