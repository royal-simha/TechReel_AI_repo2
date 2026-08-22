/*
# Harden profile creation trigger

## Root cause addressed
The profile trigger used an unqualified `profiles` table reference and had a mutable
security context. This can make auth user creation fail with the generic
"Database error saving new user" message when the trigger runs.

## Changes
- Recreate `public.handle_new_user()` with an empty search path.
- Fully qualify the target table as `public.profiles`.
- Preserve the auth UUID as `profiles.id` and safely read optional display metadata.
- Revoke direct EXECUTE access from PUBLIC, anon, and authenticated; the function is
  only intended to run as the `auth.users` trigger.
- Keep the existing trigger and RLS model intact.

## Security
- RLS remains enabled on `profiles` and all other application tables.
- The function remains SECURITY DEFINER because auth creates the profile before the
  new user has an authenticated client session.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
