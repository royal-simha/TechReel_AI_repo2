import { Reel, CandidateRecommendation } from '../types';

export type QualityResult = {
  status: 'ACCEPTED' | 'REJECTED' | 'REVIEW';
  reason: string;
  hypeScore: number;
  educationalValue: number;
};

export function evaluateQuality(item: { hypeScore: number; educationalValue: number; title: string; category: string }): QualityResult {
  const hypeTriggers = [
    'will get you a job',
    'guaranteed',
    '10x',
    'secret',
    'nobody tells you',
    'always',
    'never fail',
    '100%',
    'instant',
    'easy money',
  ];

  const titleLower = item.title.toLowerCase();
  const hasHypeTrigger = hypeTriggers.some((t) => titleLower.includes(t));

  if (item.hypeScore >= 80 || hasHypeTrigger) {
    return {
      status: 'REJECTED',
      reason: 'High hype and unrealistic career-outcome claim.',
      hypeScore: item.hypeScore,
      educationalValue: item.educationalValue,
    };
  }

  if (item.hypeScore >= 50) {
    return {
      status: 'REVIEW',
      reason: 'Moderate hype detected. Review before recommending.',
      hypeScore: item.hypeScore,
      educationalValue: item.educationalValue,
    };
  }

  return {
    status: 'ACCEPTED',
    reason: 'Content meets quality standards.',
    hypeScore: item.hypeScore,
    educationalValue: item.educationalValue,
  };
}

export function filterReelsByQuality(reels: Reel[]): { accepted: Reel[]; rejected: { reel: Reel; reason: string }[] } {
  const accepted: Reel[] = [];
  const rejected: { reel: Reel; reason: string }[] = [];

  for (const reel of reels) {
    const result = evaluateQuality(reel);
    if (result.status === 'REJECTED') {
      rejected.push({ reel, reason: result.reason });
    } else {
      accepted.push(reel);
    }
  }

  return { accepted, rejected };
}

export function filterCandidatesByQuality(candidates: CandidateRecommendation[]): CandidateRecommendation[] {
  return candidates.filter((c) => evaluateQuality(c).status !== 'REJECTED');
}
