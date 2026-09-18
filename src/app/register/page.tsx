"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShineBorder } from "@/components/ui/shine-border";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { ArrowLeft, Eye, EyeOff, Loader2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MotionButton } from "@/components/ui/motion-button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("attendee");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Terjadi kesalahan saat pendaftaran");
      }

      // Save token and role
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user?.role) {
        localStorage.setItem("role", data.user.role);
      }

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Email sudah digunakan atau data tidak valid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Desktop Background Split */}
      <div className="hidden lg:block absolute inset-0 z-0">
        
        {/* Left Side (White with subtle warm gradient) */}
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-br from-white via-gold-50/30 to-white overflow-hidden pointer-events-none">
          {/* Soft Gold glow for white side */}
          <div className="absolute -top-[150px] -left-[150px] w-[500px] h-[500px] rounded-full bg-gold-300/20 blur-[120px]"></div>
          <div className="absolute -bottom-[150px] -right-[150px] w-[500px] h-[500px] rounded-full bg-gold-400/20 blur-[120px]"></div>
        </div>

        {/* Right Side (Rich Gold Gradient) */}
        <div className="absolute inset-y-0 right-0 w-3/4 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 overflow-hidden">
          {/* Background Decorative Elements for Right Side */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-navy-900/10 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
          
          <InteractiveGridPattern
            className={cn(
              "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-0 h-full w-full opacity-30"
            )}
            squares={[60, 60]}
            width={40}
            height={40}
            squaresClassName="stroke-white/20 hover:fill-white/30 transition-all duration-500"
          />
        </div>
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 bg-white z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold-300/30 rounded-full blur-[120px] -translate-y-1/4 -translate-x-1/4"></div>
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 flex flex-1 w-full max-w-[1600px] mx-auto pointer-events-none">
        
        {/* Form Card */}
        <div className="flex-1 lg:flex-none lg:absolute lg:left-[25%] lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 flex items-center justify-center p-6 w-full lg:w-[600px] pointer-events-auto z-20">
          
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-ink-500 hover:text-navy-900 transition-colors font-medium">
            <Home className="size-4" />
            Home
          </Link>
          
          <div className="w-full relative z-10 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-8 sm:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] shadow-navy-900/5 text-left">
            <ShineBorder 
              className="rounded-2xl"
              shineColor={["#fcd34d", "#fbbf24", "#f59e0b"]} // Pure gold tones
            />
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-navy-900 mb-2 tracking-tight">Daftar Akun</h2>
                <p className="text-ink-500 text-sm">Sudah punya akun? <Link href="/login" className="text-gold-600 font-bold hover:text-gold-700 hover:underline transition-colors">Masuk di sini</Link></p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Role Selector */}
                <div className="flex flex-col gap-2 relative z-30">
                  <label className="text-sm font-medium text-navy-900">Pilih Peranmu</label>
                  <div className="relative flex w-full p-1.5 bg-ink-50 border border-line rounded-xl">
                    {[{ id: "attendee", label: "Peserta" }, { id: "organizer", label: "Penyelenggara" }].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setRole(option.id)}
                        className={cn(
                          "relative flex-1 py-3 text-sm font-medium z-10 transition-colors",
                          role === option.id ? "text-navy-900" : "text-ink-400 hover:text-navy-700"
                        )}
                      >
                        {option.label}
                        {role === option.id && (
                          <motion.div
                            layoutId="role-pill"
                            className="absolute inset-0 bg-white rounded-lg shadow-sm border border-line/50 -z-10"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-navy-900" htmlFor="name">Nama Lengkap</label>
                  <input 
                    id="name"
                    type="text"
                    placeholder="Nama lengkapmu"
                    className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all text-sm relative z-20"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-navy-900" htmlFor="email">Email</label>
                  <input 
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all text-sm relative z-20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-navy-900" htmlFor="password">Password</label>
                  <div className="relative z-20">
                    <input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all text-sm w-full pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-navy-900 transition-colors p-1 flex items-center justify-center rounded-lg hover:bg-ink-50"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <MotionButton 
                  type="submit" 
                  disabled={loading}
                  className="mt-6 w-full flex items-center justify-center py-4 rounded-xl text-base disabled:opacity-70 disabled:cursor-not-allowed relative z-20"
                >
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Buat Akun Sekarang"}
                </MotionButton>
              </form>
            </div>
          </div>
        </div>

        {/* Right Branding (Desktop only) */}
        <div className="hidden lg:flex flex-col w-[75%] justify-center p-12 xl:p-24 relative ml-auto">
          <Link href="/" className="absolute top-12 right-12 xl:right-24 flex items-center gap-2 text-navy-900 hover:text-navy-700 transition-colors group font-medium pointer-events-auto">
            <Home className="size-4 group-hover:-translate-y-0.5 transition-transform" />
            Home
          </Link>
          
          <div className="max-w-xl ml-auto text-right pointer-events-auto mt-20">
            
            <h1 className="font-serif text-5xl xl:text-7xl text-navy-900 leading-[1.1] tracking-tight mb-8">
              Mulai Langkahmu <br /> Bersama Kami.
            </h1>
            <p className="text-navy-900/80 text-lg xl:text-2xl leading-relaxed font-medium">
              Bergabunglah dengan ribuan peserta dan penyelenggara untuk menciptakan pengalaman event yang tak terlupakan dan inklusif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
