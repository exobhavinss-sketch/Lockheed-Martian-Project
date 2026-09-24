/* ==========================================================================
   Supabase Client Configuration
   Subject: Full Stack Development - 1 (Semester 3)
   Purpose: Client-side Supabase Browser Configuration
   ========================================================================== */

// Supabase Project Credentials
const SUPABASE_URL = "https://scquosapdajnkpeffftv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PvKs51xFNamNpESu1XLs0g_TzZpzG5P";

// Initialize Supabase Client using createClient from window.supabase
let supabaseClient = null;

if (typeof window !== "undefined" && window.supabase && window.supabase.createClient) {
    const { createClient } = window.supabase;
    supabaseClient = createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
    window.supabaseClient = supabaseClient;
    console.log("Supabase client initialized successfully.");
} else {
    console.warn("Supabase library not found. Ensure @supabase/supabase-js is loaded before js/supabase.js.");
}
