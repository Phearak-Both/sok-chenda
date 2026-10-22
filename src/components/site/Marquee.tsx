import type { ComponentPropsWithoutRef } from "react";

type MarqueeProps = ComponentPropsWithoutRef<"div"> & {
  /** Scroll left to right instead. */
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** Copies of the content laid side by side, so the loop never shows a gap. */
  repeat?: number;
};

/**
 * Infinite horizontal marquee, after Magic UI's Marquee (magicui.design, MIT).
 * Speed and spacing come from the `--duration` and `--gap` CSS variables.
 * With reduced motion it stops and becomes a plain horizontally scrollable row.
 */
export function Marquee({ className = "", reverse, pauseOnHover, repeat = 4, children, ...props }: MarqueeProps) {
  return (
    <div
      {...props}
      className={`group flex overflow-hidden [--duration:40s] [--gap:1rem] [gap:var(--gap)] motion-reduce:overflow-x-auto ${className}`}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={`flex shrink-0 animate-marquee flex-row justify-around [gap:var(--gap)] motion-reduce:animate-none ${
            pauseOnHover ? "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]" : ""
          } ${reverse ? "[animation-direction:reverse]" : ""} ${i > 0 ? "motion-reduce:hidden" : ""}`}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
