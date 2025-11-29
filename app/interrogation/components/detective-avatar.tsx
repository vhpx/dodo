'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { DetectiveExpression } from '../hooks/use-game-state';

interface DetectiveAvatarProps {
  expression: DetectiveExpression;
  isSpeaking: boolean;
  suspicionLevel: number;
  volume?: number;
}

export function DetectiveAvatar({ expression, isSpeaking, suspicionLevel, volume = 0 }: DetectiveAvatarProps) {
  // Expression-based styling with more dramatic differences
  const expressionStyles = {
    neutral: {
      eyebrowY: 0,
      eyebrowAngle: 0,
      mouthCurve: 0,
      lean: 0,
      glowColor: 'rgba(148, 163, 184, 0.3)',
      eyeScale: 1,
    },
    skeptical: {
      eyebrowY: -4,
      eyebrowAngle: 8,
      mouthCurve: -3,
      lean: 6,
      glowColor: 'rgba(234, 179, 8, 0.5)',
      eyeScale: 0.9,
    },
    angry: {
      eyebrowY: -8,
      eyebrowAngle: 15,
      mouthCurve: -5,
      lean: 10,
      glowColor: 'rgba(239, 68, 68, 0.6)',
      eyeScale: 1.1,
    },
    satisfied: {
      eyebrowY: 3,
      eyebrowAngle: -5,
      mouthCurve: 4,
      lean: -4,
      glowColor: 'rgba(34, 197, 94, 0.5)',
      eyeScale: 0.95,
    },
  };

  const style = expressionStyles[expression];
  const volumeScale = 1 + (volume * 0.3);

  return (
    <div className="relative flex items-center justify-center">
      {/* Suspicion-based outer ring */}
      <motion.div
        className="absolute w-56 h-56 rounded-full border-2 opacity-30"
        style={{
          borderColor: suspicionLevel > 60 ? '#ef4444' : suspicionLevel > 30 ? '#eab308' : '#22c55e',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Ambient glow based on expression */}
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl -z-10"
        animate={{
          backgroundColor: style.glowColor,
          scale: isSpeaking ? [1, 1.1 * volumeScale, 1] : 1,
        }}
        transition={{
          backgroundColor: { duration: 0.5 },
          scale: { duration: 0.15, repeat: isSpeaking ? Infinity : 0 },
        }}
      />

      {/* Volume rings when speaking */}
      <AnimatePresence>
        {isSpeaking && volume > 0.1 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute w-40 h-40 rounded-full border-2 border-amber-400/50"
          />
        )}
      </AnimatePresence>

      {/* Detective silhouette container */}
      <motion.div
        className="relative w-44 h-44"
        animate={{
          rotate: style.lean,
          y: isSpeaking ? [0, -3 * volumeScale, 0] : 0,
          scale: isSpeaking ? [1, 1.02, 1] : 1,
        }}
        transition={{
          rotate: { type: 'spring', stiffness: 100, damping: 15 },
          y: { duration: 0.12, repeat: isSpeaking ? Infinity : 0 },
          scale: { duration: 0.12, repeat: isSpeaking ? Infinity : 0 },
        }}
      >
        {/* Detective SVG silhouette */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
        >
          {/* Hat */}
          <motion.path
            d="M20 40 L50 25 L80 40 L75 45 L25 45 Z"
            fill="currentColor"
            className="text-foreground/90"
          />
          <motion.path
            d="M15 45 L85 45 L85 48 L15 48 Z"
            fill="currentColor"
            className="text-foreground/80"
          />
          
          {/* Head */}
          <motion.ellipse
            cx="50"
            cy="60"
            rx="20"
            ry="22"
            fill="currentColor"
            className="text-foreground/90"
          />
          
          {/* Left eyebrow */}
          <motion.path
            d="M38 52 L46 52"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-background"
            animate={{ 
              y: style.eyebrowY,
              rotate: -style.eyebrowAngle,
            }}
            style={{ transformOrigin: '42px 52px' }}
          />
          
          {/* Right eyebrow */}
          <motion.path
            d="M54 52 L62 52"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-background"
            animate={{ 
              y: style.eyebrowY,
              rotate: style.eyebrowAngle,
            }}
            style={{ transformOrigin: '58px 52px' }}
          />
          
          {/* Left eye */}
          <motion.circle
            cx="42"
            cy="58"
            r="3.5"
            fill="currentColor"
            className="text-background"
            animate={{ scale: style.eyeScale }}
          />
          
          {/* Right eye */}
          <motion.circle
            cx="58"
            cy="58"
            r="3.5"
            fill="currentColor"
            className="text-background"
            animate={{ scale: style.eyeScale }}
          />

          {/* Eye glints */}
          <motion.circle cx="43" cy="57" r="1" fill="currentColor" className="text-foreground/30" />
          <motion.circle cx="59" cy="57" r="1" fill="currentColor" className="text-foreground/30" />
          
          {/* Nose */}
          <motion.path
            d="M50 60 L48 68 L52 68 Z"
            fill="currentColor"
            className="text-background/50"
          />
          
          {/* Mouth */}
          <motion.path
            d={`M42 74 Q50 ${74 + style.mouthCurve} 58 74`}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="text-background"
            animate={{
              y: isSpeaking ? [0, 2, 0] : 0,
              scaleY: isSpeaking ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.15,
              repeat: isSpeaking ? Infinity : 0,
            }}
          />
          
          {/* Collar / shoulders hint */}
          <motion.path
            d="M30 82 L50 88 L70 82 L75 100 L25 100 Z"
            fill="currentColor"
            className="text-foreground/80"
          />
          
          {/* Tie */}
          <motion.path
            d="M48 88 L50 100 L52 88 Z"
            fill="currentColor"
            className="text-red-900"
          />
        </svg>

        {/* Speaking indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Expression label with mood indicator */}
      <motion.div
        className="absolute -bottom-10 flex flex-col items-center gap-1"
        key={expression}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
          {expression === 'neutral' ? 'observing' : expression}
        </span>
        {isSpeaking && (
          <motion.div
            className="flex gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-1 bg-amber-400 rounded-full"
                animate={{
                  height: [4, 12 + (volume * 20), 4],
                }}
                transition={{
                  duration: 0.15,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
