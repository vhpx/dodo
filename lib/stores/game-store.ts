import { create } from 'zustand';
import type { GamePhase, Message, Scenario } from '@/lib/types/game';

interface GameState {
  // Current game state
  phase: GamePhase;
  scenario: Scenario | null;
  hintsUsed: number;
  startTime: number | null;
  conversationHistory: Message[];
  progressLevel: number;

  // Active effects
  hasDoubleReward: boolean;
  hasAiTeammate: boolean;

  // Actions
  startNewScenario: (scenario: Scenario) => void;
  setScenarioImage: (imageUrl: string) => void;
  useHint: () => number | null;
  recordMessage: (role: 'user' | 'assistant', content: string) => void;
  setProgressLevel: (level: number) => void;
  setVictory: () => void;
  setDefeat: () => void;
  reset: () => void;
  setPhase: (phase: GamePhase) => void;
  activateDoubleReward: () => void;
  activateAiTeammate: () => void;
  deactivateEffects: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  scenario: null,
  hintsUsed: 0,
  startTime: null,
  conversationHistory: [],
  progressLevel: 0,
  hasDoubleReward: false,
  hasAiTeammate: false,

  startNewScenario: (scenario) =>
    set({
      phase: 'playing',
      scenario,
      hintsUsed: 0,
      startTime: Date.now(),
      conversationHistory: [],
      progressLevel: 0,
    }),

  setScenarioImage: (imageUrl) =>
    set((state) => ({
      scenario: state.scenario ? { ...state.scenario, imageUrl } : null,
    })),

  useHint: () => {
    const state = get();
    const maxHints = state.scenario?.hints.length || 0;
    if (state.hintsUsed < maxHints) {
      set({ hintsUsed: state.hintsUsed + 1 });
      return state.hintsUsed; // Return the index of the hint to show
    }
    return null;
  },

  recordMessage: (role, content) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, { role, content }],
    })),

  setProgressLevel: (level) => set({ progressLevel: Math.min(100, Math.max(0, level)) }),

  setVictory: () => set({ phase: 'victory' }),

  setDefeat: () => set({ phase: 'defeat' }),

  reset: () =>
    set({
      phase: 'idle',
      scenario: null,
      hintsUsed: 0,
      startTime: null,
      conversationHistory: [],
      progressLevel: 0,
      hasDoubleReward: false,
      hasAiTeammate: false,
    }),

  setPhase: (phase) => set({ phase }),

  activateDoubleReward: () => set({ hasDoubleReward: true }),

  activateAiTeammate: () => set({ hasAiTeammate: true }),

  deactivateEffects: () => set({ hasDoubleReward: false, hasAiTeammate: false }),
}));
