"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, MapPin, Loader2, X } from "lucide-react";
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const initialFormState = {
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    venue: {
      name: "",
      city: "",
      address: "",
    },
    claim: {
      step_free_entrance: 1,
      elevator_or_ramp: 0.5,
      accessible_restroom: 1,
      accessible_seating: 1,
      rest_area: 1,
      parking_or_dropoff: 0.5,
      walking_distance_m: 100,
    }
  };
  const [formData, setFormData] = useState(initialFormState);

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

  useEffect(() => {
    fetchEvents();
  }, [router, filter]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          claim: {
            ...formData.claim,
            step_free_entrance: Number(formData.claim.step_free_entrance),
            elevator_or_ramp: Number(formData.claim.elevator_or_ramp),
            accessible_restroom: Number(formData.claim.accessible_restroom),
            accessible_seating: Number(formData.claim.accessible_seating),
            rest_area: Number(formData.claim.rest_area),
            parking_or_dropoff: Number(formData.claim.parking_or_dropoff),
            walking_distance_m: Number(formData.claim.walking_distance_m),
          }
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal membuat acara.");
      }

      // Success
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchEvents(); // Refresh data
    } catch(err: any) {
      setSubmitError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };



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
              <button 
                onClick={() => setIsModalOpen(true)}
                className="group relative inline-flex w-full md:w-auto px-8 h-12 md:h-14 items-center justify-center overflow-hidden rounded-full bg-white text-navy-900 font-bold shadow-md transition-colors"
              >
                <span className="relative z-10">Daftarkan Acara &rarr;</span>
                <div className="absolute inset-0 z-0 bg-gold-400 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </button>
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

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex justify-center items-center p-4 sm:p-6 opacity-100 transition-opacity">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border border-navy-900/20 flex flex-col max-h-[90vh] overflow-hidden transform transition-all scale-100 relative">
            
            {/* Decorative Blurs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/20 rounded-full blur-[100px] -translate-y-1/4 translate-x-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-900/10 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>

            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-line/50 flex justify-between items-center bg-transparent z-10">
              <div>
                <h2 className="text-2xl font-serif text-navy-900">Daftarkan Acara Baru</h2>
                <p className="text-sm font-medium text-ink-500 mt-1">Isi detail acara dan info venue.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-ink-50 hover:bg-ink-100 rounded-full text-ink-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-8 py-6 relative" ref={scrollRef}>
              
              {/* Scroll shadow indicators */}
              <div className="fixed top-20 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
              
              <form id="createEventForm" onSubmit={handleCreateEvent} className="flex flex-col gap-8 pb-4">
                
                {submitError && (
                  <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                    {submitError}
                  </div>
                )}

                {/* Section 1: Detail Acara */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-900 border-b border-line pb-2">Detail Acara</h3>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-navy-900" htmlFor="title">Nama Acara <span className="text-red-500">*</span></label>
                    <input 
                      id="title"
                      type="text"
                      placeholder="Contoh: Festival Inklusif Jakarta"
                      className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-navy-900" htmlFor="description">Deskripsi Acara <span className="text-red-500">*</span></label>
                    <textarea 
                      id="description"
                      placeholder="Jelaskan secara singkat tentang acara ini..."
                      rows={3}
                      className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-navy-900" htmlFor="starts_at">Waktu Mulai <span className="text-red-500">*</span></label>
                      <input 
                        id="starts_at"
                        type="datetime-local"
                        className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                        value={formData.starts_at}
                        onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-navy-900" htmlFor="ends_at">Waktu Selesai <span className="text-red-500">*</span></label>
                      <input 
                        id="ends_at"
                        type="datetime-local"
                        className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                        value={formData.ends_at}
                        onChange={(e) => setFormData({...formData, ends_at: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Lokasi / Venue */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-900 border-b border-line pb-2">Lokasi / Venue</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-navy-900" htmlFor="venue_name">Nama Lokasi <span className="text-red-500">*</span></label>
                      <input 
                        id="venue_name"
                        type="text"
                        placeholder="Contoh: Gedung Serbaguna A"
                        className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                        value={formData.venue.name}
                        onChange={(e) => setFormData({...formData, venue: {...formData.venue, name: e.target.value}})}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-navy-900" htmlFor="venue_city">Kota <span className="text-red-500">*</span></label>
                      <input 
                        id="venue_city"
                        type="text"
                        placeholder="Contoh: Jakarta"
                        className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                        value={formData.venue.city}
                        onChange={(e) => setFormData({...formData, venue: {...formData.venue, city: e.target.value}})}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-navy-900" htmlFor="venue_address">Alamat Lengkap <span className="text-red-500">*</span></label>
                    <textarea 
                      id="venue_address"
                      placeholder="Jalan, RT/RW, Kode Pos..."
                      rows={2}
                      className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full resize-none"
                      value={formData.venue.address}
                      onChange={(e) => setFormData({...formData, venue: {...formData.venue, address: e.target.value}})}
                      required
                    />
                  </div>
                </div>

                {/* Section 3: Klaim Aksesibilitas */}
                <div className="space-y-4">
                  <div className="border-b border-line pb-2">
                    <h3 className="text-base font-bold text-navy-900">Fasilitas Aksesibilitas</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "step_free_entrance", label: "Pintu Masuk Tanpa Tangga" },
                      { key: "elevator_or_ramp", label: "Lift atau Ramp" },
                      { key: "accessible_restroom", label: "Toilet Aksesibel" },
                      { key: "accessible_seating", label: "Area Duduk Aksesibel" },
                      { key: "rest_area", label: "Area Istirahat Tenang" },
                      { key: "parking_or_dropoff", label: "Parkir / Drop-off" },
                    ].map((item) => (
                      <div key={item.key} className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-navy-900">{item.label}</label>
                        <select 
                          className="px-3 py-2.5 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                          value={String((formData.claim as any)[item.key])}
                          onChange={(e) => setFormData({...formData, claim: {...formData.claim, [item.key]: Number(e.target.value)}})}
                        >
                          <option value="1">Tersedia Penuh</option>
                          <option value="0.5">Tersedia Sebagian</option>
                          <option value="0">Tidak Tersedia</option>
                        </select>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-navy-900">Jarak Jalan Kaki (meter)</label>
                      <input 
                        type="number"
                        min="0"
                        className="px-3 py-2.5 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full"
                        value={formData.claim.walking_distance_m}
                        onChange={(e) => setFormData({...formData, claim: {...formData.claim, walking_distance_m: Number(e.target.value)}})}
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-line/50 bg-white/40 backdrop-blur-sm flex justify-end gap-3 z-10 rounded-b-[2rem]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-navy-900 hover:text-gold-500 transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button 
                type="submit"
                form="createEventForm"
                disabled={isSubmitting}
                className="group relative inline-flex px-8 py-2.5 items-center justify-center overflow-hidden bg-navy-900 text-white rounded-full text-sm font-bold shadow-md transition-colors disabled:opacity-70 min-w-[120px]"
              >
                <span className="relative z-10 flex items-center justify-center transition-colors duration-300 group-hover:text-gold-400">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Acara"}
                </span>
                <div className="absolute inset-0 z-0 bg-navy-800 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
