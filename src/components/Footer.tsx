import React from "react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-navy-900 text-navy-100 py-10 px-8 border-t border-navy-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex-1 max-w-sm md:max-w-md">
          <h3 className="font-serif text-3xl text-white mb-4">EventEase</h3>
          <p className="text-navy-100 text-sm leading-relaxed mb-4">
            Menjadi pionir platform pencarian event yang inklusif dan ramah disabilitas di Indonesia. Kami hadir untuk mendobrak batasan, memastikan setiap orang memiliki kebebasan dan aksesibilitas yang sama dalam merayakan setiap momen berharga. 
          </p>
        </div>
        
        <div className="flex gap-10 flex-wrap">
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold mb-2">Produk</h4>
            <Link href="#" className="text-sm hover:text-white transition-colors">Fitur</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold mb-2">Perusahaan</h4>
            <Link href="#" className="text-sm hover:text-white transition-colors">Tentang Kami</Link>
            <Link href="#" className="text-sm hover:text-white transition-colors">Kontak</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold mb-2">Bantuan</h4>
            <Link href="#" className="text-sm hover:text-white transition-colors">FAQ</Link>
            <Link href="#" className="text-sm hover:text-white transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="text-sm hover:text-white transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-navy-800 flex justify-between items-center text-xs text-navy-100/60">
        <p>© 2026 EventEase. Semua hak dilindungi.</p>
      </div>
    </footer>
  );
};
