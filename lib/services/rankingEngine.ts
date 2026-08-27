import { CandidateRecommendation, Interest, ScoreBreakdown, Recommendation } from '../types';
import { calculateSemanticSimilarity } from './recommendationEngine';

export function scoreCandidate(
  candidate: CandidateRecommendation,
  interests: Interest[],
  detectedInterest: string
): ScoreBreakdown {
  const interest = interests.find((i) => i.name === detectedInterest);
  const interestMatch = interest ? interest.score : 50;
  const semanticSimilarity = calculateSemanticSimilarity(candidate, detectedInterest);

  const educationalValue = candidate.educationalValue;
  const careerRelevance = candidate.careerRelevance;
  const contentQuality = candidate.contentQuality;
  const novelty = candidate.novelty;
  const engagementPotential = candidate.engagementPotential;
  const hypePenalty = candidate.hypeScore * 0.2;

  const finalScore =
    0.35 * interestMatch +
    0.20 * semanticSimilarity +
    0.15 * educationalValue +
    0.10 * careerRelevance +
    0.10 * contentQuality +
    0.05 * novelty +
    0.05 * engagementPotential -
    0.20 * candidate.hypeScore;

  return {
    interestMatch: Math.round(interestMatch * 10) / 10,
    semanticSimilarity: Math.round(semanticSimilarity * 10) / 10,
    educationalValue,
    careerRelevance,
    contentQuality,
    novelty,
    engagementPotential,
    hypePenalty: Math.round(hypePenalty * 10) / 10,
    finalScore: Math.round(Math.max(0, finalScore) * 10) / 10,
  };
}

export function rankCandidates(
  candidates: CandidateRecommendation[],
  interests: Interest[],
  detectedInterest: string,
  recentCategories: string[] = []
): Recommendation[] {
  const scored = candidates.map((candidate) => {
    const score = scoreCandidate(candidate, interests, detectedInterest);
    return { candidate, score };
  });

  scored.sort((a, b) => b.score.finalScore - a.score.finalScore);

  const diversityPenalized = scored.map((item, idx) => {
    let adjustedScore = item.score.finalScore;
    if (recentCategories.includes(item.candidate.category)) {
      adjustedScore -= 10;
    }
    return { ...item, adjustedScore };
  });

  diversityPenalized.sort((a, b) => b.adjustedScore - a.adjustedScore);

  return diversityPenalized.slice(0, 5).map((item) => ({
    candidate: item.candidate,
    score: item.score,
    reason: '',
  }));
}
