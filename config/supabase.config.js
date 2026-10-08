/*
 * supabase.config.js — Supabase project credentials (CLIENT-SAFE)
 * ==============================================================
 * Both values below are PUBLIC and safe to ship in a static site:
 *   • url      — your project URL, e.g. https://abcdxyz.supabase.co
 *   • anonKey  — the public "anon" key. Row Level Security (see the setup SQL)
 *                is what actually protects the data; the anon key only grants
 *                what your RLS policies allow (public read, no writes).
 *
 * NEVER put the service_role key here — it bypasses RLS. It is only used for
 * one-time setup in the Supabase SQL editor / dashboard, never in the browser.
 *
 * Until these are filled in with real values, the site and CMS keep working on
 * the bundled config/site.config.js defaults (Supabase calls simply fall back).
 */
// Supabase is retired: config/site.config.js is the single content source.
// Empty values keep every Supabase call in "not configured" mode (no-op).
window.SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};
