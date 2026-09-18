"use client";

import React from "react";
import { ChevronDownIcon, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/cnippet-collapsible";

const faqs = [
  {
    question: "Apakah EventEase gratis?",
    answer: "Ya, fitur dasar pencarian dan info aksesibilitas di EventEase bisa digunakan secara gratis selamanya."
  },
  {
    question: "Bagaimana EventEase membantu pengguna dengan mobilitas terbatas?",
    answer: "Kami memberikan informasi mendetail soal venue, mulai dari ketersediaan ramp, lift, rute kursi roda, hingga toilet aksesibel."
  },
  {
    question: "Apakah bisa dipakai tanpa install aplikasi?",
    answer: "Tentu! EventEase bisa diakses langsung melalui browser di HP maupun komputer kamu tanpa perlu install apapun."
  },
  {
    question: "Data saya aman?",
    answer: "Kami sangat menjaga privasi. Kebutuhan aksesibilitas yang kamu masukkan hanya digunakan untuk mencocokkan event dan rute yang sesuai, tidak dijual ke pihak ketiga."
  },
  {
    question: "Kota mana saja yang sudah tersedia?",
    answer: "Saat ini kami fokus di kota besar seperti Jakarta, Bandung, dan Surabaya. Kami terus menambah event di kota-kota lain setiap harinya."
  }
];

export function FAQSection() {
  return (
    <section className="py-24 px-8 bg-bg-soft" id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-navy-900 leading-tight mb-4">
            Pertanyaan yang sering <br /><em className="text-navy-600">ditanyakan.</em>
          </h2>
        </div>
        
        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-md border-[0.5px] border-navy-200/50 bg-bg px-6 py-5 text-ink-900 shadow-sm transition-all hover:border-navy-300 hover:shadow-md">
              <Collapsible>
                <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-4 text-left group [&[aria-expanded=true]_.chevron]:opacity-0 [&[aria-expanded=true]_.chevron]:scale-50 [&[aria-expanded=true]_.chevron]:rotate-180 [&[aria-expanded=true]_.xicon]:opacity-100 [&[aria-expanded=true]_.xicon]:scale-100 [&[aria-expanded=true]_.xicon]:rotate-0">
                  <span className="font-bold text-lg text-navy-900 group-hover:text-navy-600 transition-colors">{faq.question}</span>
                  <div className="relative size-5 shrink-0 text-ink-300 group-hover:text-navy-600">
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="chevron absolute inset-0 size-5 transition-all duration-300"
                    />
                    <X
                      aria-hidden="true"
                      className="xicon absolute inset-0 size-5 -rotate-90 scale-50 opacity-0 transition-all duration-300"
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-4 text-ink-500 leading-relaxed font-medium">
                    {faq.answer}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
