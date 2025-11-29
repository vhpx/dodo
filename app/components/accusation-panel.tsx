'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import type { Crime } from '../../types/game.types';

interface AccusationPanelProps {
  crime: Crime | null;
  accusationText: string;
}

export function AccusationPanel({ crime, accusationText }: AccusationPanelProps) {
  if (!crime) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Alert className="border-red-500/50 bg-red-950/20">
        <Gavel className="h-5 w-5 text-red-500" />
        <AlertTitle className="text-red-500 text-lg font-bold">
          Accusation: {crime.title}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p className="text-sm text-muted-foreground">{crime.description}</p>
          {accusationText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-foreground mt-2 pt-2 border-t border-border"
            >
              {accusationText}
            </motion.p>
          )}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
