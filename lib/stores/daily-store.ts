import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScenarioTheme } from '@/lib/types/game';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: 'wins' | 'theme_wins' | 'streak' | 'no_hints' | 'fast_win';
    count?: number;
    theme?: ScenarioTheme;
    timeLimit?: number; // in seconds
  };
  reward: number;
  progress: number;
  completed: boolean;
}

interface DailyState {
  challenges: DailyChallenge[];
  lastRefresh: number;
  dailyStreak: number;
  lastDailyCompleted: number | null;

  // Actions
  refreshChallenges: () => void;
  updateProgress: (type: string, theme?: ScenarioTheme, duration?: number) => void;
  claimReward: (id: string) => number;
  checkDailyStreak: () => void;
}

// Challenge templates
const CHALLENGE_TEMPLATES = [
  {
    title: 'Quick Starter',
    description: 'Win any 2 scenarios today',
    icon: '🎯',
    requirement: { type: 'wins' as const, count: 2 },
    reward: 50,
  },
  {
    title: 'Survivalist',
    description: 'Win a survival scenario',
    icon: '💀',
    requirement: { type: 'theme_wins' as const, theme: 'survival' as ScenarioTheme, count: 1 },
    reward: 40,
  },
  {
    title: 'Detective Work',
    description: 'Win a mystery scenario',
    icon: '🔍',
    requirement: { type: 'theme_wins' as const, theme: 'mystery' as ScenarioTheme, count: 1 },
    reward: 40,
  },
  {
    title: 'Brain Teaser',
    description: 'Win a puzzle scenario',
    icon: '🧩',
    requirement: { type: 'theme_wins' as const, theme: 'puzzle' as ScenarioTheme, count: 1 },
    reward: 40,
  },
  {
    title: 'Smooth Talker',
    description: 'Win a social scenario',
    icon: '🎭',
    requirement: { type: 'theme_wins' as const, theme: 'social' as ScenarioTheme, count: 1 },
    reward: 40,
  },
  {
    title: 'On Fire',
    description: 'Achieve a 3-win streak',
    icon: '🔥',
    requirement: { type: 'streak' as const, count: 3 },
    reward: 75,
  },
  {
    title: 'No Help Needed',
    description: 'Win without using any hints',
    icon: '🧠',
    requirement: { type: 'no_hints' as const, count: 1 },
    reward: 60,
  },
  {
    title: 'Speed Runner',
    description: 'Win a scenario in under 3 minutes',
    icon: '⚡',
    requirement: { type: 'fast_win' as const, timeLimit: 180 },
    reward: 80,
  },
  {
    title: 'Marathon',
    description: 'Win 5 scenarios today',
    icon: '🏃',
    requirement: { type: 'wins' as const, count: 5 },
    reward: 100,
  },
];

function generateDailyChallenges(): DailyChallenge[] {
  // Shuffle and pick 3 challenges
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  return selected.map((template, index) => ({
    ...template,
    id: `daily-${Date.now()}-${index}`,
    progress: 0,
    completed: false,
  }));
}

function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      challenges: [],
      lastRefresh: 0,
      dailyStreak: 0,
      lastDailyCompleted: null,

      refreshChallenges: () => {
        const now = Date.now();
        const { lastRefresh } = get();

        // Only refresh if it's a new day
        if (!isSameDay(lastRefresh, now)) {
          set({
            challenges: generateDailyChallenges(),
            lastRefresh: now,
          });
        }
      },

      updateProgress: (type, theme, duration) => {
        set((state) => {
          const updatedChallenges = state.challenges.map((challenge) => {
            if (challenge.completed) return challenge;

            let shouldUpdate = false;
            let newProgress = challenge.progress;

            switch (challenge.requirement.type) {
              case 'wins':
                if (type === 'win') {
                  shouldUpdate = true;
                  newProgress = challenge.progress + 1;
                }
                break;
              case 'theme_wins':
                if (type === 'win' && theme === challenge.requirement.theme) {
                  shouldUpdate = true;
                  newProgress = challenge.progress + 1;
                }
                break;
              case 'streak':
                if (type === 'streak') {
                  shouldUpdate = true;
                  newProgress = Math.max(challenge.progress, duration || 0);
                }
                break;
              case 'no_hints':
                if (type === 'no_hints_win') {
                  shouldUpdate = true;
                  newProgress = challenge.progress + 1;
                }
                break;
              case 'fast_win':
                if (type === 'win' && duration && duration <= (challenge.requirement.timeLimit || 180)) {
                  shouldUpdate = true;
                  newProgress = challenge.progress + 1;
                }
                break;
            }

            if (shouldUpdate) {
              const targetCount = challenge.requirement.count || 1;
              return {
                ...challenge,
                progress: newProgress,
                completed: newProgress >= targetCount,
              };
            }

            return challenge;
          });

          return { challenges: updatedChallenges };
        });
      },

      claimReward: (id) => {
        const { challenges } = get();
        const challenge = challenges.find((c) => c.id === id);

        if (!challenge || !challenge.completed) return 0;

        // Mark as claimed by removing from list
        set((state) => ({
          challenges: state.challenges.filter((c) => c.id !== id),
        }));

        // Check if all dailies are done
        const remainingCompleted = get().challenges.filter((c) => c.completed);
        if (remainingCompleted.length === 0 && get().challenges.length === 0) {
          // All dailies completed!
          get().checkDailyStreak();
        }

        return challenge.reward;
      },

      checkDailyStreak: () => {
        const now = Date.now();
        const { lastDailyCompleted, dailyStreak } = get();

        if (lastDailyCompleted) {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);

          if (isSameDay(lastDailyCompleted, yesterday.getTime())) {
            // Consecutive day
            set({
              dailyStreak: dailyStreak + 1,
              lastDailyCompleted: now,
            });
          } else if (!isSameDay(lastDailyCompleted, now)) {
            // Streak broken
            set({
              dailyStreak: 1,
              lastDailyCompleted: now,
            });
          }
        } else {
          set({
            dailyStreak: 1,
            lastDailyCompleted: now,
          });
        }
      },
    }),
    {
      name: 'escape-game-daily',
    }
  )
);
