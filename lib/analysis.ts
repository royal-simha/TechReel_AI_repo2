import { InteractionState, AnalysisResult } from './types';
import { analyzeAllReels, calculateInteractionScore } from './services/reelAnalyzer';
import { buildInferenceSteps, calculateInterestProfile, inferBroaderInterest } from './services/interestEngine';
import { generateCandidates } from './services/recommendationEngine';
import { filterReelsByQuality, filterCandidatesByQuality } from './services/qualityFilter';
import { rankCandidates } from './services/rankingEngine';
import { generateExplanation } from './services/explanationEngine';
import { REELS, CANDIDATES } from './data';

export function runFullAnalysis(interactions: Record<string, InteractionState>): AnalysisResult {
  const { rejected } = filterReelsByQuality(REELS);
  const inferenceSteps = buildInferenceSteps(REELS, interactions);
  const interestProfile = calculateInterestProfile(REELS, interactions);
  const { detectedInterest, confidence, explanation } = inferBroaderInterest(interestProfile);

  const candidates = generateCandidates(detectedInterest, CANDIDATES);
  const filteredCandidates = filterCandidatesByQuality(candidates);
  const recommendations = rankCandidates(filteredCandidates, interestProfile, detectedInterest);

  const recommendationsWithReasons = recommendations.map((rec) => ({
    ...rec,
    reason: generateExplanation(rec, REELS, interactions, detectedInterest).join(' '),
  }));

  return {
    detectedInterest,
    confidence,
    explanation,
    inferenceSteps,
    interestProfile,
    recommendations: recommendationsWithReasons,
    rejectedReels: rejected,
  };
}

export { calculateInteractionScore };
