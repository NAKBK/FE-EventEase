"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GlowingCards, GlowingCard } from "@/components/lightswind/glowing-cards";
import { CountUp } from "@/components/lightswind/count-up";
import { ArrowUpRight, Minus, Activity, ShieldCheck, Accessibility, CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch, AccessibilityRequest } from "@/lib/api";

const needLabels: Record<string, string> = {
  step_free_entrance: "Pintu Masuk Tanpa Tangga",
  elevator_or_ramp: "Lift atau Ramp",
  accessible_restroom: "Toilet Aksesibel",
  accessible_seating: "Area Duduk Aksesibel",
  rest_area: "Area Istirahat Tenang",
  parking_or_dropoff: "Parkir / Drop-off",
};

const getFirstNeed = (snapshot: any) => {
  if (!snapshot) return "Permintaan Aksesibilitas";
  for (const key of Object.keys(needLabels)) {
    if (snapshot[key] === true) {
      return needLabels[key];
    }
  }
  return "Permintaan Aksesibilitas";
};

export default function OrganizerDashboard() {
  const [userName, setUserName] = useState("Organizer");
  const [loading, setLoading] = useState(true);

  const [baruCount, setBaruCount] = useState<number>(0);
  const [prosesCount, setProsesCount] = useState<number>(0);
  const [aktifCount, setAktifCount] = useState<number>(0);
  const [score, setScore] = useState<number | null>(null);
  const [recentRequests, setRecentRequests] = useState<AccessibilityRequest[]>([]);

  useEffect(() => {
    const name = localStorage.getItem("name") || "Organizer";
    const organizerId = localStorage.getItem("organizer_id") || "org-1";
    setUserName(name);

    const fetchData = async () => {
      try {
        const [
          resPending,
          resResponded,
          resUpcoming,
          resOrg,
          resRecent
        ] = await Promise.all([
          apiFetch<{ total: number }>("/api/requests?status=pending"),
          apiFetch<{ total: number }>("/api/requests?status=responded"),
          apiFetch<{ total: number }>("/api/events?mine=true&status=upcoming"),
          apiFetch<{ reliability?: { score: number | null } }>(`/api/organizers/${organizerId}`),
          apiFetch<{ items: AccessibilityRequest[] }>("/api/requests?limit=2")
        ]);

        setBaruCount(resPending.total);
        setProsesCount(resResponded.total);
        setAktifCount(resUpcoming.total);
        setScore(resOrg.reliability?.score ?? null);
        setRecentRequests(resRecent.items);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-navy-500/20 rounded-full blur-[120px] -translate-x-1/4 -translate-y-1/4 pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gold-500/20 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 pointer-events-none -z-10"></div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-8">

          {/* Header */}
          <div>
            <h1 className="font-serif text-4xl text-navy-900 mb-2 tracking-tight">Selamat datang, {userName}</h1>
            <p className="text-ink-500 text-sm font-medium">Ringkasan acara mu hari ini.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-navy-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* 3 Summary Cards */}
              <GlowingCards gap="1rem" padding="0" enableHover={true}>
                {/* Card 1 */}
                <GlowingCard glowColor="#3b82f6" className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-center items-start text-left">
                  <div className="text-ink-500 mb-2 font-medium text-sm">
                    Acara Baru
                  </div>
                  <div>
                    <CountUp value={baruCount} className="text-4xl font-bold text-navy-900" />
                  </div>
                </GlowingCard>

                {/* Card 2 */}
                <GlowingCard glowColor="#3b82f6" className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-center items-start text-left">
                  <div className="text-ink-500 mb-2 font-medium text-sm">
                    Acara Diproses
                  </div>
                  <div>
                    <CountUp value={prosesCount} className="text-4xl font-bold text-navy-900" />
                  </div>
                </GlowingCard>

                {/* Card 3 */}
                <GlowingCard glowColor="#3b82f6" className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-center items-start text-left">
                  <div className="text-ink-500 mb-2 font-medium text-sm">
                    Acara Aktif
                  </div>
                  <div>
                    <CountUp value={aktifCount} className="text-4xl font-bold text-navy-900" />
                  </div>
                </GlowingCard>
              </GlowingCards>

              <div className="flex flex-col gap-8">

                {/* Accessibility Score Card */}
                <div className="bg-navy-900 rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-navy-800">
                  {/* Decorative Soft White Hints */}
                  <div className="absolute -top-16 -right-16 w-96 h-96 bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
                  <div className="absolute -bottom-16 -left-16 w-96 h-96 bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>

                  <div className="relative z-10 flex-1">
                    <h2 className="font-medium text-2xl font-bold text-white tracking-tight mb-2">
                      Accessibility Score
                    </h2>
                    <p className="text-navy-100 text-sm max-w-sm">
                      Berdasarkan 24 kriteria aksesibilitas venue
                    </p>
                  </div>

                  <div className="relative z-10 text-left md:text-right min-w-[160px]">
                    <div className="text-5xl font-serif text-white font-bold mb-1 flex items-baseline md:justify-end gap-1">
                      <CountUp value={score ?? 0} className="text-white" />
                      <span className="text-2xl text-white/60">/100</span>
                    </div>
                    <div className="text-sm font-bold text-gold-400 uppercase tracking-wider">
                      {score === null ? "Belum Ada Nilai" : score >= 80 ? "Sangat Baik" : score >= 60 ? "Cukup" : "Perlu Peningkatan"}
                    </div>
                  </div>
                </div>

                {/* Accessibility Requests List */}
                <div className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">Permintaan Aksesibilitas Terkini</h3>
                      <p className="text-sm text-ink-500 mt-1">Review kebutuhan peserta untuk event terdekat.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {recentRequests.length === 0 ? (
                      <p className="text-sm text-ink-500 py-4 text-center border border-dashed border-line rounded-lg bg-ink-50">Belum ada permintaan masuk.</p>
                    ) : (
                      recentRequests.map((req) => (
                        <div key={req.id} className={`p-4 border border-line rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-navy-200 transition-colors ${req.status !== 'pending' ? 'opacity-70' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${req.status === 'pending' ? 'bg-gold-50' : 'bg-green-50'}`}>
                              {req.status === 'pending' ? (
                                <Accessibility className="w-5 h-5 text-gold-600" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-navy-900">{getFirstNeed(req.needs_snapshot)}</h4>
                              <p className="text-xs text-ink-500 mt-0.5">Event: {req.event_title}</p>
                            </div>
                          </div>
                          {req.status === 'pending' ? (
                            <button className="group relative px-4 py-2 bg-white border border-navy-900 text-navy-900 rounded-lg text-xs font-bold w-full sm:w-auto overflow-hidden">
                              <div className="absolute inset-0 bg-navy-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                              <span className="relative z-10 flex items-center justify-center gap-1 group-hover:text-white transition-colors duration-300">
                                Tanggapi <span className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300">&rarr;</span>
                              </span>
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider sm:ml-auto">
                              {req.status}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
