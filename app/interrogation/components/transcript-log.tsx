'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../hooks/use-game-state';
import { AlertTriangle, MessageCircle, User } from 'lucide-react';

interface TranscriptLogProps {
  entries: TranscriptEntry[];
  showThoughts?: boolean;
}

export function TranscriptLog({ entries, showThoughts = true }: TranscriptLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-muted/20">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={16} className="text-blue-400" />
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Transcript
        </h3>
        <span className="text-xs text-muted-foreground/50 ml-auto">
          {entries.length} messages
        </span>
      </div>

      <div 
        ref={containerRef}
        className="h-56 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`
                relative rounded-lg p-3
                ${entry.role === 'detective' 
                  ? 'bg-amber-500/5 border border-amber-500/20 ml-0 mr-4' 
                  : 'bg-blue-500/5 border border-blue-500/20 ml-4 mr-0'
                }
              `}
            >
              {/* Role label with icon */}
              <div className="flex items-center gap-2 mb-1.5">
                {entry.role === 'detective' ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-[10px]">🔍</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400">
                      Det. Dodo
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User size={10} className="text-blue-400" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">
                      You
                    </span>
                  </>
                )}
                <span className="text-[10px] text-muted-foreground/40 ml-auto">
                  {new Date(entry.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>

              {/* Message content */}
              <p className={`
                text-sm leading-relaxed
                ${entry.role === 'detective' ? 'text-foreground/90' : 'text-foreground/70'}
              `}>
                {entry.content}
              </p>

              {/* Internal thought (detective only) */}
              {showThoughts && entry.role === 'detective' && entry.internalThought && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 text-xs italic text-muted-foreground/60 pl-2 border-l border-amber-500/30"
                >
                  💭 {entry.internalThought}
                </motion.p>
              )}

              {/* Contradiction alert */}
              {entry.contradictionDetected && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-2 flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/30"
                >
                  <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">
                    <span className="font-semibold">Contradiction:</span>{' '}
                    {entry.contradictionDetected}
                  </p>
                </motion.div>
              )}

              {/* Message number indicator */}
              <div className="absolute -left-2 top-3 w-4 h-4 rounded-full bg-zinc-800 border border-muted/30 flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground">{index + 1}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageCircle size={24} className="text-muted-foreground/20 mb-2" />
            <p className="text-muted-foreground/40 text-sm">
              Conversation will appear here...
            </p>
            <p className="text-muted-foreground/30 text-xs mt-1">
              Start the interrogation to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
