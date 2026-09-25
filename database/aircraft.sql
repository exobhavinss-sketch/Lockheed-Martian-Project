-- =============================================================================
-- Lockheed Martin Aircraft Educational Website
-- Supabase Database Setup: Aircraft Table with Row Level Security (RLS)
-- Subject: Full Stack Development - 1 (Semester 3)
-- Purpose: Public Read-Only Aircraft Catalog Table
-- =============================================================================

-- STEP 2: Create the `aircraft` table in the public schema
CREATE TABLE IF NOT EXISTS public.aircraft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    status TEXT,
    is_fictional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Documentation comments
COMMENT ON TABLE public.aircraft IS 'Aircraft information for the Lockheed Martin educational website.';
COMMENT ON COLUMN public.aircraft.id IS 'Unique identifier for each aircraft (UUID).';
COMMENT ON COLUMN public.aircraft.name IS 'Official name of the aircraft platform (unique).';
COMMENT ON COLUMN public.aircraft.category IS 'Aircraft operational category.';
COMMENT ON COLUMN public.aircraft.description IS 'Educational summary and description of the aircraft.';
COMMENT ON COLUMN public.aircraft.image IS 'Website-relative path to the aircraft image file.';
COMMENT ON COLUMN public.aircraft.status IS 'Current operational or historical service status.';
COMMENT ON COLUMN public.aircraft.is_fictional IS 'Indicates whether the platform is a fictional or entertainment concept.';
COMMENT ON COLUMN public.aircraft.created_at IS 'Timestamp when the aircraft record was created.';

-- Create indexes for efficient searching and category sorting
CREATE INDEX IF NOT EXISTS idx_aircraft_name ON public.aircraft(name);
CREATE INDEX IF NOT EXISTS idx_aircraft_category ON public.aircraft(category);

-- STEP 3: Enable Row Level Security (RLS) on public.aircraft
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

-- STEP 3 & 4: SELECT Policy — Public read access for anonymous and authenticated visitors
-- Only SELECT is permitted. Public INSERT, UPDATE, and DELETE operations are completely blocked.
DROP POLICY IF EXISTS "Allow public read access to aircraft" ON public.aircraft;
CREATE POLICY "Allow public read access to aircraft"
    ON public.aircraft
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- STEP 5 & 7: Insert initial 10 aircraft records (idempotent: ON CONFLICT DO NOTHING)
INSERT INTO public.aircraft (name, category, description, image, status, is_fictional)
VALUES
    (
        'F-35 Lightning II',
        'Fighter Aircraft',
        'An advanced 5th generation multirole stealth fighter designed for air superiority and strike missions. It combines advanced low-observable stealth with high-speed agility, sensor fusion, and networked combat operations.',
        'images/F-35 Lightning 2.jpg',
        'Active',
        FALSE
    ),
    (
        'F-22 Raptor',
        'Fighter Aircraft',
        'A premier 5th generation tactical stealth fighter renowned for extreme speed, agility, and situational awareness. It integrates supercruise, supermaneuverability, and advanced radar stealth.',
        'images/F22 Raptor.webp',
        'Active',
        FALSE
    ),
    (
        'F-16 Fighting Falcon',
        'Fighter Aircraft',
        'A highly agile supersonic multirole fighter aircraft used extensively for air combat and tactical missions worldwide. Highly recognized for its bubble canopy, side-stick controller, and proven multirole versatility.',
        'images/F 16 Fighting Falcon 2.webp',
        'Active',
        FALSE
    ),
    (
        'F-117 Nighthawk',
        'Spy & Reconnaissance Aircraft',
        'A pioneering precision strike aircraft designed with stealth technology to operate undetected by radar. Developed by Lockheed''s legendary Skunk Works, it was the world''s first operational stealth combat aircraft.',
        'images/F117 Nighthawk.jpeg',
        'Historic Aircraft',
        FALSE
    ),
    (
        'SR-71 Blackbird',
        'Spy & Reconnaissance Aircraft',
        'A legendary long-range reconnaissance aircraft engineered to cruise at Mach 3 speeds and extreme altitudes. It holds the official absolute speed record for crewed airbreathing jet aircraft.',
        'images/SR 71 BlackBird.avif',
        'HIGH VALUE',
        FALSE
    ),
    (
        'SR-71 Darkstar',
        'Spy & Reconnaissance Aircraft',
        'A fictional hypersonic aircraft concept featured in the movie ''Top Gun: Maverick'', designed in conceptual collaboration with Lockheed Martin Skunk Works. This platform is not a real operational aircraft and was created purely as a cinematic and conceptual design.',
        'images/SR 72 Darkstar.jpeg',
        'Fictional Concept',
        TRUE
    ),
    (
        'C-5 Galaxy',
        'Transport Aircraft',
        'A heavy strategic military airlifter designed to transport oversized cargo and vehicles across global distances. It is one of the largest military transport aircraft in the world.',
        'images/C5 Galaxy.jpg',
        'Active',
        FALSE
    ),
    (
        'C-130 Hercules',
        'Transport Aircraft',
        'A versatile four-engine turboprop military transport capable of operating from unprepared runways in demanding environments. In continuous production for decades, it performs tactical airlift, search and rescue, and humanitarian missions.',
        'images/C130 Hercules.jpeg',
        'Active',
        FALSE
    ),
    (
        'CH-53K King Stallion',
        'Helicopters',
        'A heavy-lift military cargo helicopter engineered to transport heavy equipment, armored vehicles, and combat personnel. Built for the United States Marine Corps to conduct expeditionary assault and logistics.',
        'images/CH 53K.jpg',
        'Active',
        FALSE
    ),
    (
        'VH-92 Patriot',
        'Special Mission Aircraft',
        'A secure presidential transport helicopter built to provide executive transport for the President of the United States. Flown by Marine Helicopter Squadron One (HMX-1) under the call sign ''Marine One''.',
        'images/VH 92.jpeg',
        'Active',
        FALSE
    )
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    image = EXCLUDED.image,
    status = EXCLUDED.status,
    is_fictional = EXCLUDED.is_fictional;
