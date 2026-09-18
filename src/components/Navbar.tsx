"use client";

import React from "react";
import Link from "next/link";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { MotionButton } from "@/components/ui/motion-button";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-bg/80 backdrop-blur-md border-b border-line">
      {/* Left side: Logo */}
      <div className="flex items-center gap-2">
        <Link href="/" className="font-serif text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="EventEase Logo" className="w-8 h-8 object-contain" />
          <div>
            <span className="text-navy-900">Event</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-gold-400">Ease</span>
          </div>
        </Link>
      </div>

      {/* Middle: Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="#fitur" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
          <TextRoll center className="text-sm font-extrabold normal-case">Fitur</TextRoll>
        </Link>
        <Link href="#aksesibilitas" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
          <TextRoll center className="text-sm font-extrabold normal-case">Aksesibilitas</TextRoll>
        </Link>
        <Link href="#cara-kerja" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
          <TextRoll center className="text-sm font-extrabold normal-case">Cara Kerja</TextRoll>
        </Link>
        <Link href="#faq" className="text-ink-700 hover:text-navy-700 font-extrabold text-sm">
          <TextRoll center className="text-sm font-extrabold normal-case">FAQ</TextRoll>
        </Link>
      </div>

      {/* Right: Auth Buttons */}
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-extrabold text-navy-800 hover:text-navy-700 transition-colors">
          Masuk
        </Link>
        <Link href="/register">
          <MotionButton>Daftar</MotionButton>
        </Link>
      </div>
    </nav>
  );
};
