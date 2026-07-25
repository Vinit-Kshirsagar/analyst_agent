"use client";

import { cn } from "@/lib/utils";

export interface LightRaysProps {
  className?: string;
  /** How many primary ray blades */
  count?: number;
  /** Overall opacity of the effect */
  intensity?: number;
}

/**
 * Animated light rays which shine down from above.
 * Outer wrapper holds fan rotation; inner blade animates shimmer
 * so CSS animation transform does not wipe the angle.
 */
export function LightRays({
  className,
  count = 9,
  intensity = 1,
}: LightRaysProps) {
  const rays = Array.from({ length: count }, (_, i) => {
    const mid = (count - 1) / 2;
    const t = mid === 0 ? 0 : (i - mid) / mid;
    const rotate = t * 40;
    const width = 5.5 + Math.abs(t) * 5;
    const opacity = (0.58 - Math.abs(t) * 0.3) * intensity;
    const delay = `${i * 0.32}s`;
    const duration = `${6.5 + (i % 4) * 1.2}s`;
    return { rotate, width, opacity, delay, duration, i };
  });

  return (
    <div
      aria-hidden
      className={cn(
        "light-rays pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Soft apex glow at top center */}
      <div className="light-rays-apex absolute left-1/2 top-0 h-[30%] w-[75%] max-w-3xl -translate-x-1/2 -translate-y-1/4" />

      {/* Ray fan */}
      <div className="absolute left-1/2 top-0 h-full w-full max-w-5xl -translate-x-1/2">
        {rays.map((r) => (
          <div
            key={r.i}
            className="absolute left-1/2 top-0 origin-top"
            style={{
              width: `${r.width}%`,
              height: "115%",
              marginLeft: `-${r.width / 2}%`,
              transform: `rotate(${r.rotate}deg)`,
            }}
          >
            <div
              className="light-ray h-full w-full"
              style={{
                opacity: r.opacity,
                animationDelay: r.delay,
                animationDuration: r.duration,
              }}
            />
          </div>
        ))}
      </div>

      {/* Soft wide shafts */}
      <div className="absolute left-1/2 top-0 h-full w-full max-w-4xl -translate-x-1/2">
        {[-16, 0, 16].map((rot, i) => (
          <div
            key={rot}
            className="absolute left-1/2 top-0 origin-top"
            style={{
              width: "20%",
              height: "105%",
              marginLeft: "-10%",
              transform: `rotate(${rot}deg)`,
            }}
          >
            <div
              className="light-ray light-ray-soft h-full w-full"
              style={{
                opacity: 0.2 * intensity,
                animationDelay: `${i * 0.9}s`,
                animationDuration: "12s",
              }}
            />
          </div>
        ))}
      </div>

      {/* Dissolve into page at bottom */}
      <div className="light-rays-fade absolute inset-x-0 bottom-0 h-2/5" />
    </div>
  );
}
