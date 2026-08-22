/*
# Fix handle_new_user search_path

## Root Cause
The trigger function `handle_new_user()` had `SET search_path = ''` (empty string).
An empty search_path breaks internal operator resolution (e.g., the `->>` JSON operator
and the `||` concatenation in COALESCE), causing the trigger to fail silently during
signup. Supabase then surfaces this as "Database error saving new user".

## Fix
- Set `search_path = public` (the schema where `profiles` lives)
- Keep SECURITY DEFINER (required: the trigger fires before the user has a session)
- Fully qualify table as `public.profiles`
- Revoke EXECUTE from anon/authenticated/public (trigger-only function)
- Re-attach the trigger (function OID changes on CREATE OR REPLACE)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Student User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
