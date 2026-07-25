/*
 * data-service.js — CMS data layer (THE single integration seam)
 * ==============================================================
 * The Admin Dashboard talks to site content ONLY through window.SiteContent.
 * No form, panel, or view code fetches or persists on its own.
 *
 * Persistence is Supabase (whole-document, one row) via window.SB
 * (config/supabase-client.js):
 *   • load() → SB.getDoc(). If the row is empty (fresh project) or Supabase is
 *     unreachable/not configured, it falls back to the bundled window.SITE that
 *     config/site.config.js assigns (read-only seed — the admin never writes
 *     that file).
 *   • save() → SB.saveDoc() (whole-doc replace, requires an authenticated
 *     session). Resolves with { persisted, via, error? } and never rejects, so
 *     the UI can report the outcome without try/catch at every call site.
 *
 * localStorage is NO LONGER used for content (only the auth token lives there,
 * inside supabase-client.js). The whole-document shape is unchanged: Supabase
 * stores and re-emits exactly what config/site.config.js produces.
 */
(function () {
  'use strict';

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  // config/site.config.js runs before this script and sets window.SITE
  // synchronously. That object is plain JSON-safe data, so a structural clone
  // is a faithful copy the admin can edit freely. Used as the seed / fallback.
  function bundled() {
    if (!window.SITE) {
      throw new Error(
        'window.SITE is missing — config/site.config.js did not load. ' +
        'Check the <script src="../config/site.config.js"> path.'
      );
    }
    return deepClone(window.SITE);
  }

  var SiteContent = {
    // Where the last successful load() came from — the UI shows this.
    // 'api' (Supabase) | 'bundled' | 'unknown'.
    source: 'unknown',

    /** Fetch the full site-content document. */
    load: function () {
      var self = this;
      if (!(window.SB && window.SB.configured())) {
        self.source = 'bundled';
        return Promise.resolve(bundled());
      }
      return window.SB.getDoc()
        .then(function (doc) {
          if (doc && typeof doc === 'object' && Object.keys(doc).length) {
            self.source = 'api';
            return doc;
          }
          // Empty/unseeded row → start from the bundled config.
          self.source = 'bundled';
          return bundled();
        })
        .catch(function () {
          self.source = 'bundled';
          return bundled();
        });
    },

    /**
     * Persist the full document (whole-doc replace) to Supabase.
     * Resolves with { persisted, via, error? } — never rejects.
     */
    save: function (doc) {
      if (!(window.SB && window.SB.configured())) {
        return Promise.resolve({ persisted: false, via: 'unconfigured', error: 'Supabase غير مُهيّأ' });
      }
      return window.SB.saveDoc(doc)
        .then(function () { return { persisted: true, via: 'api' }; })
        .catch(function (e) { return { persisted: false, via: 'error', error: e.message }; });
    }
  };

  window.SiteContent = SiteContent;
})();
