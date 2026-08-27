'use client';

import { useApp } from '@/lib/context';
import { Zap, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DemoModeBar() {
  const { runAnalysis, isAnalyzing, loadDemo, resetInteractions, analysis } = useApp();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="h-5 w-5 text-warning" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-warning">DEMO MODE</span>
              <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                Pre-loaded scenario
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detected: <span className="font-semibold text-foreground">{analysis.detectedInterest}</span> · Confidence: <span className="font-semibold text-foreground">{analysis.confidence}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={resetInteractions} className="h-8 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all interactions to test cold start</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="outline" size="sm" onClick={loadDemo} className="h-8 text-xs">
          Load Demo
        </Button>
        <Button
          size="sm"
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="h-8 text-xs bg-gradient-to-r from-primary to-chart-4 hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </Button>
      </div>
    </div>
  );
}
