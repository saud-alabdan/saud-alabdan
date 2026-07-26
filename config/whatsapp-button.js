/*
 * whatsapp-button.js — the ONE reusable floating WhatsApp button
 * ==============================================================
 * Include this on any public page (after the config/overlay). It reads the
 * WhatsApp settings from window.SITE.whatsapp — the single source of truth,
 * managed by the CMS "إعدادات واتساب" section — and renders a floating button
 * when the settings say it should appear on this page.
 *
 * Nothing is hardcoded here: number, message, label, position, per-page
 * visibility, and business hours all come from the settings. A future page
 * gets the button automatically just by including this script.
 *
 * Visibility rule: whatsapp.enabled AND floating.enabled AND a number AND
 * (floating.showOnAll OR floating.showOn[<thisPageId>]). Page id is derived
 * from the filename (Home.dc.html → "home", Consulting.dc.html → "consulting").
 */
(function () {
  'use strict';

  // Official WhatsApp glyph (single path, fits the 0..24 viewBox exactly).
  // Inline SVG — no external icon font/CDN. fill=currentColor inherits the
  // button's text colour.
  var WA_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true" focusable="false">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  function pageId() {
    var p = location.pathname || '';
    try { p = decodeURIComponent(p); } catch (e) {}
    var base = (p.split('/').pop() || 'home').replace(/\.dc\.html?$/i, '').replace(/\.html?$/i, '');
    return (base || 'home').toLowerCase();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(wa, theme) {
    var f = wa.floating || {};
    var id = pageId();
    var visible = !!(f.showOnAll || (f.showOn && f.showOn[id]));
    if (!wa.enabled || !f.enabled || !visible || !wa.number) return;
    if (document.querySelector('.wa-fab')) return; // idempotent

    var primary = (theme && theme.color && theme.color.primary) || '#48553F';
    var onDark = (theme && theme.color && theme.color.onDark) || '#FCFBF8';
    var pos = (f.position === 'left') ? 'left' : 'right';
    var link = wa.link || ('https://wa.me/' + wa.number + '?text=' + encodeURIComponent(wa.message || ''));
    var label = wa.buttonLabel || 'واتساب';
    var title = label + (wa.businessHours ? ' — ' + wa.businessHours : '');

    var style = document.createElement('style');
    style.setAttribute('data-wa-fab', '');
    style.textContent =
      // Collapsed = a 56px circle that is EXACTLY the icon box, so the icon is
      // centred independent of the (clipped) label. No gap / side padding.
      '.wa-fab{position:fixed;bottom:24px;' + pos + ':24px;z-index:9999;display:inline-flex;align-items:center;' +
      'height:56px;padding:0;border-radius:28px;text-decoration:none;direction:rtl;white-space:nowrap;' +
      'background:' + primary + ';color:' + onDark + ';font-family:inherit;font-size:15px;line-height:1;' +
      'box-shadow:0 14px 30px -12px rgba(0,0,0,.5);max-width:56px;overflow:hidden;' +
      'transition:max-width .4s cubic-bezier(.22,.61,.36,1),transform .25s ease;}' +
      '.wa-fab:hover,.wa-fab:focus-visible{max-width:340px;transform:translateY(-2px);}' +
      '.wa-fab .wa-ico{flex:0 0 56px;width:56px;height:56px;display:flex;align-items:center;justify-content:center;}' +
      '.wa-fab .wa-ico svg{display:block;width:24px;height:24px;}' +
      '.wa-fab .wa-lbl{font-weight:600;padding-inline-end:20px;}' +
      // Page-bottom clearance so the fixed button never overlaps footer content
      // is owned by the shared footer (config/site-chrome.js), which reserves it
      // on every screen size only on pages where this button is included.
      '@media (prefers-reduced-motion:reduce){.wa-fab{transition:none;}.wa-fab:hover{transform:none;}}';
    document.head.appendChild(style);

    var a = document.createElement('a');
    a.className = 'wa-fab';
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', label);
    a.title = title;
    a.innerHTML = '<span class="wa-ico">' + WA_ICON + '</span><span class="wa-lbl">' + esc(label) + '</span>';
    document.body.appendChild(a);
  }

  function init() {
    if (!document.body) { setTimeout(init, 30); return; }
    var tries = 0;
    (function poll() {
      if (window.SITE && window.SITE.whatsapp) { render(window.SITE.whatsapp, window.SITE.theme); return; }
      if (tries++ < 150) setTimeout(poll, 40);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
