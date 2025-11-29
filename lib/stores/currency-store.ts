import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  coins: number;
  streak: number;
  totalScenariosCompleted: number;
  highestStreak: number;

  // Actions
  addReward: (baseReward: number, hasDoubleReward?: boolean) => number;
  spendCoins: (amount: number) => boolean;
  resetStreak: () => void;
  incrementStreak: () => void;
  addCoins: (amount: number) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      coins: 100, // Starting coins
      streak: 0,
      totalScenariosCompleted: 0,
      highestStreak: 0,

      addReward: (baseReward, hasDoubleReward = false) => {
        const state = get();
        const streakMultiplier = 1 + state.streak * 0.1;
        const doubleMultiplier = hasDoubleReward ? 2 : 1;
        const reward = Math.floor(baseReward * streakMultiplier * doubleMultiplier);

        set((state) => ({
          coins: state.coins + reward,
          totalScenariosCompleted: state.totalScenariosCompleted + 1,
        }));

        return reward;
      },

      spendCoins: (amount) => {
        if (get().coins >= amount) {
          set((state) => ({ coins: state.coins - amount }));
          return true;
        }
        return false;
      },

      resetStreak: () => set({ streak: 0 }),

      incrementStreak: () =>
        set((state) => ({
          streak: state.streak + 1,
          highestStreak: Math.max(state.highestStreak, state.streak + 1),
        })),

      addCoins: (amount) =>
        set((state) => ({ coins: state.coins + amount })),
    }),
    {
      name: 'escape-game-currency',
    }
  )
);
