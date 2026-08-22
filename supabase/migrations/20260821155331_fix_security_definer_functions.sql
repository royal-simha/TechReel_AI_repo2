/*
# Fix SECURITY DEFINER functions — search_path and execute permissions

## Root Cause
The `handle_new_user()` trigger function (fires on auth.users INSERT during signup)
was created WITHOUT an explicit `search_path`. Supabase's PostgreSQL rejects
SECURITY DEFINER functions with mutable search paths, causing:
"Database error saving new user"

## Changes
1. Recreate `handle_new_user()` with `SET search_path = public` and `SECURITY DEFINER`
2. Recreate `update_updated_at()` with `SET search_path = public`
3. Revoke EXECUTE on `handle_new_user()` from `anon` and `authenticated` —
   it's a trigger function, not a callable API
4. Re-attach triggers (they reference the function OID, so recreate after function replacement)

## Security
- RLS remains enabled on all tables — no changes to RLS policies
- SECURITY DEFINER is retained for handle_new_user (required so the trigger
  can insert into profiles before the user has an authenticated session)
- search_path is locked to `public` to prevent search_path injection
*/

-- Fix handle_new_user: add search_path, keep SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Student User'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Revoke EXECUTE from anon and authenticated (trigger function, not API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Fix update_updated_at: add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Re-attach triggers (function OID changed due to CREATE OR REPLACE with SET)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS interactions_updated_at ON interactions;
CREATE TRIGGER interactions_updated_at BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS interests_updated_at ON interests;
CREATE TRIGGER interests_updated_at BEFORE UPDATE ON interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
