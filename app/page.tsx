'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Sparkles, ArrowRight, Film, Target } from 'lucide-react';
import { REELS } from '@/lib/data';
import { calculateInteractionScore } from '@/lib/services/reelAnalyzer';
import Link from 'next/link';
import { ColdStart } from '@/components/cold-start';

const INTEREST_COLORS: Record<string, string> = {
  'Software Engineering': 'bg-chart-1',
  'Programming': 'bg-chart-2',
  'Career': 'bg-chart-3',
  'Hardware': 'bg-chart-4',
  'AI': 'bg-chart-5',
  'Cybersecurity': 'bg-destructive',
  'Cloud': 'bg-primary',
  'Gaming': 'bg-warning',
};

export default function DashboardPage() {
  const { analysis, interactions, hasColdStarted } = useApp();

  const topRecommendation = analysis.recommendations[0];
  const engagedCount = REELS.filter((r) => calculateInteractionScore(interactions[r.id]).total > 0).length;
  const rejectedCount = analysis.rejectedReels.length;

  if (!hasColdStarted) {
    return (
      <PageContainer>
        <PageHeader
          title="Welcome to TechReel AI"
          subtitle="Let's personalize your experience. Choose your technology interests to get started."
        />
        <ColdStart />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Your Technology Interest"
        subtitle="TechReel AI analyzes your Reel behavior to understand what you actually care about."
      />

      {/* AI Insight Banner */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-md">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current AI Insight</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{analysis.detectedInterest}</span>
                  <Badge className={
                    analysis.confidence === 'High' ? 'bg-success text-success-foreground' :
                    analysis.confidence === 'Medium' ? 'bg-warning text-warning-foreground' :
                    'bg-muted-foreground text-background'
                  }>
                    {analysis.confidence} Confidence
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Film className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Reels Analyzed</span>
            </div>
            <p className="text-2xl font-bold">{REELS.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Engaged</span>
            </div>
            <p className="text-2xl font-bold">{engagedCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-chart-4" />
              <span className="text-xs text-muted-foreground">Recommendations</span>
            </div>
            <p className="text-2xl font-bold">{analysis.recommendations.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Filtered (Hype)</span>
            </div>
            <p className="text-2xl font-bold">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Interest Cards */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Interest Profile</CardTitle>
          <CardDescription>Major technology interests detected from your Reel activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.interestProfile.map((interest) => (
            <div key={interest.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{interest.name}</span>
                  {interest.trend === 'Increasing' && (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  )}
                  {interest.trend === 'Decreasing' && (
                    <TrendingUp className="h-3.5 w-3.5 text-destructive rotate-180" />
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums">{interest.score}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${INTEREST_COLORS[interest.name] || 'bg-primary'}`}
                  style={{ width: `${interest.score}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Recommendation Preview */}
      {topRecommendation && (
        <Card className="shadow-md border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Top Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-base">{topRecommendation.candidate.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{topRecommendation.candidate.category}</Badge>
                  <Badge variant="outline">{topRecommendation.candidate.difficulty}</Badge>
                  <Badge className="bg-success/10 text-success border-success/20">
                    Score: {topRecommendation.score.finalScore}
                  </Badge>
                </div>
              </div>
              <Link href="/recommendations">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
                  View all <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
