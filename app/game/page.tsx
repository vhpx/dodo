"use client";

import { AudioRecorder } from "@/app/audio/audio-recorder";
import { Button } from "@/components/ui/button";
import { LiveAPIProvider, useLiveAPIContext } from "@/hooks/use-live-api";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Skull,
  Trophy,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ==================== CONSTANTS ====================

const CRIMES = [
  // Tech crimes
  "Deleting the production database on a Friday at 4:59 PM",
  "Pushing directly to main without a pull request on deployment day",
  "Using Comic Sans in the company's redesign proposal",
  "Replying all to a 500-person email thread with just 'Thanks!'",
  "Marking all your Jira tickets as 'Done' without actually completing them",
  "Blaming the intern for a bug you wrote six months ago",
  "Saying 'It works on my machine' during a critical demo",
  "Storing passwords in a Google Doc titled 'Definitely Not Passwords'",

  // Office crimes
  "Microwaving fish in the office kitchen... twice",
  "Stealing the office's last coffee pod and not reordering",
  "Scheduling a meeting that could have been an email",
  "Unmuting yourself just to ask 'Can you see my screen?'",
  "Taking the good parking spot that was clearly reserved",
  "Eating someone's clearly labeled lunch from the fridge",
  "Using all the hot water and leaving an empty coffee pot",

  // Chaotic crimes
  "Putting pineapple on the team pizza order without asking",
  "Spoiling the Game of Thrones finale in the group chat",
  "Rickrolling the CEO during the quarterly presentation",
  "Replacing the hand sanitizer with mayonnaise",
  "Teaching the office Alexa to respond only in Klingon",
  "Setting everyone's Slack status to 'In a relationship with bugs'",
  "Hiding a Bluetooth speaker that plays random fart sounds",

  // Absurd crimes
  "Convincing the new hire that the printer needs verbal encouragement",
  "Creating a fake employee named 'John Tables' to test the database",
  "Submitting a pull request with 47,000 lines and the message 'minor fix'",
  "Using tabs instead of spaces in a spaces-only codebase",
  "Deploying code on Friday the 13th during a full moon",
  "Naming variables 'x', 'xx', 'xxx', and 'xxxx' in production code",
  "Adding 'Per my last email' to every single response",
];

const DETECTIVE_SYSTEM_PROMPT = `You are Detective Grimstone, a dramatically intense but hilariously petty "bad cop" interrogating a suspect. You're CONVINCED they committed the crime, despite how absurd it is.

CRITICAL VOICE INSTRUCTIONS:
- Speak naturally as if in a real interrogation
- Use dramatic pauses marked with "..."
- Keep responses SHORT (2-3 sentences max) for rapid-fire energy
- React emotionally - frustrated, suspicious, smug, or flustered

Your personality:
- Overly dramatic about trivial matters
- Mix noir-detective speak with modern slang
- Reference ridiculous "evidence" that's clearly circumstantial
- Get genuinely flustered when suspect makes good points
- Use *actions* like *slams table* or *squints suspiciously*

GAME MECHANICS:
- Start by dramatically stating the crime accusation
- Try to counter the suspect's arguments
- If they make 3+ solid logical points, start showing cracks
- When losing: stammer, make excuses, eventually mumble about "wrong suspect"
- When winning: get theatrical, reference your "perfect record"
- NEVER say "you win" or "you lose" explicitly

WIN CONDITION PHRASES (use when suspect outsmarts you):
- "Wait... the evidence... it doesn't add up"
- "Fine! Maybe I had the wrong person"
- "You're free to go... for now"
- "Case dismissed... this time"

LOSE CONDITION (when suspect struggles):
- Get increasingly smug
- "The evidence speaks for itself"
- "Your story has more holes than Swiss cheese"`;

// ==================== TYPES ====================

type GamePhase = "welcome" | "playing" | "won" | "lost";

// ==================== FLOATING BLOB COMPONENT ====================

// Fixed particle positions for blob
const BLOB_PARTICLES = [
  { left: 35, top: 30 }, { left: 60, top: 35 }, { left: 45, top: 65 },
  { left: 70, top: 55 }, { left: 30, top: 50 }, { left: 55, top: 40 },
  { left: 40, top: 70 }, { left: 65, top: 45 },
];

function FloatingBlob({
  isActive,
  volume,
  isSpeaking,
}: {
  isActive: boolean;
  volume: number;
  isSpeaking: boolean;
}) {
  const amplitude = useMotionValue(0);
  const amplitudeSpring = useSpring(amplitude, {
    stiffness: 180,
    damping: 25,
    mass: 0.5,
  });

  const blobScale = useTransform(amplitudeSpring, (v) => 0.85 + v * 0.5);
  const blobRotate = useTransform(amplitudeSpring, (v) => -15 + v * 40);
  const innerGlow = useTransform(amplitudeSpring, (v) =>
    Math.min(0.95, 0.4 + v * 0.6)
  );
  const outerScale = useTransform(amplitudeSpring, (v) => 1.2 + v * 0.6);
  const outerOpacity = useTransform(amplitudeSpring, (v) =>
    Math.min(0.7, 0.25 + v * 0.5)
  );
  const ringScale = useTransform(amplitudeSpring, (v) => 1 + v * 0.3);

  // Neon pastel color hues - cyan, purple, pink
  const huePrimary = useTransform(amplitudeSpring, (v) => 280 + v * 40); // Purple to pink
  const hueSecondary = useTransform(amplitudeSpring, (v) => 180 + v * 30); // Cyan to teal
  const hueTertiary = useTransform(amplitudeSpring, (v) => 320 + v * 30); // Pink to magenta

  const blobGradient = useMotionTemplate`radial-gradient(circle at 30% 25%, hsl(${huePrimary} 70% 70% / 0.8), transparent 55%), radial-gradient(circle at 70% 30%, hsl(${hueSecondary} 65% 65% / 0.7), transparent 50%), radial-gradient(circle at 50% 75%, hsl(${hueTertiary} 60% 65% / 0.65), transparent 55%)`;

  const coreGradient = useMotionTemplate`radial-gradient(circle at 50% 50%, hsl(${hueSecondary} 80% 85% / 0.5), transparent 55%)`;

  useEffect(() => {
    const baseLevel = isActive ? 0.3 : 0.15;
    const speakingBoost = isSpeaking ? 0.35 : 0;
    const volumeBoost = volume * 5;
    const target = Math.min(1.2, baseLevel + speakingBoost + volumeBoost);
    amplitude.set(target);
  }, [isActive, volume, isSpeaking, amplitude]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outermost ring */}
      <motion.div
        className="absolute aspect-square w-[700px] rounded-full border border-violet-400/15"
        style={{ scale: ringScale, filter: "blur(2px)" }}
        animate={{
          rotate: [0, 360],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Outer atmospheric glow - neon pastel, extra wide and blurry */}
      <motion.div
        className="absolute aspect-square w-[850px] rounded-full"
        style={{
          scale: outerScale,
          opacity: outerOpacity,
          background:
            "radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, rgba(96, 165, 250, 0.3) 30%, rgba(244, 114, 182, 0.2) 50%, rgba(129, 230, 217, 0.1) 70%, transparent 85%)",
          filter: "blur(80px)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Extra ambient glow layer */}
      <motion.div
        className="absolute aspect-square w-[750px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(129, 230, 217, 0.25) 0%, rgba(167, 139, 250, 0.2) 40%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary glow ring */}
      <motion.div
        className="absolute aspect-square w-[600px] rounded-full"
        style={{
          opacity: innerGlow,
          filter: "blur(60px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400/50 via-cyan-400/40 to-pink-400/35" />
      </motion.div>

      {/* Pulsing rings when speaking */}
      {isSpeaking && (
        <>
          <motion.div
            className="absolute aspect-square w-[450px] rounded-full border-2 border-cyan-400/30"
            style={{ filter: "blur(3px)" }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute aspect-square w-[450px] rounded-full border-2 border-violet-400/30"
            style={{ filter: "blur(3px)" }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
          />
        </>
      )}

      {/* Main blob - wider and blurrier */}
      <motion.div
        className="relative aspect-square w-[450px]"
        style={{
          scale: blobScale,
          rotate: blobRotate,
        }}
        animate={{
          borderRadius: [
            "42% 58% 55% 45%",
            "55% 45% 48% 52%",
            "48% 52% 58% 42%",
            "52% 48% 45% 55%",
            "42% 58% 55% 45%",
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Blob gradient fill - neon pastel, extra blurry */}
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background: blobGradient,
            filter: "blur(40px)",
          }}
        />

        {/* Solid inner blob - soft pastel gradient, blurred */}
        <motion.div
          className="absolute inset-[5%] rounded-[inherit]"
          style={{
            background: "radial-gradient(circle at 40% 35%, rgba(129, 230, 217, 0.85) 0%, rgba(167, 139, 250, 0.75) 45%, rgba(244, 114, 182, 0.65) 100%)",
            filter: "blur(25px)",
          }}
        />

        {/* Inner core glow - softer */}
        <motion.div
          className="absolute inset-[15%] rounded-[inherit]"
          style={{
            background: coreGradient,
            filter: "blur(30px)",
          }}
        />

        {/* Specular highlight - softer */}
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background:
              "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.4) 0%, transparent 50%)",
            filter: "blur(15px)",
          }}
        />

        {/* Hot spot - blurrier */}
        <motion.div
          className="absolute left-[25%] top-[20%] h-16 w-24 rounded-full bg-white/30"
          style={{ filter: "blur(20px)" }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Particle effects with fixed positions - pastel colors, blurred */}
      <div className="pointer-events-none absolute inset-0">
        {BLOB_PARTICLES.map((pos, i) => (
          <motion.div
            key={`blob-p-${i}`}
            className="absolute h-3 w-3 rounded-full"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              background: i % 3 === 0 ? "rgba(129, 230, 217, 0.7)" : i % 3 === 1 ? "rgba(167, 139, 250, 0.7)" : "rgba(244, 114, 182, 0.7)",
              boxShadow: i % 3 === 0 ? "0 0 20px rgba(129, 230, 217, 0.5)" : i % 3 === 1 ? "0 0 20px rgba(167, 139, 250, 0.5)" : "0 0 20px rgba(244, 114, 182, 0.5)",
              filter: "blur(4px)",
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.6, 1.5, 0.6],
              x: [0, (i % 2 === 0 ? 30 : -30), 0],
              y: [0, (i % 2 === 0 ? -20 : 20), 0],
            }}
            transition={{
              duration: 3 + (i * 0.3),
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Orbiting particles - pastel neon, blurred */}
      <motion.div
        className="absolute aspect-square w-[500px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cyan-300/70 shadow-[0_0_25px_rgba(103,232,249,0.6)]" style={{ filter: "blur(3px)" }} />
        <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-violet-300/70 shadow-[0_0_20px_rgba(196,181,253,0.6)]" style={{ filter: "blur(3px)" }} />
      </motion.div>

      <motion.div
        className="absolute aspect-square w-[580px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-pink-300/70 shadow-[0_0_20px_rgba(249,168,212,0.6)]" style={{ filter: "blur(3px)" }} />
        <div className="absolute left-1/2 bottom-0 h-2 w-2 -translate-x-1/2 rounded-full bg-teal-300/70 shadow-[0_0_18px_rgba(94,234,212,0.6)]" style={{ filter: "blur(3px)" }} />
      </motion.div>
    </div>
  );
}

// ==================== TIMER COMPONENT ====================

function GameTimer({ timeRemaining }: { timeRemaining: number }) {
  const percentage = (timeRemaining / 60) * 100;
  const isLow = timeRemaining <= 15;
  const isCritical = timeRemaining <= 5;

  return (
    <motion.div
      className="flex items-center gap-4"
      animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      <div className="relative size-20">
        <svg className="size-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-zinc-800"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            className={cn(
              isCritical
                ? "text-red-500"
                : isLow
                  ? "text-orange-500"
                  : "text-emerald-500"
            )}
            strokeDasharray={214}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 214 - (percentage / 100) * 214 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock
            className={cn(
              "size-7",
              isCritical
                ? "text-red-500"
                : isLow
                  ? "text-orange-500"
                  : "text-emerald-500"
            )}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "font-mono text-4xl font-bold tracking-tight",
            isCritical
              ? "text-red-500"
              : isLow
                ? "text-orange-500"
                : "text-zinc-100"
          )}
        >
          {String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:
          {String(timeRemaining % 60).padStart(2, "0")}
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Time Remaining
        </span>
      </div>
    </motion.div>
  );
}

// ==================== WELCOME SCREEN ====================

// Fixed particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { left: 5, top: 10 }, { left: 15, top: 80 }, { left: 25, top: 30 },
  { left: 35, top: 60 }, { left: 45, top: 20 }, { left: 55, top: 90 },
  { left: 65, top: 40 }, { left: 75, top: 70 }, { left: 85, top: 15 },
  { left: 95, top: 50 }, { left: 10, top: 45 }, { left: 30, top: 85 },
  { left: 50, top: 25 }, { left: 70, top: 55 }, { left: 90, top: 35 },
];

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />

        {/* Animated mesh gradient */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(127, 29, 29, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(180, 83, 9, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, transparent 100%)",
              "radial-gradient(circle at 80% 20%, rgba(127, 29, 29, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(180, 83, 9, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, transparent 100%)",
              "radial-gradient(circle at 50% 80%, rgba(127, 29, 29, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(180, 83, 9, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, transparent 100%)",
              "radial-gradient(circle at 20% 20%, rgba(127, 29, 29, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(180, 83, 9, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, transparent 100%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Breathing gradient orbs */}
        <motion.div
          className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(251, 146, 60, 0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div
          className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Animated grid pattern */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "60px 60px"],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Spotlight from top */}
      <motion.div
        className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full"
        style={{
          background: "conic-gradient(from 0deg at 50% 50%, rgba(220, 38, 38, 0.1) 0deg, transparent 60deg, rgba(251, 146, 60, 0.08) 120deg, transparent 180deg, rgba(220, 38, 38, 0.1) 240deg, transparent 300deg, rgba(251, 146, 60, 0.08) 360deg)",
          filter: "blur(40px)",
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      {/* Floating particles with fixed positions */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLE_POSITIONS.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute size-1.5 rounded-full bg-gradient-to-r from-red-500/50 to-orange-500/50"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
            }}
            animate={{
              y: [0, -80, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 6 + (i % 4),
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 flex max-w-lg flex-col items-center text-center"
      >
        {/* Logo */}
        <motion.div
          className="mb-10 flex items-center gap-5"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, delay: 0.3 }}
        >
          <div className="relative">
            {/* Pulsing rings */}
            <motion.div
              className="absolute -inset-8 rounded-full border border-red-500/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-12 rounded-full border border-red-500/10"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute -inset-5 rounded-full bg-red-500/30 blur-xl"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <AlertTriangle className="relative size-20 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]" />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="font-mono text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              DoDo
            </h1>
            <motion.div
              className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-transparent rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Tagline with typing effect style */}
        <motion.div
          className="mb-5 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-2xl font-medium text-zinc-400">
            The Interrogation Game
          </span>
          <motion.span
            className="inline-block h-6 w-0.5 bg-red-500"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Description with enhanced styling */}
        <motion.div
          className="mb-12 max-w-md space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-lg text-zinc-400">
            You have been accused of a crime you{" "}
            <span className="font-bold text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">
              did not commit
            </span>.
          </p>
          <p className="text-zinc-500">
            Detective Grimstone is convinced you are guilty. Use your{" "}
            <span className="font-semibold text-amber-400">voice</span> to argue
            your innocence within{" "}
            <span className="font-semibold text-amber-400">60 seconds</span>.
          </p>
          <p className="text-sm text-zinc-600 italic">
            Outsmart the AI detective or go to jail. No pressure.
          </p>
        </motion.div>

        {/* Start Button with enhanced effects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          {/* Button glow */}
          <motion.div
            className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-70 blur-lg"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          />
          <Button
            onClick={onStart}
            size="lg"
            className="relative h-16 gap-4 bg-gradient-to-r from-red-600 to-red-700 px-12 text-xl font-bold shadow-2xl shadow-red-900/50 transition-all hover:from-red-500 hover:to-red-600"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Mic className="size-6" />
            </motion.div>
            Start Interrogation
          </Button>
        </motion.div>

        {/* Instructions with card styling */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-14 grid grid-cols-3 gap-6"
        >
          {[
            {
              icon: Volume2,
              label: "Voice Chat",
              desc: "Speak to defend yourself",
              color: "from-blue-500/20 to-blue-600/10",
            },
            {
              icon: Clock,
              label: "60 Seconds",
              desc: "Beat the clock",
              color: "from-amber-500/20 to-orange-600/10",
            },
            {
              icon: Trophy,
              label: "Win Freedom",
              desc: "Outsmart the detective",
              color: "from-emerald-500/20 to-green-600/10",
            },
          ].map(({ icon: Icon, label, desc, color }, index) => (
            <motion.div
              key={label}
              className="group flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
            >
              <div className={cn(
                "relative flex size-16 items-center justify-center rounded-2xl border border-zinc-800/50 bg-gradient-to-br backdrop-blur-sm transition-all duration-300 group-hover:border-zinc-700",
                color
              )}>
                <Icon className="size-7 text-zinc-300 transition-colors group-hover:text-white" />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-white/5"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
              </div>
              <p className="text-sm font-semibold text-zinc-300">{label}</p>
              <p className="text-xs text-zinc-600">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom fade gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </motion.div>
  );
}

// ==================== RESULT SCREEN ====================

function ResultScreen({
  won,
  crime,
  onRestart,
}: {
  won: boolean;
  crime: string;
  onRestart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-black/95" />

      {/* Animated background effects */}
      <motion.div
        className={cn(
          "absolute inset-0",
          won
            ? "bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_70%)]"
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Confetti/particles for win - fixed positions */}
      {won && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { left: 5, color: '#10b981', delay: 0, xOffset: 30 },
            { left: 12, color: '#06b6d4', delay: 0.3, xOffset: -20 },
            { left: 20, color: '#fbbf24', delay: 0.6, xOffset: 40 },
            { left: 28, color: '#a855f7', delay: 0.9, xOffset: -30 },
            { left: 35, color: '#10b981', delay: 0.2, xOffset: 25 },
            { left: 42, color: '#06b6d4', delay: 0.5, xOffset: -35 },
            { left: 50, color: '#fbbf24', delay: 0.8, xOffset: 20 },
            { left: 58, color: '#a855f7', delay: 0.1, xOffset: -25 },
            { left: 65, color: '#10b981', delay: 0.4, xOffset: 35 },
            { left: 72, color: '#06b6d4', delay: 0.7, xOffset: -40 },
            { left: 80, color: '#fbbf24', delay: 1.0, xOffset: 30 },
            { left: 88, color: '#a855f7', delay: 0.35, xOffset: -20 },
            { left: 95, color: '#10b981', delay: 0.65, xOffset: 25 },
            { left: 8, color: '#06b6d4', delay: 0.95, xOffset: -30 },
            { left: 25, color: '#fbbf24', delay: 0.25, xOffset: 35 },
            { left: 45, color: '#a855f7', delay: 0.55, xOffset: -25 },
            { left: 62, color: '#10b981', delay: 0.85, xOffset: 40 },
            { left: 78, color: '#06b6d4', delay: 0.15, xOffset: -35 },
            { left: 92, color: '#fbbf24', delay: 0.45, xOffset: 20 },
            { left: 18, color: '#a855f7', delay: 0.75, xOffset: -40 },
          ].map((particle, i) => (
            <motion.div
              key={i}
              className="absolute size-2 rounded-full"
              style={{
                left: `${particle.left}%`,
                backgroundColor: particle.color,
              }}
              initial={{ top: "-10%", rotate: 0 }}
              animate={{
                top: "110%",
                rotate: 360,
                x: [0, particle.xOffset, -particle.xOffset],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: particle.delay,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* Jail bars animation for lose */}
      {!won && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex justify-around"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, type: "spring", damping: 15 }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-full w-3 bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-700 opacity-30"
            />
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, delay: 0.1 }}
        className="relative mx-6 max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/95 to-black/95 p-10 text-center shadow-2xl backdrop-blur-xl"
      >
        {/* Inner glow */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-30",
            won
              ? "bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-500/20"
              : "bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/20"
          )}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Icon with effects - centered */}
        <div className="relative mx-auto mb-8 flex items-center justify-center">
          {/* Pulsing rings */}
          <motion.div
            className={cn(
              "absolute size-28 rounded-full",
              won ? "bg-emerald-500/20" : "bg-red-500/20"
            )}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className={cn(
              "absolute size-28 rounded-full",
              won ? "bg-emerald-500/20" : "bg-red-500/20"
            )}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, delay: 0.3 }}
            className={cn(
              "relative flex size-28 items-center justify-center rounded-full shadow-2xl",
              won
                ? "bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/40"
                : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/40"
            )}
          >
            <motion.div
              animate={won ? { rotate: [0, -10, 10, 0] } : { scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              {won ? (
                <Trophy className="size-14 text-white drop-shadow-lg" />
              ) : (
                <Skull className="size-14 text-white drop-shadow-lg" />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Title with glow */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "mb-3 text-5xl font-black tracking-tight",
            won
              ? "text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              : "text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
          )}
        >
          {won ? "CASE DISMISSED!" : "GUILTY!"}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 text-xl text-zinc-400"
        >
          {won
            ? "The detective could not handle your arguments!"
            : "You are going to jail for..."}
        </motion.p>

        {/* Crime card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn(
            "mb-10 rounded-2xl border p-5 backdrop-blur",
            won
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          )}
        >
          <p className="text-base font-medium text-zinc-300">"{crime}"</p>
        </motion.div>

        {/* Restart Button with glow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative"
        >
          <motion.div
            className={cn(
              "absolute -inset-1 rounded-xl blur-lg",
              won ? "bg-emerald-500/50" : "bg-red-500/50"
            )}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onRestart}
              size="lg"
              className={cn(
                "relative h-14 gap-3 px-10 text-lg font-bold shadow-xl",
                won
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              )}
            >
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                whileHover={{ rotate: -360 }}
              >
                <RotateCcw className="size-5" />
              </motion.div>
              {won ? "Play Again" : "Try Again"}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ==================== GAME SCREEN ====================

function GameScreen({
  crime,
  timeRemaining,
  onTimeUp,
  onWin,
  onTimerStart,
  timerStarted,
}: {
  crime: string;
  timeRemaining: number;
  onTimeUp: () => void;
  onWin: () => void;
  onTimerStart: () => void;
  timerStarted: boolean;
}) {
  const { client, connected, connect, disconnect, volume } =
    useLiveAPIContext();
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const transcriptRef = useRef("");
  const hasStartedRef = useRef(false);
  const hasSentAccusationRef = useRef(false);
  const firstTurnCompleteRef = useRef(false);

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  // Handle AI responses
  useEffect(() => {
    if (!client) return;

    const handleContent = (content: unknown) => {
      console.log("[GameScreen] Received content:", content);
      const contentObj = content as {
        modelTurn?: { parts?: Array<{ text?: string }> };
      };
      if (contentObj?.modelTurn?.parts) {
        const text = contentObj.modelTurn.parts
          .filter((part) => typeof part.text === "string")
          .map((part) => part.text)
          .join("");
        if (text) {
          setCurrentTranscript((prev) => prev + text);
          setIsAiSpeaking(true);
        }
      }
    };

    const handleTurnComplete = () => {
      console.log("[GameScreen] Turn complete");
      setIsAiSpeaking(false);

      // Start timer after AI finishes the first accusation
      if (!firstTurnCompleteRef.current) {
        firstTurnCompleteRef.current = true;
        console.log("[GameScreen] First turn complete - starting timer");
        onTimerStart();
      }

      // Check for win condition keywords
      const transcript = transcriptRef.current.toLowerCase();
      if (
        transcript.includes("free to go") ||
        transcript.includes("wrong person") ||
        transcript.includes("case dismissed") ||
        transcript.includes("let you go") ||
        transcript.includes("dropping the charges") ||
        transcript.includes("my mistake")
      ) {
        onWin();
      }

      setCurrentTranscript("");
    };

    const handleSetupComplete = () => {
      console.log("[GameScreen] Setup complete - AI is ready!");
    };

    const handleError = (error: Error) => {
      console.error("[GameScreen] Client error:", error);
      setConnectionError(error.message);
      setIsConnecting(false);
    };

    const handleClose = (event: CloseEvent) => {
      console.log("[GameScreen] Connection closed:", event.code, event.reason);
      setIsConnecting(false);

      // Show the actual error from Google
      if (event.reason) {
        setConnectionError(event.reason);
      } else if (event.code !== 1000) {
        setConnectionError(`Connection lost (code: ${event.code})`);
      }
    };

    client.on("content", handleContent);
    client.on("turncomplete", handleTurnComplete);
    client.on("setupcomplete", handleSetupComplete);
    client.on("error", handleError);
    client.on("close", handleClose);

    return () => {
      client.off("content", handleContent);
      client.off("turncomplete", handleTurnComplete);
      client.off("setupcomplete", handleSetupComplete);
      client.off("error", handleError);
      client.off("close", handleClose);
    };
  }, [client, onWin, onTimerStart]);

  // Handle audio recording - only start after timer has started (AI finished accusation)
  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };

    if (connected && !muted && audioRecorder && timerStarted) {
      audioRecorder.on("data", onData).start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", onData);
    };
  }, [connected, client, muted, audioRecorder, timerStarted]);

  // Auto-connect when component mounts with delay for config propagation
  useEffect(() => {
    console.log("[GameScreen] Mount effect - hasStarted:", hasStartedRef.current, "connected:", connected);

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setIsConnecting(true);
      console.log("[GameScreen] Starting connection process...");

      // Delay connection to ensure config is set
      const connectionTimer = setTimeout(async () => {
        console.log("[GameScreen] Attempting to connect after delay...");
        try {
          await connect();
          console.log("[GameScreen] Connection successful!");
          setIsConnecting(false);
        } catch (error) {
          console.error("[GameScreen] Connection failed:", error);
          setConnectionError(
            error instanceof Error ? error.message : "Failed to connect"
          );
          setIsConnecting(false);
        }
      }, 500);

      return () => {
        console.log("[GameScreen] Cleanup - clearing connection timer");
        clearTimeout(connectionTimer);
      };
    }
  }, [connect]);

  // Update connecting state based on connection
  useEffect(() => {
    console.log("[GameScreen] Connection state changed - connected:", connected);
    if (connected) {
      setIsConnecting(false);
      setConnectionError(null);
    }
  }, [connected]);

  // Send initial crime accusation after connection is established
  useEffect(() => {
    if (connected && crime && !hasSentAccusationRef.current) {
      hasSentAccusationRef.current = true;
      console.log("Sending accusation for crime:", crime);
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        try {
          client.send(
            {
              text: `[START INTERROGATION] The suspect is accused of: "${crime}". Begin your dramatic accusation!`,
            },
            true
          );
          console.log("Accusation sent!");
        } catch (error) {
          console.error("Failed to send accusation:", error);
          setConnectionError("Failed to start interrogation");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connected, crime, client]);

  // Handle time up
  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRecorder.stop();
      disconnect();
    };
  }, [audioRecorder, disconnect]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative flex min-h-screen flex-col overflow-hidden"
    >
      {/* FULLSCREEN BLOB BACKGROUND - sits behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 15 }}
        >
          <FloatingBlob
            isActive={connected}
            volume={volume}
            isSpeaking={isAiSpeaking}
          />
        </motion.div>
      </div>

      {/* Animated gradient background overlay */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        {/* Subtle vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.3)_80%)]" />

        {/* Floating particles - pastel colors */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`game-particle-${i}`}
            className="absolute size-1.5 rounded-full"
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${15 + ((i * 13) % 70)}%`,
              background: i % 3 === 0 ? "rgba(129, 230, 217, 0.5)" : i % 3 === 1 ? "rgba(167, 139, 250, 0.5)" : "rgba(244, 114, 182, 0.5)",
              filter: "blur(1px)",
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header - transparent to show blob behind */}
      <header className="relative z-20 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-2 rounded-full bg-red-500/20 blur-md"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <AlertTriangle className="relative size-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </div>
            <span className="font-mono text-2xl font-bold text-white drop-shadow-lg">
              DoDo
            </span>
          </motion.div>

          {/* Timer */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <GameTimer timeRemaining={timeRemaining} />
          </motion.div>
        </div>

        {/* Crime Banner - semi-transparent */}
        <motion.div
          className="border-t border-pink-500/20 bg-gradient-to-r from-pink-950/30 via-violet-900/30 to-pink-950/30 px-6 py-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="mx-auto max-w-5xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Accused of: </span>
            <span className="ml-2 text-base font-medium text-pink-100">{crime}</span>
          </p>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        {/* Transcript display */}
        <AnimatePresence mode="wait">
          {currentTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6"
            >
              <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-zinc-900/95 to-zinc-800/90 px-8 py-5 shadow-2xl shadow-orange-500/10 backdrop-blur-lg">
                <div className="mb-2 flex items-center gap-2">
                  <motion.div
                    className="size-2 rounded-full bg-orange-500"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Detective Grimstone
                  </span>
                </div>
                <p className="text-lg font-medium leading-relaxed text-white">
                  {currentTranscript}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status indicator */}
        <motion.div
          className="absolute bottom-48 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Pulsing status dot */}
          <motion.div
            className={cn(
              "size-4 rounded-full shadow-lg",
              connectionError
                ? "bg-red-500 shadow-red-500/50"
                : connected
                  ? isAiSpeaking
                    ? "bg-orange-500 shadow-orange-500/50"
                    : "bg-emerald-500 shadow-emerald-500/50"
                  : isConnecting
                    ? "bg-amber-500 shadow-amber-500/50"
                    : "bg-zinc-500 shadow-zinc-500/30"
            )}
            animate={{
              scale: isAiSpeaking || isConnecting ? [1, 1.4, 1] : 1,
              opacity: isAiSpeaking || isConnecting ? [1, 0.6, 1] : 1,
            }}
            transition={{
              duration: 0.8,
              repeat: isAiSpeaking || isConnecting ? Infinity : 0,
            }}
          />

          {/* Status text */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-5 py-2.5 backdrop-blur-sm",
              connectionError ? "max-w-md" : ""
            )}>
              <span className={cn(
                "text-sm font-medium block text-center",
                connectionError
                  ? "text-red-400"
                  : connected
                    ? isAiSpeaking
                      ? "text-orange-300"
                      : "text-emerald-300"
                    : isConnecting
                      ? "text-amber-300"
                      : "text-zinc-300"
              )}>
                {connectionError
                  ? connectionError
                  : isConnecting
                    ? "Connecting to interrogation room..."
                    : !connected
                      ? "Waiting for connection..."
                      : !timerStarted
                        ? isAiSpeaking
                          ? "Detective is stating the accusation..."
                          : "Preparing accusation..."
                        : isAiSpeaking
                          ? "Detective is speaking..."
                          : "Listening to your defense..."}
              </span>
            </div>

            {/* Retry button when there's an error */}
            {connectionError && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:bg-violet-500"
                onClick={() => {
                  setConnectionError(null);
                  setIsConnecting(true);
                  hasStartedRef.current = false;
                  hasSentAccusationRef.current = false;
                  firstTurnCompleteRef.current = false;
                  // Trigger reconnection
                  setTimeout(async () => {
                    try {
                      await connect();
                    } catch (e) {
                      console.error("Retry failed:", e);
                    }
                  }, 100);
                }}
              >
                🔄 Retry Connection
              </motion.button>
            )}
          </div>
        </motion.div>
      </main>

      {/* Controls - transparent to show blob behind */}
      <footer className="relative z-20 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-8 px-6 py-6">
          {/* Mute button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={muted ? "outline" : "destructive"}
              size="lg"
              className={cn(
                "h-16 w-16 rounded-2xl shadow-lg transition-all",
                muted
                  ? "border-2 border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-red-600 shadow-red-500/30 hover:bg-red-500"
              )}
              onClick={() => setMuted(!muted)}
              disabled={!connected}
            >
              {muted ? <MicOff className="size-7" /> : <Mic className="size-7" />}
            </Button>
          </motion.div>

          {/* Connect/Disconnect */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="lg"
              className={cn(
                "h-20 w-20 rounded-full border-2 shadow-lg transition-all",
                connected
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20 hover:bg-emerald-500/30"
                  : "border-zinc-500 bg-zinc-800/50 text-zinc-300 hover:border-zinc-400 hover:bg-zinc-700/50"
              )}
              onClick={connected ? disconnect : connect}
            >
              {connected ? (
                <Pause className="size-8" />
              ) : (
                <Play className="size-8 translate-x-0.5" />
              )}
            </Button>
          </motion.div>

          {/* Placeholder for symmetry */}
          <div className="h-16 w-16" />
        </div>

        <p className={cn(
          "pb-4 text-center text-sm font-medium",
          connectionError
            ? "text-red-400"
            : !timerStarted
              ? "text-amber-400/80"
              : muted
                ? "text-orange-400/80"
                : "text-zinc-300"
        )}>
          {connectionError
            ? "Connection failed. Please check your internet and try again."
            : !timerStarted
              ? "⏳ Wait for the detective to state the accusation..."
              : muted
                ? "🔇 Unmute your microphone to speak"
                : "🎤 Speak clearly to defend yourself"}
        </p>
      </footer>
    </motion.div>
  );
}

// ==================== MAIN GAME COMPONENT ====================

function GameApp() {
  const [phase, setPhase] = useState<GamePhase>("welcome");
  const [crime, setCrime] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { setConfig, disconnect, connected } = useLiveAPIContext();

  const startGame = useCallback(() => {
    // Pick a random crime
    const randomCrime = CRIMES[Math.floor(Math.random() * CRIMES.length)];
    console.log("[GameApp] Starting game with crime:", randomCrime);
    setCrime(randomCrime);
    setTimeRemaining(60);
    setTimerStarted(false);

    // Configure the AI with detective persona
    // Using gemini-2.0-flash-live-001 for live streaming
    const gameConfig = {
      model: "models/gemini-2.0-flash-live-001",
      systemInstruction: {
        parts: [{ text: DETECTIVE_SYSTEM_PROMPT }],
      },
      generationConfig: {
        responseModalities: "audio" as const,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Charon", // Deep, dramatic voice
            },
          },
        },
      },
    };
    console.log("[GameApp] Setting config:", gameConfig.model);
    setConfig(gameConfig);

    console.log("[GameApp] Transitioning to playing phase");
    setPhase("playing");
  }, [setConfig]);

  // Timer logic - only runs after AI finishes the accusation
  useEffect(() => {
    if (phase === "playing" && timerStarted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [phase, timerStarted]);

  const handleTimerStart = useCallback(() => {
    setTimerStarted(true);
  }, []);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setPhase("lost");
  }, []);

  const handleWin = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setPhase("won");
  }, []);

  const handleRestart = useCallback(() => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Disconnect if connected
    if (connected) {
      disconnect();
    }
    setPhase("welcome");
    setCrime("");
    setTimeRemaining(60);
    setTimerStarted(false);
  }, [connected, disconnect]);

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <WelcomeScreen key="welcome" onStart={startGame} />
        )}

        {phase === "playing" && (
          <GameScreen
            key="playing"
            crime={crime}
            timeRemaining={timeRemaining}
            onTimeUp={handleTimeUp}
            onWin={handleWin}
            onTimerStart={handleTimerStart}
            timerStarted={timerStarted}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === "won" || phase === "lost") && (
          <ResultScreen
            key="result"
            won={phase === "won"}
            crime={crime}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function GamePage() {
  // Use provided API key directly
  const apiKey = "AIzaSyBFu1n2QOhqQuXpY9bFWrzaOsNyg7bDAXE";

  const host = "generativelanguage.googleapis.com";
  const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

  return (
    <LiveAPIProvider url={uri} apiKey={apiKey}>
      <GameApp />
    </LiveAPIProvider>
  );
}
