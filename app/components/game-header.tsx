'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Gavel, Shield, Users } from 'lucide-react';
import type { Crime, Difficulty, GamePhase } from '../../types/game.types';

interface GameHeaderProps {
  difficulty: Difficulty;
  phase: GamePhase;
  crime?: Crime | null;
}

export function GameHeader({ difficulty, phase, crime }: GameHeaderProps) {
  const difficultyConfig = {
    easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    hard: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  };

  const config = difficultyConfig[difficulty];

  return (
    <div className="h-14 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800/50 flex items-center px-4">
      {/* Left - Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700">
          <Gavel className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-100 leading-tight">
            Dodo
          </span>
          {crime && (
            <span className="text-[10px] text-zinc-500 leading-tight truncate max-w-[200px]">
              {crime.title}
            </span>
          )}
        </div>
      </div>

      {/* Center - Meeting Info */}
      <div className="flex-1 flex items-center justify-center gap-6">
        {/* Participants */}
        <div className="flex items-center gap-2 text-zinc-500">
          <Users className="h-4 w-4" />
          <span className="text-xs">2 participants</span>
        </div>

        {/* Difficulty */}
        <Badge
          variant="outline"
          className={cn(
            'text-xs font-medium px-2.5 py-0.5',
            config.color,
            config.bg,
            config.border
          )}
        >
          <Shield className="h-3 w-3 mr-1" />
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
      </div>

      {/* Right - Phase indicator */}
      <div className="flex items-center gap-2">
        {phase === 'defense' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium">In Session</span>
          </div>
        )}
        {phase === 'verdict' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-400">
            <Gavel className="h-3 w-3" />
            <span className="text-xs font-medium">Deliberating</span>
          </div>
        )}
      </div>
    </div>
  );
}
