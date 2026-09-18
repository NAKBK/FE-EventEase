"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export function TypingAnimation({
  children,
  className,
  duration = 30,
  delay = 0,
  as: Component = "p",
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
        setIsComplete(true);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started]);

  return (
    <Component className={cn(className)}>
      {displayedText}
      {!isComplete && (
        <span className="animate-[pulse_1s_ease-in-out_infinite] font-bold opacity-80">|</span>
      )}
    </Component>
  );
}
