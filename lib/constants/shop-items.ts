import type { ItemId, ShopItem } from '@/lib/types/game';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hint_pack',
    name: 'Hint Pack',
    description:
      'Receive 3 hints you can use during any scenario. Hints get progressively more specific.',
    price: 50,
    icon: '💡',
    quantity: 3,
  },
  {
    id: 'skip_token',
    name: 'Skip Token',
    description:
      'Skip the current scenario without losing your streak. Perfect for when you are truly stuck.',
    price: 100,
    icon: '⏭️',
    quantity: 1,
  },
  {
    id: 'ai_teammate',
    name: 'AI Teammate',
    description:
      'An AI companion provides subtle suggestions during the scenario. Does not give away answers.',
    price: 150,
    icon: '🤖',
    quantity: 1,
  },
  {
    id: 'time_freeze',
    name: 'Time Freeze',
    description:
      'Pause the timer for 60 seconds on time-limited scenarios. Breathe and think!',
    price: 75,
    icon: '❄️',
    quantity: 1,
  },
  {
    id: 'double_reward',
    name: 'Double Reward',
    description:
      'Double the coins earned on your next victory. Consumed on use.',
    price: 120,
    icon: '💰',
    quantity: 1,
  },
  {
    id: 'theme_choice',
    name: 'Theme Choice',
    description:
      'Choose the theme for your next scenario: survival, mystery, puzzle, or social.',
    price: 60,
    icon: '🎭',
    quantity: 1,
  },
];

export const SHOP_ITEMS_MAP: Record<ItemId, ShopItem> = SHOP_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ItemId, ShopItem>
);

// Noir detective themed icons
export const THEME_ICONS: Record<string, string> = {
  survival: '🔦',
  mystery: '🔍',
  puzzle: '🔐',
  social: '🎭',
};

// Case difficulty classifications
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Rookie',
  2: 'Detective',
  3: 'Veteran',
  4: 'Senior',
  5: 'Chief',
};
