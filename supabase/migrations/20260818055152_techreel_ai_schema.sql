/*
# TechReel AI — Full Database Schema

## Overview
Creates the complete database schema for TechReel AI, an intelligent technology Reel recommendation agent.
This schema stores reels, user interactions, AI analysis, interest profiles, recommendations, and feedback.

## New Tables

1. **profiles** — User profile data (extends Supabase auth.users)
   - `id` (uuid, PK, references auth.users)
   - `email` (text)
   - `display_name` (text)
   - `role` (text, default 'student')
   - `created_at`, `updated_at` (timestamps)

2. **reels** — Fictional Reel dataset (shared, read-only for users)
   - `id` (text, PK — uses stable IDs like 'reel-1')
   - `title` (text)
   - `category` (text)
   - `topics` (text[])
   - `primary_topic` (text)
   - `secondary_topics` (text[])
   - `technology_domain` (text)
   - `context` (text)
   - `intent` (text)
   - `difficulty` (text)
   - `educational_value` (int)
   - `career_relevance` (int)
   - `entertainment_value` (int)
   - `hype_score` (int)
   - `quality_status` (text)
   - `quality_reason` (text, nullable)

3. **interactions** — User interactions with reels
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `reel_id` (text, references reels)
   - `watch_percent` (int, default 0)
   - `liked` (bool, default false)
   - `saved` (bool, default false)
   - `shared` (bool, default false)
   - `rewatched` (bool, default false)
   - `commented` (bool, default false)
   - `skipped` (bool, default false)
   - `created_at`, `updated_at` (timestamps)
   - Unique constraint on (user_id, reel_id)

4. **reel_analysis** — Cached AI analysis of reels
   - `id` (uuid, PK)
   - `reel_id` (text, references reels)
   - `analysis_data` (jsonb — full structured analysis)
   - `analysis_source` (text — 'gemini' or 'demo')
   - `created_at` (timestamp)

5. **interests** — User's dynamic interest profile
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `interest_name` (text)
   - `score` (int)
   - `confidence` (text)
   - `trend` (text)
   - `created_at`, `updated_at` (timestamps)
   - Unique constraint on (user_id, interest_name)

6. **recommendations** — Generated recommendations for users
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `candidate_id` (text)
   - `candidate_title` (text)
   - `candidate_category` (text)
   - `candidate_topic` (text)
   - `candidate_difficulty` (text)
   - `score_breakdown` (jsonb — full scoring components)
   - `final_score` (numeric)
   - `reason` (text)
   - `rank` (int)
   - `created_at` (timestamp)

7. **feedback** — User feedback on recommendations
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `recommendation_id` (uuid, references recommendations)
   - `feedback_type` (text — 'useful', 'not_relevant', 'more_like_this', 'dont_recommend')
   - `created_at` (timestamp)

8. **cold_start_selections** — User's initial interest selections
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `selections` (text[])
   - `created_at` (timestamp)

## Security
- RLS enabled on ALL tables
- `reels` and `reel_analysis` are readable by all authenticated users (shared data)
- All user-specific tables (interactions, interests, recommendations, feedback, cold_start_selections) are owner-scoped
- Owner columns default to `auth.uid()` so inserts work without explicitly passing user_id
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE)
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT 'Student User',
  role text DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Reels table (shared data)
CREATE TABLE IF NOT EXISTS reels (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}',
  primary_topic text NOT NULL,
  secondary_topics text[] NOT NULL DEFAULT '{}',
  technology_domain text NOT NULL,
  context text NOT NULL,
  intent text NOT NULL,
  difficulty text NOT NULL,
  educational_value int NOT NULL DEFAULT 50,
  career_relevance int NOT NULL DEFAULT 50,
  entertainment_value int NOT NULL DEFAULT 50,
  hype_score int NOT NULL DEFAULT 0,
  quality_status text NOT NULL DEFAULT 'ACCEPTED',
  quality_reason text
);
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_reels" ON reels;
CREATE POLICY "read_reels" ON reels FOR SELECT
  TO anon, authenticated USING (true);

-- Reel Analysis cache
CREATE TABLE IF NOT EXISTS reel_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id text NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  analysis_data jsonb NOT NULL,
  analysis_source text NOT NULL DEFAULT 'demo',
  created_at timestamptz DEFAULT now(),
  UNIQUE(reel_id)
);
ALTER TABLE reel_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_reel_analysis" ON reel_analysis;
CREATE POLICY "read_reel_analysis" ON reel_analysis FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_reel_analysis" ON reel_analysis;
CREATE POLICY "insert_reel_analysis" ON reel_analysis FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_reel_analysis" ON reel_analysis;
CREATE POLICY "update_reel_analysis" ON reel_analysis FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  reel_id text NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  watch_percent int NOT NULL DEFAULT 0,
  liked boolean NOT NULL DEFAULT false,
  saved boolean NOT NULL DEFAULT false,
  shared boolean NOT NULL DEFAULT false,
  rewatched boolean NOT NULL DEFAULT false,
  commented boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reel_id)
);
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interactions" ON interactions;
CREATE POLICY "select_own_interactions" ON interactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_interactions" ON interactions;
CREATE POLICY "insert_own_interactions" ON interactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_interactions" ON interactions;
CREATE POLICY "update_own_interactions" ON interactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_interactions" ON interactions;
CREATE POLICY "delete_own_interactions" ON interactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Interactions updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interactions_updated_at ON interactions;
CREATE TRIGGER interactions_updated_at BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Interactions index
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);

-- Interests table
CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  interest_name text NOT NULL,
  score int NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'Low',
  trend text NOT NULL DEFAULT 'Stable',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, interest_name)
);
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interests" ON interests;
CREATE POLICY "select_own_interests" ON interests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_interests" ON interests;
CREATE POLICY "insert_own_interests" ON interests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_interests" ON interests;
CREATE POLICY "update_own_interests" ON interests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_interests" ON interests;
CREATE POLICY "delete_own_interests" ON interests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS interests_updated_at ON interests;
CREATE TRIGGER interests_updated_at BEFORE UPDATE ON interests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id text NOT NULL,
  candidate_title text NOT NULL,
  candidate_category text NOT NULL,
  candidate_topic text NOT NULL,
  candidate_difficulty text NOT NULL,
  score_breakdown jsonb NOT NULL,
  final_score numeric NOT NULL,
  reason text NOT NULL DEFAULT '',
  rank int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recommendations" ON recommendations;
CREATE POLICY "select_own_recommendations" ON recommendations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recommendations" ON recommendations;
CREATE POLICY "insert_own_recommendations" ON recommendations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recommendations" ON recommendations;
CREATE POLICY "delete_own_recommendations" ON recommendations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  feedback_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_feedback" ON feedback;
CREATE POLICY "delete_own_feedback" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Cold start selections
CREATE TABLE IF NOT EXISTS cold_start_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  selections text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE cold_start_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cold_start" ON cold_start_selections;
CREATE POLICY "select_own_cold_start" ON cold_start_selections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cold_start" ON cold_start_selections;
CREATE POLICY "insert_own_cold_start" ON cold_start_selections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cold_start" ON cold_start_selections;
CREATE POLICY "update_own_cold_start" ON cold_start_selections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cold_start" ON cold_start_selections;
CREATE POLICY "delete_own_cold_start" ON cold_start_selections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Student User'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
