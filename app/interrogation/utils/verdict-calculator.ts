// Calculate final verdict based on game state

export type Verdict = 'released' | 'detained' | 'arrested';

export interface VerdictResult {
  verdict: Verdict;
  title: string;
  description: string;
  color: string;
}

export function calculateVerdict(suspicionScore: number): VerdictResult {
  if (suspicionScore <= 30) {
    return {
      verdict: 'released',
      title: 'RELEASED',
      description: 'Insufficient evidence to hold suspect. Released pending further investigation.',
      color: 'text-emerald-400',
    };
  } else if (suspicionScore <= 60) {
    return {
      verdict: 'detained',
      title: 'DETAINED',
      description: 'Suspect held for additional questioning. Evidence inconclusive but suspicious.',
      color: 'text-yellow-400',
    };
  } else {
    return {
      verdict: 'arrested',
      title: 'ARRESTED',
      description: 'Probable cause established. Suspect taken into custody.',
      color: 'text-red-500',
    };
  }
}

export function getSuspicionLabel(score: number): { label: string; color: string } {
  if (score <= 20) {
    return { label: 'COOPERATIVE', color: 'text-emerald-400' };
  } else if (score <= 40) {
    return { label: 'GUARDED', color: 'text-emerald-300' };
  } else if (score <= 60) {
    return { label: 'SUSPICIOUS', color: 'text-yellow-400' };
  } else if (score <= 80) {
    return { label: 'HOSTILE', color: 'text-orange-400' };
  } else {
    return { label: 'DECEPTIVE', color: 'text-red-500' };
  }
}

export function getMeterColor(score: number): string {
  if (score <= 30) return 'bg-emerald-500';
  if (score <= 50) return 'bg-yellow-500';
  if (score <= 70) return 'bg-orange-500';
  return 'bg-red-500';
}
