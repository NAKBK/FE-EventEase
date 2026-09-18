"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShineBorder } from "@/components/ui/shine-border";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { Eye, EyeOff, Loader2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { demoLogin, getErrorMessage, login, saveSession, type Role } from "@/lib/api";

function SessionExpiredNotice() {
  const params = useSearchParams();
  if (!params.get("expired")) return null;

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-500/20 text-ink-700 rounded-lg text-sm font-medium">
      Sesi kamu berakhir. Silakan masuk kembali.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<Role | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      saveSession(data);

      // Redirect to home
      router.push(data.user.role === "organizer" ? "/dashboard" : "/");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Email atau password salah"));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: Role) => {
    setError("");
    setDemoLoading(account);

    try {
      const data = await demoLogin(account);
      saveSession(data);
      router.push(data.user.role === "organizer" ? "/dashboard" : "/");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal masuk dengan akun demo"));
    } finally {
      setDemoLoading(null);
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
          
          {/* Desktop back link */}
          <Link href="/" className="absolute top-12 left-12 xl:left-24 flex items-center gap-2 text-white/70 hover:text-white transition-colors group font-medium pointer-events-auto">
            <Home className="size-4 group-hover:-translate-y-0.5 transition-transform" />
            Home
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
        <div className="flex-1 lg:flex-none lg:absolute lg:right-[25%] lg:translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 flex items-center justify-center p-6 w-full lg:w-[600px] pointer-events-auto z-20">
          
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-ink-500 hover:text-navy-900 transition-colors font-medium">
            <Home className="size-4" />
            Home
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

              <Suspense fallback={null}>
                <SessionExpiredNotice />
              </Suspense>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-ink-700 rounded-lg text-sm font-medium">
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

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("attendee")}
                  disabled={!!demoLoading}
                  className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 hover:bg-ink-50 disabled:opacity-70 flex items-center justify-center"
                >
                  {demoLoading === "attendee" ? <Loader2 className="size-4 animate-spin" /> : "Demo Pengguna"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("organizer")}
                  disabled={!!demoLoading}
                  className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 hover:bg-ink-50 disabled:opacity-70 flex items-center justify-center"
                >
                  {demoLoading === "organizer" ? <Loader2 className="size-4 animate-spin" /> : "Demo Organizer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
