'use client';

import { useCallback, useState } from 'react';
import type { CaseScenario, Evidence } from '../data/cases';

export interface PlayerClaim {
  timestamp: number;
  question: string;
  response: string;
  extractedFacts: string[];
  confidenceIndicators: {
    pauseDuration: number;
    speechRate: number;
    fillerWords: number;
  };
}

export interface TranscriptEntry {
  id: string;
  role: 'detective' | 'suspect';
  content: string;
  timestamp: number;
  internalThought?: string;
  contradictionDetected?: string;
}

export type GamePhase = 'intro' | 'interrogation' | 'verdict' | 'casefile';
export type DetectiveExpression = 'neutral' | 'skeptical' | 'angry' | 'satisfied';

export interface GameState {
  phase: GamePhase;
  currentCase: CaseScenario | null;
  suspicionScore: number;
  playerClaims: PlayerClaim[];
  revealedEvidence: string[];
  transcript: TranscriptEntry[];
  exchangeCount: number;
  detectiveExpression: DetectiveExpression;
  verdict: 'released' | 'detained' | 'arrested' | null;
  lastContradiction: string | null;
  isProcessing: boolean;
}

const initialState: GameState = {
  phase: 'intro',
  currentCase: null,
  suspicionScore: 25, // Start slightly suspicious
  playerClaims: [],
  revealedEvidence: [],
  transcript: [],
  exchangeCount: 0,
  detectiveExpression: 'neutral',
  verdict: null,
  lastContradiction: null,
  isProcessing: false,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const selectCase = useCallback((caseData: CaseScenario) => {
    setState(() => ({
      ...initialState,
      phase: 'interrogation',
      currentCase: caseData,
      transcript: [{
        id: 'opening',
        role: 'detective',
        content: caseData.openingStatement,
        timestamp: Date.now(),
      }],
    }));
  }, []);

  const addPlayerClaim = useCallback((claim: PlayerClaim) => {
    setState(prev => ({
      ...prev,
      playerClaims: [...prev.playerClaims, claim],
    }));
  }, []);

  const addTranscriptEntry = useCallback((entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      transcript: [
        ...prev.transcript,
        {
          ...entry,
          id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  const updateSuspicion = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      suspicionScore: Math.max(0, Math.min(100, prev.suspicionScore + delta)),
    }));
  }, []);

  const revealEvidence = useCallback((evidenceId: string) => {
    setState(prev => {
      if (prev.revealedEvidence.includes(evidenceId)) return prev;
      return {
        ...prev,
        revealedEvidence: [...prev.revealedEvidence, evidenceId],
      };
    });
  }, []);

  const setDetectiveExpression = useCallback((expression: DetectiveExpression) => {
    setState(prev => ({
      ...prev,
      detectiveExpression: expression,
    }));
  }, []);

  const incrementExchange = useCallback(() => {
    setState(prev => ({
      ...prev,
      exchangeCount: prev.exchangeCount + 1,
    }));
  }, []);

  const setContradiction = useCallback((contradiction: string | null) => {
    setState(prev => ({
      ...prev,
      lastContradiction: contradiction,
    }));
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({
      ...prev,
      isProcessing,
    }));
  }, []);

  const endGame = useCallback((verdict: 'released' | 'detained' | 'arrested') => {
    setState(prev => ({
      ...prev,
      phase: 'verdict',
      verdict,
    }));
  }, []);

  const showCaseFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'casefile',
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  const getUnrevealedEvidence = useCallback((): Evidence[] => {
    if (!state.currentCase) return [];
    return state.currentCase.evidence.filter(
      e => !state.revealedEvidence.includes(e.id)
    );
  }, [state.currentCase, state.revealedEvidence]);

  const getEvidenceById = useCallback((id: string): Evidence | undefined => {
    return state.currentCase?.evidence.find(e => e.id === id);
  }, [state.currentCase]);

  return {
    state,
    selectCase,
    addPlayerClaim,
    addTranscriptEntry,
    updateSuspicion,
    revealEvidence,
    setDetectiveExpression,
    incrementExchange,
    setContradiction,
    setProcessing,
    endGame,
    showCaseFile,
    resetGame,
    getUnrevealedEvidence,
    getEvidenceById,
  };
}

export type GameStateActions = ReturnType<typeof useGameState>;
