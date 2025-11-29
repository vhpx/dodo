'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface TimerDisplayProps {
  timeRemaining: number;
  totalTime?: number;
}

export function TimerDisplay({ timeRemaining, totalTime = 60 }: TimerDisplayProps) {
  const progress = (timeRemaining / totalTime) * 100;
  const isUrgent = timeRemaining <= 10;
  const circumference = 2 * Math.PI * 45; // radius is 45%
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const gpuStyle = useMemo(
    () => ({
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden' as const,
    }),
    []
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative h-32 w-32"
        style={gpuStyle}
        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <svg className="h-full w-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(
              'transition-colors duration-500',
              timeRemaining > 30 && 'text-green-500',
              timeRemaining <= 30 && timeRemaining > 10 && 'text-yellow-500',
              timeRemaining <= 10 && 'text-red-500'
            )}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear',
            }}
          />
        </svg>

        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'text-4xl font-bold tabular-nums',
              isUrgent && 'text-red-500 animate-pulse'
            )}
          >
            {timeRemaining}
          </span>
        </div>
      </motion.div>

      <p className="text-sm text-muted-foreground">
        {timeRemaining > 0 ? 'Time Remaining' : 'Time\'s Up!'}
      </p>
    </div>
  );
}
