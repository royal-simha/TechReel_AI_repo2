'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { REELS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function AIAnalysisPage() {
  const { analysis } = useApp();

  return (
    <PageContainer>
      <PageHeader
        title="AI Reel Analysis"
        subtitle="Deep analysis of each Reel's topics, intent, educational value, career relevance, and hype score."
      />

      <div className="grid gap-4">
        {REELS.map((reel) => {
          const isRejected = reel.qualityStatus === 'REJECTED';
          return (
            <Card key={reel.id} className={cn('shadow-sm', isRejected && 'border-destructive/30')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{reel.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">{reel.context}</CardDescription>
                  </div>
                  <QualityBadge status={reel.qualityStatus} reason={reel.qualityReason} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Topic Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label label="Primary Topic" value={reel.primaryTopic} />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Secondary Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {reel.secondaryTopics.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <Label label="Technology Domain" value={reel.technologyDomain} />
                    <Label label="Intent" value={reel.intent} />
                    <Label label="Difficulty" value={reel.difficulty} />
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    <MetricBar label="Educational Value" value={reel.educationalValue} color="bg-chart-2" />
                    <MetricBar label="Career Relevance" value={reel.careerRelevance} color="bg-chart-1" />
                    <MetricBar label="Entertainment Value" value={reel.entertainmentValue} color="bg-chart-3" />
                    <MetricBar label="Hype Score" value={reel.hypeScore} color={reel.hypeScore > 50 ? 'bg-destructive' : 'bg-warning'} />
                  </div>
                </div>

                {/* Quality Warning */}
                {isRejected && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">REJECTED</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reel.qualityReason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

function Label({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function QualityBadge({ status, reason }: { status: string; reason?: string }) {
  if (status === 'REJECTED') {
    return (
      <Badge variant="destructive" className="shrink-0">
        <XCircle className="h-3 w-3 mr-1" />
        REJECTED
      </Badge>
    );
  }
  if (status === 'REVIEW') {
    return (
      <Badge className="bg-warning text-warning-foreground shrink-0">
        <AlertTriangle className="h-3 w-3 mr-1" />
        REVIEW
      </Badge>
    );
  }
  return (
    <Badge className="bg-success/10 text-success border border-success/20 shrink-0">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      ACCEPTED
    </Badge>
  );
}
