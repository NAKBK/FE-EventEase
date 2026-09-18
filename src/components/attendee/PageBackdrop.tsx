import React from "react";

// Soft blurred gold and navy glows behind attendee pages, built only from design-system tokens.
// The parent must be `relative isolate overflow-hidden` so the glows sit behind the content and never scroll horizontally.
// Each page gets its own composition so they do not all look identical.
export type BackdropVariant = "home" | "detail" | "history" | "verification" | "request" | "profile";

const blobs: Record<BackdropVariant, string[]> = {
  home: [
    "-top-28 -left-28 h-[440px] w-[440px] bg-gold-400/35 blur-[110px]",
    "top-[18%] -right-36 h-[500px] w-[500px] bg-navy-500/25 blur-[120px]",
    "top-[55%] -left-36 h-[460px] w-[460px] bg-navy-500/20 blur-[120px]",
    "-bottom-32 right-[20%] h-[420px] w-[420px] bg-gold-400/30 blur-[110px]",
  ],
  detail: [
    "-top-24 -left-24 h-[460px] w-[460px] bg-navy-500/25 blur-[120px]",
    "top-[14%] -right-32 h-[480px] w-[480px] bg-gold-400/35 blur-[110px]",
    "top-[58%] -left-32 h-[440px] w-[440px] bg-gold-400/25 blur-[110px]",
    "-bottom-28 right-[12%] h-[420px] w-[420px] bg-navy-500/20 blur-[120px]",
  ],
  history: [
    "-top-24 -right-24 h-[460px] w-[460px] bg-gold-400/35 blur-[110px]",
    "top-[30%] -left-40 h-[500px] w-[500px] bg-navy-500/25 blur-[120px]",
    "top-[64%] -right-36 h-[440px] w-[440px] bg-navy-500/20 blur-[120px]",
    "-bottom-32 left-[14%] h-[420px] w-[420px] bg-gold-400/30 blur-[110px]",
  ],
  verification: [
    "-top-32 left-[28%] h-[480px] w-[480px] bg-navy-500/25 blur-[120px]",
    "top-[28%] -left-36 h-[460px] w-[460px] bg-gold-400/35 blur-[110px]",
    "top-[50%] -right-32 h-[460px] w-[460px] bg-navy-500/20 blur-[120px]",
    "-bottom-28 right-[10%] h-[420px] w-[420px] bg-gold-400/30 blur-[110px]",
  ],
  request: [
    "-top-24 left-[35%] h-[500px] w-[500px] bg-gold-400/30 blur-[120px]",
    "top-[34%] -left-40 h-[480px] w-[480px] bg-navy-500/25 blur-[120px]",
    "top-[52%] -right-40 h-[480px] w-[480px] bg-navy-500/25 blur-[120px]",
    "-bottom-32 left-[8%] h-[420px] w-[420px] bg-gold-400/25 blur-[110px]",
  ],
  profile: [
    "-top-28 -right-28 h-[480px] w-[480px] bg-navy-500/30 blur-[120px]",
    "top-[24%] -left-36 h-[460px] w-[460px] bg-gold-400/35 blur-[110px]",
    "top-[58%] -right-36 h-[440px] w-[440px] bg-gold-400/25 blur-[110px]",
    "-bottom-32 left-[24%] h-[420px] w-[420px] bg-navy-500/20 blur-[120px]",
  ],
};

export function PageBackdrop({ variant = "home" }: { variant?: BackdropVariant }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {blobs[variant].map((classes) => (
        <div key={classes} className={`absolute rounded-full ${classes}`} />
      ))}
    </div>
  );
}
