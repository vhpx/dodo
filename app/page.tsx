'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LiveAPIProvider } from '@/hooks/use-live-api';
import { useCallback, useEffect, useState } from 'react';
import { GameContainer } from './components/game-container';

export default function AccusationGamePage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState<string>('');
  const [checkedStorage, setCheckedStorage] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored =
        typeof window !== 'undefined' ? window.localStorage.getItem('gemini_api_key') : null;
      if (stored) setApiKey(stored);
    } catch {}
    setCheckedStorage(true);
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

  // Loading state while checking for existing key in localStorage
  if (!checkedStorage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground px-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card/60 p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
              aria-hidden
            />
            <span className="text-sm text-muted-foreground">Checking saved key…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground px-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card/60 p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-card-foreground">Enter Gemini API Key</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Provide your Google Gemini API key to start the game. The key is stored locally and
            cannot be viewed later.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Input
              type="password"
              placeholder="AIza..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="bg-background text-foreground placeholder:text-muted-foreground"
              aria-label="Gemini API key"
            />
            <Button onClick={handleSaveKey} disabled={!keyInput.trim()}>
              Save key
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: You can rotate the key anytime by clearing site data in your browser.
          </p>
        </div>
      </div>
    );
  }

  const host = 'generativelanguage.googleapis.com';
  const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

  return (
    <LiveAPIProvider url={uri} apiKey={apiKey}>
      <GameContainer />
    </LiveAPIProvider>
  );
}
