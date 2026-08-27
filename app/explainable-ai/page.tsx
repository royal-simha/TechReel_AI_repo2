'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ArrowRight, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { REELS } from '@/lib/data';
import { calculateInteractionScore } from '@/lib/services/reelAnalyzer';
import { generateExplanation, generateConfidenceExplanation } from '@/lib/services/explanationEngine';
import { cn } from '@/lib/utils';

export default function ExplainableAIPage() {
  const { analysis, interactions } = useApp();
  const topRec = analysis.recommendations[0];

  const engagedReels = REELS.filter((r) => calculateInteractionScore(interactions[r.id]).total > 0);
  const reasons = topRec ? generateExplanation(topRec, REELS, interactions, analysis.detectedInterest) : [];
  const confidenceExplanation = generateConfidenceExplanation(analysis.interestProfile, analysis.confidence);

  return (
    <PageContainer>
      <PageHeader
        title="Explainable AI"
        subtitle="Understand exactly why TechReel AI inferred your interests and recommended specific content."
      />

      {/* Why This? Section */}
      {topRec && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Why this recommendation?
            </CardTitle>
            <CardDescription>
              Evidence-based reasoning for: <span className="font-semibold text-foreground">{topRec.candidate.title}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                    idx === reasons.length - 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm">{reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interest Inference Graph */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Interest Inference Graph
          </CardTitle>
          <CardDescription>How individual topics are hierarchically inferred into broader interests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.inferenceSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{step.from}</Badge>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs">{step.to}</Badge>
                <span className="text-[10px] text-muted-foreground hidden md:block">{step.reason}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evidence Cards */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Evidence Cards</CardTitle>
          <CardDescription>Connected evidence from your Reel interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {engagedReels.map((reel) => {
              const { total } = calculateInteractionScore(interactions[reel.id]);
              return (
                <div key={reel.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium">{reel.title}</h4>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{reel.category}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reel.topics.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Score:</span>
                    <span className={cn(
                      'text-xs font-bold',
                      total > 10 ? 'text-success' : total > 0 ? 'text-warning' : 'text-destructive'
                    )}>
                      {total > 0 ? '+' : ''}{total}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-primary">{reel.primaryTopic}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confidence Explanation */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Confidence Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Badge className={
              analysis.confidence === 'High' ? 'bg-success text-success-foreground' :
              analysis.confidence === 'Medium' ? 'bg-warning text-warning-foreground' :
              'bg-muted-foreground text-background'
            }>
              {analysis.confidence}
            </Badge>
            <p className="text-sm text-muted-foreground flex-1">{confidenceExplanation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Core Message */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-semibold leading-relaxed">
                "We don't recommend what the student watched. We recommend what the student's behavior suggests they actually care about."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
