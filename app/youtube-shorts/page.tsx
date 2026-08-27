'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageContainer, PageHeader } from '@/components/page-container';
import { useApp } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Youtube, Loader2, Search, Eye, ThumbsUp, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Short = {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  embedUrl: string;
};

export default function YouTubeShortsPage() {
  const { analysis } = useApp();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInterest, setActiveInterest] = useState(analysis.detectedInterest || 'AI');

  const fetchShorts = useCallback(async (query: string, interest: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) {
        params.set('query', query);
      } else {
        params.set('interest', interest);
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      const resp = await fetch(`${supabaseUrl}/functions/v1/youtube-shorts?${params}`, {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) {
        throw new Error(`Request failed (${resp.status})`);
      }
      const data = await resp.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (!Array.isArray(data.shorts)) {
        throw new Error('Unexpected response format');
      }
      setShorts(data.shorts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch shorts';
      setError(msg);
      setShorts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShorts('', activeInterest);
  }, [fetchShorts, activeInterest]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShorts(searchQuery, activeInterest);
  };

  const handleInterestChange = (interest: string) => {
    setActiveInterest(interest);
    setSearchQuery('');
  };

  const interestOptions = analysis.interestProfile.length > 0
    ? analysis.interestProfile.map((i) => i.name)
    : ['AI', 'Programming', 'Career', 'Cybersecurity', 'Cloud'];

  return (
    <PageContainer>
      <PageHeader
        title="YouTube Shorts"
        subtitle="Discover real YouTube Shorts matched to your technology interests."
      />

      {/* Search & Interest Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for tech shorts (e.g. 'python tips', 'cloud computing')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !searchQuery.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">Your interests:</span>
            {interestOptions.map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestChange(interest)}
                disabled={loading}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  activeInterest === interest && !searchQuery
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted'
                )}
              >
                {interest}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Failed to load shorts</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fetchShorts(searchQuery, activeInterest)}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-[9/16] bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shorts Grid */}
      {!loading && !error && shorts.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-bold">
                {searchQuery ? `Results for "${searchQuery}"` : `${activeInterest} Shorts`}
              </h2>
              <Badge variant="outline" className="text-[10px]">{shorts.length} videos</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchShorts(searchQuery, activeInterest)}
              disabled={loading}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shorts.map((short) => (
              <ShortCard key={short.videoId} short={short} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && shorts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No shorts found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term or interest filter.
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function ShortCard({ short }: { short: Short }) {
  const [expanded, setExpanded] = useState(false);

  const formatCount = (count: string) => {
    const n = parseInt(count, 10);
    if (isNaN(n)) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      {/* Video Embed */}
      <div className="relative aspect-[9/16] bg-black">
        <iframe
          src={short.embedUrl}
          title={short.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{short.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{short.channelTitle}</span>
          <span>·</span>
          <span>{formatDate(short.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatCount(short.viewCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {formatCount(short.likeCount)}
          </span>
        </div>
        {short.description && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline"
            >
              {expanded ? 'Show less' : 'Show description'}
            </button>
            {expanded && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                {short.description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
