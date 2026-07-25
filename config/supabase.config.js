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
window.SUPABASE_CONFIG = {
  url: 'https://jaubmntjmpaxtmzfvaet.supabase.co',
  anonKey: 'sb_publishable_H9G9Lw5KNKuMuWaQrj-2Iw_XMO3U2Ih'
};