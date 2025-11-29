'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { GameState } from '../hooks/use-game-state';
import { calculateVerdict } from '../utils/verdict-calculator';
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface VerdictScreenProps {
  state: GameState;
  onViewCaseFile: () => void;
  onPlayAgain: () => void;
}

export function VerdictScreen({ state, onViewCaseFile, onPlayAgain }: VerdictScreenProps) {
  const verdictResult = calculateVerdict(state.suspicionScore);

  const verdictIcons = {
    released: <CheckCircle className="w-16 h-16 text-emerald-400" />,
    detained: <AlertTriangle className="w-16 h-16 text-yellow-400" />,
    arrested: <XCircle className="w-16 h-16 text-red-500" />,
  };

  const verdictColors = {
    released: 'from-emerald-500/20 via-transparent to-transparent',
    detained: 'from-yellow-500/20 via-transparent to-transparent',
    arrested: 'from-red-500/20 via-transparent to-transparent',
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-zinc-950 to-black" />
      
      {/* Verdict glow */}
      <motion.div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-linear-to-b ${verdictColors[verdictResult.verdict]}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
      >
        {/* Stamp animation */}
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 20,
            delay: 0.3 
          }}
          className="mb-8"
        >
          {verdictIcons[verdictResult.verdict]}
        </motion.div>

        {/* Verdict text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`
            text-4xl md:text-5xl font-black tracking-wider mb-4
            ${verdictResult.color}
          `}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {verdictResult.title}
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground mb-6 max-w-sm"
        >
          {verdictResult.description}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex gap-6 mb-8"
        >
          <div className="text-center">
            <div className="text-2xl font-bold">{state.suspicionScore}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Suspicion
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{state.exchangeCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Exchanges
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{state.revealedEvidence.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Evidence
            </div>
          </div>
        </motion.div>

        {/* Case info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-sm text-muted-foreground/60 mb-8"
        >
          Case: {state.currentCase?.title}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            size="lg"
            onClick={onViewCaseFile}
            className="gap-2"
          >
            <FileText size={18} />
            View Case File
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onPlayAgain}
          >
            Play Again
          </Button>
        </motion.div>
      </motion.div>

      {/* Flicker effect */}
      <motion.div
        className="absolute inset-0 bg-white/2 pointer-events-none"
        animate={{ opacity: [0, 0.03, 0, 0.02, 0] }}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 5 }}
      />
    </div>
  );
}
