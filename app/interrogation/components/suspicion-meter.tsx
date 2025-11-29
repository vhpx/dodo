'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { getMeterColor, getSuspicionLabel } from '../utils/verdict-calculator';
import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react';

interface SuspicionMeterProps {
  score: number;
  showChange?: boolean;
  lastDelta?: number;
}

export function SuspicionMeter({ score, showChange = false, lastDelta = 0 }: SuspicionMeterProps) {
  const springScore = useSpring(score, { stiffness: 100, damping: 20 });
  const displayScore = useTransform(springScore, (v) => Math.round(v));
  const { label, color } = getSuspicionLabel(score);
  const meterColor = getMeterColor(score);

  useEffect(() => {
    springScore.set(score);
  }, [score, springScore]);

  // Icon based on suspicion level
  const SuspicionIcon = score > 60 ? ShieldAlert : score > 30 ? AlertTriangle : Shield;
  const iconColor = score > 60 ? 'text-red-400' : score > 30 ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="space-y-3 p-4 rounded-xl bg-zinc-900/50 border border-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SuspicionIcon size={16} className={iconColor} />
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Suspicion Level
          </h3>
        </div>
        <motion.span 
          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${color} bg-current/10`}
          key={label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {label}
        </motion.span>
      </div>
      
      <div className="relative">
        {/* Background track with gradient */}
        <div className="h-4 rounded-full bg-linear-to-r from-emerald-500/10 via-yellow-500/10 to-red-500/10 overflow-hidden border border-muted/20">
          {/* Threshold markers */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/50 z-10" 
            style={{ left: '30%' }} 
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-10" 
            style={{ left: '60%' }} 
          />
          
          {/* Fill bar */}
          <motion.div
            className={`h-full rounded-full ${meterColor} relative overflow-hidden`}
            initial={{ width: '25%' }}
            animate={{ width: `${score}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          </motion.div>
        </div>

        {/* Score display */}
        <div className="flex items-center justify-between mt-2">
          <motion.span className="text-2xl font-bold tabular-nums">
            {displayScore}
          </motion.span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>

        {/* Delta indicator */}
        {showChange && lastDelta !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              absolute -top-8 right-0 text-sm font-bold px-2 py-1 rounded-lg
              ${lastDelta > 0 
                ? 'text-red-400 bg-red-500/20 border border-red-500/30' 
                : 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
              }
            `}
          >
            {lastDelta > 0 ? '↑' : '↓'} {lastDelta > 0 ? '+' : ''}{lastDelta}
          </motion.div>
        )}
      </div>

      {/* Threshold labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground/60 px-1">
        <span className="text-emerald-400/60">SAFE</span>
        <span className="text-yellow-400/60">SUSPICIOUS</span>
        <span className="text-red-400/60">DANGER</span>
      </div>
    </div>
  );
}
