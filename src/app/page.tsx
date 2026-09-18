"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TestimonialSection } from "@/components/TestimonialSection";
import { FAQSection } from "@/components/FAQSection";
import { GlowingCards, GlowingCard } from "@/components/lightswind/glowing-cards";
import { TrustedUsers } from "@/components/lightswind/trusted-users";
import { DottedMap } from "@/components/ui/dotted-map";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { GlareHover } from "@/components/ui/glare-hover";
import { DotPattern } from "@/components/ui/dot-pattern";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { CountUp } from "@/components/lightswind/count-up";
import { MapPin, Target, Calendar, Accessibility, Activity, Heart, Baby, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen pt-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center pt-28 pb-20 lg:pt-32 lg:pb-24 px-8 text-center overflow-hidden" id="hero">
        {/* Background elements */}
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)] opacity-50"
          )}
        />
        <div className="absolute -top-24 -right-24 w-[500px] h-[400px] bg-navy-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[400px] bg-navy-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <h1 className="font-serif text-[clamp(40px,5vw,64px)] text-navy-900 leading-[1.1] tracking-tight max-w-4xl mx-auto mb-6 relative z-10">
          Temukan event <br className="hidden md:block" />
          <em className="text-navy-600">tanpa hambatan.</em>
        </h1>
        <TypingAnimation
          className="text-ink-500 text-[clamp(14px,2vw,18px)] leading-relaxed max-w-2xl mx-auto mb-10 relative z-10 font-normal"
          duration={15}
        >
          EventEase membantu kamu menemukan konser, seminar, dan acara favorit. Lengkap dengan info aksesibilitas untuk pengguna dengan mobilitas terbatas.
        </TypingAnimation>

        <div className="mb-10 relative z-10">
          {/* Replace src string array with an array of objects which TrustedUsers might expect depending on the implementation */}
          <div className="flex flex-col items-center gap-3">
            <TrustedUsers
              className="mb-2"
              totalUsersText={8200}
              avatars={[
                "https://i.pravatar.cc/150?u=a042581f4e29026024d",
                "https://i.pravatar.cc/150?u=a042581f4e29026704d",
                "https://i.pravatar.cc/150?u=a04258114e29026702d",
                "https://i.pravatar.cc/150?u=a048581f4e29026701d",
              ]}
            />
          </div>
        </div>

        <button className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-navy-800 border border-navy-800 px-8 font-bold text-white shadow-lg hover:shadow-xl z-10 transition-colors">
          <span className="relative z-10 flex items-center">
            <span className="mr-2">Daftar sekarang</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
          <div className="absolute inset-0 z-0 bg-navy-900 origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" />
        </button>
      </section>

      {/* Stats Section */}
      <section className="bg-navy-900 text-white py-16 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-navy-800">
          <div className="flex flex-col gap-2 p-4">
            <CountUp value={12} suffix="K+" className="font-serif text-5xl text-gold-500 font-normal" colorScheme="custom" customColor="#F2C94C" />
            <span className="text-navy-100 text-sm font-semibold tracking-wider uppercase">Pengguna Aktif</span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <CountUp value={3500} suffix="+" separator="." className="font-serif text-5xl text-gold-500 font-normal" colorScheme="custom" customColor="#F2C94C" />
            <span className="text-navy-100 text-sm font-semibold tracking-wider uppercase">Event Terdaftar</span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <CountUp value={98} suffix="%" className="font-serif text-5xl text-gold-500 font-normal" colorScheme="custom" customColor="#F2C94C" />
            <span className="text-navy-100 text-sm font-semibold tracking-wider uppercase">Tingkat Kepuasan</span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <CountUp value={4.9} decimals={1} className="font-serif text-5xl text-gold-500 font-normal" colorScheme="custom" customColor="#F2C94C" />
            <span className="text-navy-100 text-sm font-semibold tracking-wider uppercase">Rating Rata-rata</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 bg-bg relative" id="fitur">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 relative">
          <div className="text-center lg:text-left lg:w-1/3 shrink-0 flex flex-col justify-center">
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-navy-900 leading-tight mb-4">
              Semua yang kamu butuhkan, <br />
              <em className="text-navy-600">dalam satu tempat.</em>
            </h2>
            <p className="text-ink-500 text-lg">
              Dari pencarian event hingga navigasi aksesibel, kami rancang untuk semua orang.
            </p>
          </div>

          <div className="flex-1 w-full">
            <GlowingCards className="flex flex-col gap-6" responsive={false}>
              <GlowingCard className="bg-bg-soft border border-line rounded-[var(--radius-xl)] p-8">
                <div className="bg-white size-12 rounded-full flex items-center justify-center mb-6 shadow-sm border border-line">
                  <Target className="text-navy-700 size-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">Pencarian Cerdas</h3>
                <p className="text-ink-500 text-sm leading-relaxed">
                  Temukan event berdasarkan genre, lokasi, tanggal, dan tingkat aksesibilitas venue.
                </p>
              </GlowingCard>

              <GlowingCard className="bg-bg-soft border border-line rounded-[var(--radius-xl)] p-8">
                <div className="bg-white size-12 rounded-full flex items-center justify-center mb-6 shadow-sm border border-line">
                  <MapPin className="text-navy-700 size-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">Navigasi Aksesibel</h3>
                <p className="text-ink-500 text-sm leading-relaxed">
                  Rute khusus untuk kursi roda, jalur landai, lift, dan toilet aksesibel di setiap venue.
                </p>
              </GlowingCard>

              <GlowingCard className="bg-bg-soft border border-line rounded-[var(--radius-xl)] p-8">
                <div className="bg-white size-12 rounded-full flex items-center justify-center mb-6 shadow-sm border border-line">
                  <Calendar className="text-navy-700 size-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">Jadwal Personal</h3>
                <p className="text-ink-500 text-sm leading-relaxed">
                  Simpan event favorit, dapatkan pengingat, dan atur rencana harianmu dengan mudah.
                </p>
              </GlowingCard>
            </GlowingCards>
          </div>
        </div>
      </section>

      {/* Personalization Section */}
      <section className="py-24 px-8 bg-bg-soft">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-navy-900 leading-tight mb-4">
            Pilih kebutuhan <em className="text-navy-600">aksesibilitasmu.</em>
          </h2>
          <p className="text-ink-500 text-lg mb-12 max-w-2xl mx-auto">
            Kami akan menyesuaikan rekomendasi event dan rute navigasi sesuai kondisi agar pengalamanmu tetap maksimal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "Pengguna Kursi Roda", icon: <Accessibility className="size-6 text-navy-700" /> },
              { title: "Pengguna Kruk", icon: <Activity className="size-6 text-navy-700" /> },
              { title: "Mobilitas Terbatas Sementara", icon: <Heart className="size-6 text-navy-700" /> },
              { title: "Ibu Hamil", icon: <Baby className="size-6 text-navy-700" /> },
              { title: "Lansia", icon: <User className="size-6 text-navy-700" /> },
              { title: "Pengguna Stroller", icon: <Baby className="size-6 text-navy-700" /> },
            ].map((tag, i) => (
              <GlareHover key={i} className="rounded-xl border border-line bg-white shadow-sm hover:border-navy-500 hover:shadow-md transition-all cursor-pointer h-full" duration={600}>
                <div className="flex flex-col items-center justify-center p-6 text-center gap-4 h-full">
                  <div className="p-3 bg-navy-50 rounded-full">
                    {tag.icon}
                  </div>
                  <span className="text-navy-900 font-bold">
                    {tag.title}
                  </span>
                </div>
              </GlareHover>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section className="py-24 px-8 bg-navy-900 text-white" id="cara-kerja">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-white leading-tight mb-4">
              Tiga langkah, <em className="text-gold-400">langsung jalan.</em>
            </h2>
            <p className="text-navy-100 text-lg max-w-2xl mx-auto">
              Tanpa ribet. Tanpa install. Cukup buka browser-mu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-navy-800 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="w-24 h-24 rounded-full bg-navy-800 border-4 border-navy-900 flex items-center justify-center font-serif text-4xl text-gold-500 mb-6 shadow-lg shadow-black/20">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Daftar Akun</h3>
              <p className="text-navy-100 text-sm leading-relaxed">
                Buat akun gratis dalam 30 detik. Pilih kebutuhan aksesibilitasmu saat mendaftar.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="w-24 h-24 rounded-full bg-navy-800 border-4 border-navy-900 flex items-center justify-center font-serif text-4xl text-gold-500 mb-6 shadow-lg shadow-black/20">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Temukan Event</h3>
              <p className="text-navy-100 text-sm leading-relaxed">
                Jelajahi ribuan event di kota kamu. Filter berdasarkan tanggal, genre, dan aksesibilitas.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="w-24 h-24 rounded-full bg-navy-800 border-4 border-navy-900 flex items-center justify-center font-serif text-4xl text-gold-500 mb-6 shadow-lg shadow-black/20">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Datang & Nikmati</h3>
              <p className="text-navy-100 text-sm leading-relaxed">
                Dapatkan rute aksesibel langsung ke kursimu. Tinggal datang dan nikmati acaranya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <TestimonialSection />

      {/* Dotted Map Section */}
      <section className="py-24 px-8 bg-navy-900 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1">
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-white leading-tight mb-6">
              Kami siap <br /><em className="text-gold-400">membantu di mana saja.</em>
            </h2>
            <p className="text-navy-100 text-lg leading-relaxed max-w-md">
              Terus berkembang ke seluruh penjuru Indonesia. Dari Jakarta hingga pelosok daerah, visi kami adalah membuat setiap event jadi inklusif.
            </p>
          </div>
          <div className="flex-1 w-full flex justify-center opacity-75">
            <DottedMap className="fill-white/30 h-[300px] w-full max-w-[500px]" />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-navy-800 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 opacity-50"></div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-24 px-8 bg-bg relative overflow-hidden">
        <div className="max-w-3xl mx-auto bg-navy-900 rounded-[var(--radius-xl)] p-12 text-center relative shadow-xl overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
              Siap mulai? <br />
              <em className="text-gold-400">Kami bantu sampai event-nya.</em>
            </h2>
            <p className="text-navy-100 mb-8 max-w-lg mx-auto">
              Gratis selamanya untuk fitur dasar. Upgrade kapan saja kamu butuh lebih.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-3 px-8 rounded-full transition-colors shadow-lg shadow-gold-500/20">
                Daftar Gratis
              </button>
              <button className="bg-transparent border border-navy-100 text-white hover:bg-navy-800 font-bold py-3 px-8 rounded-full transition-colors">
                Lihat FAQ
              </button>
            </div>
          </div>

          <div className="absolute -top-24 -left-24 w-64 h-64 bg-navy-800 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-navy-800 rounded-full blur-3xl opacity-50"></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
