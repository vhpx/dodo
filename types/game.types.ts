export type GamePhase = 'setup' | 'accusation' | 'defense' | 'verdict';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type EvidenceType = 'witness' | 'document' | 'physical' | 'digital';

export type MessageRole = 'prosecutor' | 'defendant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface Crime {
  type: string;
  title: string;
  description: string;
  location: string;
  time: string;
}

export interface GameState {
  // Game flow
  phase: GamePhase;
  difficulty: Difficulty;

  // Current scenario
  crime: Crime | null;
  evidence: Evidence[];

  // Timer
  timeRemaining: number;
  timerActive: boolean;

  // Conversation messages
  messages: ChatMessage[];

  // Transcripts (legacy - keeping for verdict)
  accusationText: string;
  defenseText: string;
  verdictText: string;

  // AI judgment
  isGuilty: boolean;
  convictionLevel: number; // 0-100

  // Actions
  setPhase: (phase: GamePhase) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setCrime: (crime: Crime) => void;
  setEvidence: (evidence: Evidence[]) => void;
  generateScenario: () => void;
  setTimeRemaining: (time: number) => void;
  setTimerActive: (active: boolean) => void;
  startTimer: () => void;
  decrementTimer: () => void;
  addMessage: (role: MessageRole, content: string) => string;
  updateMessage: (id: string, content: string) => void;
  finalizeMessage: (id: string) => void;
  updateAccusationText: (text: string) => void;
  updateDefenseText: (text: string) => void;
  updateVerdictText: (text: string) => void;
  setVerdict: (guilty: boolean, conviction: number, text: string) => void;
  resetGame: () => void;
}

export interface DifficultyConfig {
  convictionBias: number;
  evidenceCount: number;
  interruptionRate: number;
  voiceName: string;
}
