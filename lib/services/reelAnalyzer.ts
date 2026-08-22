import { Reel, InteractionState } from '../types';

export type ReelAnalysis = {
  reel: Reel;
  interactionScore: number;
  scoreBreakdown: { label: string; points: number }[];
};

export function calculateInteractionScore(state: InteractionState): {
  total: number;
  breakdown: { label: string; points: number }[];
} {
  const breakdown: { label: string; points: number }[] = [];

  if (state.save) breakdown.push({ label: 'Save', points: 5 });
  if (state.rewatch) breakdown.push({ label: 'Rewatch', points: 4 });
  if (state.share) breakdown.push({ label: 'Share', points: 4 });
  if (state.like) breakdown.push({ label: 'Like', points: 3 });
  if (state.comment) breakdown.push({ label: 'Comment', points: 2 });

  if (state.watchPercent > 80) breakdown.push({ label: 'Watch >80%', points: 3 });
  else if (state.watchPercent >= 50) breakdown.push({ label: 'Watch 50-80%', points: 1 });
  else if (state.watchPercent > 0 && state.watchPercent < 20) breakdown.push({ label: 'Watch <20%', points: -3 });

  if (state.skip) breakdown.push({ label: 'Skip', points: -2 });

  const total = breakdown.reduce((sum, b) => sum + b.points, 0);
  return { total, breakdown };
}

export function analyzeReel(reel: Reel, state: InteractionState): ReelAnalysis {
  const { total, breakdown } = calculateInteractionScore(state);
  return { reel, interactionScore: total, scoreBreakdown: breakdown };
}

export function analyzeAllReels(
  reels: Reel[],
  interactions: Record<string, InteractionState>
): ReelAnalysis[] {
  return reels.map((reel) => analyzeReel(reel, interactions[reel.id]));
}
