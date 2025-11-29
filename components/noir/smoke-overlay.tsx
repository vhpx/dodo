"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SmokeOverlayProps {
  intensity?: number;
  className?: string;
}

export function SmokeOverlay({ intensity = 1, className }: SmokeOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        className
      )}
    >
      {/* Smoke layer 1 - Slow drift right */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: 0.04 * intensity,
          background: `radial-gradient(ellipse at 30% 50%, oklch(0.30 0.01 250 / 0.4) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 30%, oklch(0.25 0.01 250 / 0.3) 0%, transparent 40%)`,
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Smoke layer 2 - Slow drift left */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: 0.03 * intensity,
          background: `radial-gradient(ellipse at 60% 60%, oklch(0.35 0.01 250 / 0.35) 0%, transparent 45%),
                       radial-gradient(ellipse at 20% 70%, oklch(0.28 0.01 250 / 0.25) 0%, transparent 35%)`,
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Smoke layer 3 - Subtle vertical rise */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: 0.025 * intensity,
          background: `radial-gradient(ellipse at 50% 80%, oklch(0.32 0.01 250 / 0.3) 0%, transparent 50%)`,
        }}
        animate={{
          y: [0, -60, 0],
          opacity: [0.025 * intensity, 0.04 * intensity, 0.025 * intensity],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
