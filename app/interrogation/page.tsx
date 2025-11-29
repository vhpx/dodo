'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useState, useEffect } from 'react';
import { LiveAPIProvider } from '@/hooks/use-live-api';
import { useGameState } from './hooks/use-game-state';
import { IntroScreen } from './components/intro-screen';
import { InterrogationRoom } from './components/interrogation-room';
import { VerdictScreen } from './components/verdict-screen';
import { CaseFile } from './components/case-file';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CaseScenario } from './data/cases';

function InterrogationGame({ onClearApiKey }: { onClearApiKey: () => void }) {
  const gameActions = useGameState();
  const { state, selectCase, showCaseFile, resetGame } = gameActions;

  const handleSelectCase = useCallback((caseData: CaseScenario) => {
    selectCase(caseData);
  }, [selectCase]);

  // Render based on game phase
  switch (state.phase) {
    case 'intro':
      return <IntroScreen onSelectCase={handleSelectCase} />;
    
    case 'interrogation':
      return <InterrogationRoom gameActions={gameActions} onClearApiKey={onClearApiKey} />;
    
    case 'verdict':
      return (
        <VerdictScreen 
          state={state} 
          onViewCaseFile={showCaseFile}
          onPlayAgain={resetGame}
        />
      );
    
    case 'casefile':
      return <CaseFile state={state} onPlayAgain={resetGame} />;
    
    default:
      return <IntroScreen onSelectCase={handleSelectCase} />;
  }
}

export default function InterrogationPage() {
  // Start with undefined to distinguish "not yet checked" from "checked and empty"
  const [apiKey, setApiKey] = useState<string | null | undefined>(undefined);
  const [keyInput, setKeyInput] = useState('');

  // Check localStorage on mount only - using flushSync workaround for lint
  useEffect(() => {
    const checkStorage = () => {
      try {
        return window.localStorage.getItem('gemini_api_key');
      } catch {
        return null;
      }
    };
    // Delay to next tick to avoid lint warning about sync setState in effect
    const stored = checkStorage();
    const timer = setTimeout(() => setApiKey(stored), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveKey = useCallback(() => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    try {
      window.localStorage.setItem('gemini_api_key', trimmed);
      setApiKey(trimmed);
      setKeyInput('');
    } catch {}
  }, [keyInput]);

  const handleClearKey = useCallback(() => {
    try {
      window.localStorage.removeItem('gemini_api_key');
      setApiKey(null);
    } catch {}
  }, []);

  // Loading state - haven't checked storage yet
  if (apiKey === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-foreground">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // API key entry
  if (!apiKey) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-black via-zinc-950 to-black text-foreground px-6">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        
        <div className="relative z-10 w-full max-w-md rounded-xl border border-amber-500/20 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-amber-500/10">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-amber-400"
                fill="currentColor"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Dodo Interrogation
              </h1>
              <p className="text-xs text-muted-foreground">
                Voice-powered crime drama
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Enter your Google Gemini API key to begin the interrogation. 
            Your key is stored locally and never sent to our servers.
          </p>

          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="AIza..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="bg-background/50 border-muted/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveKey();
              }}
            />
            <Button 
              onClick={handleSaveKey} 
              disabled={!keyInput.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-black"
            >
              Enter
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground/60">
            Get your API key at{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-400/80 hover:text-amber-400 underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>
      </div>
    );
  }

  const host = 'generativelanguage.googleapis.com';
  const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

  // Use apiKey as key to force full remount when API key changes
  return (
    <LiveAPIProvider key={apiKey} url={uri} apiKey={apiKey}>
      <InterrogationGame onClearApiKey={handleClearKey} />
    </LiveAPIProvider>
  );
}
