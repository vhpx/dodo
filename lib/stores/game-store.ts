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

  // Timer state (90-second countdown)
  timeRemaining: number;         // Countdown in milliseconds
  timerDrainRate: number;        // 1.0 = normal, 2.0 = silence penalty
  lastActivityTime: number;      // Timestamp of last user speech
  silenceThreshold: number;      // Time before silence penalty (5000ms)
  bonusTimeAwarded: number;      // Total bonus time earned
  timePurchased: number;         // Total time purchased with coins

  // Performance tracking
  performanceScore: number;      // 0-100 score based on recent responses
  lastQualityScore: number;      // Most recent quality score from AI (0-3)
  qualityHistory: number[];      // Recent quality scores for averaging

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

  // Timer actions
  initializeTimer: () => void;
  addBonusTime: (seconds: number) => void;
  purchaseTime: (seconds: number) => void;
  setDrainRate: (rate: number) => void;
  updateActivity: () => void;
  decrementTime: (deltaMs: number) => void;

  // Performance actions
  updatePerformance: (qualityScore: number) => void;
  getPerformanceLevel: () => 'terrible' | 'poor' | 'okay' | 'good' | 'great';
}

const INITIAL_TIME = 90000; // 90 seconds in milliseconds
const SILENCE_THRESHOLD = 5000; // 5 seconds before penalty

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  scenario: null,
  hintsUsed: 0,
  startTime: null,
  conversationHistory: [],
  progressLevel: 0,

  // Timer initial state
  timeRemaining: INITIAL_TIME,
  timerDrainRate: 1.0,
  lastActivityTime: Date.now(),
  silenceThreshold: SILENCE_THRESHOLD,
  bonusTimeAwarded: 0,
  timePurchased: 0,

  // Performance initial state
  performanceScore: 50,
  lastQualityScore: 1,
  qualityHistory: [],

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
      // Initialize timer for new game
      timeRemaining: INITIAL_TIME,
      timerDrainRate: 1.0,
      lastActivityTime: Date.now(),
      bonusTimeAwarded: 0,
      timePurchased: 0,
      // Initialize performance
      performanceScore: 50,
      lastQualityScore: 1,
      qualityHistory: [],
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
      // Reset timer
      timeRemaining: INITIAL_TIME,
      timerDrainRate: 1.0,
      lastActivityTime: Date.now(),
      bonusTimeAwarded: 0,
      timePurchased: 0,
      // Reset performance
      performanceScore: 50,
      lastQualityScore: 1,
      qualityHistory: [],
    }),

  setPhase: (phase) => set({ phase }),

  activateDoubleReward: () => set({ hasDoubleReward: true }),

  activateAiTeammate: () => set({ hasAiTeammate: true }),

  deactivateEffects: () => set({ hasDoubleReward: false, hasAiTeammate: false }),

  // Timer actions
  initializeTimer: () =>
    set({
      timeRemaining: INITIAL_TIME,
      timerDrainRate: 1.0,
      lastActivityTime: Date.now(),
      bonusTimeAwarded: 0,
    }),

  addBonusTime: (seconds: number) =>
    set((state) => ({
      timeRemaining: state.timeRemaining + seconds * 1000,
      bonusTimeAwarded: state.bonusTimeAwarded + seconds,
    })),

  setDrainRate: (rate: number) =>
    set({ timerDrainRate: Math.max(1.0, Math.min(3.0, rate)) }),

  updateActivity: () =>
    set({
      lastActivityTime: Date.now(),
      timerDrainRate: 1.0, // Reset drain rate when user speaks
    }),

  decrementTime: (deltaMs: number) =>
    set((state) => {
      const drain = deltaMs * state.timerDrainRate;
      return {
        timeRemaining: Math.max(0, state.timeRemaining - drain),
      };
    }),

  purchaseTime: (seconds: number) =>
    set((state) => ({
      timeRemaining: state.timeRemaining + seconds * 1000,
      timePurchased: state.timePurchased + seconds,
    })),

  // Performance tracking
  updatePerformance: (qualityScore: number) =>
    set((state) => {
      const newHistory = [...state.qualityHistory.slice(-4), qualityScore]; // Keep last 5 scores
      const avgQuality = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
      // Convert 0-3 quality scale to 0-100 performance with more weight on recent
      const newPerformance = Math.round((avgQuality / 3) * 100);
      return {
        lastQualityScore: qualityScore,
        qualityHistory: newHistory,
        performanceScore: newPerformance,
      };
    }),

  getPerformanceLevel: () => {
    const state = get();
    if (state.performanceScore < 20) return 'terrible';
    if (state.performanceScore < 40) return 'poor';
    if (state.performanceScore < 60) return 'okay';
    if (state.performanceScore < 80) return 'good';
    return 'great';
  },
}));
