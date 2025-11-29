import { create } from 'zustand';
import type { ChatMessage, Crime, Difficulty, Evidence, GamePhase, GameState, MessageRole } from '../types/game.types';
import { generateRandomCrime } from '../utils/crime-generator';
import { generateEvidence } from '../utils/evidence-generator';

let messageIdCounter = 0;

export const useGameState = create<GameState>((set, get) => ({
  // Initial state
  phase: 'setup',
  difficulty: 'medium',
  crime: null,
  evidence: [],
  timeRemaining: 60,
  timerActive: false,
  messages: [],
  accusationText: '',
  defenseText: '',
  verdictText: '',
  isGuilty: false,
  convictionLevel: 50,

  // Actions
  setPhase: (phase: GamePhase) => set({ phase }),

  setDifficulty: (difficulty: Difficulty) => set({ difficulty }),

  setCrime: (crime: Crime) => set({ crime }),

  setEvidence: (evidence: Evidence[]) => set({ evidence }),

  generateScenario: () =>
    set((state) => {
      const crime = generateRandomCrime();
      const evidence = generateEvidence(crime, state.difficulty);
      return { crime, evidence };
    }),

  setTimeRemaining: (time: number) => set({ timeRemaining: time }),

  setTimerActive: (active: boolean) => set({ timerActive: active }),

  startTimer: () => set({ timeRemaining: 60, timerActive: true }),

  decrementTimer: () =>
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
    })),

  addMessage: (role: MessageRole, content: string) => {
    const id = `msg-${++messageIdCounter}`;
    const message: ChatMessage = {
      id,
      role,
      content,
      timestamp: new Date(),
      isStreaming: role === 'prosecutor', // AI messages start as streaming
    };
    set((state) => ({
      messages: [...state.messages, message],
    }));
    return id;
  },

  updateMessage: (id: string, content: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + content } : msg
      ),
    })),

  finalizeMessage: (id: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isStreaming: false } : msg
      ),
    })),

  updateAccusationText: (text: string) =>
    set((state) => ({ accusationText: state.accusationText + text })),

  updateDefenseText: (text: string) =>
    set((state) => ({ defenseText: state.defenseText + text })),

  updateVerdictText: (text: string) =>
    set((state) => ({ verdictText: state.verdictText + text })),

  setVerdict: (guilty: boolean, conviction: number, text: string) =>
    set({ isGuilty: guilty, convictionLevel: conviction, verdictText: text }),

  resetGame: () => {
    messageIdCounter = 0;
    set({
      phase: 'setup',
      crime: null,
      evidence: [],
      timeRemaining: 60,
      timerActive: false,
      messages: [],
      accusationText: '',
      defenseText: '',
      verdictText: '',
      isGuilty: false,
      convictionLevel: 50,
    });
  },
}));
