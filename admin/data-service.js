/*
 * data-service.js — CMS data layer (THE single integration seam)
 * ==============================================================
 * The Admin Dashboard talks to site content ONLY through window.SiteContent.
 * No form, panel, or view code fetches or persists on its own.
 *
 * The contract is API-first by design (matches the note at the top of
 * config/site.config.js):
 *
 *     GET  /api/site-content   ->  the full window.SITE JSON document
 *     PUT  /api/site-content   <-  the full document (whole-doc replace)
 *
 * There is no backend in this phase, so it persists locally instead:
 *   • load() tries the API, then a saved localStorage document, then the
 *     bundled window.SITE that config/site.config.js assigns (read-only — the
 *     admin never writes that file).
 *   • save() tries the API, then writes the whole document to localStorage.
 *     The public pages read that same key via config/cms-overlay.js, so a
 *     save is reflected on the site after a refresh.
 *
 * WHEN THE BACKEND LANDS: nothing above this file changes. Delete the
 * localStorage fallbacks and the service becomes a thin fetch wrapper. Keep
 * the whole-document shape — the server stores and re-emits exactly what
 * config/site.config.js produces.
 */
(function () {
  'use strict';

  var API_BASE = '/api/site-content';
  // MUST match STORAGE_KEY in config/cms-overlay.js (the public-side reader).
  var STORAGE_KEY = 'saud-site-content';

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // config/site.config.js runs before this script and sets window.SITE
  // synchronously. That object is plain JSON-safe data (no functions), so a
  // structural clone is a faithful copy the admin can edit freely.
  function bundled() {
    if (!window.SITE) {
      throw new Error(
        'window.SITE is missing — config/site.config.js did not load. ' +
        'Check the <script src="../config/site.config.js"> path.'
      );
    }
    return deepClone(window.SITE);
  }

  function readLocal() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  var SiteContent = {
    // Where the last successful load() came from — the UI shows this so the
    // editor knows what it is looking at. 'api' | 'local' | 'bundled' | 'unknown'.
    source: 'unknown',

    /** Fetch the full site-content document. */
    load: function () {
      var self = this;
      return fetch(API_BASE, { headers: { accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (doc) {
          self.source = 'api';
          return doc;
        })
        .catch(function () {
          // No backend — prefer a previously saved local document (so the
          // editor reopens on the last saved state), else the bundled config.
          var saved = readLocal();
          if (saved && typeof saved === 'object') { self.source = 'local'; return saved; }
          self.source = 'bundled';
          return bundled();
        });
    },

    /**
     * Persist the full document (whole-doc replace).
     * Resolves with { persisted, via, error? } — never rejects, so the UI can
     * report the outcome without a try/catch at every call site.
     */
    save: function (doc) {
      return fetch(API_BASE, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(doc)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return { persisted: true, via: 'api' };
        })
        .catch(function () {
          // No backend — persist to localStorage, which the public pages read
          // through config/cms-overlay.js. Reflected on the site after refresh.
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
            return { persisted: true, via: 'local' };
          } catch (e) {
            return { persisted: false, via: 'memory', error: e.message };
          }
        });
    }
  };

  window.SiteContent = SiteContent;
})();
