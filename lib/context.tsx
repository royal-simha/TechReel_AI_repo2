'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { InteractionState, Recommendation, FeedbackType } from './types';
import { REELS, DEMO_INTERACTIONS, EMPTY_INTERACTIONS, CANDIDATES } from './data';
import { runFullAnalysis } from './analysis';
import { calculateInterestProfile, inferBroaderInterest, buildInferenceSteps } from './services/interestEngine';
import { generateCandidates } from './services/recommendationEngine';
import { filterReelsByQuality, filterCandidatesByQuality } from './services/qualityFilter';
import { rankCandidates } from './services/rankingEngine';
import { generateExplanation } from './services/explanationEngine';
import { useAuth } from './auth-context';
import { supabase } from './supabase-client';
import { toast } from 'sonner';

type AppState = {
  interactions: Record<string, InteractionState>;
  setInteraction: (reelId: string, state: Partial<InteractionState>) => void;
  resetInteractions: () => void;
  loadDemo: () => void;
  hasHistory: boolean;
  analysis: ReturnType<typeof runFullAnalysis>;
  runAnalysis: () => void;
  isAnalyzing: boolean;
  analysisSteps: string[];
  currentStep: number;
  feedback: Record<string, FeedbackType>;
  giveFeedback: (recommendationId: string, type: FeedbackType) => void;
  interestOverrides: Record<string, number>;
  coldStartSelections: string[];
  setColdStartSelections: (selections: string[]) => void;
  applyColdStart: () => void;
  hasColdStarted: boolean;
  syncWithDb: () => Promise<void>;
  isSyncing: boolean;
};

const ANALYSIS_STEPS = [
  'Analyzing Reels',
  'Analyzing interactions',
  'Building interest profile',
  'Inferring broader interest',
  'Generating candidates',
  'Applying quality filter',
  'Ranking recommendations',
  'Generating explanation',
  'Calculating confidence',
];

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const [interactions, setInteractions] = useState<Record<string, InteractionState>>(DEMO_INTERACTIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [feedback, setFeedback] = useState<Record<string, FeedbackType>>({});
  const [interestOverrides, setInterestOverrides] = useState<Record<string, number>>({});
  const [coldStartSelections, setColdStartSelections] = useState<string[]>([]);
  const [hasColdStarted, setHasColdStarted] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<typeof runFullAnalysis>>(() => runFullAnalysis(DEMO_INTERACTIONS));

  // Sync with Supabase when user changes
  const syncWithDb = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const { data: interactionData } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', user.id);

      let loadedInteractions: Record<string, InteractionState>;

      if (interactionData && interactionData.length > 0) {
        loadedInteractions = {};
        for (const row of interactionData) {
          loadedInteractions[row.reel_id as string] = {
            watchPercent: row.watch_percent as number,
            like: row.liked as boolean,
            save: row.saved as boolean,
            share: row.shared as boolean,
            rewatch: row.rewatched as boolean,
            comment: row.commented as boolean,
            skip: row.skipped as boolean,
          };
        }
        // Fill missing reels with empty state
        for (const reel of REELS) {
          if (!loadedInteractions[reel.id]) {
            loadedInteractions[reel.id] = { ...EMPTY_INTERACTIONS[reel.id] };
          }
        }
        setHasColdStarted(true);
      } else {
        // Check cold start selections
        const { data: coldData } = await supabase
          .from('cold_start_selections')
          .select('selections')
          .eq('user_id', user.id)
          .maybeSingle();

        if (coldData && coldData.selections) {
          setColdStartSelections(coldData.selections as string[]);
          setHasColdStarted(true);
          loadedInteractions = { ...EMPTY_INTERACTIONS };
        } else {
          loadedInteractions = { ...EMPTY_INTERACTIONS };
          setHasColdStarted(false);
        }
      }

      setInteractions(loadedInteractions);

      // Load feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('recommendation_id, feedback_type')
        .eq('user_id', user.id);

      if (feedbackData) {
        const fb: Record<string, FeedbackType> = {};
        for (const row of feedbackData) {
          fb[row.recommendation_id as string] = row.feedback_type as FeedbackType;
        }
        setFeedback(fb);
      }

      const result = runFullAnalysis(loadedInteractions);
      setAnalysis(result);
    } catch {
      // Fall back to demo data
      setInteractions(DEMO_INTERACTIONS);
      setHasColdStarted(true);
      setAnalysis(runFullAnalysis(DEMO_INTERACTIONS));
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !isDemoMode) {
      syncWithDb();
    } else if (isDemoMode) {
      setInteractions(DEMO_INTERACTIONS);
      setHasColdStarted(true);
      setAnalysis(runFullAnalysis(DEMO_INTERACTIONS));
    } else if (!user) {
      setInteractions(DEMO_INTERACTIONS);
      setHasColdStarted(true);
      setAnalysis(runFullAnalysis(DEMO_INTERACTIONS));
    }
  }, [user, isDemoMode, syncWithDb]);

  const setInteraction = useCallback((reelId: string, state: Partial<InteractionState>) => {
    setInteractions((prev) => ({
      ...prev,
      [reelId]: { ...prev[reelId], ...state },
    }));

    // Persist to Supabase if authenticated
    if (user && !isDemoMode) {
      const newState = { ...interactions[reelId], ...state };
      supabase.from('interactions').upsert({
        user_id: user.id,
        reel_id: reelId,
        watch_percent: newState.watchPercent,
        liked: newState.like,
        saved: newState.save,
        shared: newState.share,
        rewatched: newState.rewatch,
        commented: newState.comment,
        skipped: newState.skip,
      }, { onConflict: 'user_id,reel_id' }).then(({ error }) => {
        if (error) console.error('Failed to save interaction:', error.message);
      });
    }
  }, [user, isDemoMode, interactions]);

  const hasHistory = useMemo(() => {
    return Object.values(interactions).some((state) => {
      return state.like || state.save || state.share || state.rewatch || state.comment || state.watchPercent > 0;
    });
  }, [interactions]);

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysisSteps([]);
    setCurrentStep(-1);

    const steps = ANALYSIS_STEPS;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setAnalysisSteps((prev) => [...prev, steps[stepIndex]]);
        setCurrentStep(stepIndex);
        stepIndex++;
      } else {
        clearInterval(interval);
        const result = runFullAnalysis(interactions);
        setAnalysis(result);
        setIsAnalyzing(false);
        setCurrentStep(-1);
        toast.success('AI Analysis Complete', {
          description: `Detected Interest: ${result.detectedInterest} (${result.confidence} confidence)`,
        });

        // Persist results to Supabase
        if (user && !isDemoMode) {
          // Save interest profile
          supabase.from('interests').delete().eq('user_id', user.id).then(() => {
            const interestRows = result.interestProfile.map((i) => ({
              user_id: user.id,
              interest_name: i.name,
              score: i.score,
              confidence: i.confidence,
              trend: i.trend,
            }));
            if (interestRows.length > 0) {
              supabase.from('interests').insert(interestRows).then(({ error }) => {
                if (error) console.error('Failed to save interests:', error.message);
              });
            }
          });

          // Save recommendations
          supabase.from('recommendations').delete().eq('user_id', user.id).then(() => {
            const recRows = result.recommendations.map((rec, idx) => ({
              user_id: user.id,
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
            if (recRows.length > 0) {
              supabase.from('recommendations').insert(recRows).then(({ error }) => {
                if (error) console.error('Failed to save recommendations:', error.message);
              });
            }
          });
        }
      }
    }, 400);
  }, [interactions, user, isDemoMode]);

  const loadDemo = useCallback(() => {
    setInteractions(DEMO_INTERACTIONS);
    setHasColdStarted(true);
    setFeedback({});
    setInterestOverrides({});
    const result = runFullAnalysis(DEMO_INTERACTIONS);
    setAnalysis(result);

    // Persist demo interactions to Supabase
    if (user && !isDemoMode) {
      // Clear existing and insert demo
      supabase.from('interactions').delete().eq('user_id', user.id).then(() => {
        const inserts = Object.entries(DEMO_INTERACTIONS).map(([reelId, state]) =>
          supabase.from('interactions').upsert({
            user_id: user.id,
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
        Promise.all(inserts).then(() => {
          // Save analysis results
          supabase.from('interests').delete().eq('user_id', user.id).then(() => {
            const interestRows = result.interestProfile.map((i) => ({
              user_id: user.id,
              interest_name: i.name,
              score: i.score,
              confidence: i.confidence,
              trend: i.trend,
            }));
            if (interestRows.length > 0) {
              supabase.from('interests').insert(interestRows).then();
            }
          });
          supabase.from('recommendations').delete().eq('user_id', user.id).then(() => {
            const recRows = result.recommendations.map((rec, idx) => ({
              user_id: user.id,
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
            if (recRows.length > 0) {
              supabase.from('recommendations').insert(recRows).then();
            }
          });
        });
      });
    }

    toast.success('Demo scenario loaded', {
      description: 'Hackathon demo interactions have been restored.',
    });
  }, [user, isDemoMode]);

  const resetInteractions = useCallback(() => {
    setInteractions(EMPTY_INTERACTIONS);
    setHasColdStarted(false);
    setFeedback({});
    setInterestOverrides({});
    const result = runFullAnalysis(EMPTY_INTERACTIONS);
    setAnalysis(result);

    // Clear from Supabase
    if (user && !isDemoMode) {
      supabase.from('interactions').delete().eq('user_id', user.id).then();
      supabase.from('interests').delete().eq('user_id', user.id).then();
      supabase.from('recommendations').delete().eq('user_id', user.id).then();
      supabase.from('cold_start_selections').delete().eq('user_id', user.id).then();
    }

    toast.info('Interactions reset', {
      description: 'Choose 3 technology interests to personalize your feed.',
    });
  }, [user, isDemoMode]);

  const giveFeedback = useCallback((recommendationId: string, type: FeedbackType) => {
    setFeedback((prev) => ({ ...prev, [recommendationId]: type }));

    if (type === 'more_like_this') {
      setInterestOverrides((prev) => ({
        ...prev,
        [recommendationId]: (prev[recommendationId] || 0) + 10,
      }));
      toast.success('Interest profile updated', {
        description: 'Related interest weights have been increased.',
      });
    } else if (type === 'dont_recommend') {
      setInterestOverrides((prev) => ({
        ...prev,
        [recommendationId]: (prev[recommendationId] || 0) - 10,
      }));
      toast.success('Interest profile updated', {
        description: 'This topic\'s recommendation weight has been reduced.',
      });
    } else if (type === 'useful') {
      toast.success('Feedback recorded', {
        description: 'Thank you! This helps improve recommendations.',
      });
    } else if (type === 'not_relevant') {
      toast.info('Feedback recorded', {
        description: 'We\'ll reduce similar recommendations.',
      });
    }

    // Persist feedback to Supabase
    if (user && !isDemoMode) {
      // Find the recommendation UUID from the database
      supabase
        .from('recommendations')
        .select('id')
        .eq('user_id', user.id)
        .eq('candidate_id', recommendationId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            supabase.from('feedback').insert({
              user_id: user.id,
              recommendation_id: data.id,
              feedback_type: type,
            }).then(({ error }) => {
              if (error) console.error('Failed to save feedback:', error.message);
            });
          }
        });
    }
  }, [user, isDemoMode]);

  const applyColdStart = useCallback(() => {
    if (coldStartSelections.length < 3) {
      toast.error('Please select at least 3 interests');
      return;
    }

    const newInteractions = { ...EMPTY_INTERACTIONS };

    coldStartSelections.forEach((selection) => {
      const matchingReels = REELS.filter((r) =>
        r.topics.some((t) => t.toLowerCase().includes(selection.toLowerCase()))
      );
      matchingReels.forEach((reel) => {
        newInteractions[reel.id] = {
          ...newInteractions[reel.id],
          watchPercent: 85,
          like: true,
          save: true,
        };
      });
    });

    setInteractions(newInteractions);
    setHasColdStarted(true);
    const result = runFullAnalysis(newInteractions);
    setAnalysis(result);

    // Persist to Supabase
    if (user && !isDemoMode) {
      supabase.from('cold_start_selections').upsert({
        user_id: user.id,
        selections: coldStartSelections,
      }, { onConflict: 'user_id' }).then();

      // Clear old interactions and save new ones
      supabase.from('interactions').delete().eq('user_id', user.id).then(() => {
        const inserts = Object.entries(newInteractions)
          .filter(([, state]) => state.watchPercent > 0)
          .map(([reelId, state]) =>
            supabase.from('interactions').upsert({
              user_id: user.id,
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
        Promise.all(inserts).then();
      });
    }

    toast.success('Interest profile created', {
      description: `Selected ${coldStartSelections.length} interests. Feed personalized.`,
    });
  }, [coldStartSelections, user, isDemoMode]);

  const value: AppState = {
    interactions,
    setInteraction,
    resetInteractions,
    loadDemo,
    hasHistory,
    analysis,
    runAnalysis,
    isAnalyzing,
    analysisSteps,
    currentStep,
    feedback,
    giveFeedback,
    interestOverrides,
    coldStartSelections,
    setColdStartSelections,
    applyColdStart,
    hasColdStarted,
    syncWithDb,
    isSyncing,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
