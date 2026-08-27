import { Reel, InteractionState, Recommendation, Interest } from '../types';
import { calculateInteractionScore } from './reelAnalyzer';

export function generateExplanation(
  recommendation: Recommendation,
  reels: Reel[],
  interactions: Record<string, InteractionState>,
  detectedInterest: string
): string[] {
  const reasons: string[] = [];
  const engagedReels = reels.filter((r) => {
    const { total } = calculateInteractionScore(interactions[r.id]);
    return total > 0;
  });

  const javaReel = engagedReels.find((r) => r.topics.includes('Java'));
  if (javaReel) {
    reasons.push('You strongly engaged with Java programming content.');
  }

  const lifestyleReel = engagedReels.find((r) => r.topics.includes('Developer Lifestyle'));
  if (lifestyleReel) {
    reasons.push('You watched software-engineering lifestyle content.');
  }

  const interviewReel = engagedReels.find((r) => r.topics.includes('Coding Interviews'));
  if (interviewReel) {
    reasons.push('You interacted with coding interview content.');
  }

  const hardwareReel = engagedReels.find((r) => r.topics.includes('Laptop') || r.topics.includes('Hardware'));
  if (hardwareReel) {
    reasons.push('You showed interest in developer hardware.');
  }

  reasons.push(`These signals indicate a broader ${detectedInterest} interest.`);

  const candCategory = recommendation.candidate.category;
  reasons.push(
    `The recommended Reel connects ${detectedInterest} with your demonstrated ${candCategory} interest.`
  );

  return reasons;
}

export function generateConfidenceExplanation(
  interests: Interest[],
  confidence: 'High' | 'Medium' | 'Low'
): string {
  const highConfidenceCount = interests.filter((i) => i.confidence === 'High').length;
  const mediumConfidenceCount = interests.filter((i) => i.confidence === 'Medium').length;

  if (confidence === 'High') {
    return `Multiple strong interactions across ${highConfidenceCount} interest domains with a consistent semantic theme and clear interest cluster.`;
  }
  if (confidence === 'Medium') {
    return `Some related content engagement with ${mediumConfidenceCount} medium-confidence domains and mixed signals.`;
  }
  return 'Very little interaction data with conflicting or sparse interests.';
}
