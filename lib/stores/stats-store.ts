import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AchievementId, PlayerStats, ScenarioTheme, Achievement } from '@/lib/types/game';

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_escape',
    name: 'First Steps',
    description: 'Complete your first escape',
    icon: '🎯',
    reward: 50,
  },
  {
    id: 'streak_3',
    name: 'Getting Warmed Up',
    description: 'Achieve a 3-win streak',
    icon: '🔥',
    reward: 100,
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: 'Achieve a 5-win streak',
    icon: '💥',
    reward: 200,
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Achieve a 10-win streak',
    icon: '⚡',
    reward: 500,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Escape in under 2 minutes',
    icon: '⏱️',
    reward: 150,
  },
  {
    id: 'no_hints',
    name: 'Purist',
    description: 'Escape without using any hints',
    icon: '🧠',
    reward: 100,
  },
  {
    id: 'campaign_complete',
    name: 'Storyteller',
    description: 'Complete any campaign',
    icon: '📖',
    reward: 300,
  },
  {
    id: 'all_themes',
    name: 'Jack of All Trades',
    description: 'Win at least one scenario of each theme',
    icon: '🎭',
    reward: 250,
  },
  {
    id: 'social_master',
    name: 'Silver Tongue',
    description: 'Win 5 social theme scenarios',
    icon: '🗣️',
    reward: 200,
  },
  {
    id: 'survival_expert',
    name: 'Survivor',
    description: 'Win 5 survival theme scenarios',
    icon: '💪',
    reward: 200,
  },
  {
    id: 'puzzle_solver',
    name: 'Mastermind',
    description: 'Win 5 puzzle theme scenarios',
    icon: '🧩',
    reward: 200,
  },
  {
    id: 'mystery_detective',
    name: 'Detective',
    description: 'Win 5 mystery theme scenarios',
    icon: '🔍',
    reward: 200,
  },
  {
    id: 'rich_player',
    name: 'Money Bags',
    description: 'Accumulate 1000 coins',
    icon: '💰',
    reward: 100,
  },
  {
    id: 'item_collector',
    name: 'Hoarder',
    description: 'Own 10 items at once',
    icon: '🎒',
    reward: 150,
  },
];

const ACHIEVEMENTS_MAP = ACHIEVEMENTS.reduce((acc, a) => {
  acc[a.id] = a;
  return acc;
}, {} as Record<AchievementId, Achievement>);

interface StatsState {
  stats: PlayerStats;
  unlockedAchievements: AchievementId[];
  pendingAchievements: AchievementId[]; // Achievements to show notification for

  // Actions
  recordGameStart: () => void;
  recordWin: (theme: ScenarioTheme, durationSeconds: number, hintsUsed: number, streak: number) => AchievementId[];
  recordLoss: () => void;
  recordItemUsed: () => void;
  recordPlayTime: (seconds: number) => void;
  checkAchievement: (id: AchievementId) => boolean;
  unlockAchievement: (id: AchievementId) => number; // Returns reward amount
  clearPendingAchievements: () => void;
  checkAndUnlockAchievements: (context: {
    streak?: number;
    coins?: number;
    totalItems?: number;
    campaignCompleted?: boolean;
    winDuration?: number;
    hintsUsed?: number;
  }) => AchievementId[];
}

const defaultStats: PlayerStats = {
  totalGamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  fastestWin: null,
  longestStreak: 0,
  totalPlayTime: 0,
  themeWins: {
    survival: 0,
    mystery: 0,
    puzzle: 0,
    social: 0,
  },
  hintsUsed: 0,
  itemsUsed: 0,
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      stats: defaultStats,
      unlockedAchievements: [],
      pendingAchievements: [],

      recordGameStart: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalGamesPlayed: state.stats.totalGamesPlayed + 1,
          },
        }));
      },

      recordWin: (theme, durationSeconds, hintsUsed, streak) => {
        const newAchievements: AchievementId[] = [];

        set((state) => {
          const newStats = {
            ...state.stats,
            totalWins: state.stats.totalWins + 1,
            hintsUsed: state.stats.hintsUsed + hintsUsed,
            longestStreak: Math.max(state.stats.longestStreak, streak),
            themeWins: {
              ...state.stats.themeWins,
              [theme]: state.stats.themeWins[theme] + 1,
            },
            fastestWin:
              state.stats.fastestWin === null
                ? durationSeconds
                : Math.min(state.stats.fastestWin, durationSeconds),
          };

          return { stats: newStats };
        });

        // Check for achievements after updating stats
        const achievements = get().checkAndUnlockAchievements({
          streak,
          winDuration: durationSeconds,
          hintsUsed,
        });

        return achievements;
      },

      recordLoss: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalLosses: state.stats.totalLosses + 1,
          },
        }));
      },

      recordItemUsed: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            itemsUsed: state.stats.itemsUsed + 1,
          },
        }));
      },

      recordPlayTime: (seconds) => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalPlayTime: state.stats.totalPlayTime + seconds,
          },
        }));
      },

      checkAchievement: (id) => {
        return get().unlockedAchievements.includes(id);
      },

      unlockAchievement: (id) => {
        const state = get();
        if (state.unlockedAchievements.includes(id)) return 0;

        const achievement = ACHIEVEMENTS_MAP[id];
        if (!achievement) return 0;

        set({
          unlockedAchievements: [...state.unlockedAchievements, id],
          pendingAchievements: [...state.pendingAchievements, id],
        });

        return achievement.reward;
      },

      clearPendingAchievements: () => {
        set({ pendingAchievements: [] });
      },

      checkAndUnlockAchievements: (context) => {
        const state = get();
        const { stats, unlockedAchievements } = state;
        const newlyUnlocked: AchievementId[] = [];

        const tryUnlock = (id: AchievementId): boolean => {
          if (unlockedAchievements.includes(id)) return false;
          const reward = state.unlockAchievement(id);
          if (reward > 0) {
            newlyUnlocked.push(id);
            return true;
          }
          return false;
        };

        // First escape
        if (stats.totalWins >= 1) {
          tryUnlock('first_escape');
        }

        // Streak achievements
        if (context.streak) {
          if (context.streak >= 3) tryUnlock('streak_3');
          if (context.streak >= 5) tryUnlock('streak_5');
          if (context.streak >= 10) tryUnlock('streak_10');
        }

        // Speed achievement
        if (context.winDuration && context.winDuration <= 120) {
          tryUnlock('speed_demon');
        }

        // No hints achievement
        if (context.hintsUsed === 0 && stats.totalWins >= 1) {
          tryUnlock('no_hints');
        }

        // Theme mastery
        if (stats.themeWins.social >= 5) tryUnlock('social_master');
        if (stats.themeWins.survival >= 5) tryUnlock('survival_expert');
        if (stats.themeWins.puzzle >= 5) tryUnlock('puzzle_solver');
        if (stats.themeWins.mystery >= 5) tryUnlock('mystery_detective');

        // All themes
        if (
          stats.themeWins.survival >= 1 &&
          stats.themeWins.mystery >= 1 &&
          stats.themeWins.puzzle >= 1 &&
          stats.themeWins.social >= 1
        ) {
          tryUnlock('all_themes');
        }

        // Campaign complete
        if (context.campaignCompleted) {
          tryUnlock('campaign_complete');
        }

        // Rich player
        if (context.coins && context.coins >= 1000) {
          tryUnlock('rich_player');
        }

        // Item collector
        if (context.totalItems && context.totalItems >= 10) {
          tryUnlock('item_collector');
        }

        return newlyUnlocked;
      },
    }),
    {
      name: 'escape-game-stats',
    }
  )
);

export { ACHIEVEMENTS_MAP };
