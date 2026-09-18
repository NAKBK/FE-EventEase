"use client";

import React, { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { UploadCloud, Save, CheckCircle2 } from "lucide-react";
import { GlowingCards, GlowingCard } from "@/components/lightswind/glowing-cards";
import { MotionCard, MotionCardGrid } from "@/components/ui/motion-card";

type Status = "Tersedia Penuh" | "Tersedia Sebagian" | "Tidak tersedia" | "Pending";

interface Facility {
  id: string;
  name: string;
  apiKey: string;
  status: Status;
}

const initialFacilities: Facility[] = [
  { id: "1", name: "Pintu Masuk Tanpa Tangga", apiKey: "step_free_entrance", status: "Tersedia Penuh" },
  { id: "2", name: "Lift atau Ramp", apiKey: "elevator_or_ramp", status: "Tersedia Sebagian" },
  { id: "3", name: "Toilet Aksesibel", apiKey: "accessible_restroom", status: "Tersedia Penuh" },
  { id: "4", name: "Area Duduk Aksesibel", apiKey: "accessible_seating", status: "Tersedia Penuh" },
  { id: "5", name: "Area Istirahat Tenang", apiKey: "rest_area", status: "Tersedia Penuh" },
  { id: "6", name: "Parkir / Drop-off", apiKey: "parking_or_dropoff", status: "Tidak tersedia" },
];

export default function RegistrationPage() {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusConfig = (status: Status) => {
    switch (status) {
      case "Tersedia Penuh":
        return { color: "text-green-600", bg: "bg-green-50" };
      case "Tersedia Sebagian":
        return { color: "text-gold-600", bg: "bg-gold-50" };
      case "Tidak tersedia":
        return { color: "text-red-600", bg: "bg-red-50" };
      default:
        return { color: "text-ink-500", bg: "bg-ink-100" };
    }
  };

  const fulfilledCount = facilities.filter(f => f.status === "Tersedia Penuh").length;
  const progressPercent = Math.round((fulfilledCount / facilities.length) * 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const mapStatusToValue = (status: Status) => {
    if (status === "Tersedia Penuh") return 1;
    if (status === "Tersedia Sebagian") return 0.5;
    if (status === "Tidak tersedia") return 0;
    return null;
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token") || "";
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Create Event (Mocking Event Data as this page only collects claims)
      const claimPayload: any = { source: "organizer" };
      facilities.forEach(f => {
        claimPayload[f.apiKey] = mapStatusToValue(f.status);
      });

      const eventPayload = {
        title: "Venue Event " + new Date().getTime(), // Dummy title
        description: "Event created from venue registration",
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 172800000).toISOString(),
        venue: {
          name: "Venue Registration",
          city: "Jakarta",
          address: "Jakarta"
        },
        claim: claimPayload
      };

      const eventRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/events`, {
        method: "POST",
        headers,
        body: JSON.stringify(eventPayload)
      });

      if (!eventRes.ok) throw new Error("Gagal menyimpan fasilitas");
      const eventData = await eventRes.json();
      const eventId = eventData.id;

      // 2. Upload Photo if selected
      if (file && eventId) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadHeaders: HeadersInit = {};
        if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;
        
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/events/${eventId}/media`, {
          method: "POST",
          headers: uploadHeaders,
          body: formData
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFacilities(initialFacilities);
    setFile(null);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 pb-24 px-4 sm:px-8 bg-ink-50/30">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          
          {/* Header */}
          <div>
            <h1 className="font-serif text-4xl text-navy-900 mb-3 tracking-tight">Registrasi Venue</h1>
            <p className="text-ink-500 text-sm font-medium max-w-2xl">
              Lengkapi kelengkapan fasilitas aksesibilitas untuk memverifikasi venue-mu sebagai partner EventEase.
            </p>
          </div>

          <GlowingCards className="w-full" gap="1.25rem" responsive={false}>
            <div className="flex flex-col w-full gap-5">
              {/* 1. Summary Card */}
              <GlowingCard className="bg-white border border-line rounded-[2rem] p-6 shadow-sm w-full max-w-none">
              <h3 className="text-lg font-bold text-navy-900 mb-6 flex items-center gap-2">
                Ringkasan Registrasi
              </h3>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
                <div className="flex-1">
                  <p className="text-ink-500 text-xs uppercase tracking-wider font-medium mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy-900">Menunggu Dokumen</p>
                  </div>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-ink-500">Progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gold-500 h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-gold-500 text-sm font-bold">{progressPercent}%</span>
                  </div>
                </div>

                <div className="flex flex-1 justify-between gap-4">
                  <div>
                    <p className="text-ink-500 text-xs uppercase tracking-wider font-medium mb-1">
                      Fasilitas<br />Penuh
                    </p>
                    <p className="font-bold text-lg text-navy-900">{fulfilledCount} <span className="text-sm text-ink-400 font-bold">/ {facilities.length}</span></p>
                  </div>
                  <div>
                    <p className="text-ink-500 text-xs uppercase tracking-wider font-medium mb-1">
                      Estimasi<br />Verifikasi
                    </p>
                    <p className="font-bold text-lg text-navy-900 flex items-center gap-1">
                      1×24 jam
                    </p>
                  </div>
                </div>
              </div>
            </GlowingCard>

            {/* 2. Checklist Section */}
            <GlowingCard className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm w-full h-full max-w-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-navy-900 mb-1">Fasilitas Aksesibilitas</h2>
                  <p className="text-sm text-ink-500">Pastikan semua kelengkapan terisi dengan akurat sebelum submit.</p>
                </div>
              </div>

              <MotionCardGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map((facility) => {
                  const config = getStatusConfig(facility.status);
                  return (
                    <MotionCard
                      key={facility.id}
                      className="p-4 border border-navy-200 rounded-lg flex flex-col gap-3 hover:bg-ink-50/50"
                      lift={false}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-navy-900">{facility.name}</h4>
                      </div>
                      <select 
                        value={facility.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as Status;
                          setFacilities(facilities.map(f => f.id === facility.id ? { ...f, status: newStatus } : f));
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border-none outline-none focus:ring-2 focus:ring-navy-200 cursor-pointer w-full ${config.bg} ${config.color}`}
                      >
                        <option value="Tersedia Penuh">Tersedia Penuh</option>
                        <option value="Tersedia Sebagian">Tersedia Sebagian</option>
                        <option value="Tidak tersedia">Tidak tersedia</option>
                      </select>
                    </MotionCard>
                  );
                })}
              </MotionCardGrid>
            </GlowingCard>

            {/* 3. Upload Section */}
            <GlowingCard className="bg-white border border-line rounded-[2rem] p-6 sm:p-8 shadow-sm w-full h-full max-w-none">
              <h3 className="text-xl font-bold text-navy-900 mb-1">Foto Venue</h3>
              <p className="text-sm text-ink-500 mb-6">Unggah foto venue sebagai bukti kelengkapan (akan ditampilkan di profil).</p>
              
              <div 
                className="border-2 border-dashed border-line rounded-2xl p-10 flex flex-col items-center justify-center bg-ink-50 hover:bg-ink-100/50 transition-colors cursor-pointer group relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept="image/png, image/jpeg, application/pdf"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="text-center z-10">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-navy-900 mb-1">{file.name}</h4>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center z-10">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-navy-400" />
                    </div>
                    <h4 className="text-base font-bold text-navy-900 mb-1">Upload Foto Venue</h4>
                    <p className="text-sm text-ink-500 mb-4">Tarik file ke sini atau klik untuk pilih</p>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">PDF, JPG, PNG — maks. 10 MB per file</p>
                  </div>
                )}
              </div>
            </GlowingCard>
            </div>
          </GlowingCards>

          {/* 4. Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 bg-navy-900 text-white rounded-xl font-bold text-base hover:bg-navy-800 motion-safe:transition-[color,background-color,transform] shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed motion-safe:active:scale-[0.985]"
            >
              {loading ? (
                <>Menyimpan...</>
              ) : success ? (
                <><CheckCircle2 className="w-5 h-5" /> Tersimpan!</>
              ) : (
                <><Save className="w-5 h-5" /> Simpan</>
              )}
            </button>
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-4 bg-white border-2 border-line text-navy-900 rounded-xl font-bold text-base hover:bg-ink-50 motion-safe:transition-[color,background-color,transform] flex items-center justify-center gap-2 disabled:opacity-70 motion-safe:active:scale-[0.985]"
            >
              Batalkan
            </button>
          </div>
            
        </div>
      </div>
    </>
  );
}
