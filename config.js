/**
 * منصة الموديلز - Supabase Configuration
 */

const SUPABASE_URL = "https://gdtpgjzmtvuzudydkhgu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdHBnanptdHZ1enVkeWRraGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTM0OTIsImV4cCI6MjEwMDg2OTQ5Mn0.zwZWq7VJ_It3mHIRYKalUhdUeloBMIKvWhjEFH9OkBE";

const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
};

let supabaseClient = null;

if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase successfully connected!");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("⚠️ Supabase credentials not provided.");
}

// No fictional profiles or portfolio images are bundled with production.
const DEMO_MODELS = [];
const DEMO_PORTFOLIO = {};
