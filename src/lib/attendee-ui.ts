import type { Claim, NeedProfile, RequestStatus, VerificationValue } from "@/lib/api";

export const needLabels: Record<keyof NeedProfile, string> = {
  step_free_entrance: "Pintu masuk tanpa tangga",
  elevator_or_ramp: "Lift atau ramp",
  accessible_restroom: "Toilet aksesibel",
  accessible_seating: "Area duduk aksesibel",
  rest_area: "Area istirahat",
  parking_or_dropoff: "Parkir / drop-off",
  walking_distance: "Jarak jalan kaki",
};

export const defaultNeeds: NeedProfile = {
  step_free_entrance: true,
  elevator_or_ramp: true,
  accessible_restroom: true,
  accessible_seating: false,
  rest_area: false,
  parking_or_dropoff: true,
  walking_distance: "short",
};

export function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(status: RequestStatus | string) {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    responded: "Direspons",
    confirmed: "Dikonfirmasi",
    closed: "Ditutup",
    verified: "Terverifikasi",
    upcoming: "Akan datang",
    completed: "Selesai",
  };

  return labels[status] || status;
}

export function verificationLabel(value: VerificationValue | string) {
  const labels: Record<string, string> = {
    fulfilled: "Terpenuhi",
    partially_fulfilled: "Sebagian",
    not_fulfilled: "Tidak terpenuhi",
  };

  return labels[value] || value;
}

export function claimLabel(value: Claim[keyof Claim]) {
  if (value === 1) return "Tersedia";
  if (value === 0.5) return "Sebagian";
  if (value === 0) return "Tidak tersedia";
  if (value === null) return "Belum diketahui";
  return String(value);
}

export function claimTone(value: Claim[keyof Claim]) {
  if (value === 1) return "bg-green-50 text-ink-700";
  if (value === 0.5) return "bg-amber-50 text-ink-700";
  if (value === 0) return "bg-red-50 text-ink-700";
  return "bg-bg-soft text-ink-500";
}

export function requestTone(status: RequestStatus) {
  if (status === "pending") return "bg-amber-50 text-ink-700";
  if (status === "responded") return "bg-navy-50 text-navy-700";
  if (status === "confirmed" || status === "verified") return "bg-green-50 text-ink-700";
  return "bg-bg-soft text-ink-500";
}

export function decisionLabel(decision: string) {
  const labels: Record<string, string> = {
    can_fulfill: "Dapat dipenuhi",
    partially_fulfill: "Sebagian dapat dipenuhi",
    cannot_fulfill: "Tidak dapat dipenuhi",
  };

  return labels[decision] || decision;
}

export function matchLabel(label: string) {
  const labels: Record<string, string> = {
    fulfilled: "Terpenuhi",
    partially_fulfilled: "Sebagian",
    not_fulfilled: "Tidak terpenuhi",
    unknown: "Belum diketahui",
  };

  return labels[label] || label;
}

export function matchLabelTone(label: string) {
  if (label === "fulfilled") return "bg-green-50 text-ink-700";
  if (label === "partially_fulfilled") return "bg-amber-50 text-ink-700";
  if (label === "not_fulfilled") return "bg-red-50 text-ink-700";
  return "bg-bg-soft text-ink-500";
}

// Score tiers are a presentation aid only: the contract defines a 0-100 score
// (provisional-v1 weights), not categories. Thresholds are an assumption.
export interface MatchTier {
  key: "high" | "medium" | "low" | "none";
  label: string;
  color: string;
  tone: string;
}

export function matchTier(score: number | null | undefined): MatchTier {
  if (score === null || score === undefined) {
    return { key: "none", label: "Belum dihitung", color: "var(--ink-300)", tone: "bg-bg-soft text-ink-500" };
  }
  if (score >= 75) return { key: "high", label: "Cocok", color: "var(--green-500)", tone: "bg-green-50 text-ink-700" };
  if (score >= 50) return { key: "medium", label: "Sebagian cocok", color: "var(--amber-500)", tone: "bg-amber-50 text-ink-700" };
  return { key: "low", label: "Kurang cocok", color: "var(--red-500)", tone: "bg-red-50 text-ink-700" };
}

export function claimSourceLabel(source: string) {
  const labels: Record<string, string> = {
    organizer: "Klaim penyelenggara",
    open_data: "Data terbuka",
    demo: "Data demo",
  };

  return labels[source] || source;
}

export function toLocalInputValue(iso?: string | null) {
  const date = iso ? new Date(iso) : new Date(Date.now() + 60 * 60 * 1000);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}
