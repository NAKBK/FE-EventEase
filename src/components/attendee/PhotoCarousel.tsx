"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselImage {
  id: string;
  url: string;
}

interface PhotoCarouselProps {
  images: CarouselImage[];
  // Used for alt text, e.g. the event title.
  title: string;
  caption?: string;
}

const SWIPE_THRESHOLD = 60;

// Self-contained on purpose (only framer-motion and lucide, both already dependencies) so it can be swapped for
// another carousel component without touching the page that uses it.
export function PhotoCarousel({ images, title, caption }: PhotoCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);

  if (images.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[2rem] border border-line bg-white px-5 py-4 text-sm text-ink-500 shadow-sm">
        <ImageOff className="size-5 shrink-0 text-ink-300" />
        Penyelenggara belum mengunggah foto untuk event ini.
      </div>
    );
  }

  const count = images.length;
  const go = (next: number) => {
    const target = (next + count) % count;
    setPage([target, next > index || (index === count - 1 && target === 0) ? 1 : -1]);
  };
  const paginate = (step: number) => go(index + step);

  const slide = {
    enter: (dir: number) => ({ x: reduceMotion ? 0 : dir * 48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: reduceMotion ? 0 : dir * -48, opacity: 0 }),
  };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={`Foto fasilitas ${title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") paginate(-1);
        if (e.key === "ArrowRight") paginate(1);
      }}
      className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
    >
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-bg-soft">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={images[index].id}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x <= -SWIPE_THRESHOLD) paginate(1);
              else if (info.offset.x >= SWIPE_THRESHOLD) paginate(-1);
            }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index].url}
              alt={`Foto fasilitas ${title} ${index + 1} dari ${count}`}
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Foto sebelumnya"
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-md hover:bg-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Foto berikutnya"
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-md hover:bg-white"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-navy-900 px-2.5 py-1 text-xs font-bold text-white">
              {index + 1} / {count}
            </span>
          </>
        )}

        {caption && (
          <span className="absolute bottom-3 left-3 max-w-[80%] rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-ink-700">
            {caption}
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3" aria-label="Pilih foto">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Lihat foto ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-opacity",
                i === index ? "border-navy-900" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" draggable={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
