import { Reel, InteractionState } from '../types';
import { calculateInteractionScore } from './reelAnalyzer';

export type WeightedInteraction = {
  reelId: string;
  reelTitle: string;
  score: number;
  weight: number;
};

const DOMAIN_MAP: Record<string, string[]> = {
  'Software Engineering': ['Java', 'Programming', 'Developer Humor', 'Software Engineering', 'Developer Lifestyle', 'Programming Career', 'Coding Interviews', 'DSA', 'Software Engineering'],
  'Hardware': ['Laptop', 'Development', 'Hardware', 'Programming'],
  'Gaming': ['Gaming', 'PC', 'RGB', 'Hardware'],
  'AI': ['AI', 'Career', 'Job Search'],
  'Cybersecurity': ['Cybersecurity', 'Networking', 'DDoS'],
  'Cloud': ['Cloud', 'AWS', 'Software Engineering', 'Career'],
};

export function getInteractionWeights(
  reels: Reel[],
  interactions: Record<string, InteractionState>
): WeightedInteraction[] {
  return reels.map((reel) => {
    const { total } = calculateInteractionScore(interactions[reel.id]);
    const weight = Math.max(0, total) / 15;
    return {
      reelId: reel.id,
      reelTitle: reel.title,
      score: total,
      weight: Math.min(weight, 1.5),
    };
  });
}

export function getEngagedReels(
  reels: Reel[],
  interactions: Record<string, InteractionState>
): Reel[] {
  return reels.filter((reel) => {
    const { total } = calculateInteractionScore(interactions[reel.id]);
    return total > 0;
  });
}
