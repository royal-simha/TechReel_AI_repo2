'use client';

import { DemoModeBar } from '@/components/demo-mode-bar';
import { useApp } from '@/lib/context';
import { COLD_START_OPTIONS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageContainer({ children }: { children: React.ReactNode }) {
  const { hasColdStarted } = useApp();

  if (!hasColdStarted) {
    return <ColdStart />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DemoModeBar />
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ColdStart() {
  const { coldStartSelections, setColdStartSelections, applyColdStart } = useApp();

  const toggle = (option: string) => {
    if (coldStartSelections.includes(option)) {
      setColdStartSelections(coldStartSelections.filter((s) => s !== option));
    } else if (coldStartSelections.length < 5) {
      setColdStartSelections([...coldStartSelections, option]);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="max-w-2xl w-full shadow-lg border-2">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-lg">
            <Check className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Choose Your Technology Interests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose 3 technology interests to personalize your feed. This helps TechReel AI understand what you care about before you start watching Reels.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {COLD_START_OPTIONS.map((option) => {
              const selected = coldStartSelections.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggle(option)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    selected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                      : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted'
                  )}
                >
                  {selected && <Check className="inline h-3.5 w-3.5 mr-1.5" />}
                  {option}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {coldStartSelections.length} selected (min 3, max 5)
            </span>
            <Button
              onClick={applyColdStart}
              disabled={coldStartSelections.length < 3}
              className="bg-gradient-to-r from-primary to-chart-4"
            >
              Create My Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
