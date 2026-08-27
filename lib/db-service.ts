'use server';

import { supabase } from './supabase-client';
import { InteractionState, Reel, Interest, Recommendation, FeedbackType, ScoreBreakdown } from './types';
import { REELS, CANDIDATES, DEMO_INTERACTIONS, EMPTY_INTERACTIONS } from './data';
import { calculateInteractionScore } from './services/reelAnalyzer';
import { calculateInterestProfile, inferBroaderInterest, buildInferenceSteps } from './services/interestEngine';
import { generateCandidates } from './services/recommendationEngine';
import { filterReelsByQuality, filterCandidatesByQuality } from './services/qualityFilter';
import { rankCandidates } from './services/rankingEngine';
import { generateExplanation } from './services/explanationEngine';

export type DbInteraction = {
  reel_id: string;
  watch_percent: number;
  liked: boolean;
  saved: boolean;
  shared: boolean;
  rewatched: boolean;
  commented: boolean;
  skipped: boolean;
};

export async function fetchReels(): Promise<Reel[]> {
  const { data, error } = await supabase.from('reels').select('*');
  if (error || !data) return REELS;

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    category: row.category as Reel['category'],
    topics: row.topics as string[],
    primaryTopic: row.primary_topic as string,
    secondaryTopics: row.secondary_topics as string[],
    technologyDomain: row.technology_domain as string,
    context: row.context as string,
    intent: row.intent as string,
    difficulty: row.difficulty as Reel['difficulty'],
    educationalValue: row.educational_value as number,
    careerRelevance: row.career_relevance as number,
    entertainmentValue: row.entertainment_value as number,
    hypeScore: row.hype_score as number,
    qualityStatus: row.quality_status as Reel['qualityStatus'],
    qualityReason: (row.quality_reason as string) || undefined,
  }));
}

export async function fetchInteractions(userId: string): Promise<Record<string, InteractionState>> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return {};

  const interactions: Record<string, InteractionState> = {};
  for (const row of data) {
    interactions[row.reel_id as string] = {
      watchPercent: row.watch_percent as number,
      like: row.liked as boolean,
      save: row.saved as boolean,
      share: row.shared as boolean,
      rewatch: row.rewatched as boolean,
      comment: row.commented as boolean,
      skip: row.skipped as boolean,
    };
  }
  return interactions;
}

export async function upsertInteraction(
  userId: string,
  reelId: string,
  state: InteractionState
): Promise<void> {
  const { error } = await supabase.from('interactions').upsert({
    user_id: userId,
    reel_id: reelId,
    watch_percent: state.watchPercent,
    liked: state.like,
    saved: state.save,
    shared: state.share,
    rewatched: state.rewatch,
    commented: state.comment,
    skipped: state.skip,
  }, { onConflict: 'user_id,reel_id' });

  if (error) throw error;
}

export async function clearInteractions(userId: string): Promise<void> {
  const { error } = await supabase
    .from('interactions')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

export async function loadDemoInteractions(userId: string): Promise<Record<string, InteractionState>> {
  await clearInteractions(userId);

  const inserts = Object.entries(DEMO_INTERACTIONS).map(([reelId, state]) =>
    supabase.from('interactions').upsert({
      user_id: userId,
      reel_id: reelId,
      watch_percent: state.watchPercent,
      liked: state.like,
      saved: state.save,
      shared: state.share,
      rewatched: state.rewatch,
      commented: state.comment,
      skipped: state.skip,
    }, { onConflict: 'user_id,reel_id' })
  );

  await Promise.all(inserts);
  return DEMO_INTERACTIONS;
}

export async function saveInterestProfile(userId: string, interests: Interest[]): Promise<void> {
  await supabase.from('interests').delete().eq('user_id', userId);

  if (interests.length === 0) return;

  const rows = interests.map((i) => ({
    user_id: userId,
    interest_name: i.name,
    score: i.score,
    confidence: i.confidence,
    trend: i.trend,
  }));

  const { error } = await supabase.from('interests').insert(rows);
  if (error) throw error;
}

export async function fetchInterestProfile(userId: string): Promise<Interest[]> {
  const { data, error } = await supabase
    .from('interests')
    .select('*')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    name: row.interest_name as string,
    score: row.score as number,
    confidence: row.confidence as Interest['confidence'],
    trend: row.trend as Interest['trend'],
  }));
}

export async function saveRecommendations(
  userId: string,
  recommendations: Recommendation[]
): Promise<void> {
  await supabase.from('recommendations').delete().eq('user_id', userId);

  if (recommendations.length === 0) return;

  const rows = recommendations.map((rec, idx) => ({
    user_id: userId,
    candidate_id: rec.candidate.id,
    candidate_title: rec.candidate.title,
    candidate_category: rec.candidate.category,
    candidate_topic: rec.candidate.topic,
    candidate_difficulty: rec.candidate.difficulty,
    score_breakdown: rec.score as unknown as Record<string, unknown>,
    final_score: rec.score.finalScore,
    reason: rec.reason,
    rank: idx,
  }));

  const { error } = await supabase.from('recommendations').insert(rows);
  if (error) throw error;
}

export async function fetchRecommendations(userId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('rank', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const breakdown = row.score_breakdown as unknown as ScoreBreakdown;
    return {
      candidate: {
        id: row.candidate_id as string,
        title: row.candidate_title as string,
        category: row.candidate_category as Reel['category'],
        topic: row.candidate_topic as string,
        difficulty: row.candidate_difficulty as Reel['difficulty'],
        educationalValue: breakdown.educationalValue,
        careerRelevance: breakdown.careerRelevance,
        contentQuality: breakdown.contentQuality,
        novelty: breakdown.novelty,
        engagementPotential: breakdown.engagementPotential,
        hypeScore: breakdown.hypePenalty ? Math.round(breakdown.hypePenalty / 0.2) : 0,
      },
      score: breakdown,
      reason: row.reason as string,
    };
  });
}

export async function saveFeedback(
  userId: string,
  recommendationId: string,
  feedbackType: FeedbackType
): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    user_id: userId,
    recommendation_id: recommendationId,
    feedback_type: feedbackType,
  });
  if (error) throw error;
}

export async function fetchFeedback(userId: string): Promise<Record<string, FeedbackType>> {
  const { data, error } = await supabase
    .from('feedback')
    .select('recommendation_id, feedback_type')
    .eq('user_id', userId);

  if (error || !data) return {};

  const feedback: Record<string, FeedbackType> = {};
  for (const row of data) {
    feedback[row.recommendation_id as string] = row.feedback_type as FeedbackType;
  }
  return feedback;
}

export async function saveColdStartSelections(userId: string, selections: string[]): Promise<void> {
  await supabase.from('cold_start_selections').upsert({
    user_id: userId,
    selections,
  }, { onConflict: 'user_id' });
}

export async function fetchColdStartSelections(userId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('cold_start_selections')
    .select('selections')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.selections as string[];
}

export async function runAnalysisPipeline(interactions: Record<string, InteractionState>) {
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

export { DEMO_INTERACTIONS, EMPTY_INTERACTIONS };
