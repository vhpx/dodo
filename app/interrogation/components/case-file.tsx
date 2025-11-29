'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { GameState } from '../hooks/use-game-state';
import { calculateVerdict } from '../utils/verdict-calculator';
import { Share2, RotateCcw } from 'lucide-react';
import { useRef, useCallback, useId } from 'react';

interface CaseFileProps {
  state: GameState;
  onPlayAgain: () => void;
}

// Generate a case number from a stable ID
function generateCaseNumber(id: string): string {
  // Use the React ID to create a deterministic but unique-looking case number
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `DD-${hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}

export function CaseFile({ state, onPlayAgain }: CaseFileProps) {
  const caseFileRef = useRef<HTMLDivElement>(null);
  const verdictResult = calculateVerdict(state.suspicionScore);

  // Use React's useId for a stable, unique identifier
  const componentId = useId();
  const caseNumber = generateCaseNumber(componentId);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Key transcript excerpts
  const keyExchanges = state.transcript
    .filter(t => t.role === 'detective' || t.contradictionDetected)
    .slice(-4);

  const handleShare = useCallback(async () => {
    const text = `🔍 DODO INTERROGATION - Case #${caseNumber}\n\nCase: ${state.currentCase?.title}\nVerdict: ${verdictResult.title}\nSuspicion: ${state.suspicionScore}/100\n\nCan you survive the interrogation?`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Dodo Interrogation', text });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Case summary copied to clipboard!');
    }
  }, [caseNumber, state.currentCase?.title, state.suspicionScore, verdictResult.title]);

  return (
    <div className="relative min-h-screen flex flex-col items-center py-8 px-4 overflow-auto">
      {/* Background */}
      <div className="fixed inset-0 bg-linear-to-br from-amber-950/20 via-zinc-950 to-black -z-10" />

      {/* Case file document */}
      <motion.div
        ref={caseFileRef}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Paper texture container */}
        <div 
          className="relative bg-amber-50 text-zinc-900 rounded-sm shadow-2xl overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        >
          {/* Coffee stain decoration */}
          <div className="absolute top-20 right-10 w-32 h-32 rounded-full border-4 border-amber-800/10 opacity-50" />
          
          {/* Header */}
          <div className="border-b-2 border-zinc-300 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 
                  className="text-2xl font-black tracking-wider text-zinc-800"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  CRIMINAL INVESTIGATION DIVISION
                </h1>
                <p className="text-sm text-zinc-500 font-mono mt-1">
                  OFFICIAL CASE REPORT
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">CASE NUMBER</p>
                <p className="font-mono font-bold text-lg">{caseNumber}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Case info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 uppercase text-xs tracking-wider">Date</p>
                <p className="font-mono">{dateStr}</p>
              </div>
              <div>
                <p className="text-zinc-500 uppercase text-xs tracking-wider">Investigating Officer</p>
                <p className="font-mono">Det. Dodo</p>
              </div>
              <div className="col-span-2">
                <p className="text-zinc-500 uppercase text-xs tracking-wider">Case Title</p>
                <p className="font-semibold text-lg">{state.currentCase?.title}</p>
              </div>
              <div className="col-span-2">
                <p className="text-zinc-500 uppercase text-xs tracking-wider">Location</p>
                <p className="font-mono">{state.currentCase?.setting}</p>
              </div>
            </div>

            {/* Accusation */}
            <div className="bg-zinc-100 p-4 rounded border border-zinc-200">
              <p className="text-zinc-500 uppercase text-xs tracking-wider mb-2">Initial Accusation</p>
              <p className="text-sm leading-relaxed">{state.currentCase?.accusation}</p>
            </div>

            {/* Evidence summary */}
            <div>
              <p className="text-zinc-500 uppercase text-xs tracking-wider mb-2">Evidence Presented ({state.revealedEvidence.length} items)</p>
              <ul className="space-y-2">
                {state.currentCase?.evidence
                  .filter(e => state.revealedEvidence.includes(e.id))
                  .map(evidence => (
                    <li key={evidence.id} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600">•</span>
                      <span>{evidence.description}</span>
                    </li>
                  ))}
                {state.revealedEvidence.length === 0 && (
                  <li className="text-zinc-400 text-sm italic">No evidence presented during interrogation</li>
                )}
              </ul>
            </div>

            {/* Key transcript */}
            <div>
              <p className="text-zinc-500 uppercase text-xs tracking-wider mb-2">Interrogation Excerpt</p>
              <div className="bg-zinc-100 p-4 rounded border border-zinc-200 font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
                {keyExchanges.map((entry) => (
                  <p key={entry.id} className={entry.role === 'detective' ? 'text-zinc-700' : 'text-zinc-500'}>
                    <span className="font-bold">{entry.role === 'detective' ? 'DET:' : 'SUS:'}</span>{' '}
                    {entry.content.length > 150 ? entry.content.slice(0, 150) + '...' : entry.content}
                  </p>
                ))}
              </div>
            </div>

            {/* Suspicion analysis */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-zinc-100 p-3 rounded">
                <p className="text-2xl font-bold">{state.suspicionScore}</p>
                <p className="text-xs text-zinc-500">SUSPICION LEVEL</p>
              </div>
              <div className="bg-zinc-100 p-3 rounded">
                <p className="text-2xl font-bold">{state.exchangeCount}</p>
                <p className="text-xs text-zinc-500">EXCHANGES</p>
              </div>
              <div className="bg-zinc-100 p-3 rounded">
                <p className="text-2xl font-bold">{state.playerClaims.length}</p>
                <p className="text-xs text-zinc-500">CLAIMS MADE</p>
              </div>
            </div>
          </div>

          {/* Verdict stamp */}
          <div className="relative border-t-2 border-zinc-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 uppercase text-xs tracking-wider mb-1">Final Determination</p>
                <p className="text-sm">{verdictResult.description}</p>
              </div>
              
              {/* Stamp */}
              <motion.div
                initial={{ scale: 2, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: -8 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className={`
                  px-6 py-3 border-4 rounded font-black text-2xl tracking-wider
                  ${verdictResult.verdict === 'released' 
                    ? 'border-emerald-600 text-emerald-600' 
                    : verdictResult.verdict === 'detained'
                    ? 'border-yellow-600 text-yellow-600'
                    : 'border-red-600 text-red-600'
                  }
                `}
                style={{ 
                  fontFamily: 'Georgia, serif',
                  transform: 'rotate(-8deg)',
                }}
              >
                {verdictResult.title}
              </motion.div>
            </div>

            {/* Signature line */}
            <div className="mt-8 pt-4 border-t border-zinc-200">
              <div className="flex items-end justify-between">
                <div>
                  <div className="w-48 border-b border-zinc-400 mb-1">
                    <span className="font-script text-2xl text-zinc-600 italic">Det. Dodo</span>
                  </div>
                  <p className="text-xs text-zinc-500">Investigating Officer</p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  <p>Document ID: {caseNumber}</p>
                  <p>Generated: {new Date().toISOString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap gap-3 mt-6 justify-center"
      >
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 size={16} />
          Share
        </Button>
        <Button onClick={onPlayAgain} className="gap-2">
          <RotateCcw size={16} />
          New Interrogation
        </Button>
      </motion.div>
    </div>
  );
}
