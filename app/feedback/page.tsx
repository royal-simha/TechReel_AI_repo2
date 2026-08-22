'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Heart, Ban, MessageSquare, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedbackType } from '@/lib/types';

const FEEDBACK_INFO: Record<FeedbackType, { label: string; icon: React.ElementType; description: string; color: string }> = {
  useful: { label: 'Useful', icon: ThumbsUp, description: 'Marks this recommendation as helpful. Reinforces current interest weights.', color: 'text-success' },
  not_relevant: { label: 'Not Relevant', icon: ThumbsDown, description: 'Reduces similar recommendations. Signals a mismatch with your interests.', color: 'text-muted-foreground' },
  more_like_this: { label: 'More Like This', icon: Heart, description: 'Increases related interest weights. Boosts similar content in future rankings.', color: 'text-destructive' },
  dont_recommend: { label: "Don't Recommend This Topic", icon: Ban, description: 'Reduces that topic\'s recommendation weight. Suppresses this category in rankings.', color: 'text-warning' },
};

export default function FeedbackPage() {
  const { analysis, feedback, giveFeedback } = useApp();

  const feedbackCount = Object.keys(feedback).length;
  const feedbackEntries = Object.entries(feedback);

  return (
    <PageContainer>
      <PageHeader
        title="Feedback"
        subtitle="Your feedback directly shapes the interest profile. Every action updates the AI's understanding of your preferences."
      />

      {/* Feedback Types Info */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Feedback Actions</CardTitle>
          <CardDescription>How each feedback type affects your interest profile</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(Object.keys(FEEDBACK_INFO) as FeedbackType[]).map((type) => {
            const info = FEEDBACK_INFO[type];
            const Icon = info.icon;
            return (
              <div key={type} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={cn('h-4 w-4', info.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feedback Given */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Your Feedback
            {feedbackCount > 0 && <Badge variant="secondary" className="text-[10px]">{feedbackCount} given</Badge>}
          </CardTitle>
          <CardDescription>
            {feedbackCount === 0
              ? 'No feedback given yet. Visit the Recommendations page to give feedback on specific Reels.'
              : 'Feedback you\'ve given on recommendations so far.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Info className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No feedback yet</p>
              <p className="text-xs text-muted-foreground mt-1">Give feedback on the Recommendations page to see it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbackEntries.map(([recId, type]) => {
                const rec = analysis.recommendations.find((r) => r.candidate.id === recId);
                const info = FEEDBACK_INFO[type];
                const Icon = info.icon;
                return (
                  <div key={recId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Icon className={cn('h-4 w-4 shrink-0', info.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec?.candidate.title || 'Unknown recommendation'}</p>
                      <p className="text-xs text-muted-foreground">{info.label}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{info.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Give Feedback on Recommendations */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Give Feedback</CardTitle>
          <CardDescription>Click a button to update your interest profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.recommendations.map((rec) => {
            const currentFeedback = feedback[rec.candidate.id];
            return (
              <div key={rec.candidate.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-medium">{rec.candidate.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.candidate.category} · Score: {rec.score.finalScore}</p>
                  </div>
                  {currentFeedback && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {FEEDBACK_INFO[currentFeedback].label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(Object.keys(FEEDBACK_INFO) as FeedbackType[]).map((type) => {
                    const info = FEEDBACK_INFO[type];
                    const Icon = info.icon;
                    const active = currentFeedback === type;
                    return (
                      <button
                        key={type}
                        onClick={() => giveFeedback(rec.candidate.id, type)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          active
                            ? 'border-primary/50 bg-primary/10 shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('h-3.5 w-3.5', active && info.color)} />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
