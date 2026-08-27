'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check } from 'lucide-react';
import { COLD_START_OPTIONS } from '@/lib/data';
import { cn } from '@/lib/utils';

export function ColdStart() {
  const { coldStartSelections, setColdStartSelections, applyColdStart } = useApp();
  const [localSelections, setLocalSelections] = useState<string[]>(coldStartSelections);

  const toggle = (option: string) => {
    setLocalSelections((prev) =>
      prev.includes(option)
        ? prev.filter((s) => s !== option)
        : prev.length < 5
          ? [...prev, option]
          : prev
    );
  };

  const handleApply = () => {
    setColdStartSelections(localSelections);
    applyColdStart();
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Choose Your Technology Interests
        </CardTitle>
        <CardDescription>
          Select at least 3 interests to personalize your feed. This helps TechReel AI understand what you care about.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {COLD_START_OPTIONS.map((option) => {
            const selected = localSelections.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggle(option)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {localSelections.length} selected
          </Badge>
          <Button
            onClick={handleApply}
            disabled={localSelections.length < 3}
            className="bg-gradient-to-r from-primary to-chart-4 hover:opacity-90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Personalize My Feed
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
