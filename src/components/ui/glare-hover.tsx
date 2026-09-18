"use client";

import { useRef, useState } from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MotionCard } from "@/components/ui/motion-card";

type GlareHoverProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  duration?: number;
};

export function GlareHover({
  children,
  className,
  duration = 600,
  ...props
}: GlareHoverProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <MotionCard
      ref={containerRef}
      className={cn("relative overflow-hidden group", className)}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.4), transparent 40%)`,
          transitionDuration: `${duration}ms`,
        }}
      />
    </MotionCard>
  );
}
