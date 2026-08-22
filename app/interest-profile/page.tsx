'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InterestProfilePage() {
  const { analysis } = useApp();

  return (
    <PageContainer>
      <PageHeader
        title="Interest Profile"
        subtitle="Your dynamic technology interest profile, updated in real time as you interact with Reels."
      />

      {/* Detected Interest Banner */}
      <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-md">
              <Brain className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Detected Interest</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl font-bold">{analysis.detectedInterest}</h2>
                <Badge className={
                  analysis.confidence === 'High' ? 'bg-success text-success-foreground' :
                  analysis.confidence === 'Medium' ? 'bg-warning text-warning-foreground' :
                  'bg-muted-foreground text-background'
                }>
                  {analysis.confidence}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Cards Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {analysis.interestProfile.map((interest, idx) => (
          <Card key={interest.name} className={cn('shadow-sm transition-all hover:shadow-md', idx === 0 && 'border-primary/30')}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{interest.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className={cn(
                      'text-[10px]',
                      interest.confidence === 'High' ? 'border-success/30 text-success' :
                      interest.confidence === 'Medium' ? 'border-warning/30 text-warning' :
                      'border-muted-foreground/30 text-muted-foreground'
                    )}>
                      {interest.confidence} confidence
                    </Badge>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      {interest.trend === 'Increasing' && <TrendingUp className="h-3 w-3 text-success" />}
                      {interest.trend === 'Decreasing' && <TrendingDown className="h-3 w-3 text-destructive" />}
                      {interest.trend === 'Stable' && <Minus className="h-3 w-3 text-muted-foreground" />}
                      {interest.trend}
                    </span>
                    {interest.trend === 'Increasing' && <span className="text-success text-[10px]">↑</span>}
                    {interest.trend === 'Decreasing' && <span className="text-destructive text-[10px]">↓</span>}
                  </div>
                </div>
                <span className={cn(
                  'text-2xl font-bold tabular-nums',
                  interest.score > 70 ? 'text-success' :
                  interest.score > 40 ? 'text-warning' :
                  'text-muted-foreground'
                )}>
                  {interest.score}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    interest.score > 70 ? 'bg-success' :
                    interest.score > 40 ? 'bg-warning' :
                    'bg-muted-foreground'
                  )}
                  style={{ width: `${interest.score}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confidence System Explanation */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Confidence System</CardTitle>
          <CardDescription>How TechReel AI determines confidence levels</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <ConfidenceCard
            level="High"
            color="success"
            conditions={['Multiple strong interactions', 'Consistent semantic theme', 'Clear interest cluster']}
          />
          <ConfidenceCard
            level="Medium"
            color="warning"
            conditions={['Some related content', 'Mixed signals', 'Partial engagement']}
          />
          <ConfidenceCard
            level="Low"
            color="muted"
            conditions={['Very little interaction data', 'Conflicting interests', 'Insufficient signals']}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function ConfidenceCard({ level, color, conditions }: { level: string; color: string; conditions: string[] }) {
  const colorMap: Record<string, string> = {
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    muted: 'border-border bg-muted/30',
  };

  return (
    <div className={cn('rounded-lg border p-4 space-y-2', colorMap[color])}>
      <Badge className={
        color === 'success' ? 'bg-success text-success-foreground' :
        color === 'warning' ? 'bg-warning text-warning-foreground' :
        'bg-muted-foreground text-background'
      }>
        {level} Confidence
      </Badge>
      <ul className="space-y-1">
        {conditions.map((c) => (
          <li key={c} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="mt-0.5">•</span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
