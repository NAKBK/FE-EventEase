"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-full border border-navy-800 bg-transparent px-6 py-2.5 text-sm font-extrabold text-navy-900 transition-colors hover:text-white group",
          className
        )}
        {...props}
      >
        <span className="relative z-10 transition-colors">{children}</span>
        <div className="absolute inset-0 z-0 bg-navy-800 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      </button>
    );
  }
);
MotionButton.displayName = "MotionButton";
