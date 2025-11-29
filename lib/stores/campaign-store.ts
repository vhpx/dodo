import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CampaignId, CampaignProgress } from '@/lib/types/game';
import { CAMPAIGNS_MAP } from '@/lib/constants/campaigns';

interface CampaignState {
  // Active campaign
  activeCampaign: CampaignId | null;
  campaignProgress: Record<CampaignId, CampaignProgress>;
  completedCampaigns: CampaignId[];

  // Actions
  startCampaign: (campaignId: CampaignId) => void;
  completeChapter: (campaignId: CampaignId, chapterId: string) => void;
  completeCampaign: (campaignId: CampaignId) => void;
  abandonCampaign: () => void;
  getCurrentChapter: () => number;
  isCampaignUnlocked: (campaignId: CampaignId, totalCompleted: number) => boolean;
  getCampaignProgress: (campaignId: CampaignId) => CampaignProgress | null;
  resetCampaignProgress: (campaignId: CampaignId) => void;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      activeCampaign: null,
      campaignProgress: {} as Record<CampaignId, CampaignProgress>,
      completedCampaigns: [],

      startCampaign: (campaignId) => {
        const existing = get().campaignProgress[campaignId];
        if (existing && !existing.completedAt) {
          // Resume existing campaign
          set({ activeCampaign: campaignId });
        } else {
          // Start new campaign
          set((state) => ({
            activeCampaign: campaignId,
            campaignProgress: {
              ...state.campaignProgress,
              [campaignId]: {
                campaignId,
                currentChapter: 0,
                completedChapters: [],
                startedAt: Date.now(),
              },
            },
          }));
        }
      },

      completeChapter: (campaignId, chapterId) => {
        const campaign = CAMPAIGNS_MAP[campaignId];
        if (!campaign) return;

        set((state) => {
          const progress = state.campaignProgress[campaignId];
          if (!progress) return state;

          const newCompletedChapters = [...progress.completedChapters, chapterId];
          const nextChapter = progress.currentChapter + 1;
          const isComplete = nextChapter >= campaign.chapters.length;

          return {
            campaignProgress: {
              ...state.campaignProgress,
              [campaignId]: {
                ...progress,
                currentChapter: nextChapter,
                completedChapters: newCompletedChapters,
                completedAt: isComplete ? Date.now() : undefined,
              },
            },
            completedCampaigns: isComplete
              ? [...state.completedCampaigns, campaignId]
              : state.completedCampaigns,
            activeCampaign: isComplete ? null : state.activeCampaign,
          };
        });
      },

      completeCampaign: (campaignId) => {
        set((state) => ({
          activeCampaign: null,
          completedCampaigns: state.completedCampaigns.includes(campaignId)
            ? state.completedCampaigns
            : [...state.completedCampaigns, campaignId],
        }));
      },

      abandonCampaign: () => {
        set({ activeCampaign: null });
      },

      getCurrentChapter: () => {
        const state = get();
        if (!state.activeCampaign) return 0;
        const progress = state.campaignProgress[state.activeCampaign];
        return progress?.currentChapter || 0;
      },

      isCampaignUnlocked: (campaignId, totalCompleted) => {
        const campaign = CAMPAIGNS_MAP[campaignId];
        if (!campaign || !campaign.unlockRequirement) return true;

        const { completedCampaigns } = get();
        const req = campaign.unlockRequirement;

        if (req.totalScenariosCompleted && totalCompleted < req.totalScenariosCompleted) {
          return false;
        }

        if (req.completedCampaigns) {
          const hasAllRequired = req.completedCampaigns.every((id) =>
            completedCampaigns.includes(id)
          );
          if (!hasAllRequired) return false;
        }

        return true;
      },

      getCampaignProgress: (campaignId) => {
        return get().campaignProgress[campaignId] || null;
      },

      resetCampaignProgress: (campaignId) => {
        set((state) => {
          const newProgress = { ...state.campaignProgress };
          delete newProgress[campaignId];
          return {
            campaignProgress: newProgress,
            completedCampaigns: state.completedCampaigns.filter(
              (id) => id !== campaignId
            ),
            activeCampaign:
              state.activeCampaign === campaignId ? null : state.activeCampaign,
          };
        });
      },
    }),
    {
      name: 'escape-game-campaigns',
    }
  )
);
