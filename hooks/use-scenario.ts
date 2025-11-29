import { useMutation } from '@tanstack/react-query';
import type { Scenario, ScenarioTheme, CampaignChapter, CampaignId } from '@/lib/types/game';

interface CampaignContext {
  campaignId: CampaignId;
  campaignTitle: string;
  chapter: CampaignChapter;
  previousChapters?: string[];
}

interface GenerateScenarioParams {
  previousThemes?: ScenarioTheme[];
  difficulty?: number;
  forcedTheme?: ScenarioTheme;
  campaignContext?: CampaignContext;
}

interface GenerateImageParams {
  prompt: string;
  scenarioId: string;
  theme?: string;
}

export function useGenerateScenario() {
  return useMutation({
    mutationFn: async (params: GenerateScenarioParams): Promise<Scenario> => {
      const response = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate scenario');
      }

      const data = await response.json();
      return data.scenario;
    },
  });
}

export function useGenerateImage() {
  return useMutation({
    mutationFn: async (params: GenerateImageParams): Promise<string | null> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        return data.imageUrl || null;
      } catch (error) {
        // Silently fail - images are optional
        console.warn('Image generation skipped:', error);
        return null;
      }
    },
  });
}

export function useSetApiKey() {
  return useMutation({
    mutationFn: async (apiKey: string): Promise<boolean> => {
      const response = await fetch('/api/auth/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to set API key');
      }

      return true;
    },
  });
}

export function useCheckApiKey() {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const response = await fetch('/api/auth/set-key', {
        method: 'GET',
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasKey;
    },
  });
}
