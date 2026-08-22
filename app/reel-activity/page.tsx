'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Bookmark, Share2, RotateCw, MessageSquare, SkipForward, Film, AlertTriangle } from 'lucide-react';
import { REELS } from '@/lib/data';
import { calculateInteractionScore } from '@/lib/services/reelAnalyzer';
import { cn } from '@/lib/utils';

export default function ReelActivityPage() {
  const { interactions, setInteraction } = useApp();

  return (
    <PageContainer>
      <PageHeader
        title="Reel Activity"
        subtitle="Simulated short-form Reel interactions. Adjust the controls to see how the AI updates your interest profile in real time."
      />

      <div className="grid gap-4">
        {REELS.map((reel) => {
          const state = interactions[reel.id];
          const { total, breakdown } = calculateInteractionScore(state);
          const isRejected = reel.qualityStatus === 'REJECTED';

          return (
            <Card key={reel.id} className={cn('shadow-sm transition-all', isRejected && 'border-destructive/30')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-chart-4/20 flex items-center justify-center shrink-0">
                      <Film className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{reel.title}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{reel.category}</Badge>
                        {reel.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-[10px]">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isRejected && (
                    <Badge variant="destructive" className="shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {reel.qualityReason}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Watch Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Watch Percentage</span>
                    <span className={cn(
                      'text-xs font-bold tabular-nums',
                      state.watchPercent > 80 ? 'text-success' :
                      state.watchPercent >= 50 ? 'text-warning' :
                      state.watchPercent > 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {state.watchPercent}%
                    </span>
                  </div>
                  <Slider
                    value={[state.watchPercent]}
                    onValueChange={(v) => setInteraction(reel.id, { watchPercent: v[0] })}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                {/* Interaction Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <InteractionToggle
                    icon={Heart}
                    label="Like"
                    active={state.like}
                    onChange={(v) => setInteraction(reel.id, { like: v })}
                    color="text-destructive"
                  />
                  <InteractionToggle
                    icon={Bookmark}
                    label="Save"
                    active={state.save}
                    onChange={(v) => setInteraction(reel.id, { save: v })}
                    color="text-primary"
                  />
                  <InteractionToggle
                    icon={Share2}
                    label="Share"
                    active={state.share}
                    onChange={(v) => setInteraction(reel.id, { share: v })}
                    color="text-chart-2"
                  />
                  <InteractionToggle
                    icon={RotateCw}
                    label="Rewatch"
                    active={state.rewatch}
                    onChange={(v) => setInteraction(reel.id, { rewatch: v })}
                    color="text-chart-3"
                  />
                  <InteractionToggle
                    icon={MessageSquare}
                    label="Comment"
                    active={state.comment}
                    onChange={(v) => setInteraction(reel.id, { comment: v })}
                    color="text-chart-4"
                  />
                  <InteractionToggle
                    icon={SkipForward}
                    label="Skip"
                    active={state.skip}
                    onChange={(v) => setInteraction(reel.id, { skip: v })}
                    color="text-muted-foreground"
                  />
                </div>

                {/* Score Breakdown */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interaction Score</span>
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      total > 10 ? 'text-success' :
                      total > 0 ? 'text-warning' :
                      total < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {total > 0 ? '+' : ''}{total}
                    </span>
                  </div>
                  {breakdown.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {breakdown.map((b) => (
                        <span
                          key={b.label}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium',
                            b.points > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {b.label} {b.points > 0 ? '+' : ''}{b.points}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No interactions recorded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

function InteractionToggle({
  icon: Icon,
  label,
  active,
  onChange,
  color,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onChange(!active)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
            active
              ? 'border-primary/50 bg-primary/10 text-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', active && color)} />
          {label}
          <span className={cn('ml-auto h-2 w-2 rounded-full transition-colors', active ? 'bg-primary' : 'bg-muted-foreground/30')} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Toggle {label}</TooltipContent>
    </Tooltip>
  );
}
