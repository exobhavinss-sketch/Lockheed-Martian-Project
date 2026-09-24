-- =============================================================================
-- Lockheed Martin Aircraft Educational Website
-- Database Setup: Saved Aircraft / Favorites Table with Row Level Security (RLS)
-- Subject: Full Stack Development - 1 (Semester 3)
-- =============================================================================

-- 1. Create the `favorites` table linked to Supabase Auth (`auth.users`)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aircraft_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_aircraft_favorite UNIQUE (user_id, aircraft_id)
);

-- 2. Add documentation comments
COMMENT ON TABLE public.favorites IS 'User saved/favorite aircraft for Lockheed Martin Aircraft website members.';
COMMENT ON COLUMN public.favorites.id IS 'Unique identifier for the favorite record.';
COMMENT ON COLUMN public.favorites.user_id IS 'References the authenticated user (auth.users.id).';
COMMENT ON COLUMN public.favorites.aircraft_id IS 'Unique lowercase identifier for the saved aircraft (e.g. f35, f22).';
COMMENT ON COLUMN public.favorites.created_at IS 'Timestamp when the aircraft was saved.';

-- 3. Create index for fast user lookup on dashboard
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- 4. Enable Row Level Security (RLS) on the favorites table
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Users can view their own saved aircraft only
CREATE POLICY "Users can view their own favorites"
    ON public.favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- 6. RLS Policy: Users can insert their own saved aircraft only
CREATE POLICY "Users can insert their own favorites"
    ON public.favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policy: Users can delete their own saved aircraft only
CREATE POLICY "Users can delete their own favorites"
    ON public.favorites
    FOR DELETE
    USING (auth.uid() = user_id);
