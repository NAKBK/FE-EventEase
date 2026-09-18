"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/3d-testimonails";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rina Wijaya",
    location: "Jakarta",
    body: '"Sebagai pengguna kursi roda, akhirnya ada app yang benar-benar mikirin aksesibilitas. Rutenya jelas, infonya lengkap."',
    initial: "R"
  },
  {
    name: "Bagas Pratama",
    location: "Bandung",
    body: '"Suka banget sama filter aksesibilitasnya. Jadi tahu venue mana yang ramah sebelum beli tiket."',
    initial: "B"
  },
  {
    name: "Sari Anggraini",
    location: "Yogyakarta",
    body: '"Desainnya bersih, gampang dipakai. Ibuku yang gaptek pun bisa pakai sendiri."',
    initial: "S"
  },
  {
    name: "Budi Santoso",
    location: "Surabaya",
    body: '"Sangat membantu untuk cari event musik yang ramah difabel. Mantap EventEase!"',
    initial: "BS"
  }
];

function TestimonialCard({ name, location, body, initial }: (typeof testimonials)[number]) {
  return (
    <Card className="w-80 shadow-md border-navy-100 rounded-[var(--radius-lg)]">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
          ))}
        </div>
        <blockquote className="mt-3 text-sm text-ink-700 leading-relaxed italic mb-4">{body}</blockquote>
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-navy-100">
            <AvatarFallback className="bg-navy-50 text-navy-800 font-bold">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-bold text-navy-900 flex items-center gap-1">
              {name}
            </figcaption>
            <p className="text-xs font-medium text-ink-500">{location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialSection() {
  return (
    <section className="py-24 px-8 bg-bg relative overflow-hidden" id="testimoni">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">

        {/* Left Side: Title & Description */}
        <div className="flex-1">
          <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-navy-900 leading-tight mb-4">
            Kata mereka <br />
            tentang <em className="text-navy-600">EventEase.</em>
          </h2>
          <p className="text-ink-500 text-lg max-w-sm">
            Platform kami telah membantu ribuan pengguna dengan mobilitas terbatas menemukan event favorit mereka tanpa hambatan.
          </p>
        </div>

        {/* Right Side: Marquee Testimonials */}
        <div className="flex-1 w-full max-w-[500px]">
          <div className="relative flex h-[500px] w-full flex-row items-center justify-center overflow-hidden gap-1.5 [perspective:300px]">
            <div
              className="flex flex-row items-center gap-4"
              style={{
                transform: 'translateX(0px) translateY(0px) translateZ(-50px) rotateX(10deg) rotateY(-10deg) rotateZ(5deg)',
              }}
            >
              <Marquee vertical pauseOnHover repeat={4} className="[--duration:30s]">
                {testimonials.map((review, idx) => (
                  <TestimonialCard key={`col1-${idx}`} {...review} />
                ))}
              </Marquee>
              <Marquee vertical pauseOnHover reverse repeat={4} className="[--duration:35s]">
                {[...testimonials].reverse().map((review, idx) => (
                  <TestimonialCard key={`col2-${idx}`} {...review} />
                ))}
              </Marquee>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-bg to-transparent"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-bg to-transparent"></div>
          </div>
        </div>

      </div>
    </section>
  );
}
