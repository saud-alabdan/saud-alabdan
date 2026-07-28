/*
 * consultation-cards.js — the ONE shared consultation card renderer
 * ================================================================
 * SINGLE SOURCE of consultation rendering. Both the Consulting page and the
 * Home page render their consultation cards through this module, so the data
 * mapping (filter by status → sort by order → resolve the flexible pricing
 * model → WhatsApp CTA fallback) and the card markup exist in exactly one
 * place. Neither page reimplements a card, and both read the same
 * window.SITE.services.consultations.
 *
 * FLEXIBLE PRICING MODEL (per consultation item)
 *   priceType     fixed | from | contact | custom
 *   price         current price (number)          — fixed / from
 *   compareAtPrice previous price (number, opt)    — shown struck-through
 *   discountText  discount badge text (opt)        — e.g. "خصم ٢٠٪"
 *   offerExpiry   ISO date (opt)                   — countdown; past → offer hidden
 *   hidePrice     bool                             — force "تواصل لمعرفة السعر"
 *   taxNote       bool                             — show VAT-inclusive note
 *   badgeType     none|popular|new|limited|bestValue|custom
 *   badge         custom badge text                — used when badgeType=custom
 *   status        available|fullyBooked|comingSoon|hidden
 *   ctaLabel / ctaHref                             — button text + destination
 *
 * The view-model keeps raw amount/currency alongside the display strings so a
 * future online-payment step can route the CTA to checkout without a redesign
 * (see card.pay). Nothing here performs payment today.
 *
 * Exports (on window):
 *   buildConsultationCards(cfg)  -> array of card view-models
 *   renderConsultationCards(cfg) -> a React element (the cards grid) or null
 */
(function () {
  'use strict';

  function h() { return window.React.createElement.apply(null, arguments); }

  // All interaction/entrance styling lives in a stylesheet (injected once) so
  // :hover / entrance transitions work — inline styles can't carry pseudo-state.
  var STYLE_ID = 'sc-consult-cards-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      /* card frame + premium hover lift */
      '.sc-card{position:relative;display:flex;flex-direction:column;background:oklch(0.99 0.004 75);border:1px solid oklch(0.88 0.01 75);border-radius:18px;overflow:hidden;transition:transform .5s cubic-bezier(.22,.61,.36,1),box-shadow .5s cubic-bezier(.22,.61,.36,1),border-color .5s ease;}',
      '.sc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,oklch(0.52 0.1 70),oklch(0.63 0.12 70));transform:scaleX(0);transform-origin:right;transition:transform .55s cubic-bezier(.22,.61,.36,1);z-index:3;}',
      '@media (hover:hover){.sc-card:hover{transform:translateY(-6px);box-shadow:0 30px 60px -34px rgba(35,33,30,.30);border-color:oklch(0.80 0.04 70);}.sc-card:hover::before{transform:scaleX(1);}}',
      '.sc-card.sc-emph{border-color:oklch(0.74 0.06 70);box-shadow:0 22px 46px -30px rgba(120,85,50,.34);}',
      '.sc-card.sc-emph::before{transform:scaleX(1);}',
      /* inner content + scroll-in entrance (only when .sc-anim is present) */
      '.sc-card-inner{position:relative;display:flex;flex-direction:column;gap:16px;padding:clamp(24px,3vw,34px);height:100%;box-sizing:border-box;}',
      '.sc-cards.sc-anim .sc-card-inner{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s cubic-bezier(.22,.61,.36,1);}',
      '.sc-cards.sc-anim.in .sc-card-inner{opacity:1;transform:none;}',
      '.sc-cards.sc-anim.in .sc-card:nth-child(1) .sc-card-inner{transition-delay:.04s}',
      '.sc-cards.sc-anim.in .sc-card:nth-child(2) .sc-card-inner{transition-delay:.12s}',
      '.sc-cards.sc-anim.in .sc-card:nth-child(3) .sc-card-inner{transition-delay:.20s}',
      '.sc-cards.sc-anim.in .sc-card:nth-child(4) .sc-card-inner{transition-delay:.28s}',
      '.sc-cards.sc-anim.in .sc-card:nth-child(5) .sc-card-inner{transition-delay:.36s}',
      '.sc-cards.sc-anim.in .sc-card:nth-child(6) .sc-card-inner{transition-delay:.44s}',
      /* badges (content + status) */
      '.sc-badge{position:absolute;top:16px;inset-inline-start:16px;z-index:2;font-size:11px;font-weight:600;letter-spacing:.2px;color:oklch(0.98 0.005 75);background:oklch(0.52 0.1 70);padding:5px 12px;border-radius:999px;box-shadow:0 6px 16px -8px rgba(120,85,50,.6);}',
      '.sc-badge.k-new{background:oklch(0.55 0.11 155);}',
      '.sc-badge.k-limited{background:oklch(0.55 0.15 35);}',
      '.sc-badge.k-best{background:oklch(0.50 0.09 265);}',
      /* price hierarchy */
      '.sc-price{display:flex;flex-direction:column;gap:6px;}',
      '.sc-price-row{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}',
      '.sc-price-now{font-size:clamp(27px,3vw,35px);font-weight:700;color:oklch(0.52 0.1 70);line-height:1.05;letter-spacing:-.01em;}',
      '.sc-price-meta{font-size:13px;color:oklch(0.5 0.01 75);}',
      '.sc-price-sub{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
      '.sc-price-was{font-size:15px;color:oklch(0.6 0.02 75);text-decoration:line-through;text-decoration-thickness:1.5px;}',
      '.sc-disc{font-size:12px;font-weight:700;color:oklch(0.44 0.13 35);background:oklch(0.94 0.05 45);padding:3px 9px;border-radius:6px;}',
      '.sc-tax{font-size:12px;color:oklch(0.55 0.01 75);}',
      '.sc-offer{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:oklch(0.48 0.1 45);}',
      /* refined CTA */
      '.sc-consult-cta{margin-top:auto;display:inline-flex;align-items:center;justify-content:center;gap:10px;color:oklch(0.98 0.005 75);background:oklch(0.16 0.012 75);padding:15px 24px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:500;box-shadow:0 14px 30px -20px rgba(35,33,30,.6);transition:background .35s ease,gap .35s ease,box-shadow .35s ease,transform .2s ease;}',
      '.sc-consult-cta .sc-arrow{transition:transform .35s cubic-bezier(.22,.61,.36,1);}',
      '@media (hover:hover){.sc-consult-cta:hover{background:oklch(0.52 0.1 70);gap:15px;box-shadow:0 20px 40px -20px rgba(120,85,50,.55);}.sc-consult-cta:hover .sc-arrow{transform:translateX(-5px);}}',
      '.sc-consult-cta:active{transform:scale(.985);}',
      '.sc-consult-cta:focus-visible{outline:2px solid oklch(0.52 0.1 70);outline-offset:3px;}',
      '.sc-cta-disabled{margin-top:auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;color:oklch(0.46 0.01 75);background:oklch(0.94 0.006 75);border:1px solid oklch(0.87 0.01 75);padding:15px 24px;border-radius:12px;font-size:15px;font-weight:600;cursor:not-allowed;}',
      /* reduced-motion: no entrance/hover motion */
      '@media (prefers-reduced-motion: reduce){.sc-cards.sc-anim .sc-card-inner{opacity:1 !important;transform:none !important;transition:none !important;}.sc-card,.sc-consult-cta,.sc-card::before{transition:none !important;}}'
    ].join('');
    document.head.appendChild(s);
  }

  // Single source of the consultation view-model.
  function buildConsultationCards(cfg) {
    if (!cfg || !cfg.services) return [];
    var CUR = { SAR: 'ريال', USD: 'دولار' };
    var PERIOD = { session: '/ الجلسة', month: '/ شهريًا', once: '' };
    var BADGE = { popular: 'الأكثر طلبًا', new: 'جديد', limited: 'عرض محدود', bestValue: 'أفضل قيمة' };
    var BADGE_KIND = { popular: '', new: 'k-new', limited: 'k-limited', bestValue: 'k-best', custom: '' };
    var num = function (v) { var n = Number(v); return isNaN(n) ? 0 : n; };
    var hasNum = function (v) { return v === 0 || (v !== '' && v != null && !isNaN(Number(v))); };
    var money = function (v, currency) { return num(v).toLocaleString('en-US') + ' ' + (CUR[currency] || currency || ''); };
    var wa = cfg.whatsapp || {};
    var waLink = (wa.enabled && wa.number)
      ? (wa.link || ('https://wa.me/' + wa.number + '?text=' + encodeURIComponent(wa.message || '')))
      : '';

    // Status resolves the new `status` field; back-compat: legacy `active:false`
    // maps to hidden when no explicit status is set.
    function statusOf(x) {
      var st = (x.status || '').trim();
      if (st) return st;
      return x.active === false ? 'hidden' : 'available';
    }

    // Badge resolves from badgeType; back-compat: an item that predates badgeType
    // falls back to the old free-text `badge` / exclusive `featured` flag.
    function badgeOf(x) {
      var t = (x.badgeType || '').trim();
      if (!t) {
        var legacy = (x.badge || '').trim() || (x.featured ? 'الأكثر طلبًا' : '');
        return legacy ? { label: legacy, kind: '', emph: x.featured === true || legacy.indexOf('الأكثر') === 0 } : null;
      }
      if (t === 'none') return null;
      if (t === 'custom') { var c = (x.badge || '').trim(); return c ? { label: c, kind: '', emph: false } : null; }
      return { label: BADGE[t] || '', kind: BADGE_KIND[t] || '', emph: (t === 'popular' || t === 'bestValue') };
    }

    // Offer countdown from offerExpiry. Past date → { expired:true } so the
    // caller suppresses the compare price + discount automatically.
    function offerOf(x) {
      var d = (x.offerExpiry || '').trim();
      if (!d) return { text: '', expired: false };
      var end = new Date(d + 'T23:59:59');
      if (isNaN(end.getTime())) return { text: '', expired: false };
      var ms = end.getTime() - Date.now();
      if (ms < 0) return { text: '', expired: true };
      var days = Math.ceil(ms / 86400000);
      var unit = days === 1 ? 'يوم واحد' : (days === 2 ? 'يومين' : (days <= 10 ? days + ' أيام' : days + ' يومًا'));
      return { text: days === 1 ? 'ينتهي العرض اليوم' : ('ينتهي العرض خلال ' + unit), expired: false };
    }

    // Current-price display (also returns raw amount/currency for future payment).
    function priceOf(x) {
      if (x.hidePrice === true || (x.priceType || 'fixed') === 'contact') return { mode: 'contact', now: 'تواصل لمعرفة السعر' };
      if ((x.priceType || '') === 'custom') return { mode: 'custom', now: (x.priceText || '').trim() };
      if (!hasNum(x.price)) return { mode: 'none', now: '' };
      var prefix = (x.priceType === 'from') ? 'يبدأ من ' : '';
      return {
        mode: 'amount',
        now: prefix + money(x.price, x.currency),
        suffix: PERIOD[x.period] || '',
        amount: num(x.price),
        currency: x.currency || 'SAR'
      };
    }

    return (cfg.services.consultations || [])
      .map(function (x, i) { return { x: x || {}, i: i }; })
      .filter(function (o) { return statusOf(o.x) !== 'hidden'; })
      .sort(function (a, b) { return (num(a.x.order) - num(b.x.order)) || (a.i - b.i); })
      .map(function (o) {
        var x = o.x;
        var feats = Array.isArray(x.features) ? x.features.filter(Boolean) : [];
        var customHref = (x.ctaHref || '').trim();
        var useWa = !customHref && !!waLink;
        var price = priceOf(x);
        var offer = offerOf(x);
        var showOffer = price.mode === 'amount' && !offer.expired;
        var hasCompare = showOffer && hasNum(x.compareAtPrice) && num(x.compareAtPrice) > price.amount;
        var status = statusOf(x);
        var statusLabel = status === 'fullyBooked' ? 'مكتمل الحجز' : (status === 'comingSoon' ? 'قريبًا' : '');
        return {
          title: x.title || '',
          description: x.description || '',
          price: price,
          durationText: num(x.durationMinutes) ? (num(x.durationMinutes) + ' دقيقة') : '',
          compareText: hasCompare ? money(x.compareAtPrice, price.currency) : '',
          discountText: showOffer ? (x.discountText || '').trim() : '',
          offerText: offer.text,
          taxNote: (x.taxNote === true && price.mode === 'amount') ? 'شامل ضريبة القيمة المضافة' : '',
          features: feats,
          badge: badgeOf(x),
          status: status,
          statusLabel: statusLabel,
          ctaDisabled: status === 'fullyBooked' || status === 'comingSoon',
          ctaLabel: x.ctaLabel || 'احجز الآن',
          ctaHref: customHref || waLink || 'Contact.dc.html',
          ctaTarget: useWa ? '_blank' : undefined,
          // Raw handle for a future online-payment step (unused today).
          pay: price.mode === 'amount' ? { amount: price.amount, currency: price.currency } : null
        };
      });
  }

  function priceBlock(card) {
    if (!card.price.now && !card.durationText) return null;
    var kids = [];
    if (card.price.now) {
      var metaBits = [];
      if (card.price.suffix) metaBits.push(h('span', { key: 's', className: 'sc-price-meta' }, card.price.suffix));
      if (card.durationText) metaBits.push(h('span', { key: 'd', className: 'sc-price-meta' }, '· ' + card.durationText));
      kids.push(h('div', { key: 'row', className: 'sc-price-row' },
        h('span', { key: 'now', className: 'sc-price-now' }, card.price.now),
        metaBits.length ? metaBits : null
      ));
      if (card.compareText || card.discountText) {
        kids.push(h('div', { key: 'sub', className: 'sc-price-sub' },
          card.compareText ? h('span', { key: 'was', className: 'sc-price-was' }, card.compareText) : null,
          card.discountText ? h('span', { key: 'disc', className: 'sc-disc' }, card.discountText) : null
        ));
      }
      if (card.offerText) kids.push(h('div', { key: 'off', className: 'sc-offer' },
        h('span', { key: 'i', 'aria-hidden': 'true' }, '⏳'), card.offerText));
      if (card.taxNote) kids.push(h('div', { key: 'tax', className: 'sc-tax' }, card.taxNote));
    } else if (card.durationText) {
      kids.push(h('div', { key: 'dur', className: 'sc-price-meta' }, card.durationText));
    }
    return h('div', { key: 'p', className: 'sc-price' }, kids);
  }

  function cardEl(card, key) {
    var inner = [];

    // One top-corner pill: the content badge, or (if none) the status label.
    var topBadge = card.badge ||
      (card.statusLabel ? { label: card.statusLabel, kind: (card.status === 'fullyBooked' ? 'k-limited' : 'k-best') } : null);
    if (topBadge) inner.push(h('span', { key: 'b', className: 'sc-badge ' + (topBadge.kind || '') }, topBadge.label));

    inner.push(h('div', { key: 't', style: { fontSize: 'clamp(20px,2vw,24px)', fontWeight: 700, color: 'oklch(0.16 0.012 75)', lineHeight: 1.4 } }, card.title));
    if (card.description) inner.push(h('div', { key: 'd', style: { fontSize: '14px', lineHeight: 1.85, color: 'oklch(0.4 0.012 75)' } }, card.description));

    var pb = priceBlock(card);
    if (pb) inner.push(pb);

    if (card.features.length) {
      inner.push(h('div', { key: 'f', style: { display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid oklch(0.9 0.008 75)' } },
        card.features.map(function (f, i) {
          return h('div', { key: i, style: { display: 'flex', gap: '10px', alignItems: 'baseline', fontSize: '14px', lineHeight: 1.7, color: 'oklch(0.35 0.012 75)' } },
            h('span', { key: 'c', 'aria-hidden': 'true', style: { color: 'oklch(0.52 0.1 70)', flex: '0 0 auto' } }, '✓'),
            h('span', { key: 'x' }, f)
          );
        })
      ));
    }

    if (card.ctaDisabled) {
      inner.push(h('span', { key: 'a', className: 'sc-cta-disabled', 'aria-disabled': 'true' }, card.statusLabel || card.ctaLabel));
    } else {
      inner.push(h('a', {
        key: 'a', href: card.ctaHref, target: card.ctaTarget, rel: 'noopener', className: 'sc-consult-cta'
      },
        h('span', { key: 'l' }, card.ctaLabel),
        h('span', { key: 'ar', className: 'sc-arrow', 'aria-hidden': 'true' }, '←')
      ));
    }

    return h('div', { key: key, className: 'sc-card' + (card.badge && card.badge.emph ? ' sc-emph' : '') },
      h('div', { className: 'sc-card-inner' }, inner)
    );
  }

  // Scroll-triggered staggered entrance. Applied via a callback ref so it also
  // works on the async CMS path. Cards are fully visible by default — the
  // .sc-anim class (which hides them pre-reveal) is only added once the observer
  // is wired, so a missing IntersectionObserver / ref never leaves them blank.
  function gridRef(node) {
    if (!node || node.__scObserved) return;
    node.__scObserved = true;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    node.classList.add('sc-anim');
    var reveal = function () { node.classList.add('in'); };
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { reveal(); io.disconnect(); clearTimeout(fallback); }
    }, { threshold: 0.12 });
    io.observe(node);
    // Safety net: never leave cards hidden if the observer never fires
    // (e.g. non-compositing contexts). Reveal-in-place after a short grace.
    var fallback = setTimeout(function () { reveal(); io.disconnect(); }, 1600);
  }

  // React element for the cards grid, or null when there are no visible items.
  function renderConsultationCards(cfg) {
    var cards = buildConsultationCards(cfg);
    if (!cards.length) return null;
    ensureStyle();
    return h('div', {
      ref: gridRef, className: 'sc-cards',
      style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 'clamp(20px,2.4vw,28px)', alignItems: 'stretch' }
    }, cards.map(function (c, i) { return cardEl(c, i); }));
  }

  window.buildConsultationCards = buildConsultationCards;
  window.renderConsultationCards = renderConsultationCards;
})();
