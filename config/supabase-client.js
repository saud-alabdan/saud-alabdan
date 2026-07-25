/*
 * supabase-client.js — the ONE Supabase seam (window.SB)
 * ==============================================================
 * A tiny, dependency-free REST client (no supabase-js, no build step) shared by
 * BOTH sides of the app so the integration lives in exactly one place:
 *   • public pages (config/cms-overlay.js)  → SB.getDoc()   [anonymous read]
 *   • admin CMS     (admin/data-service.js, admin/media-manager.js)
 *                                            → SB.saveDoc() / SB.uploadMedia()
 *                                              plus SB.signIn/signOut [authed]
 *
 * Whole-document model is preserved: the entire window.SITE JSON lives in a
 * single row of table `site_content` (id = 'singleton', column `doc jsonb`).
 * Media lives in the Storage bucket `media`. See supabase-setup.sql.
 *
 * Reads `window.SUPABASE_CONFIG` (config/supabase.config.js). When it is not
 * configured, every call rejects/returns not-configured so callers fall back to
 * the bundled config — the site behaves exactly as before Supabase was wired.
 */
(function () {
  'use strict';

  var CFG  = window.SUPABASE_CONFIG || {};
  var BASE = String(CFG.url || '').replace(/\/+$/, '');
  var ANON = CFG.anonKey || '';
  var TABLE = 'site_content';
  var ROW_ID = 'singleton';
  var BUCKET = 'media';
  var SESSION_KEY = 'sb-admin-session';   // AUTH TOKEN ONLY — never content.

  function configured() {
    return !!(BASE && ANON && BASE.indexOf('YOUR-PROJECT') < 0 && ANON.indexOf('YOUR-') < 0);
  }

  /* ── auth session (login token persistence — not site content) ─────────── */
  var session = (function () {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  })();
  function storeSession(s) {
    session = s || null;
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function isAuthed() { return !!(session && session.access_token); }
  function currentEmail() { return (session && session.user && session.user.email) || ''; }

  function jsonOrThrow(r) {
    return r.text().then(function (t) {
      var j = t ? JSON.parse(t) : {};
      if (!r.ok) throw new Error(j.error_description || j.msg || j.message || ('HTTP ' + r.status));
      return j;
    });
  }

  function signIn(email, password) {
    if (!configured()) return Promise.reject(new Error('Supabase not configured'));
    return fetch(BASE + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(jsonOrThrow).then(function (j) {
      j.obtained_at = Date.now();
      storeSession(j);
      return j;
    });
  }

  function signOut() {
    var tok = session && session.access_token;
    storeSession(null);
    if (tok) { try { fetch(BASE + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + tok } }); } catch (e) {} }
    return Promise.resolve();
  }

  // Refresh the access token if it is near expiry. Resolves to the session
  // (possibly unchanged) and never rejects — callers just proceed.
  function ensureFresh() {
    if (!session) return Promise.resolve(null);
    var ageSec = (Date.now() - (session.obtained_at || 0)) / 1000;
    if (ageSec < (session.expires_in || 3600) - 60) return Promise.resolve(session);
    return fetch(BASE + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.access_token) { j.obtained_at = Date.now(); storeSession(j); } return session; })
      .catch(function () { return session; });
  }

  /* ── content document (whole-doc, single row) ──────────────────────────── */
  function getDoc() {
    if (!configured()) return Promise.reject(new Error('Supabase not configured'));
    return fetch(BASE + '/rest/v1/' + TABLE + '?id=eq.' + ROW_ID + '&select=doc', {
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, Accept: 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (rows) {
      return (rows && rows[0] && rows[0].doc) ? rows[0].doc : null;
    });
  }

  function saveDoc(doc) {
    if (!configured()) return Promise.reject(new Error('Supabase not configured'));
    return ensureFresh().then(function () {
      if (!isAuthed()) throw new Error('غير مُسجّل الدخول');
      return fetch(BASE + '/rest/v1/' + TABLE + '?id=eq.' + ROW_ID, {
        method: 'PATCH',
        headers: {
          apikey: ANON,
          Authorization: 'Bearer ' + session.access_token,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ doc: doc, updated_at: new Date().toISOString() })
      });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ' ' + t); });
      return true;
    });
  }

  /* ── media storage ─────────────────────────────────────────────────────── */
  function sanitize(name) {
    return String(name || 'file').replace(/[^\w.\-]+/g, '_').replace(/^_+/, '').slice(-80) || 'file';
  }
  function publicUrl(path) { return BASE + '/storage/v1/object/public/' + BUCKET + '/' + path; }

  // Uploads a File/Blob and resolves to its PUBLIC URL (string).
  function uploadMedia(blob, filename, contentType) {
    if (!configured()) return Promise.reject(new Error('Supabase not configured'));
    var path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + sanitize(filename);
    return ensureFresh().then(function () {
      if (!isAuthed()) throw new Error('غير مُسجّل الدخول');
      return fetch(BASE + '/storage/v1/object/' + BUCKET + '/' + path, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: 'Bearer ' + session.access_token,
          'Content-Type': contentType || blob.type || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: blob
      });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('رفع الملف فشل (HTTP ' + r.status + ') ' + t); });
      return publicUrl(path);
    });
  }

  window.SB = {
    configured: configured,
    signIn: signIn,
    signOut: signOut,
    isAuthed: isAuthed,
    currentEmail: currentEmail,
    ensureFresh: ensureFresh,
    getDoc: getDoc,
    saveDoc: saveDoc,
    uploadMedia: uploadMedia
  };
})();
