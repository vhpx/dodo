export type GamePhase = 'idle' | 'loading' | 'playing' | 'victory' | 'defeat';

export type ScenarioTheme = 'survival' | 'mystery' | 'puzzle' | 'social';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  theme: ScenarioTheme;
  difficulty: 1 | 2 | 3 | 4 | 5;
  hints: string[];
  winConditions: string[];
  imagePrompt: string;
  imageUrl: string | null;
  challengeType: string;
  // Extended scenario info
  setting?: string;
  antagonist?: string;
  keyItems?: string[];
  atmosphere?: string;
  openingNarration?: string;
}

// Achievement system
export type AchievementId =
  | 'first_escape'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'speed_demon'
  | 'no_hints'
  | 'campaign_complete'
  | 'all_themes'
  | 'social_master'
  | 'survival_expert'
  | 'puzzle_solver'
  | 'mystery_detective'
  | 'rich_player'
  | 'item_collector';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  reward: number;
  unlockedAt?: number;
}

// Player stats
export interface PlayerStats {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  fastestWin: number | null; // in seconds
  longestStreak: number;
  totalPlayTime: number; // in seconds
  themeWins: Record<ScenarioTheme, number>;
  hintsUsed: number;
  itemsUsed: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type ItemId =
  | 'hint_pack'
  | 'skip_token'
  | 'ai_teammate'
  | 'time_freeze'
  | 'double_reward'
  | 'theme_choice';

export interface ShopItem {
  id: ItemId;
  name: string;
  description: string;
  price: number;
  icon: string;
  quantity: number;
}

export interface EscapeAttemptEvaluation {
  playerAction: string;
  matchesWinCondition: boolean;
  conditionMatched?: string;
  narrativeResponse: string;
  progressLevel: number;
}

// Campaign types
export type CampaignId =
  | 'haunted_mansion'
  | 'space_odyssey'
  | 'time_traveler'
  | 'undercover_agent'
  | 'ancient_temple';

export interface CampaignChapter {
  id: string;
  title: string;
  theme: ScenarioTheme;
  difficulty: 1 | 2 | 3 | 4 | 5;
  setting: string;
  objective: string;
  storyContext: string;
}

export interface Campaign {
  id: CampaignId;
  title: string;
  description: string;
  icon: string;
  theme: ScenarioTheme;
  chapters: CampaignChapter[];
  reward: number;
  unlockRequirement?: {
    completedCampaigns?: CampaignId[];
    totalScenariosCompleted?: number;
  };
}

export interface CampaignProgress {
  campaignId: CampaignId;
  currentChapter: number;
  completedChapters: string[];
  startedAt: number;
  completedAt?: number;
}
