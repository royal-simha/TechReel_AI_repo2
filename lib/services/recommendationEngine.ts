import { Reel, CandidateRecommendation } from '../types';

export function generateCandidates(
  detectedInterest: string,
  allCandidates: CandidateRecommendation[]
): CandidateRecommendation[] {
  return allCandidates.filter((c) => {
    if (detectedInterest === 'Software Engineering') {
      return ['Hardware', 'Web Development', 'DSA', 'HLD', 'Programming', 'Cloud', 'Career', 'AI'].includes(c.category);
    }
    if (detectedInterest === 'Programming') {
      return ['Programming', 'Web Development', 'DSA', 'HLD'].includes(c.category);
    }
    if (detectedInterest === 'Career') {
      return ['Career', 'Cloud', 'AI'].includes(c.category);
    }
    if (detectedInterest === 'Hardware') {
      return ['Hardware', 'Programming'].includes(c.category);
    }
    if (detectedInterest === 'AI') {
      return ['AI', 'Programming', 'Web Development'].includes(c.category);
    }
    if (detectedInterest === 'Cybersecurity') {
      return ['Cybersecurity', 'Cloud', 'Programming'].includes(c.category);
    }
    if (detectedInterest === 'Cloud') {
      return ['Cloud', 'Programming', 'Career'].includes(c.category);
    }
    return true;
  });
}

export function calculateSemanticSimilarity(
  candidate: CandidateRecommendation,
  detectedInterest: string
): number {
  const interestKeywords: Record<string, string[]> = {
    'Software Engineering': ['software', 'engineering', 'developer', 'programming', 'code', 'dsa', 'system', 'git', 'career', 'cloud', 'hardware', 'laptop', 'ai'],
    'Programming': ['programming', 'code', 'git', 'web', 'api', 'dsa'],
    'Career': ['career', 'job', 'team', 'cloud', 'ai'],
    'Hardware': ['hardware', 'laptop', 'developer', 'coding'],
    'AI': ['ai', 'productivity', 'developer', 'coding'],
    'Cybersecurity': ['cybersecurity', 'networking', 'cloud', 'programming'],
    'Cloud': ['cloud', 'aws', 'developer', 'career'],
    'Gaming': ['gaming', 'hardware', 'pc'],
  };

  const keywords = interestKeywords[detectedInterest] || [];
  const candidateText = `${candidate.title} ${candidate.topic} ${candidate.category}`.toLowerCase();
  const matches = keywords.filter((k) => candidateText.includes(k)).length;
  return Math.min((matches / keywords.length) * 100, 100);
}
