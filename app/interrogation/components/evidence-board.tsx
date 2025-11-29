'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Phone, Camera, Users, FileText, CreditCard, Mail, Lock, Eye } from 'lucide-react';
import type { Evidence } from '../data/cases';

interface EvidenceBoardProps {
  allEvidence: Evidence[];
  revealedIds: string[];
  contradictedIds?: string[];
}

const iconMap: Record<string, React.ElementType> = {
  fingerprint: Fingerprint,
  phone: Phone,
  camera: Camera,
  witness: Users,
  document: FileText,
  keycard: CreditCard,
  email: Mail,
};

export function EvidenceBoard({ allEvidence, revealedIds, contradictedIds = [] }: EvidenceBoardProps) {
  const revealedCount = revealedIds.length;
  const totalCount = allEvidence.length;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-zinc-900/50 border border-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-amber-400" />
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Evidence Board
          </h3>
        </div>
        <span className="text-xs text-amber-400 font-mono">
          {revealedCount}/{totalCount}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {allEvidence.map((evidence) => {
          const isRevealed = revealedIds.includes(evidence.id);
          const isContradicted = contradictedIds.includes(evidence.id);
          const Icon = iconMap[evidence.icon] || FileText;

          return (
            <motion.div
              key={evidence.id}
              initial={false}
              animate={isRevealed ? { rotateY: 0 } : { rotateY: 180 }}
              transition={{ duration: 0.6, type: 'spring' }}
              style={{ perspective: 1000 }}
              className="relative aspect-square"
            >
              <motion.div
                className={`
                  absolute inset-0 rounded-lg border-2 flex items-center justify-center
                  transition-all duration-300 cursor-default
                  ${isRevealed
                    ? isContradicted
                      ? 'border-red-500/60 bg-red-500/10'
                      : 'border-amber-500/60 bg-amber-500/10'
                    : 'border-muted/30 bg-muted/10'
                  }
                `}
                whileHover={isRevealed ? { scale: 1.08, borderColor: 'rgba(245, 158, 11, 0.8)' } : {}}
                title={isRevealed ? evidence.description : 'Evidence not yet revealed'}
              >
                {isRevealed ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="relative"
                  >
                    <Icon 
                      size={20} 
                      className={isContradicted ? 'text-red-400' : 'text-amber-400'} 
                    />
                    {isContradicted && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                      />
                    )}
                  </motion.div>
                ) : (
                  <Lock size={14} className="text-muted-foreground/30" />
                )}
                
                {/* Glow effect for revealed evidence */}
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`
                      absolute inset-0 rounded-lg blur-sm -z-10
                      ${isContradicted ? 'bg-red-500/30' : 'bg-amber-500/20'}
                    `}
                  />
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Recently revealed evidence description */}
      <AnimatePresence mode="wait">
        {revealedIds.length > 0 && (
          <motion.div
            key={revealedIds[revealedIds.length - 1]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
          >
            <p className="text-xs text-amber-200/80 leading-relaxed">
              <span className="text-amber-400 font-semibold">Evidence:</span>{' '}
              {allEvidence.find(e => e.id === revealedIds[revealedIds.length - 1])?.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {revealedIds.length === 0 && (
        <p className="text-xs text-muted-foreground/50 text-center py-2">
          Evidence will be revealed during interrogation
        </p>
      )}
    </div>
  );
}
