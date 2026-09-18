import React from "react";
import { Check } from "lucide-react";
import type { RequestStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const steps = [
  "Isi profil kebutuhan",
  "Cek skor kecocokan",
  "Ajukan permintaan",
  "Penyelenggara merespons",
  "Kamu konfirmasi",
  "Verifikasi permintaan",
];

// Index of the step the attendee is on. steps.length means every step is done.
export function journeyStep(status: RequestStatus | null, hasProfile: boolean) {
  if (status === "verified") return steps.length;
  if (status === "confirmed") return 5;
  if (status === "responded") return 4;
  if (status === "pending") return 3;
  return hasProfile ? 2 : 0;
}

export function JourneyStepper({ current, className }: { current: number; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2", className)} aria-label="Alur dukungan aksesibilitas">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold",
              active ? "border-navy-900 bg-navy-50 text-navy-900" : "border-line bg-white text-ink-500",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                done ? "bg-green-500 text-white" : active ? "bg-navy-900 text-white" : "bg-bg-soft text-ink-500",
              )}
            >
              {done ? <Check className="size-3" /> : index + 1}
            </span>
            <span className="leading-tight">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
