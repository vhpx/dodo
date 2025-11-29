'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Gavel, Mic, Shield, Sparkles, Target, Zap } from 'lucide-react';
import type { Difficulty } from '../../types/game.types';

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
}

const difficulties = [
  {
    value: 'easy' as const,
    title: 'Easy',
    description: 'Lenient prosecutor, weak evidence, 3 pieces',
    icon: Shield,
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    iconColor: 'text-emerald-400',
    buttonBg: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400',
  },
  {
    value: 'medium' as const,
    title: 'Medium',
    description: 'Balanced challenge, solid evidence, 4 pieces',
    icon: Target,
    gradient: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    iconColor: 'text-amber-400',
    buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400',
  },
  {
    value: 'hard' as const,
    title: 'Hard',
    description: 'Skeptical prosecutor, strong evidence, 5 pieces',
    icon: Zap,
    gradient: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30 hover:border-red-500/60',
    iconColor: 'text-red-400',
    buttonBg: 'bg-red-500/20 hover:bg-red-500/30 text-red-400',
  },
];

export function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-4xl space-y-10"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Gavel className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-zinc-100 tracking-tight"
          >
            Dodo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-zinc-400 max-w-xl mx-auto"
          >
            You have <span className="text-red-400 font-semibold">60 seconds</span> to defend
            yourself against an AI prosecutor in a live voice conversation.
          </motion.p>
        </div>

        {/* Difficulty Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {difficulties.map((diff, index) => (
            <motion.div
              key={diff.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <button
                onClick={() => onSelect(diff.value)}
                className={cn(
                  'w-full p-6 rounded-2xl border-2 transition-all duration-300',
                  'bg-gradient-to-br',
                  diff.gradient,
                  diff.border,
                  'hover:scale-[1.02] hover:shadow-xl',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950',
                  diff.value === 'easy' && 'focus:ring-emerald-500',
                  diff.value === 'medium' && 'focus:ring-amber-500',
                  diff.value === 'hard' && 'focus:ring-red-500'
                )}
              >
                <div className="space-y-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center mx-auto',
                      'bg-zinc-900/50 border border-zinc-800'
                    )}
                  >
                    <diff.icon className={cn('h-6 w-6', diff.iconColor)} />
                  </div>

                  {/* Title */}
                  <h3 className={cn('text-xl font-bold', diff.iconColor)}>{diff.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-zinc-400 leading-relaxed">{diff.description}</p>

                  {/* Select Button */}
                  <div
                    className={cn(
                      'mt-4 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors',
                      diff.buttonBg
                    )}
                  >
                    Select {diff.title}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-3 text-zinc-500"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800/50">
            <Mic className="h-4 w-4" />
            <span className="text-sm">Make sure your microphone is ready</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800/50">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Voice interaction powered by AI</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
