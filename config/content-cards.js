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
      primary: C.primary || '#48553F', onDark: C.onDark || '#FCFBF8', accent: C.accent || '#A57A4C',
      onDarkDim: C.onDarkDim || '#D6D2C6'
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
      '.cc-btn:hover{background:' + C.accent + ';transform:translateY(-2px);}' +
      // article page
      '.cc-article-cover{width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:18px;background:' + C.bg + ';margin-bottom:clamp(28px,4vw,44px);}' +
      '.cc-article-cover img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.cc-article-content{font-size:clamp(16px,1.7vw,18px);line-height:1.95;color:' + C.body + ';}' +
      '.cc-article-content h2{font-size:1.5em;font-weight:700;color:' + C.ink + ';margin:1.4em 0 .5em;line-height:1.35;}' +
      '.cc-article-content h3{font-size:1.25em;font-weight:700;color:' + C.ink + ';margin:1.2em 0 .5em;line-height:1.4;}' +
      '.cc-article-content p{margin:0 0 1.1em;}' +
      '.cc-article-content ul,.cc-article-content ol{margin:0 0 1.1em;padding-inline-start:1.6em;}' +
      '.cc-article-content li{margin-bottom:.5em;}' +
      '.cc-article-content a{color:' + C.primary + ';text-decoration:underline;}' +
      '.cc-article-content img{max-width:100%;height:auto;border-radius:10px;margin:1em 0;}' +
      '.cc-article-content blockquote{margin:1.2em 0;padding-inline-start:1em;border-inline-start:3px solid ' + C.accent + ';color:' + C.muted + ';}' +
      // end-of-article CTA (generic/reusable)
      '.cc-cta-btn{display:inline-flex;align-items:center;gap:8px;background:' + C.onDark + ';color:' + C.ink + ';padding:15px 34px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;transition:transform .2s ease,box-shadow .2s ease;}' +
      '.cc-cta-btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px rgba(0,0,0,0.5);}' +
      // sharing
      '.cc-share{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;border:1px solid ' + C.line + ';background:' + C.surface + ';color:' + C.body + ';cursor:pointer;text-decoration:none;transition:color .25s ease,border-color .25s ease,transform .2s ease;}' +
      '.cc-share:hover{color:' + C.primary + ';border-color:' + C.primary + ';transform:translateY(-2px);}' +
      '.cc-share.is-copied{color:' + C.primary + ';border-color:' + C.primary + ';}';
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

  /* ── single article ──────────────────────────────────────────────────── */
  function findArticle(cfg, slug) {
    if (!cfg || !Array.isArray(cfg.articles) || !slug) return null;
    var s = String(slug), found = null;
    cfg.articles.forEach(function (a) { if (a && a.published && String(a.slug) === s) found = a; });
    return found;
  }

  // Optional "Social Share Image" with automatic fallback to the cover image —
  // the single source for OG image and share previews.
  function shareImageOf(a) { return (a && (a.shareImage || a.cover)) || ''; }

  /* Generic, reusable end-of-content CTA — content-driven (title, description,
   * button text + URL) so it can promote a consultation, a product, a course, a
   * WhatsApp chat, or any internal/external page. Returns null when disabled or
   * empty. Not tied to articles — any page can call it with a { enabled, title,
   * description, buttonText, buttonUrl } object. */
  function renderCta(cfg, cta) {
    if (!cta || cta.enabled === false) return null;
    if (!(cta.title || cta.description || cta.buttonText)) return null;
    var C = colors(cfg); ensureStyle(C);
    var url = String(cta.buttonUrl || '').trim();
    var external = /^https?:\/\//i.test(url);
    var kids = [];
    if (cta.title) kids.push(h('h2', { key: 't', style: { fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 700, color: C.onDark, margin: '0 0 14px', lineHeight: 1.4, textWrap: 'pretty' } }, cta.title));
    if (cta.description) kids.push(h('p', { key: 'd', style: { fontSize: '15px', lineHeight: 1.9, color: C.onDarkDim, margin: '0 auto 26px', maxWidth: '560px' } }, cta.description));
    if (cta.buttonText && url) kids.push(h('a', { key: 'b', href: url, target: external ? '_blank' : undefined, rel: 'noopener', className: 'cc-cta-btn' }, cta.buttonText));
    return h('div', { style: { background: C.primary, borderRadius: '18px', padding: 'clamp(32px,5vw,52px)', textAlign: 'center', margin: 'clamp(32px,5vw,52px) 0' } }, kids);
  }

  var ICON = {
    share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.6-4.6A8 8 0 1 1 8 19.4z"/><path d="M8.5 9.5c0 3 2 5 5 5.5.6.1 1.2-.4 1.4-1 .1-.4-.1-.7-.5-.9l-1.2-.5-.9 .9c-1-.4-1.8-1.2-2.2-2.2l.9-.9-.5-1.2c-.2-.4-.5-.6-.9-.5-.4 .1-.6 .5-.6 .8z"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M20 4L4 20"/></svg>',
    linkedin: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7.5" y1="10.5" x2="7.5" y2="17"/><circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none"/><path d="M11 17v-3.5a2 2 0 0 1 4 0V17"/><line x1="11" y1="10.5" x2="11" y2="17"/></svg>',
    email: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/></svg>',
    copy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
  };

  function shareLinks(url, title) {
    var u = encodeURIComponent(url), t = encodeURIComponent(title);
    return {
      whatsapp: 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url),
      x: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u,
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
      email: 'mailto:?subject=' + t + '&body=' + u
    };
  }

  // Sharing bar — native Web Share API when supported, plus icon actions
  // (WhatsApp, X, LinkedIn, Email, Copy Link) that always work as the fallback.
  function renderSharing(cfg, article) {
    var C = colors(cfg); ensureStyle(C);
    var url = (typeof location !== 'undefined') ? location.href : '';
    var title = (article && article.title) || '';
    var L = shareLinks(url, title);
    var canNative = (typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    var actions = [];
    if (canNative) {
      actions.push(h('button', { key: 'native', type: 'button', className: 'cc-share', 'aria-label': 'مشاركة', onClick: function () { try { navigator.share({ title: title, text: title, url: url }); } catch (e) {} }, dangerouslySetInnerHTML: { __html: ICON.share } }));
    }
    actions.push(h('a', { key: 'wa', className: 'cc-share', href: L.whatsapp, target: '_blank', rel: 'noopener', 'aria-label': 'واتساب', dangerouslySetInnerHTML: { __html: ICON.whatsapp } }));
    actions.push(h('a', { key: 'x', className: 'cc-share', href: L.x, target: '_blank', rel: 'noopener', 'aria-label': 'X', dangerouslySetInnerHTML: { __html: ICON.x } }));
    actions.push(h('a', { key: 'li', className: 'cc-share', href: L.linkedin, target: '_blank', rel: 'noopener', 'aria-label': 'LinkedIn', dangerouslySetInnerHTML: { __html: ICON.linkedin } }));
    actions.push(h('a', { key: 'em', className: 'cc-share', href: L.email, 'aria-label': 'البريد الإلكتروني', dangerouslySetInnerHTML: { __html: ICON.email } }));
    actions.push(h('button', { key: 'copy', type: 'button', className: 'cc-share', 'aria-label': 'نسخ الرابط', onClick: function (e) { var b = e.currentTarget; try { navigator.clipboard.writeText(url); } catch (err) {} if (b) { b.classList.add('is-copied'); b.setAttribute('aria-label', 'تم نسخ الرابط'); } }, dangerouslySetInnerHTML: { __html: ICON.copy } }));
    return h('div', { style: { borderTop: '1px solid ' + C.line, marginTop: 'clamp(32px,5vw,48px)', paddingTop: 'clamp(24px,3vw,32px)' } },
      h('div', { key: 'lbl', style: { fontSize: '14px', color: C.muted, marginBottom: '16px' } }, 'شارك المقال'),
      h('div', { key: 'row', style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } }, actions)
    );
  }

  // Full single-article body: cover, title, meta (date · author · last updated),
  // rich content, then the generic CTA, then the sharing bar (in that order).
  function renderArticleBody(cfg, a) {
    if (!a) return null;
    var C = colors(cfg); ensureStyle(C);
    var kids = [];
    if (a.cover) kids.push(h('div', { key: 'cover', className: 'cc-article-cover' },
      h('img', { src: a.cover, alt: a.title || '', onError: function (e) { var w = e.target && e.target.parentNode; if (w && w.style) w.style.display = 'none'; } })));
    kids.push(h('h1', { key: 'title', style: { fontWeight: 700, fontSize: 'clamp(30px,4.4vw,46px)', lineHeight: 1.3, color: C.ink, margin: '0 0 18px', textWrap: 'pretty' } }, a.title || ''));

    var metaBits = [];
    var d = formatDate(a.date, cfg); if (d) metaBits.push({ k: 'd', t: d });
    if (a.author) metaBits.push({ k: 'au', t: 'بقلم ' + a.author });
    var u = formatDate(a.updated, cfg); if (u) metaBits.push({ k: 'u', t: 'آخر تحديث: ' + u });
    if (metaBits.length) {
      var metaEls = [];
      metaBits.forEach(function (m, i) {
        metaEls.push(h('span', { key: m.k }, m.t));
        if (i < metaBits.length - 1) metaEls.push(h('span', { key: m.k + '-s', 'aria-hidden': 'true', style: { margin: '0 10px', opacity: 0.5 } }, '·'));
      });
      kids.push(h('div', { key: 'meta', style: { fontSize: '14px', color: C.muted, margin: '0 0 clamp(28px,4vw,40px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center' } }, metaEls));
    }

    kids.push(h('div', { key: 'content', className: 'cc-article-content', dangerouslySetInnerHTML: { __html: a.body || '' } }));

    var cta = renderCta(cfg, a.cta); if (cta) kids.push(h('div', { key: 'cta' }, cta));   // after content …
    kids.push(h('div', { key: 'share' }, renderSharing(cfg, a)));                          // … before sharing

    return h('article', { style: { maxWidth: '760px', margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(20px,6vw,40px)' } }, kids);
  }

  window.ContentCards = {
    renderGrid: renderGrid,
    formatDate: formatDate,
    publishedArticles: publishedArticles,
    articleToCard: articleToCard,
    renderArticles: renderArticles,
    renderLatestSection: renderLatestSection,
    findArticle: findArticle,
    shareImageOf: shareImageOf,
    renderCta: renderCta,
    renderSharing: renderSharing,
    renderArticleBody: renderArticleBody
  };
})();
