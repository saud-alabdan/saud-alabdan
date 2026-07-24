/*
 * consultation-cards.js — the ONE shared consultation card renderer
 * ================================================================
 * SINGLE SOURCE of consultation rendering. Both the Consulting page and the
 * Home page render their consultation cards through this module, so the data
 * mapping (filter active → sort by order → format price/duration → WhatsApp
 * CTA fallback) and the card markup exist in exactly one place. Neither page
 * reimplements a card, and both read the same window.SITE.services.consultations.
 *
 * Exports (on window):
 *   buildConsultationCards(cfg)  -> array of card view-models
 *   renderConsultationCards(cfg) -> a React element (the cards grid) or null
 *
 * Pages call renderConsultationCards(cfg) in renderVals and drop the result
 * into the template with {{ consultationsGrid }} (the DC runtime renders a
 * React element value inline).
 */
(function () {
  'use strict';

  function h() { return window.React.createElement.apply(null, arguments); }

  // The CTA's base + hover colours live in a stylesheet (injected once) so the
  // :hover works — an inline background can't be overridden by a :hover rule.
  var STYLE_ID = 'sc-consult-cards-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.sc-consult-cta{background:oklch(0.16 0.012 75);transition:background .3s ease;}' +
      '.sc-consult-cta:hover{background:oklch(0.52 0.1 70);}';
    document.head.appendChild(s);
  }

  // Single source of the consultation view-model.
  function buildConsultationCards(cfg) {
    if (!cfg || !cfg.services) return [];
    var CUR = { SAR: 'ريال', USD: 'دولار' };
    var PERIOD = { session: '/ الجلسة', month: '/ شهريًا', once: '' };
    var num = function (v) { var n = Number(v); return isNaN(n) ? 0 : n; };
    var wa = cfg.whatsapp || {};
    var waLink = (wa.enabled && wa.number)
      ? (wa.link || ('https://wa.me/' + wa.number + '?text=' + encodeURIComponent(wa.message || '')))
      : '';

    // Price display resolves from priceType (fixed | from | contact | custom).
    // Back-compat: a saved item without priceType behaves as 'fixed'.
    function priceOf(x) {
      var type = x.priceType || 'fixed';
      if (type === 'contact') return 'تواصل لمعرفة السعر';
      if (type === 'custom') return (x.priceText || '').trim();
      var hasPrice = x.price === 0 || (x.price !== '' && x.price != null && !isNaN(Number(x.price)));
      if (!hasPrice) return '';
      var amount = num(x.price).toLocaleString('en-US') + ' ' + (CUR[x.currency] || x.currency || '');
      var suffix = PERIOD[x.period] || '';
      var prefix = type === 'from' ? 'يبدأ من ' : '';
      return (prefix + amount + (suffix ? ' ' + suffix : '')).trim();
    }

    return (cfg.services.consultations || [])
      .map(function (x, i) { return { x: x || {}, i: i }; })
      .filter(function (o) { return o.x.active !== false; })
      .sort(function (a, b) { return (num(a.x.order) - num(b.x.order)) || (a.i - b.i); })
      .map(function (o) {
        var x = o.x;
        var feats = Array.isArray(x.features) ? x.features.filter(Boolean) : [];
        var customHref = (x.ctaHref || '').trim();
        var useWa = !customHref && !!waLink;
        // Badge is content only. Back-compat: fall back to the old exclusive
        // `featured` flag when a saved item predates the `badge` field.
        var badge = (x.badge || '').trim() || (x.featured ? 'الأكثر طلبًا' : '');
        return {
          title: x.title || '',
          description: x.description || '',
          priceText: priceOf(x),
          durationText: num(x.durationMinutes) ? (num(x.durationMinutes) + ' دقيقة') : '',
          features: feats,
          ctaLabel: x.ctaLabel || 'احجز الآن',
          ctaHref: customHref || waLink || 'Contact.dc.html',
          ctaTarget: useWa ? '_blank' : undefined,
          badge: badge
        };
      });
  }

  function cardEl(card, key) {
    var kids = [];
    // Badge is content only — a plain text pill. It does not drive card border
    // or emphasis; presentation stays a UI decision.
    if (card.badge) {
      kids.push(h('div', { key: 'b', style: { position: 'absolute', top: '18px', left: '18px', fontSize: '11px', fontWeight: 600, color: 'oklch(0.98 0.005 75)', background: 'oklch(0.52 0.1 70)', padding: '4px 12px', borderRadius: '999px' } }, card.badge));
    }
    kids.push(h('div', { key: 't', style: { fontSize: 'clamp(20px,2vw,24px)', fontWeight: 700, color: 'oklch(0.16 0.012 75)', lineHeight: 1.4 } }, card.title));
    kids.push(h('div', { key: 'd', style: { fontSize: '14px', lineHeight: 1.85, color: 'oklch(0.4 0.012 75)' } }, card.description));
    kids.push(h('div', { key: 'p', style: { display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' } },
      h('span', { key: 'v', style: { fontSize: 'clamp(26px,3vw,34px)', fontWeight: 700, color: 'oklch(0.52 0.1 70)' } }, card.priceText),
      h('span', { key: 'u', style: { fontSize: '13px', color: 'oklch(0.5 0.01 75)' } }, card.durationText)
    ));
    if (card.features.length) {
      kids.push(h('div', { key: 'f', style: { display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid oklch(0.9 0.008 75)' } },
        card.features.map(function (f, i) {
          return h('div', { key: i, style: { display: 'flex', gap: '10px', alignItems: 'baseline', fontSize: '14px', lineHeight: 1.7, color: 'oklch(0.35 0.012 75)' } },
            h('span', { key: 'c', 'aria-hidden': 'true', style: { color: 'oklch(0.52 0.1 70)', flex: '0 0 auto' } }, '✓'),
            h('span', { key: 'x' }, f)
          );
        })
      ));
    }
    kids.push(h('a', {
      key: 'a', href: card.ctaHref, target: card.ctaTarget, rel: 'noopener', className: 'sc-consult-cta',
      style: { marginTop: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'oklch(0.98 0.005 75)', padding: '14px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '15px' }
    }, card.ctaLabel));

    return h('div', {
      key: key,
      style: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px', background: 'oklch(0.99 0.004 75)', border: '1px solid oklch(0.85 0.01 75)', borderRadius: '18px', padding: 'clamp(24px,3vw,34px)' }
    }, kids);
  }

  // React element for the cards grid, or null when there are no active items.
  function renderConsultationCards(cfg) {
    var cards = buildConsultationCards(cfg);
    if (!cards.length) return null;
    ensureStyle();
    return h('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(20px,2.4vw,28px)' }
    }, cards.map(function (c, i) { return cardEl(c, i); }));
  }

  window.buildConsultationCards = buildConsultationCards;
  window.renderConsultationCards = renderConsultationCards;
})();
