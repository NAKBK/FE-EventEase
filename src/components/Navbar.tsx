"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { MotionButton } from "@/components/ui/motion-button";
import { clearSession } from "@/lib/api";

export const Navbar = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  const handleLogout = () => {
    clearSession();
    setRole(null);
    router.push("/login");
  };

  // Prevent hydration mismatch by returning empty div structure before mount
  if (!isMounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-bg/80 backdrop-blur-md border-b border-line h-[72px]">
        {/* Placeholder */}
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-bg/80 backdrop-blur-md border-b border-line">
      {/* Left side: Logo */}
      <div className="flex items-center gap-2">
        <Link href={role === "organizer" ? "/dashboard" : "/"} className="font-serif text-3xl font-medium tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="EventEase Logo" className="w-8 h-8 object-contain" />
          <div>
            <span className="text-navy-900">Event</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-gold-400">Ease</span>
          </div>
        </Link>
      </div>

      {/* Middle: Links */}
      <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        {!role && (
          <>
            <Link href="#fitur" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold normal-case">FITUR</TextRoll>
            </Link>
            <Link href="#aksesibilitas" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold normal-case">AKSESIBILITAS</TextRoll>
            </Link>
            <Link href="#cara-kerja" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold normal-case">CARA KERJA</TextRoll>
            </Link>
            <Link href="#faq" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold normal-case">FAQ</TextRoll>
            </Link>
          </>
        )}

        {role === "attendee" && (
          <>
            <Link href="/" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">HOME</TextRoll>
            </Link>
            <Link href="/history" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">RIWAYAT</TextRoll>
            </Link>
            <Link href="/verification" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">VERIFIKASI</TextRoll>
            </Link>
            <Link href="/request" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">PERMINTAAN</TextRoll>
            </Link>
            <Link href="/profile" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">PROFIL</TextRoll>
            </Link>
          </>
        )}

        {role === "organizer" && (
          <>
            <Link href="/dashboard" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">DASHBOARD</TextRoll>
            </Link>
            <Link href="/event" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">ACARA</TextRoll>
            </Link>

            <Link href="/profile" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
              <TextRoll center className="text-sm font-extrabold uppercase">PROFIL</TextRoll>
            </Link>
          </>
        )}
      </div>

      {/* Right: Auth Buttons */}
      <div className="flex items-center gap-4">
        {!role ? (
          <>
            <Link href="/login" className="text-sm font-extrabold text-navy-800 hover:text-gold-500 transition-colors">
              Masuk
            </Link>
            <Link href="/register">
              <MotionButton>Daftar</MotionButton>
            </Link>
          </>
        ) : (
          <button 
            onClick={handleLogout}
            className="text-sm font-extrabold text-red-500 hover:text-red-700 transition-colors"
          >
            KELUAR
          </button>
        )}
      </div>
    </nav>
  );
};
