export type Category =
  | 'Programming Meme'
  | 'Career'
  | 'Hardware'
  | 'Gaming'
  | 'AI / Career'
  | 'Cybersecurity'
  | 'Cloud'
  | 'Web Development'
  | 'DSA'
  | 'HLD'
  | 'AI'
  | 'Programming';

export type InteractionState = {
  watchPercent: number;
  like: boolean;
  save: boolean;
  share: boolean;
  rewatch: boolean;
  comment: boolean;
  skip: boolean;
};

export type Reel = {
  id: string;
  title: string;
  category: Category;
  topics: string[];
  primaryTopic: string;
  secondaryTopics: string[];
  technologyDomain: string;
  context: string;
  intent: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  educationalValue: number;
  careerRelevance: number;
  entertainmentValue: number;
  hypeScore: number;
  qualityStatus: 'ACCEPTED' | 'REJECTED' | 'REVIEW';
  qualityReason?: string;
};

export type Interaction = {
  reelId: string;
  state: InteractionState;
};

export type Interest = {
  name: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  trend: 'Increasing' | 'Decreasing' | 'Stable';
};

export type CandidateRecommendation = {
  id: string;
  title: string;
  category: Category;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  educationalValue: number;
  careerRelevance: number;
  contentQuality: number;
  novelty: number;
  engagementPotential: number;
  hypeScore: number;
};

export type ScoreBreakdown = {
  interestMatch: number;
  semanticSimilarity: number;
  educationalValue: number;
  careerRelevance: number;
  contentQuality: number;
  novelty: number;
  engagementPotential: number;
  hypePenalty: number;
  finalScore: number;
};

export type Recommendation = {
  candidate: CandidateRecommendation;
  score: ScoreBreakdown;
  reason: string;
  feedback?: FeedbackType;
};

export type FeedbackType = 'useful' | 'not_relevant' | 'more_like_this' | 'dont_recommend';

export type FeedbackRecord = {
  recommendationId: string;
  type: FeedbackType;
  timestamp: number;
};

export type InferenceStep = {
  from: string;
  to: string;
  reason: string;
};

export type AnalysisResult = {
  detectedInterest: string;
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
  inferenceSteps: InferenceStep[];
  interestProfile: Interest[];
  recommendations: Recommendation[];
  rejectedReels: { reel: Reel; reason: string }[];
};
