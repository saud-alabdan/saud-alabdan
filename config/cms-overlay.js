/*
 * cms-overlay.js — applies CMS-saved content over the site config
 * ================================================================
 * The Admin Dashboard (admin/) persists the edited site document to
 * localStorage under STORAGE_KEY (this phase has no backend). Included in each
 * public page's real <head> BEFORE the DC runtime boots, this script makes the
 * public site render from that saved document instead of the bundled config —
 * so CMS edits appear after a plain refresh.
 *
 * It installs a getter on window.SITE that returns the saved document and
 * ignores config/site.config.js's later assignment. Because the config script
 * is injected by the helmet asynchronously, ordering between the two scripts
 * is not guaranteed — the getter makes order irrelevant: the saved content
 * always wins. With no saved document, this is a no-op and the bundled config
 * behaves exactly as before.
 *
 * STORAGE_KEY MUST match STORAGE_KEY in admin/data-service.js (the only other
 * place the key appears — the two are separate page entry points).
 */
(function () {
  var STORAGE_KEY = 'saud-site-content';

  var override = null;
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) override = JSON.parse(raw);
  } catch (e) { /* storage blocked / bad JSON — fall through to config */ }

  if (!override || typeof override !== 'object') return;

  try {
    Object.defineProperty(window, 'SITE', {
      configurable: true,
      enumerable: true,
      get: function () { return override; },
      set: function () { /* ignore config's assignment; CMS content wins */ }
    });
  } catch (e) {
    // Environment without defineProperty support — best-effort direct set.
    window.SITE = override;
  }
})();
