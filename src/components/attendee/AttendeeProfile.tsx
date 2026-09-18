"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, CircleDashed, Loader2, Save } from "lucide-react";
import { getErrorMessage, getNeeds, NeedProfile, saveNeeds } from "@/lib/api";
import { defaultNeeds, formatDateTime, needLabels } from "@/lib/attendee-ui";
import { cn } from "@/lib/utils";
import { MotionCardGrid, MotionCardLabel, MotionForm, MotionSection } from "@/components/ui/motion-card";
import { PageBackdrop } from "@/components/attendee/PageBackdrop";

const needHints: Record<string, string> = {
  step_free_entrance: "Akses masuk tanpa anak tangga.",
  elevator_or_ramp: "Perpindahan antarlantai atau level.",
  accessible_restroom: "Toilet yang bisa dijangkau dan dipakai.",
  accessible_seating: "Tempat duduk atau area khusus.",
  rest_area: "Tempat beristirahat di lokasi.",
  parking_or_dropoff: "Parkir dekat atau titik drop-off.",
};

// Approximate thresholds of the provisional-v1 scoring rule (see ARCHITECTURE.md).
const walkingOptions: Array<{ value: NeedProfile["walking_distance"]; label: string; hint: string }> = [
  { value: "short", label: "Pendek", hint: "Sekitar 200 m atau kurang" },
  { value: "moderate", label: "Sedang", hint: "Sekitar 500 m atau kurang" },
  { value: "any", label: "Bebas", hint: "Jarak tidak dibatasi" },
];

const booleanKeys = Object.keys(needHints) as Array<keyof Omit<NeedProfile, "walking_distance">>;

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

export function AttendeeProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<NeedProfile>(defaultNeeds);
  const [savedProfile, setSavedProfile] = useState<NeedProfile>(defaultNeeds);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [name, setName] = useState("Pengguna");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadNeeds = useCallback(async () => {
    try {
      const data = await getNeeds();
      setProfile(data.profile || defaultNeeds);
      setSavedProfile(data.profile || defaultNeeds);
      setUpdatedAt(data.updated_at);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil profil kebutuhan."));
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
      setLoading(false);
      return;
    }

    setName(localStorage.getItem("name") || "Pengguna");
    void loadNeeds();
  }, [loadNeeds, router]);

  const dirty = JSON.stringify(profile) !== JSON.stringify(savedProfile);
  const selectedCount = booleanKeys.filter((key) => profile[key]).length;

  const handleToggle = (key: keyof Omit<NeedProfile, "walking_distance">) => {
    setMessage("");
    setProfile((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const data = await saveNeeds(profile);
      setUpdatedAt(data.updated_at);
      setSavedProfile(profile);
      setMessage("Profil kebutuhan tersimpan. Skor kecocokan event kini mengikuti profil barumu.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-bg-soft flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-navy-900" />
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden pt-24 pb-20 px-4 sm:px-8 bg-bg-soft">
      <PageBackdrop variant="profile" />
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <MotionSection className="bg-white border border-line rounded-[2rem] p-6 shadow-sm hover:border-navy-100" lift={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-14 shrink-0 rounded-2xl bg-navy-900 text-white flex items-center justify-center text-xl font-bold">
                {initials(name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-navy-700">Profil pengguna</p>
                <h1 className="font-serif text-3xl sm:text-4xl leading-tight text-navy-900 truncate">{name}</h1>
                <p className="text-sm text-ink-500 mt-0.5">Peserta · kebutuhan diperbarui {updatedAt ? formatDateTime(updatedAt) : "belum pernah"}</p>
              </div>
            </div>
            <div
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-ink-700",
                updatedAt ? "bg-green-50" : "bg-amber-50",
              )}
            >
              {updatedAt ? <CheckCircle2 className="size-4 text-green-500" /> : <CircleDashed className="size-4 text-amber-500" />}
              {updatedAt ? "Profil tersimpan" : "Belum disimpan"}
            </div>
          </div>
        </MotionSection>

        {message && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-green-500/20 bg-green-50 px-4 py-3 text-sm font-semibold text-ink-700">
            {message}
            <Link href="/" className="font-bold text-navy-700 underline">
              Lihat event yang cocok
            </Link>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-ink-700">{error}</div>
        )}

        <MotionForm onSubmit={handleSave} className="bg-white border border-line rounded-[2rem] p-6 shadow-sm flex flex-col gap-5" lift={false}>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Kebutuhan aksesibilitas</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Dipakai untuk menghitung skor kecocokan dan disalin ke setiap permintaan yang kamu kirim. Ini kebutuhan fungsional, bukan
              diagnosis medis.
            </p>
            {!updatedAt && (
              <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-50 px-4 py-2.5 text-sm text-ink-700">
                Profilmu belum pernah disimpan. Pilihan di bawah hanya contoh awal. Simpan agar skor kecocokan bisa dihitung.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-navy-900">Fasilitas yang kamu perlukan</h3>
              <p className="text-xs font-bold text-ink-500">
                {selectedCount} dari {booleanKeys.length} dipilih
              </p>
            </div>
            <MotionCardGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3">
              {booleanKeys.map((key) => (
                <MotionCardLabel
                  key={key}
                  className="flex h-full items-start gap-3 rounded-2xl border border-line bg-bg p-3 cursor-pointer hover:border-navy-500 has-[:checked]:border-navy-900 has-[:checked]:bg-navy-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-500"
                >
                  <input type="checkbox" checked={profile[key]} onChange={() => handleToggle(key)} className="peer sr-only" />
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-line bg-white text-white peer-checked:border-navy-900 peer-checked:bg-navy-900"
                  >
                    <Check className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-navy-900">{needLabels[key]}</span>
                    <span className="block text-xs text-ink-500 mt-0.5">{needHints[key]}</span>
                    <span className="block text-[11px] font-bold text-ink-700 mt-1">{profile[key] ? "Kamu perlukan" : "Tidak wajib"}</span>
                  </span>
                </MotionCardLabel>
              ))}
            </MotionCardGrid>
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-navy-900 mb-2">{needLabels.walking_distance} yang masih nyaman</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {walkingOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-bg p-3 hover:border-navy-500 has-[:checked]:border-navy-900 has-[:checked]:bg-navy-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-500"
                >
                  <input
                    type="radio"
                    name="walking_distance"
                    value={option.value}
                    checked={profile.walking_distance === option.value}
                    onChange={() => {
                      setMessage("");
                      setProfile((current) => ({ ...current, walking_distance: option.value }));
                    }}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-white peer-checked:border-navy-900 peer-checked:border-[6px]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-navy-900">{option.label}</span>
                    <span className="block text-xs text-ink-500 mt-0.5">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-2">Batas jarak adalah perkiraan dari aturan skor sementara (provisional-v1).</p>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs font-bold text-ink-500">
              {dirty ? "Ada perubahan yang belum disimpan." : updatedAt ? "Semua perubahan sudah tersimpan." : "Simpan untuk mengaktifkan skor kecocokan."}
            </p>
            <button
              disabled={saving || (!dirty && updatedAt !== null)}
              className="w-full sm:w-fit rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-60 flex items-center justify-center gap-2 motion-safe:transition-transform motion-safe:active:scale-[0.985]"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Simpan profil
            </button>
          </div>
        </MotionForm>
      </div>
    </div>
  );
}
