'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Gavel, RefreshCw, Scale, ShieldCheck, ShieldX } from 'lucide-react';

interface VerdictModalProps {
  open: boolean;
  isGuilty: boolean;
  convictionLevel: number;
  verdictText: string;
  onPlayAgain: () => void;
}

export function VerdictModal({
  open,
  isGuilty,
  convictionLevel,
  verdictText,
  onPlayAgain,
}: VerdictModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-zinc-900 border-zinc-800">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative"
        >
          {/* Background gradient */}
          <div
            className={cn(
              'absolute inset-0 opacity-20',
              isGuilty
                ? 'bg-gradient-to-br from-red-500 to-red-900'
                : 'bg-gradient-to-br from-emerald-500 to-emerald-900'
            )}
          />

          <div className="relative p-8 space-y-6">
            {/* Verdict Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="flex justify-center"
            >
              <div
                className={cn(
                  'h-24 w-24 rounded-full flex items-center justify-center',
                  isGuilty
                    ? 'bg-red-500/20 ring-4 ring-red-500/30'
                    : 'bg-emerald-500/20 ring-4 ring-emerald-500/30'
                )}
              >
                {isGuilty ? (
                  <ShieldX className="h-12 w-12 text-red-400" />
                ) : (
                  <ShieldCheck className="h-12 w-12 text-emerald-400" />
                )}
              </div>
            </motion.div>

            {/* Verdict Header */}
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className={cn(
                  'text-5xl font-black tracking-tight',
                  isGuilty ? 'text-red-400' : 'text-emerald-400'
                )}
              >
                {isGuilty ? 'GUILTY' : 'NOT GUILTY'}
              </motion.h1>
              <p className="text-zinc-500 text-sm">The court has reached a verdict</p>
            </div>

            {/* Conviction Meter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Scale className="h-4 w-4" />
                  Conviction Certainty
                </span>
                <span
                  className={cn(
                    'font-bold text-lg',
                    isGuilty ? 'text-red-400' : 'text-emerald-400'
                  )}
                >
                  {convictionLevel}%
                </span>
              </div>

              {/* Custom progress bar */}
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${convictionLevel}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    isGuilty
                      ? 'bg-gradient-to-r from-red-600 to-red-400'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  )}
                />
              </div>
            </motion.div>

            {/* AI Reasoning */}
            {verdictText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gavel className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-400">Judge's Statement</span>
                </div>
                <ScrollArea className="h-[140px] rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
                  <p className="text-zinc-300 text-sm leading-relaxed">{verdictText}</p>
                </ScrollArea>
              </motion.div>
            )}

            {/* Play Again Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={onPlayAgain}
                size="lg"
                className={cn(
                  'w-full h-12 font-semibold text-base',
                  isGuilty
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Another Case
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
