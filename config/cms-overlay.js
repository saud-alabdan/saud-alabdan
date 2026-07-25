/*
 * cms-overlay.js — applies CMS-saved content over the site config
 * ================================================================
 * The CMS stores the edited site document in Supabase (table site_content,
 * one row — see config/supabase-client.js). Included in each public page's
 * <head> BEFORE the DC runtime boots, this script makes the public site render
 * from that saved document instead of the bundled config — so CMS edits appear
 * after a plain refresh.
 *
 * It installs a getter/setter on window.SITE:
 *   • config/site.config.js's synchronous assignment is captured as `bundled`
 *     (the fallback), never shown on its own while a Supabase fetch is pending.
 *   • window.SITE reads `undefined` until the fetch settles, so the DC page's
 *     boot poll waits; then it returns the Supabase document (or `bundled` on
 *     empty/error/timeout). Script order is irrelevant.
 *
 * If Supabase is not configured, this is a no-op and the bundled config wins,
 * exactly as before the migration.
 *
 * Requires config/supabase.config.js + config/supabase-client.js to be loaded
 * before this script.
 */
(function () {
  'use strict';

  var bundled;                 // set by site.config.js's window.SITE assignment
  var haveBundled = false;
  var current;                 // what window.SITE returns; undefined => not ready
  var settled = false;         // once true, `current` is authoritative
  var wantBundled = false;     // fetch finished without a doc → use bundled

  function finish(v) { settled = true; current = v; }
  function useBundled() {
    wantBundled = true;
    if (!settled) { if (haveBundled) finish(bundled); /* else adopt on assignment */ }
  }

  var hasSupabase = !!(window.SB && window.SB.configured && window.SB.configured());

  try {
    Object.defineProperty(window, 'SITE', {
      configurable: true,
      enumerable: true,
      get: function () { return current; },
      set: function (v) {
        bundled = v; haveBundled = true;
        // Adopt the bundled config immediately only when we are not waiting on
        // a Supabase fetch (not configured, or the fetch already fell back).
        if (!settled && (wantBundled || !hasSupabase)) finish(bundled);
      }
    });
  } catch (e) {
    // Environment without defineProperty — best effort: leave native assignment.
    hasSupabase = false;
  }

  if (!hasSupabase) return;   // no-op — bundled config behaves exactly as before

  // Guarantee window.SITE resolves within the page's boot-poll window even if
  // the network is slow/offline: race the fetch against a short timeout.
  var done = false;
  var timer = setTimeout(function () {
    if (done) return;
    done = true;
    useBundled();
  }, 1800);

  window.SB.getDoc().then(function (doc) {
    if (done) { if (doc && typeof doc === 'object') { current = doc; } return; }
    done = true; clearTimeout(timer);
    if (doc && typeof doc === 'object') finish(doc);
    else useBundled();          // empty row → bundled defaults
  }).catch(function () {
    if (done) return;
    done = true; clearTimeout(timer);
    useBundled();
  });
})();
