/**
 * services/supabase.js
 * Supabase client setup + data persistence layer
 *
 * Environment variables (set in .env or GitHub Secrets):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * For plain HTML/JS (no build tool), replace import.meta.env with window.ENV
 */

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL =
  (typeof import_meta_env !== 'undefined' && import_meta_env.VITE_SUPABASE_URL) ||
  window.__ENV__?.SUPABASE_URL ||
  'YOUR_SUPABASE_URL'; // ← Replace for production

const SUPABASE_ANON_KEY =
  (typeof import_meta_env !== 'undefined' && import_meta_env.VITE_SUPABASE_ANON_KEY) ||
  window.__ENV__?.SUPABASE_ANON_KEY ||
  'YOUR_SUPABASE_ANON_KEY'; // ← Replace for production

// Detect if Supabase SDK is available (loaded via CDN)
function getSupabaseClient() {
  if (typeof window !== 'undefined' && window.supabase) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return null;
}

let _client = null;
function client() {
  if (!_client) _client = getSupabaseClient();
  return _client;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function isConfigured() {
  return (
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
    client() !== null
  );
}

// ── Profile (Parsed Resume) ──────────────────────────────────────────────────
/**
 * Save parsed resume profile to Supabase `profiles` table
 * Table schema:
 *   id uuid primary key default gen_random_uuid()
 *   session_id text
 *   name text
 *   skills jsonb
 *   experience jsonb
 *   education jsonb
 *   raw_text text
 *   created_at timestamptz default now()
 */
export async function saveProfile(parsedResume, sessionId) {
  if (!isConfigured()) {
    console.warn('[Supabase] Not configured — saving to localStorage instead.');
    const stored = { ...parsedResume, session_id: sessionId, id: crypto.randomUUID() };
    localStorage.setItem('resumeai_profile', JSON.stringify(stored));
    return { data: stored, error: null };
  }

  const { data, error } = await client()
    .from('profiles')
    .insert({
      session_id: sessionId,
      name: parsedResume.name,
      skills: parsedResume.skills,
      experience: parsedResume.experience,
      education: parsedResume.education,
      raw_text: parsedResume.raw_text,
    })
    .select()
    .single();

  return { data, error };
}

// ── Job Analysis ─────────────────────────────────────────────────────────────
/**
 * Save parsed job description to Supabase `job_analyses` table
 * Table schema:
 *   id uuid primary key default gen_random_uuid()
 *   session_id text
 *   title text
 *   company text
 *   required_skills jsonb
 *   keywords jsonb
 *   responsibilities jsonb
 *   raw_text text
 *   created_at timestamptz default now()
 */
export async function saveJobAnalysis(parsedJob, sessionId) {
  if (!isConfigured()) {
    console.warn('[Supabase] Not configured — saving to localStorage instead.');
    const stored = { ...parsedJob, session_id: sessionId, id: crypto.randomUUID() };
    localStorage.setItem('resumeai_job', JSON.stringify(stored));
    return { data: stored, error: null };
  }

  const { data, error } = await client()
    .from('job_analyses')
    .insert({
      session_id: sessionId,
      title: parsedJob.title,
      company: parsedJob.company,
      required_skills: parsedJob.required_skills,
      keywords: parsedJob.keywords,
      responsibilities: parsedJob.responsibilities,
      raw_text: parsedJob.raw_text,
    })
    .select()
    .single();

  return { data, error };
}

// ── Retrieve saved data (for session recovery) ────────────────────────────────
export async function getLatestSession(sessionId) {
  if (!isConfigured()) {
    return {
      profile: JSON.parse(localStorage.getItem('resumeai_profile') || 'null'),
      job: JSON.parse(localStorage.getItem('resumeai_job') || 'null'),
    };
  }

  const [{ data: profile }, { data: job }] = await Promise.all([
    client().from('profiles').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(),
    client().from('job_analyses').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  return { profile, job };
}

export default { saveProfile, saveJobAnalysis, getLatestSession, isConfigured };
