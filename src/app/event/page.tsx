"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

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

type FilterStatus = "all" | "upcoming" | "completed";

export default function EventManagementPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");

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
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/events?mine=true`;
        if (filter !== "all") {
          url += `&status=${filter}`;
        }

        const eventsRes = await fetch(url, {
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

    fetchEvents();
  }, [router, filter]);

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming": return "Upcoming";
      case "completed": return "Selesai";
      default: return status;
    }
  };

  const getFilterTitle = () => {
    switch(filter) {
      case "upcoming": return "Upcoming";
      case "completed": return "Selesai";
      default: return "Semua Acara";
    }
  }

  if (loading && !events) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-ink-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          {/* Header */}
          <div>
            <h1 className="font-serif text-4xl text-navy-900 mb-2 tracking-tight">Acara Saya</h1>
            <p className="text-ink-500 text-sm font-medium">Kelola event kamu</p>
          </div>

          {/* Banner: Register New Event */}
          <div className="bg-gradient-to-br from-navy-900 to-[#1e2a45] text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            {/* Soft white hints */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-[60px] -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[60px] translate-x-1/3 translate-y-1/3 pointer-events-none z-0"></div>
            
            <div className="relative z-10 flex-1">
              <h2 className="font-serif text-4xl text-white mb-2 tracking-tight">
                Register New <span className="italic font-light">Event.</span>
              </h2>
              <p className="text-gold-500 text-sm font-medium max-w-md">
                Gratis selamanya untuk fitur dasar. Upgrade kapan saja kamu butuh lebih.
              </p>
            </div>
            
            <div className="relative z-10 w-full md:w-auto shrink-0">
              <Link href="/event/create">
                <button className="group relative inline-flex w-full md:w-auto px-8 h-12 md:h-14 items-center justify-center overflow-hidden rounded-full bg-white text-navy-900 font-bold shadow-md transition-colors">
                  <span className="relative z-10">Daftarkan Acara &rarr;</span>
                  <div className="absolute inset-0 z-0 bg-gold-400 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" />
                </button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 p-1.5 bg-ink-100/50 rounded-xl w-fit">
            {(["all", "upcoming", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                  filter === f
                    ? "bg-white text-navy-900 shadow-sm"
                    : "text-ink-500 hover:text-navy-900 hover:bg-white/50"
                )}
              >
                {f === "all" ? "Semua" : f === "upcoming" ? "Upcoming" : "Selesai"}
              </button>
            ))}
          </div>

          {/* List Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-navy-900 mb-2">{getFilterTitle()}</h3>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-ink-400" />
              </div>
            ) : events?.items && events.items.length > 0 ? (
              <div className="flex flex-col gap-4">
                {events.items.map((evt) => (
                  <div key={evt.id} className="bg-white rounded-2xl border border-line p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-navy-200 hover:shadow-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          evt.status === "upcoming" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gold-100 text-gold-700"
                        )}>
                          {getStatusLabel(evt.status)}
                        </span>
                        <span className="text-xs font-bold text-ink-400">{evt.id}</span>
                      </div>
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
                    
                    <button className="w-full md:w-auto px-4 py-2 border border-line rounded-lg text-xs font-bold text-navy-900 hover:bg-ink-50 transition-colors">
                      Kelola
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-line p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-ink-400" />
                </div>
                <h4 className="text-base font-bold text-navy-900 mb-1">Belum ada acara</h4>
                <p className="text-sm font-medium text-ink-500">
                  {filter === "all" 
                    ? "Kamu belum mendaftarkan acara apa pun." 
                    : `Tidak ada acara dengan status ${getFilterTitle().toLowerCase()}.`}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
