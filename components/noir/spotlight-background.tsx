"use client";

import { cn } from "@/lib/utils";

interface SpotlightBackgroundProps {
  children: React.ReactNode;
  intensity?: number;
  position?: "center" | "top" | "bottom-left" | "top-right";
  className?: string;
}

export function SpotlightBackground({
  children,
  intensity = 0.5,
  position = "center",
  className,
}: SpotlightBackgroundProps) {
  const positionStyles = {
    center: "at 50% 40%",
    top: "at 50% 0%",
    "bottom-left": "at 20% 80%",
    "top-right": "at 80% 20%",
  };

  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Base dark background */}
      <div className="absolute inset-0 bg-background" />

      {/* Spotlight cone effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse ${positionStyles[position]},
            oklch(0.95 0.05 70 / ${intensity * 0.12}) 0%,
            oklch(0.75 0.15 70 / ${intensity * 0.04}) 25%,
            transparent 50%
          )`,
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center,
            transparent 0%,
            transparent 40%,
            rgba(0,0,0,0.3) 70%,
            rgba(0,0,0,0.6) 100%
          )`,
        }}
      />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
