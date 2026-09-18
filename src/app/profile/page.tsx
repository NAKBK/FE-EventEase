"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2, FileText, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");
      const role = localStorage.getItem("role");

      if (!token || !userId) {
        router.push("/login");
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
          const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizers/${userId}`, {
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

      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-navy-900 mb-2 tracking-tight">
              Profil <span className="text-navy-900 italic font-light">Venue.</span>
            </h1>
            <p className="text-ink-500 text-sm font-medium">Informasi publik dan riwayat aktivitas venue-mu.</p>
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
              <div className="absolute bottom-0 right-0 size-7 bg-white rounded-full flex items-center justify-center p-1">
                <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="size-3 text-white" />
                </div>
              </div>
            </div>
            
            <h2 className="text-xl font-extrabold text-navy-900 mb-1 text-center">{profile?.name || "Nama Venue"}</h2>
            <div className="flex items-center gap-1.5 text-ink-500 text-sm font-medium mb-8">
              <MapPin className="size-4" />
              Yogyakarta, Indonesia
            </div>

            <div className="w-full h-px bg-line mb-8"></div>

            <div className="flex w-full items-center justify-between px-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-extrabold text-navy-900">{events?.total || 0}</span>
                <span className="text-xs text-ink-500 font-medium">Event</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-extrabold text-navy-900">{profile?.reliability?.score ?? "-"}</span>
                <span className="text-xs text-ink-500 font-medium">Skor Akses</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-extrabold text-navy-900">4.8</span>
                <span className="text-xs text-ink-500 font-medium">Rating</span>
              </div>
            </div>
          </div>

          {/* Right: History */}
          <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl border border-line p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-navy-900 mb-1">History</h2>
            <p className="text-ink-500 text-sm font-medium mb-6">Aktivitas terbaru venue-mu.</p>

            <div className="flex flex-col">
              {events?.items && events.items.length > 0 ? (
                events.items.slice(0, 4).map((evt, index) => (
                  <div key={evt.id} className={cn(
                    "flex items-center gap-4 py-5",
                    index !== Math.min(events.items.length, 4) - 1 ? "border-b border-line" : ""
                  )}>
                    <div className="size-10 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                      <FileText className="size-5 text-navy-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-navy-900 truncate mb-1">{evt.title}</h3>
                      <p className="text-xs text-ink-500 font-medium">
                        {formatDate(evt.starts_at)} • Status: {evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                      </p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5",
                      evt.status === "upcoming" ? "bg-green-50 text-green-700" : "bg-gold-50 text-gold-700"
                    )}>
                      <div className={cn(
                        "size-1.5 rounded-full",
                        evt.status === "upcoming" ? "bg-green-500" : "bg-gold-500"
                      )}></div>
                      {evt.status === "upcoming" ? "Live" : "Selesai"}
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
            <h2 className="text-xl font-extrabold text-navy-900 mb-1">How does it work?</h2>
            <p className="text-ink-500 text-sm font-medium">Panduan singkat untuk venue partner baru.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="flex flex-col gap-4">
              <div className="font-serif text-4xl text-gold-500 italic">01</div>
              <div>
                <h3 className="text-sm font-bold text-navy-900 mb-2">Daftarkan Venue</h3>
                <p className="text-sm text-ink-600 font-medium leading-relaxed">
                  Lengkapi profil dan dokumen legalitas venue-mu.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-4">
              <div className="font-serif text-4xl text-gold-500 italic">02</div>
              <div>
                <h3 className="text-sm font-bold text-navy-900 mb-2">Verifikasi Aksesibilitas</h3>
                <p className="text-sm text-ink-600 font-medium leading-relaxed">
                  Tim kami akan menilai fasilitas aksesibel venue-mu.
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
