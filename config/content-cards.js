/*
 * content-cards.js — ONE reusable card-grid renderer for card-based content
 * =========================================================================
 * A GENERIC content-card component, deliberately NOT tied to articles. The core
 * `renderGrid(cards, opts)` renders any list of normalized card view-models:
 *
 *   card = { image, imageAlt, badge, title, meta, summary, href, hrefTarget,
 *            ctaLabel }
 *
 * Any content type (articles today; products, courses, news, case studies later)
 * reuses it by writing a small adapter that maps its items to that shape and
 * calls renderGrid — no card markup is duplicated. The article adapters below
 * (publishedArticles / articleToCard / renderArticles / renderLatestSection) are
 * the first consumer and the template for future ones.
 *
 * Exports (window.ContentCards):
 *   renderGrid(cards, opts)        -> grid element (or null)          [generic]
 *   formatDate(value, cfg)         -> localized date string           [generic]
 *   publishedArticles(cfg)         -> published articles, newest first
 *   articleToCard(cfg, article)    -> a card view-model
 *   renderArticles(cfg, limit?)    -> grid element (or null)
 *   renderLatestSection(cfg)       -> homepage "Latest Articles" section (or null)
 *
 * Pages call these in renderVals and drop the result into the template with
 * {{ ... }} (the DC runtime renders a React element value inline).
 */
(function () {
  'use strict';

  function h() { return window.React.createElement.apply(null, arguments); }

  // Theme tokens with safe fallbacks (same approach as site-chrome.js) so cards
  // inherit the site's colours and stay consistent across pages.
  function colors(cfg) {
    var C = (cfg && cfg.theme && cfg.theme.color) || {};
    return {
      ink: C.ink || '#232323', body: C.body || '#5F5951', muted: C.muted || '#8A837A',
      line: C.line || '#E6E0D8', surface: C.surface || '#FCFBF8', bg: C.bg || '#F7F5F2',
      primary: C.primary || '#48553F', onDark: C.onDark || '#FCFBF8', accent: C.accent || '#A57A4C'
    };
  }

  var STYLE_ID = 'cc-content-cards-style';
  function ensureStyle(C) {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.cc-card{display:flex;flex-direction:column;overflow:hidden;text-decoration:none;background:' + C.surface + ';border:1px solid ' + C.line + ';border-radius:18px;transition:border-color .25s ease,box-shadow .25s ease,transform .25s ease;}' +
      '.cc-card:hover{border-color:' + C.primary + ';box-shadow:0 22px 44px -28px rgba(0,0,0,0.28);transform:translateY(-3px);}' +
      '.cc-media{position:relative;width:100%;aspect-ratio:16/9;background:' + C.bg + ';overflow:hidden;}' +
      '.cc-media img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.cc-clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
      '.cc-clamp3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}' +
      '.cc-more{margin-top:auto;display:inline-flex;align-items:center;gap:8px;color:' + C.primary + ';font-size:14px;font-weight:600;transition:gap .3s ease;}' +
      '.cc-card:hover .cc-more{gap:14px;}' +
      '.cc-btn{display:inline-flex;align-items:center;gap:10px;background:' + C.primary + ';color:' + C.onDark + ';padding:15px 34px;border-radius:10px;text-decoration:none;font-size:15px;transition:background .3s ease,transform .2s ease;}' +
      '.cc-btn:hover{background:' + C.accent + ';transform:translateY(-2px);}';
    document.head.appendChild(s);
  }

  /* ── GENERIC card + grid ─────────────────────────────────────────────── */
  function cardEl(card, key, C) {
    var kids = [];
    if (card.image) {
      kids.push(h('div', { key: 'm', className: 'cc-media' },
        h('img', {
          src: card.image, alt: card.imageAlt || card.title || '', loading: 'lazy',
          onError: function (e) { var w = e.target && e.target.parentNode; if (w && w.style) w.style.display = 'none'; }
        })
      ));
    }
    var body = [];
    if (card.badge) {
      body.push(h('span', { key: 'badge', style: { alignSelf: 'flex-start', fontSize: '11px', fontWeight: 600, color: C.onDark, background: C.accent, padding: '4px 12px', borderRadius: '999px' } }, card.badge));
    }
    if (card.meta) {
      body.push(h('div', { key: 'meta', style: { fontSize: '13px', color: C.muted } }, card.meta));
    }
    body.push(h('div', { key: 'title', className: 'cc-clamp2', style: { fontSize: 'clamp(19px,1.9vw,23px)', fontWeight: 700, color: C.ink, lineHeight: 1.45 } }, card.title));
    if (card.summary) {
      body.push(h('div', { key: 'sum', className: 'cc-clamp3', style: { fontSize: '14px', lineHeight: 1.85, color: C.muted } }, card.summary));
    }
    if (card.ctaLabel) {
      body.push(h('span', { key: 'more', className: 'cc-more' }, h('span', { key: 'l' }, card.ctaLabel), h('span', { key: 'a', 'aria-hidden': 'true' }, '←')));
    }
    kids.push(h('div', { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: '12px', padding: 'clamp(20px,2.4vw,28px)', flex: '1 1 auto' } }, body));

    var props = { key: key, className: 'cc-card' };
    if (card.href) { props.href = card.href; props.target = card.hrefTarget; props.rel = 'noopener'; }
    return h(card.href ? 'a' : 'div', props, kids);
  }

  // GENERIC: render any normalized card list. opts: { cfg, minCol }.
  function renderGrid(cards, opts) {
    if (!cards || !cards.length) return null;
    opts = opts || {};
    var C = colors(opts.cfg);
    ensureStyle(C);
    var min = opts.minCol || 320;
    return h('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(' + min + 'px,100%),1fr))', gap: 'clamp(20px,2.6vw,32px)' }
    }, cards.map(function (c, i) { return cardEl(c, i, C); }));
  }

  /* ── shared helpers ──────────────────────────────────────────────────── */
  function dateVal(s) { var t = Date.parse(s); return isNaN(t) ? 0 : t; }
  function formatDate(value, cfg) {
    if (!value) return '';
    var t = Date.parse(value);
    if (isNaN(t)) return String(value);
    try {
      var loc = (cfg && cfg.site && cfg.site.lang === 'en') ? 'en-US' : 'ar';
      return new Date(t).toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return String(value); }
  }

  /* ── ARTICLE adapter (first consumer; template for future types) ─────── */
  function publishedArticles(cfg) {
    var arr = (cfg && Array.isArray(cfg.articles)) ? cfg.articles : [];
    return arr
      .map(function (a, i) { return { a: a || {}, i: i }; })
      .filter(function (o) { return o.a.published && o.a.title; })
      .sort(function (x, y) { return (dateVal(y.a.date) - dateVal(x.a.date)) || (x.i - y.i); })
      .map(function (o) { return o.a; });
  }
  function articleToCard(cfg, a) {
    return {
      image: a.cover || '', imageAlt: a.title || '', badge: a.featured ? 'مميّز' : '',
      title: a.title || '', meta: formatDate(a.date, cfg), summary: a.summary || '',
      href: 'Article.dc.html?slug=' + encodeURIComponent(a.slug || ''), ctaLabel: 'اقرأ المزيد'
    };
  }
  function renderArticles(cfg, limit) {
    var list = publishedArticles(cfg);
    if (limit) list = list.slice(0, limit);
    return renderGrid(list.map(function (a) { return articleToCard(cfg, a); }), { cfg: cfg });
  }

  // Homepage "Latest Articles" section: heading + latest 3 + "View All" button.
  // Content-driven (content.latestArticles) and returns null when disabled or
  // when there are no published articles, so the page reserves no empty space.
  function renderLatestSection(cfg) {
    if (!cfg) return null;
    var la = (cfg.content && cfg.content.latestArticles) || {};
    if (la.enabled === false) return null;
    var grid = renderArticles(cfg, 3);
    if (!grid) return null;
    var C = colors(cfg); ensureStyle(C);
    return h('section', {
      id: 'articles', 'data-reveal': 'up',
      style: { maxWidth: '1400px', margin: '0 auto', padding: 'clamp(72px,9vw,120px) clamp(20px,6vw,64px)', borderTop: '1px solid ' + C.line, opacity: 0, transform: 'translateY(16px)', transition: 'opacity 1s cubic-bezier(0.22,0.61,0.36,1), transform 1s cubic-bezier(0.22,0.61,0.36,1)' }
    },
      h('h2', { key: 'h', style: { fontSize: 'clamp(28px,3.4vw,42px)', fontWeight: 700, lineHeight: 1.32, color: C.ink, margin: '0 0 clamp(40px,5vw,64px)', maxWidth: '640px', textWrap: 'pretty' } }, la.title || 'أحدث المقالات'),
      grid,
      h('div', { key: 'va', style: { textAlign: 'center', marginTop: 'clamp(40px,5vw,60px)' } },
        h('a', { href: 'Articles.dc.html', className: 'cc-btn' }, la.viewAllLabel || 'عرض كل المقالات'))
    );
  }

  window.ContentCards = {
    renderGrid: renderGrid,
    formatDate: formatDate,
    publishedArticles: publishedArticles,
    articleToCard: articleToCard,
    renderArticles: renderArticles,
    renderLatestSection: renderLatestSection
  };
})();
