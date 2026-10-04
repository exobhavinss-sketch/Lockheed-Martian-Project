-- =============================================================================
-- Lockheed Martin Aircraft Educational Website
-- Supabase Database Setup: Favorites Table with Row Level Security (RLS)
-- Subject: Full Stack Development - 1 (Semester 3)
-- =============================================================================

-- STEP 2: Create the `favorites` table linking authenticated users to aircraft
-- Foreign keys ensure cascade deletion if user or aircraft record is removed
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    aircraft_id UUID NOT NULL
        REFERENCES public.aircraft(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE (user_id, aircraft_id)
);

-- Documentation comment
COMMENT ON TABLE public.favorites IS
'Aircraft favorites saved by authenticated website users.';

-- STEP 3: Enable Row Level Security (RLS) on public.favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- STEP 4: SELECT Policy — Authenticated users can view only their own favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites"
    ON public.favorites
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- STEP 5: INSERT Policy — Authenticated users can insert only their own favorites
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites"
    ON public.favorites
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

-- STEP 6: DELETE Policy — Authenticated users can delete only their own favorites
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
CREATE POLICY "Users can delete their own favorites"
    ON public.favorites
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- =============================================================================
-- DATABASE VERIFICATION QUERIES
-- Run the queries below in the Supabase SQL Editor to verify RLS configuration:
-- =============================================================================
-- 1. Verify RLS is enabled on public.favorites:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites';
-- 2. Verify all policies on public.favorites:
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorites';

