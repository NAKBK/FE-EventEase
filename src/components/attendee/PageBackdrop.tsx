import React from "react";

// Soft blurred gold and navy glows behind attendee pages, built only from design-system tokens.
// The parent must be `relative isolate overflow-hidden` so the glows sit behind the content and never scroll horizontally.
export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-28 -left-28 h-[440px] w-[440px] rounded-full bg-gold-400/35 blur-[110px]" />
      <div className="absolute top-[18%] -right-36 h-[500px] w-[500px] rounded-full bg-navy-500/25 blur-[120px]" />
      <div className="absolute top-[55%] -left-36 h-[460px] w-[460px] rounded-full bg-navy-500/20 blur-[120px]" />
      <div className="absolute -bottom-32 right-[20%] h-[420px] w-[420px] rounded-full bg-gold-400/30 blur-[110px]" />
    </div>
  );
}
