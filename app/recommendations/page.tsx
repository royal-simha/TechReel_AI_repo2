'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, ChevronDown, ChevronUp, ArrowRight, Brain, Filter, ThumbsUp, ThumbsDown, Heart, Ban } from 'lucide-react';
import { REELS } from '@/lib/data';
import { calculateInteractionScore } from '@/lib/services/reelAnalyzer';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { FeedbackType } from '@/lib/types';

export default function RecommendationsPage() {
  const { analysis, interactions, feedback, giveFeedback } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentReel = REELS.find((r) => calculateInteractionScore(interactions[r.id]).total > 0);
  const topRec = analysis.recommendations[0];

  return (
    <PageContainer>
      <PageHeader
        title="Recommendations"
        subtitle="AI-ranked technology Reels based on your inferred interests — not just what you watched."
      />

      {/* Main Recommendation Flow */}
      {currentReel && topRec && (
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-card to-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* Current Reel */}
              <div className="flex-1 w-full">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Current Reel</p>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-sm">{currentReel.title}</h3>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{currentReel.category}</Badge>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">AI Infers</span>
              </div>

              {/* Detected Interest */}
              <div className="flex-1 w-full">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Interest Detected</p>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <h3 className="font-bold text-base text-primary">{analysis.detectedInterest}</h3>
                  <Badge className={cn(
                    'mt-2',
                    analysis.confidence === 'High' ? 'bg-success text-success-foreground' :
                    'bg-warning text-warning-foreground'
                  )}>
                    {analysis.confidence} Confidence
                  </Badge>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary rotate-90 md:rotate-0" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Recommends</span>
              </div>

              {/* Recommended Reel */}
              <div className="flex-1 w-full">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Recommended Tech Reel</p>
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                  <h3 className="font-semibold text-sm">{topRec.candidate.title}</h3>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{topRec.candidate.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{topRec.candidate.difficulty}</Badge>
                    <Badge className="bg-success/10 text-success border border-success/20 text-[10px]">
                      Score: {topRec.score.finalScore}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Ranked Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Ranked Recommendations</h2>
          <Badge variant="outline" className="text-[10px]">{analysis.recommendations.length} candidates</Badge>
        </div>

        {analysis.recommendations.map((rec, idx) => {
          const isExpanded = expandedId === rec.candidate.id;
          const currentFeedback = feedback[rec.candidate.id];

          return (
            <Card key={rec.candidate.id} className="shadow-sm transition-all">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold',
                      idx === 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{rec.candidate.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{rec.candidate.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">{rec.candidate.difficulty}</Badge>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-bold text-primary">Score: {rec.score.finalScore}</span>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs h-8 shrink-0">View Score</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-base">Score Breakdown</DialogTitle>
                      </DialogHeader>
                      <ScoreBreakdownView score={rec.score} title={rec.candidate.title} />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Feedback Buttons */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <FeedbackButton
                    type="useful"
                    label="Useful"
                    icon={ThumbsUp}
                    active={currentFeedback === 'useful'}
                    onClick={() => giveFeedback(rec.candidate.id, 'useful')}
                    color="text-success"
                  />
                  <FeedbackButton
                    type="not_relevant"
                    label="Not Relevant"
                    icon={ThumbsDown}
                    active={currentFeedback === 'not_relevant'}
                    onClick={() => giveFeedback(rec.candidate.id, 'not_relevant')}
                    color="text-muted-foreground"
                  />
                  <FeedbackButton
                    type="more_like_this"
                    label="More Like This"
                    icon={Heart}
                    active={currentFeedback === 'more_like_this'}
                    onClick={() => giveFeedback(rec.candidate.id, 'more_like_this')}
                    color="text-destructive"
                  />
                  <FeedbackButton
                    type="dont_recommend"
                    label="Don't Recommend"
                    icon={Ban}
                    active={currentFeedback === 'dont_recommend'}
                    onClick={() => giveFeedback(rec.candidate.id, 'dont_recommend')}
                    color="text-warning"
                  />
                </div>

                {/* Expandable Reason */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rec.candidate.id)}
                  className="flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
                >
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {isExpanded ? 'Hide reasoning' : 'Show reasoning'}
                </button>
                {isExpanded && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 animate-fade-in">
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quality Filter Info */}
      {analysis.rejectedReels.length > 0 && (
        <Card className="border-destructive/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-destructive" />
              Filtered Out by Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.rejectedReels.map(({ reel, reason }) => (
              <div key={reel.id} className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{reel.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
                </div>
                <Badge variant="destructive" className="shrink-0 text-[10px]">REJECTED</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function ScoreBreakdownView({ score, title }: { score: any; title: string }) {
  const items = [
    { label: 'Interest Match (×0.35)', value: score.interestMatch, weight: 0.35 },
    { label: 'Semantic Similarity (×0.20)', value: score.semanticSimilarity, weight: 0.20 },
    { label: 'Educational Value (×0.15)', value: score.educationalValue, weight: 0.15 },
    { label: 'Career Relevance (×0.10)', value: score.careerRelevance, weight: 0.10 },
    { label: 'Content Quality (×0.10)', value: score.contentQuality, weight: 0.10 },
    { label: 'Novelty (×0.05)', value: score.novelty, weight: 0.05 },
    { label: 'Engagement Potential (×0.05)', value: score.engagementPotential, weight: 0.05 },
    { label: 'Hype Penalty (×0.20)', value: score.hypePenalty, weight: 0.20, isPenalty: true },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={cn('font-bold tabular-nums', item.isPenalty ? 'text-destructive' : 'text-foreground')}>
              {item.isPenalty ? '-' : ''}{item.value}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full', item.isPenalty ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${Math.min(item.value, 100)}%` }}
            />
          </div>
        </div>
      ))}
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <span className="text-sm font-bold">Final Score</span>
        <span className="text-lg font-bold text-primary tabular-nums">{score.finalScore}</span>
      </div>
    </div>
  );
}

function FeedbackButton({
  label,
  icon: Icon,
  active,
  onClick,
  color,
}: {
  type: FeedbackType;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-primary/50 bg-primary/10 shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', active && color)} />
      {label}
    </button>
  );
}
