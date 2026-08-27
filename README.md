# TechReel AI

**Intelligent Technology Reel Recommendation Agent**

TechReel AI analyzes simulated Reel interactions to infer a user's broader technology interests — not just the topic they watched, but what their behavior suggests they actually care about.

## Problem

Traditional recommendation systems suggest content based on surface-level signals (e.g., "you watched Java, here's more Java"). This misses the bigger picture: a student watching Java memes, coding interview content, and developer lifestyle Reels isn't just interested in Java — they're interested in **Software Engineering** as a career.

## Solution

TechReel AI uses a multi-stage analysis pipeline:

1. **Reel Interaction** — Users interact with Reels (watch, like, save, share, rewatch, comment, skip)
2. **Interaction Scoring** — Each interaction is weighted (Save = +5, Rewatch = +4, etc.)
3. **AI Content Analysis** — Each Reel is analyzed for topics, domain, intent, educational value, hype score
4. **Broader Interest Inference** — Topics are mapped through a hierarchy (Java → Programming → Software Development → Software Engineering)
5. **Interest Profile** — Dynamic scores across 8 technology domains
6. **Candidate Generation** — Relevant recommendation candidates are generated
7. **Hype Filter** — Clickbait and unrealistic claims are rejected (e.g., "10 AI Tools That Will Get You a Job" = REJECTED)
8. **Ranking** — Weighted scoring with diversity penalties
9. **Recommendation** — The best candidate is recommended with full explanation
10. **Feedback** — User feedback adjusts the interest profile for future recommendations

## Features

- **Authentication** — Sign up, login, logout via Supabase Auth
- **Demo Mode** — Judges can launch the full hackathon demo without creating an account
- **Cold Start** — New users select 3+ interests to personalize their feed
- **8 Fictional Reels** — Pre-seeded with realistic technology content
- **8 Recommendation Candidates** — Diverse technology topics with full scoring
- **Interaction Scoring** — Weighted scoring from 7 interaction types
- **Interest Inference** — Hierarchical topic mapping with broader interest detection
- **Hype Filter** — Detects clickbait, unrealistic claims, and low-quality content
- **Explainable AI** — "Why this?" button with evidence-based reasoning
- **Confidence Scoring** — High/Medium/Low based on signal strength and consistency
- **Feedback System** — 4 feedback types that adjust future recommendations
- **Interest Graph** — Visual representation of topic-to-interest mapping
- **Score Breakdown** — Full transparency into recommendation scoring
- **Dark/Light Theme** — Modern, responsive UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 13, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide React |
| Backend | Next.js server actions, Supabase Edge Functions |
| Database | Supabase (PostgreSQL with Row Level Security) |
| Authentication | Supabase Auth (email/password) |
| AI | Gemini API (optional, with deterministic demo fallback) |
| Deployment | Vercel-ready |

## Database Schema

- **profiles** — User profile data (auto-created on signup)
- **reels** — 8 fictional Reel records (shared, read-only)
- **interactions** — User interactions with Reels (owner-scoped)
- **reel_analysis** — Cached AI analysis of Reels
- **interests** — User's dynamic interest profile (owner-scoped)
- **recommendations** — Generated recommendations (owner-scoped)
- **feedback** — User feedback on recommendations (owner-scoped)
- **cold_start_selections** — Initial interest selections (owner-scoped)

All user-specific tables use Row Level Security with `auth.uid()` ownership checks.

## Recommendation Algorithm

```
Final Score = 0.35 × Interest Match
            + 0.20 × Semantic Similarity
            + 0.15 × Educational Value
            + 0.10 × Career Relevance
            + 0.10 × Content Quality
            + 0.05 × Novelty
            + 0.05 × Engagement Potential
            - 0.20 × Hype Score
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Building

```bash
npm run build
npm start
```

## Demo Flow

1. Click **"Launch Hackathon Demo"** on the login page
2. The demo loads with pre-configured interactions:
   - Java Meme: 95% watch + Like + Save + Rewatch
   - Software Engineer Lifestyle: 92% watch + Save + Rewatch
   - Coding Interview: 90% watch + Like + Rewatch
   - Laptop Comparison: 87% watch + Save
   - Gaming Setup: 18% watch (negative signal)
3. Click **"Run AI Analysis"** to see the full pipeline
4. The system detects: **Software Engineering** (High confidence)
5. Top recommendation: **"How Developers Choose the Right Laptop for Coding"**
6. Click **"Why this?"** for the full explanation
7. View the **Hype Filter** rejecting "10 AI Tools That Will Get You a Job"
8. Try the **Feedback** buttons to see how they affect recommendations
9. Click **Reset** to test the cold start flow

## Architecture

```
app/
  auth/           — Login and signup pages
  page.tsx        — Dashboard
  reel-activity/  — Reel interaction page
  ai-analysis/    — AI analysis page
  recommendations/ — Recommendations page
  interest-profile/ — Interest profile page
  explainable-ai/  — Explainability page
  feedback/       — Feedback page
  settings/       — Settings page
components/
  ui/             — shadcn/ui components
  sidebar.tsx     — Navigation sidebar
  route-guard.tsx — Auth route protection
  app-shell.tsx   — Layout wrapper
  cold-start.tsx  — Cold start onboarding
  demo-mode-bar.tsx — Demo controls bar
lib/
  services/       — Business logic modules
  context.tsx     — App state provider
  auth-context.tsx — Auth state provider
  supabase-client.ts — Supabase client
  analysis.ts     — Analysis pipeline orchestrator
  data.ts          — Reel and candidate data
  types.ts         — TypeScript types
```

## Services

- **reelAnalyzer** — Interaction scoring with weighted points
- **interestEngine** — Hierarchical interest inference and profile calculation
- **recommendationEngine** — Candidate generation and semantic similarity
- **qualityFilter** — Hype detection and content quality assessment
- **rankingEngine** — Weighted scoring with diversity penalties
- **explanationEngine** — Evidence-based explanation generation

## License

MIT
