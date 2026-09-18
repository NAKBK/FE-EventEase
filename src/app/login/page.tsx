"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShineBorder } from "@/components/ui/shine-border";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Terjadi kesalahan saat login");
      }

      // Save token (usually localStorage or cookie)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Desktop Background Split */}
      <div className="hidden lg:block absolute inset-0 z-0">
        <div className="absolute inset-y-0 left-0 w-3/4 bg-navy-900 overflow-hidden">
          {/* Background Decorative Elements for Left Side */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-navy-800/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-900/10 rounded-full blur-[100px] translate-x-1/4 translate-y-1/3 pointer-events-none"></div>
          <InteractiveGridPattern
            className={cn(
              "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-0 h-full w-full opacity-60"
            )}
            squares={[60, 60]}
            width={40}
            height={40}
            squaresClassName="hover:fill-gold-500/20"
          />
        </div>
        <div className="absolute inset-y-0 right-0 w-1/4 bg-white overflow-hidden pointer-events-none">
          {/* Navy blur hint for right side */}
          <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] rounded-full bg-navy-500/40 blur-[100px]"></div>
          <div className="absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] rounded-full bg-navy-500/40 blur-[100px]"></div>
        </div>
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 bg-white z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-navy-300/50 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4"></div>
      </div>

      {/* Foreground Container - pass pointer events through */}
      <div className="relative z-10 flex flex-1 w-full max-w-[1600px] mx-auto pointer-events-none">
        {/* Left Branding (Desktop only) */}
        <div className="hidden lg:flex flex-col w-[65%] justify-center p-12 xl:p-24 relative">
          <Link href="/" className="absolute top-12 left-12 xl:left-24 flex items-center gap-2 text-navy-100 hover:text-white transition-colors group font-medium pointer-events-auto">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </Link>
          
          <div className="max-w-xl pointer-events-auto">
            <h1 className="font-serif text-5xl xl:text-6xl text-white leading-tight tracking-tight mb-6">
              Selamat Datang <br /> Kembali.
            </h1>
            <p className="text-navy-100/80 text-lg xl:text-xl leading-relaxed">
              Masuk ke akunmu untuk mengelola event, melihat rekomendasi personal, dan menikmati navigasi rute aksesibel.
            </p>
          </div>
        </div>

        {/* Form Card - capture pointer events */}
        <div className="flex-1 lg:flex-none lg:absolute lg:right-[25%] lg:translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 flex items-center justify-center p-6 w-full lg:w-[600px] pointer-events-auto">
          
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-ink-500 hover:text-navy-900 transition-colors font-medium">
            <ArrowLeft className="size-4" />
            Beranda
          </Link>
          
          <div className="w-full relative z-10 bg-white border border-line rounded-2xl p-8 sm:p-12 shadow-2xl shadow-navy-900/10 text-left">
            <ShineBorder 
              className="rounded-2xl"
              shineColor={["#1e2a45", "#334155"]} // Navy/Slate theme for login
            />
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-900 mb-2">Masuk</h2>
                <p className="text-ink-500 text-sm">Belum punya akun? <Link href="/register" className="text-gold-500 font-semibold hover:underline">Daftar di sini</Link></p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-navy-900" htmlFor="email">Email</label>
                  <input 
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm relative z-20"
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
                      className="px-4 py-3 rounded-lg border border-line bg-bg focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition-all text-sm w-full pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-navy-900 transition-colors p-1 flex items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link href="#" className="text-xs text-ink-500 hover:text-navy-900 transition-colors">Lupa Password?</Link>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-4 w-full flex items-center justify-center bg-navy-900 hover:bg-navy-800 text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md relative z-20"
                >
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Masuk"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
