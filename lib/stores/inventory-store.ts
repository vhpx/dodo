import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItemId } from '@/lib/types/game';

interface InventoryState {
  items: Record<ItemId, number>;

  // Actions
  addItem: (id: ItemId, quantity?: number) => void;
  useItem: (id: ItemId) => boolean;
  getQuantity: (id: ItemId) => number;
  hasItem: (id: ItemId) => boolean;
}

const defaultItems: Record<ItemId, number> = {
  hint_pack: 0,
  skip_token: 0,
  ai_teammate: 0,
  time_freeze: 0,
  double_reward: 0,
  theme_choice: 0,
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: { ...defaultItems },

      addItem: (id, quantity = 1) =>
        set((state) => ({
          items: { ...state.items, [id]: (state.items[id] || 0) + quantity },
        })),

      useItem: (id) => {
        if (get().items[id] > 0) {
          set((state) => ({
            items: { ...state.items, [id]: state.items[id] - 1 },
          }));
          return true;
        }
        return false;
      },

      getQuantity: (id) => get().items[id] || 0,

      hasItem: (id) => get().items[id] > 0,
    }),
    {
      name: 'escape-game-inventory',
    }
  )
);
