import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import Image from "next/image";
import Link from "next/link";

interface TrustedUsersProps {
  avatars: string[];
  rating?: number;
  totalUsersText?: number;
  caption?: string;
  className?: string;
  starColorClass?: string;
  ringColors?: string[];
}

export const TrustedUsers: React.FC<TrustedUsersProps> = ({
  avatars,
  rating = 5,
  totalUsersText = 1000, // ✅ default as number
  caption = "Trusted by",
  className = "",
  starColorClass = "text-yellow-400",
  ringColors = [],
}) => {
  return (
    <div
      className={cn(
        `flex items-center justify-center gap-6 bg-transparent
          text-foreground py-4 px-4`,
        className
      )}
    >
      <div className="flex -space-x-4">
        {avatars.map((src, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full overflow-hidden ring-1 ring-offset-2 ring-offset-black ${ringColors[i] || "ring-blue-900"
              }`}
          >
            <Image
              src={src}
              alt={`Avatar ${i + 1}`}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start gap-1">
        <div className="flex gap-1 text-gold-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} fill="currentColor" className="w-4 h-4" aria-hidden="true" />
          ))}
        </div>
        <div className="text-foreground text-xs md:text-sm font-medium flex items-center flex-wrap gap-1">
          <span className="text-navy-900 font-bold">4,9/5</span>
          <span className="text-ink-600">dari</span>
          <CountUp
            value={totalUsersText}
            duration={2}
            separator="."
            className="text-sm"
            numberClassName="text-ink-600 font-medium"
            suffix="+"
            colorScheme="default"
          />
          <span className="text-ink-600">ulasan</span>
        </div>
      </div>
    </div>
  );
};
