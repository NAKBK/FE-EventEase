"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save, UserRound } from "lucide-react";
import { getErrorMessage, getNeeds, NeedProfile, saveNeeds } from "@/lib/api";
import { defaultNeeds, formatDateTime, needLabels } from "@/lib/attendee-ui";

export function AttendeeProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<NeedProfile>(defaultNeeds);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [name, setName] = useState("Pengguna");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadNeeds = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getNeeds();
      setProfile(data.profile || defaultNeeds);
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
    loadNeeds();
  }, [loadNeeds, router]);

  const handleToggle = (key: keyof Omit<NeedProfile, "walking_distance">) => {
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
      setMessage("Profil kebutuhan berhasil disimpan.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  };

  const booleanKeys = Object.keys(defaultNeeds).filter((key) => key !== "walking_distance") as Array<
    keyof Omit<NeedProfile, "walking_distance">
  >;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-ink-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-navy-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <section className="bg-white border border-line rounded-[2rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-navy-900 text-white flex items-center justify-center">
                <UserRound className="size-8" />
              </div>
              <div>
                <h1 className="font-serif text-4xl text-navy-900">Profil Pengguna</h1>
                <p className="text-sm text-ink-500 mt-1">{name} · terakhir diperbarui {formatDateTime(updatedAt)}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-green-50 px-5 py-4 text-green-700 flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="size-5" />
              Attendee
            </div>
          </div>
        </section>

        {message && <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{message}</div>}
        {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <form onSubmit={handleSave} className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-8">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Kebutuhan aksesibilitas</h2>
            <p className="text-sm text-ink-500 mt-1">Data ini dipakai untuk menghitung match score dan snapshot saat mengirim permintaan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booleanKeys.map((key) => (
              <label
                key={key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg p-4 cursor-pointer hover:border-navy-200"
              >
                <span>
                  <span className="block text-sm font-bold text-navy-900">{needLabels[key]}</span>
                  <span className="block text-xs text-ink-500 mt-1">Tandai jika fasilitas ini kamu perlukan.</span>
                </span>
                <input
                  type="checkbox"
                  checked={profile[key]}
                  onChange={() => handleToggle(key)}
                  className="size-5 accent-navy-900 shrink-0"
                />
              </label>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-bg p-4">
            <label className="block text-sm font-bold text-navy-900 mb-3">{needLabels.walking_distance}</label>
            <select
              value={profile.walking_distance}
              onChange={(e) => setProfile((current) => ({ ...current, walking_distance: e.target.value as NeedProfile["walking_distance"] }))}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:border-navy-500"
            >
              <option value="short">Pendek</option>
              <option value="moderate">Sedang</option>
              <option value="any">Bebas</option>
            </select>
          </div>

          <button
            disabled={saving}
            className="w-full sm:w-fit rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan profil
          </button>
        </form>
      </div>
    </div>
  );
}
