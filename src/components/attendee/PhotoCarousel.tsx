"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  className?: string;
}

const SWIPE_THRESHOLD = 60;

// Compact carousel meant to sit beside other content: it fills the height of its grid cell.
// Self-contained on purpose (only framer-motion and lucide, both already dependencies) so it can be swapped for
// another carousel component without touching the page that uses it.
export function PhotoCarousel({ images, title, caption, className }: PhotoCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);

  const count = images.length;
  if (count === 0) return null;

  const paginate = (step: number) => {
    setPage([(index + step + count) % count, step]);
  };

  const goTo = (target: number) => {
    if (target === index) return;
    setPage([target, target > index ? 1 : -1]);
  };

  const slide = {
    enter: (dir: number) => ({ x: reduceMotion ? 0 : dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: reduceMotion ? 0 : dir * -40, opacity: 0 }),
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
      className={cn(
        "relative min-h-56 overflow-hidden rounded-[2rem] border border-line bg-bg-soft shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
        className,
      )}
    >
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
            className="absolute left-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-md hover:bg-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            aria-label="Foto berikutnya"
            className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-md hover:bg-white"
          >
            <ChevronRight className="size-4" />
          </button>
          <span className="absolute right-3 top-3 rounded-full bg-navy-900 px-2 py-0.5 text-[11px] font-bold text-white">
            {index + 1} / {count}
          </span>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-label="Pilih foto">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Lihat foto ${i + 1}`}
                aria-current={i === index}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90")}
              />
            ))}
          </div>
        </>
      )}

      {caption && (
        <span className="absolute left-3 top-3 max-w-[55%] rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold leading-tight text-ink-700">
          {caption}
        </span>
      )}
    </section>
  );
}
