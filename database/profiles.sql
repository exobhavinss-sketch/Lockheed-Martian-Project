-- =============================================================================
-- Lockheed Martin Aircraft Educational Website
-- Supabase Database Setup: Profiles Table with Row Level Security (RLS)
-- Subject: Full Stack Development - 1 (Semester 3)
-- =============================================================================

-- STEP 2: Create the `profiles` table linked 1-to-1 with Supabase Auth (auth.users)
-- Passwords are NOT stored here; credentials are kept exclusively in auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT,
    email TEXT,
    aircraft_interest TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Documentation comment
COMMENT ON TABLE public.profiles IS 'User profile information for Lockheed Martin Aircraft website members.';

-- STEP 3: Enable Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: SELECT Policy — Authenticated users can view only their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- STEP 5: INSERT Policy — Authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- STEP 6: UPDATE Policy — Authenticated users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
