import { Reel, InteractionState, Interest, InferenceStep } from '../types';
import { calculateInteractionScore } from './reelAnalyzer';

const INTEREST_HIERARCHY: Record<string, string> = {
  'Java': 'Programming',
  'Programming': 'Software Development',
  'Software Development': 'Software Engineering',
  'Developer Humor': 'Programming',
  'Coding Interviews': 'DSA',
  'DSA': 'Software Engineering',
  'Developer Lifestyle': 'Software Engineering',
  'Programming Career': 'Software Engineering',
  'Laptop': 'Developer Hardware',
  'Developer Hardware': 'Hardware',
  'Hardware': 'Hardware',
  'Gaming': 'Gaming',
  'PC': 'Gaming',
  'RGB': 'Gaming',
  'AI': 'AI',
  'Job Search': 'Career',
  'Cybersecurity': 'Cybersecurity',
  'Networking': 'Cybersecurity',
  'DDoS': 'Cybersecurity',
  'Cloud': 'Cloud Computing',
  'AWS': 'Cloud Computing',
  'Cloud Computing': 'Cloud Computing',
  'Web Development': 'Web Development',
  'System Design': 'Software Engineering',
  'Version Control': 'Software Engineering',
  'Data Structures & Algorithms': 'Software Engineering',
  'AI Tools': 'AI',
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Software Engineering': ['Java', 'Programming', 'Software Engineering', 'Developer Lifestyle', 'Programming Career', 'Coding Interviews', 'DSA', 'Software Development', 'System Design', 'Version Control', 'Data Structures & Algorithms'],
  'Programming': ['Java', 'Programming', 'Developer Humor', 'Version Control'],
  'Career': ['Software Engineering', 'Developer Lifestyle', 'Programming Career', 'Coding Interviews', 'Job Search', 'Career'],
  'Hardware': ['Laptop', 'Development', 'Hardware', 'Developer Hardware'],
  'AI': ['AI', 'AI Tools', 'Job Search'],
  'Cybersecurity': ['Cybersecurity', 'Networking', 'DDoS'],
  'Cloud': ['Cloud', 'AWS', 'Cloud Computing'],
  'Gaming': ['Gaming', 'PC', 'RGB'],
  'Web Development': ['Web Development', 'REST APIs'],
};

export function buildInferenceSteps(
  reels: Reel[],
  interactions: Record<string, InteractionState>
): InferenceStep[] {
  const steps: InferenceStep[] = [];
  const seen = new Set<string>();

  for (const reel of reels) {
    const { total } = calculateInteractionScore(interactions[reel.id]);
    if (total <= 0) continue;

    for (const topic of reel.topics) {
      let current = topic;
      const path: string[] = [current];
      while (INTEREST_HIERARCHY[current] && INTEREST_HIERARCHY[current] !== current) {
        current = INTEREST_HIERARCHY[current];
        path.push(current);
      }

      for (let i = 0; i < path.length - 1; i++) {
        const key = `${path[i]}->${path[i + 1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          steps.push({
            from: path[i],
            to: path[i + 1],
            reason: `Topic "${path[i]}" maps to broader category "${path[i + 1]}"`,
          });
        }
      }
    }
  }

  return steps;
}

export function calculateInterestProfile(
  reels: Reel[],
  interactions: Record<string, InteractionState>
): Interest[] {
  const domainScores: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};

  for (const reel of reels) {
    const { total } = calculateInteractionScore(interactions[reel.id]);
    if (total === 0) continue;

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matches = reel.topics.filter((t) => keywords.includes(t));
      if (matches.length > 0) {
        const contribution = (total / 15) * 100 * (matches.length / reel.topics.length);
        domainScores[domain] = (domainScores[domain] || 0) + contribution;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }
  }

  const interests: Interest[] = Object.entries(domainScores)
    .map(([name, score]) => {
      const normalized = Math.min(Math.round(score / Math.max(domainCounts[name], 1) * 1.2), 100);
      const count = domainCounts[name];
      let confidence: Interest['confidence'] = 'Low';
      if (count >= 3 && normalized >= 70) confidence = 'High';
      else if (count >= 2 && normalized >= 40) confidence = 'Medium';

      return {
        name,
        score: normalized,
        confidence,
        trend: normalized > 60 ? 'Increasing' : normalized < 30 ? 'Decreasing' : 'Stable',
      } as Interest;
    })
    .sort((a, b) => b.score - a.score);

  return interests;
}

export function inferBroaderInterest(interests: Interest[]): {
  detectedInterest: string;
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
} {
  if (interests.length === 0) {
    return {
      detectedInterest: 'Unknown',
      confidence: 'Low',
      explanation: 'No interaction data available to infer interests.',
    };
  }

  const top = interests[0];
  const highConfidenceCount = interests.filter((i) => i.confidence === 'High').length;
  const totalEngaged = interests.reduce((sum, i) => sum + i.score, 0);

  let confidence: 'High' | 'Medium' | 'Low' = 'Low';
  if (top.score >= 70 && highConfidenceCount >= 2) confidence = 'High';
  else if (top.score >= 40) confidence = 'Medium';

  const explanation =
    confidence === 'High'
      ? `The user's interactions span programming, coding interviews, software-engineering lifestyle, and developer hardware. These signals indicate a broader software-engineering interest rather than an isolated ${interests[0]?.name.toLowerCase() || 'topic'} preference.`
      : confidence === 'Medium'
      ? `The user shows moderate engagement across related topics, suggesting an emerging interest in ${top.name}.`
      : `Limited interaction data. The detected interest in ${top.name} is preliminary.`;

  return {
    detectedInterest: top.name,
    confidence,
    explanation,
  };
}
