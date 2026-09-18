"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2, FileText, Clock, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { AttendeeProfile } from "@/components/attendee/AttendeeProfile";
import { getErrorMessage } from "@/lib/api";
import Link from "next/link";

interface OrganizerProfile {
  id: string;
  name: string;
  reliability: {
    score: number | null;
    sample_count: number;
    window_size: number;
    updated_at: string | null;
  };
}

interface EventItem {
  id: string;
  title: string;
  starts_at: string;
  status: string;
  venue: {
    id: string;
    name: string;
    city: string;
  };
}

interface EventResponse {
  items: EventItem[];
  total: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [events, setEvents] = useState<EventResponse | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");
      const organizerId = localStorage.getItem("organizer_id");
      const role = localStorage.getItem("role");
      setAuthRole(role);

      if (!token || !userId) {
        router.push("/login");
        return;
      }

      if (role === "attendee") {
        setLoading(false);
        return;
      }

      if (role !== "organizer") {
        setError("Halaman ini khusus untuk penyelenggara (organizer).");
        setLoading(false);
        return;
      }

      try {
        // Fetch Profile gracefully
        let profileData = null;
        try {
          const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizers/${organizerId || userId}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Accept": "application/json"
            }
          });

          if (profileRes.ok) {
            profileData = await profileRes.json();
          } else {
            console.warn(`API Profil merespons dengan status ${profileRes.status}`);
          }
        } catch (e) {
          console.warn("Gagal mengambil profil:", e);
        }

        setProfile(profileData);

        // Fetch Events
        const eventsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events?mine=true`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });

        if (!eventsRes.ok) throw new Error("Gagal mengambil data event.");
        const eventsData = await eventsRes.json();
        setEvents(eventsData);

      } catch (err: unknown) {
        setError(getErrorMessage(err, "Terjadi kesalahan sistem."));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (authRole === "attendee") {
    return (
      <>
        <Navbar />
        <AttendeeProfile />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-ink-50 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gold-500" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-ink-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm max-w-md w-full">
            <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Akses Ditolak</h2>
            <p className="text-ink-600 mb-6 text-sm">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-navy-900 text-white rounded-xl font-bold text-sm hover:bg-navy-800 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </>
    );
  }

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  // Format Date
  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-gold-500/30 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-navy-500/30 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl text-navy-900 mb-2 tracking-tight">
                Profil <span className="text-navy-900 italic font-light">Penyelenggara.</span>
              </h1>
              <p className="text-ink-500 text-sm font-medium">Informasi publik dan riwayat aktivitas penyelenggara.</p>
            </div>
          </div>

          {/* Top Row: Profile Card & History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Profile Card */}
            <div className="col-span-1 bg-white rounded-3xl border border-line p-8 flex flex-col items-center justify-center shadow-sm">
              <div className="relative mb-6">
                <div className="size-24 rounded-full bg-navy-900 flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-navy-900/20">
                  {profile?.name ? getInitials(profile.name) : "V"}
                </div>
              </div>

              <h2 className="text-xl font-bold text-navy-900 mb-8 text-center">{profile?.name || "Nama Penyelenggara"}</h2>

              <div className="w-full h-px bg-line mb-8"></div>

              <div className="flex w-full items-center justify-evenly px-2">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold text-navy-900">{events?.total || 0}</span>
                  <span className="text-xs text-ink-500 font-medium">Event</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-bold text-navy-900">{profile?.reliability?.score ?? "-"}</span>
                  <span className="text-xs text-ink-500 font-medium">Skor Akses</span>
                </div>
              </div>
            </div>

            {/* Right: History */}
            <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl border border-line p-8 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-navy-900">History</h2>
                <Link href="/event" className="text-sm font-bold text-navy-900 hover:text-gold-500 transition-colors">
                  Lihat semua &gt;
                </Link>
              </div>
              <p className="text-ink-500 text-sm font-medium mb-6">Aktivitas terbaru penyelenggara.</p>

              <div className="flex flex-col gap-4">
                {events?.items && events.items.length > 0 ? (
                  events.items.slice(0, 3).map((evt, index) => (
                    <div key={evt.id} className="bg-white rounded-2xl border border-line p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-navy-200">
                      <div className="relative z-10">
                        <h4 className="text-base font-bold text-navy-900 mb-2">{evt.title}</h4>
                        <div className="flex items-center gap-4 text-xs font-medium text-ink-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(evt.starts_at)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {evt.venue.name}
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 shrink-0">
                        <span className={cn(
                          "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider block text-center",
                          evt.status === "upcoming" 
                            ? "bg-transparent border border-green-800 text-green-800" 
                            : "bg-transparent border border-navy-900 text-navy-900"
                        )}>
                          {evt.status === "upcoming" ? "Upcoming" : "Selesai"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center flex flex-col items-center">
                    <div className="size-12 bg-ink-50 rounded-full flex items-center justify-center mb-3">
                      <Clock className="size-6 text-ink-400" />
                    </div>
                    <h3 className="text-sm font-bold text-navy-900 mb-1">Belum ada aktivitas</h3>
                    <p className="text-xs text-ink-500">Event yang kamu buat akan muncul di sini.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Row: How does it work (Horizontal Layout) */}
          <div className="bg-white rounded-3xl border border-line p-8 shadow-sm mt-4">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-navy-900 mb-1">How does it work?</h2>
              <p className="text-ink-500 text-sm font-medium">Panduan singkat untuk penyelenggara baru.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Step 1 */}
              <div className="flex flex-col gap-4">
                <div className="font-serif text-4xl text-gold-500 italic">01</div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 mb-2">Daftarkan Penyelenggara</h3>
                  <p className="text-sm text-ink-600 font-medium leading-relaxed">
                    Lengkapi profil dan dokumen legalitas penyelenggara.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-4">
                <div className="font-serif text-4xl text-gold-500 italic">02</div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 mb-2">Verifikasi Aksesibilitas</h3>
                  <p className="text-sm text-ink-600 font-medium leading-relaxed">
                    Tim kami akan menilai fasilitas aksesibel penyelenggara.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-4">
                <div className="font-serif text-4xl text-gold-500 italic">03</div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 mb-2">Publish Event</h3>
                  <p className="text-sm text-ink-600 font-medium leading-relaxed">
                    Mulai daftarkan event dan terima permintaan aksesibilitas.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
