-- =============================================================================
-- Lockheed Martin Aircraft Educational Website
-- Supabase Database Migration & Verification: Profile Update RLS Policy
-- Subject: Full Stack Development - 1 (Semester 3)
-- =============================================================================

-- STEP 2: Verify and ensure the UPDATE policy on public.profiles is active.
-- Row Level Security (RLS) ensures each authenticated user can ONLY update
-- their own profile row where auth.uid() = id.

-- Ensure RLS is enabled on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it already exists, then re-create cleanly
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- =============================================================================
-- STEP 18: DATABASE VERIFICATION QUERIES
-- Run the queries below in the Supabase SQL Editor to verify RLS configuration:
-- =============================================================================

-- 1. Verify RLS is enabled on public.profiles:
-- Expected output: tablename = 'profiles', rowsecurity = true
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 2. Verify all policies on public.profiles:
-- Expected output shows SELECT, INSERT, and UPDATE policies with (auth.uid() = id)
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';
