/*
 * site-chrome.js — the ONE shared Header + Footer for every public page
 * =====================================================================
 * SINGLE SOURCE of the site chrome (header/nav + footer). Every public page
 * renders its header and footer through this module, so the markup, the colours
 * and the navigation source exist in exactly one place. No page reimplements a
 * header or footer; all read the same window.SITE (brand, navigation, footer,
 * social, contact, theme) — the CMS-overlaid config. A change here reaches every
 * page automatically.
 *
 * Same integration contract as config/consultation-cards.js:
 *   window.SiteChrome.renderHeader(cfg, pageId) -> React element (or null)
 *   window.SiteChrome.renderFooter(cfg, pageId) -> React element (or null)
 *   window.SiteChrome.vals(cfg)                 -> { siteHeader, siteFooter }
 *   window.SiteChrome.watch(component)          -> resolve window.SITE then setState
 *
 * A page's DC component calls SiteChrome.vals(cfg) in renderVals and drops the
 * result into its template with {{ siteHeader }} / {{ siteFooter }} (the DC
 * runtime renders a React element value inline).
 */
(function () {
  'use strict';

  function h() { return window.React.createElement.apply(null, arguments); }

  var FONT = "'IBM Plex Sans Arabic', sans-serif";
  // Header/footer link gray — the chrome's own one-off token (matches the
  // canonical Home design; not one of the theme.color tokens).
  var LINK_GRAY = '#6D675F';

  // Outline social icons — same glyphs the Home footer used. Rendered as raw
  // SVG (currentColor inherits the anchor's colour).
  var ICON = {
    linkedin: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7.5" y1="10.5" x2="7.5" y2="17"/><circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none"/><path d="M11 17v-3.5a2 2 0 0 1 4 0V17"/><line x1="11" y1="10.5" x2="11" y2="17"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M20 4L4 20"/></svg>',
    instagram: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none"/></svg>',
    email: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/></svg>'
  };

  function colors(cfg) {
    var C = (cfg && cfg.theme && cfg.theme.color) || {};
    return {
      ink: C.ink || '#232323',
      bg: C.bg || '#F7F5F2',
      surface: C.surface || '#FCFBF8',
      body: C.body || '#5F5951',
      primary: C.primary || '#48553F',
      accent: C.accent || '#A57A4C',
      muted: C.muted || '#8A837A',
      line: C.line || '#E6E0D8',
      lineSoft: C.lineSoft || '#EDE8E1',
      dark: C.dark || '#2A2A28',
      onDark: C.onDark || '#FCFBF8',
      onDarkDim: C.onDarkDim || '#D6D2C6'
    };
  }

  // Colour + :hover live in a stylesheet (injected once) so hover works — an
  // inline colour can't be overridden by a :hover rule. Inline styles below
  // carry layout only.
  var STYLE_ID = 'sc-site-chrome-style';
  function ensureStyle(k) {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.sc-nav-link{color:inherit;text-decoration:none;background-image:linear-gradient(' + k.accent + ',' + k.accent + ');background-repeat:no-repeat;background-position:0 100%;background-size:0% 1px;transition:background-size .35s ease,color .35s ease;}' +
      '.sc-nav-link:hover{background-size:100% 1px;color:' + k.ink + ';}' +
      '.sc-cta{color:' + k.primary + ';text-decoration:none;border:1px solid ' + k.primary + ';border-radius:2px;transition:background .3s ease,color .3s ease,border-color .3s ease;}' +
      '.sc-cta:hover{background:' + k.primary + ';color:' + k.onDark + ';border-color:' + k.primary + ';}' +
      '.sc-foot-link{color:' + LINK_GRAY + ';text-decoration:none;transition:color .3s ease;}' +
      '.sc-foot-link:hover{color:' + k.ink + ';}' +
      '.sc-social{color:' + LINK_GRAY + ';border:1px solid ' + k.lineSoft + ';transition:color .3s ease,border-color .3s ease;}' +
      '.sc-social:hover{color:' + k.primary + ';border-color:' + k.primary + ';}' +
      '.sc-closing-btn{transition:transform .2s ease,box-shadow .2s ease,background .2s ease;}' +
      '.sc-closing-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px -18px rgba(0,0,0,0.4);}' +
      '.sc-org-cell{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;filter:grayscale(1);opacity:.62;transition:filter .35s ease,opacity .35s ease,transform .35s ease;}' +
      '.sc-org-cell:hover{filter:grayscale(0);opacity:1;}' +
      'a.sc-org-cell:hover{transform:translateY(-2px);}';
    document.head.appendChild(s);
  }

  // Page id from the filename (Home.dc.html -> "home"), matching the WhatsApp
  // button's derivation so per-page logic stays consistent.
  function pageId() {
    var p = location.pathname || '';
    try { p = decodeURIComponent(p); } catch (e) {}
    var base = (p.split('/').pop() || 'home').replace(/\.dc\.html?$/i, '').replace(/\.html?$/i, '');
    base = (base || 'home').toLowerCase();
    if (base === 'index') base = 'home';
    return base;
  }

  // Anchor links (#topics) only resolve on the Home page; off Home, send the
  // visitor to Home first so the one nav source works on every page.
  function navHref(href, pid) {
    if (href && href.charAt(0) === '#' && pid !== 'home') return 'Home.dc.html' + href;
    return href;
  }

  // The consultation action — WhatsApp when enabled, mailto fallback. Same
  // single source the Home hero/CTA use.
  function ctaLink(cfg) {
    var wa = cfg.whatsapp || {};
    if (wa.enabled && wa.link) return { href: wa.link, target: '_blank' };
    return { href: 'mailto:' + ((cfg.contact && cfg.contact.email) || ''), target: undefined };
  }

  function renderHeader(cfg, pid) {
    if (!cfg) return null;
    var k = colors(cfg);
    ensureStyle(k);
    var brand = cfg.brand || {};
    var nav = cfg.navigation || {};
    var primary = nav.primary || [];
    var cta = nav.cta || {};
    var action = ctaLink(cfg);

    var brandEl = h('a', {
      href: 'Home.dc.html',
      style: { fontFamily: FONT, fontSize: '22px', fontWeight: 600, letterSpacing: '0.5px', color: k.ink, textDecoration: 'none' }
    }, brand.name || '');

    var links = primary.map(function (it, i) {
      return h('a', { key: i, className: 'sc-nav-link', href: navHref(it.href, pid) }, it.label);
    });
    links.push(h('a', {
      key: 'cta', className: 'sc-cta', href: action.href, target: action.target, rel: 'noopener',
      style: { padding: '10px 22px', fontSize: '14px', whiteSpace: 'nowrap', flex: '0 0 auto' }
    }, cta.label || 'احجز استشارة'));

    var navEl = h('nav', {
      style: { display: 'flex', alignItems: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap', fontSize: '15px', color: LINK_GRAY }
    }, links);

    return h('header', {
      className: 'sc-site-header',
      style: { position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', padding: '24px clamp(20px,6vw,64px)', background: k.bg, transition: 'box-shadow .35s ease' }
    }, brandEl, navEl);
  }

  function renderFooter(cfg, pid) {
    if (!cfg) return null;
    var k = colors(cfg);
    ensureStyle(k);
    var brand = cfg.brand || {};
    var contact = cfg.contact || {};
    var cols = (cfg.footer && cfg.footer.columns) || [];
    var social = cfg.social || [];

    var brandBlock = h('div', { key: 'brand', style: { flex: '1 1 220px', minWidth: '200px' } },
      h('div', { style: { fontFamily: FONT, fontSize: '20px', fontWeight: 600, marginBottom: '8px' } }, brand.name || ''),
      h('div', { style: { fontSize: '14px', lineHeight: 1.85, color: k.muted, maxWidth: '280px' } }, brand.tagline || '')
    );

    // Footer navigation: hidden items drop out; the remaining links keep their
    // CMS order (reorder via the CMS list controls) and close any gap.
    var colEls = cols.map(function (col, i) {
      var links = (col.links || []).filter(function (l) { return l && !l.hidden; });
      return h('div', { key: i, style: { flex: '1 1 160px', minWidth: '160px' } },
        h('div', { style: { fontSize: '12px', fontWeight: 600, color: k.accent, marginBottom: '18px' } }, col.title || ''),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' } },
          links.map(function (l, j) {
            return h('a', { key: j, className: 'sc-foot-link', href: l.href }, l.label);
          })
        )
      );
    });

    var topRow = h('div', { key: 'top', style: { display: 'flex', gap: 'clamp(28px,5vw,80px)', flexWrap: 'wrap' } },
      [brandBlock].concat(colEls));

    // Social channels: hidden ones drop out and the row re-flows (no empty gap).
    // The email channel's address is derived from the single source (contact.email).
    var socialEls = social.filter(function (s) { return s && !s.hidden && ICON[s.type]; }).map(function (s, i) {
      var href = (s.type === 'email') ? ('mailto:' + (contact.email || '')) : (s.href || '');
      return h('a', {
        key: i, className: 'sc-social', href: href, target: (s.type === 'email' ? undefined : '_blank'), rel: 'noopener', 'aria-label': s.label,
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%' },
        dangerouslySetInnerHTML: { __html: ICON[s.type] || '' }
      });
    });

    // Address + optional phone (phone hidden until a number is set in the CMS).
    var contactInfo = [h('span', { key: 'addr' }, contact.location || '')];
    if (contact.phone) {
      contactInfo.push(h('span', { key: 'sep', 'aria-hidden': 'true', style: { margin: '0 8px', opacity: 0.5 } }, '·'));
      contactInfo.push(h('a', { key: 'tel', href: 'tel:' + String(contact.phone).replace(/\s+/g, ''), style: { color: 'inherit', textDecoration: 'none' } }, contact.phone));
    }

    var bottom = h('div', { key: 'bottom', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px 28px', flexWrap: 'wrap', paddingTop: 'clamp(32px,3.6vw,44px)', borderTop: '1px solid #F0ECE5', fontSize: '13px', color: '#9A938A' } },
      h('div', { key: 'c' }, contact.copyright || ''),
      h('div', { key: 's', style: { display: 'flex', alignItems: 'center', gap: '16px', order: 3 } }, socialEls),
      h('div', { key: 'l', style: { color: k.muted } }, contactInfo)
    );

    // Reserve room so the fixed WhatsApp button never overlaps footer content.
    // Only added on pages where the button is actually included, on every size.
    var footPadBottom = fabOnPage()
      ? 'calc(clamp(28px,3.2vw,40px) + 72px + env(safe-area-inset-bottom,0px))'
      : 'clamp(28px,3.2vw,40px)';

    return h('footer', {
      className: 'sc-site-footer',
      style: { maxWidth: '1400px', margin: '0 auto', padding: 'clamp(50px,5.6vw,74px) clamp(20px,6vw,64px) ' + footPadBottom, display: 'flex', flexDirection: 'column', gap: 'clamp(38px,4vw,48px)' }
    }, topRow, bottom);
  }

  // True when the floating WhatsApp button module is present on this page — the
  // one signal that the fixed button will render here, so the footer reserves
  // clearance only where it is actually needed (not config-guessed).
  function fabOnPage() {
    return !!document.querySelector('script[src*="whatsapp-button.js"]');
  }

  // Background style -> a section background token + whether it reads as "dark".
  // Colours come only from the theme tokens (no hardcoded colours here).
  function bgFor(name, k) {
    switch (name) {
      case 'secondary':   return { bg: k.accent,     dark: true };
      case 'light':       return { bg: k.surface,    dark: false };
      case 'dark':        return { bg: k.dark,       dark: true };
      case 'transparent': return { bg: 'transparent', dark: false };
      case 'primary':
      default:            return { bg: k.primary,    dark: true };
    }
  }

  // Button style -> inline layout + token colours, adapted to the background so
  // the button always reads correctly. Hover (lift) lives in the stylesheet.
  function buttonStyleFor(name, onDarkBg, k) {
    var base = { display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '18px 44px', borderRadius: '14px', textDecoration: 'none', fontSize: '16px', border: '1px solid transparent' };
    var contrast = onDarkBg ? k.onDark : k.primary;
    switch (name) {
      case 'secondary':
        return Object.assign({}, base, { background: k.accent, color: k.onDark, border: '1px solid ' + k.accent });
      case 'outline':
        return Object.assign({}, base, { background: 'transparent', color: contrast, border: '1px solid ' + contrast });
      case 'ghost':
        return Object.assign({}, base, { background: 'transparent', color: contrast });
      case 'primary':
      default:
        // On a dark background the high-emphasis button inverts to a light fill
        // (the site's established closing-CTA look); on a light background it
        // fills with the primary token.
        return onDarkBg
          ? Object.assign({}, base, { background: k.onDark, color: k.ink, border: '1px solid #E1D8C9' })
          : Object.assign({}, base, { background: k.primary, color: k.onDark, border: '1px solid ' + k.primary });
    }
  }

  // Button destination — WhatsApp (the single consultation action), Email
  // (single-source contact email), an internal page, or an external URL.
  function closingDestination(cfg, cc) {
    var btn = (cc && cc.button) || {};
    var type = btn.destinationType || 'whatsapp';
    var dest = (btn.destination || '').trim();
    if (type === 'email') return { href: 'mailto:' + ((cfg.contact && cfg.contact.email) || ''), target: undefined };
    if (type === 'internal') return { href: dest || 'Contact.dc.html', target: undefined };
    if (type === 'external') return { href: dest || '#', target: '_blank' };
    return ctaLink(cfg); // whatsapp (with mailto fallback) — the default
  }

  // Shared final call-to-action — ONE CMS-managed component (content.closingCta)
  // used by every content page. Fully content-driven: show/hide, title, body,
  // button label + destination, and a token-only appearance (background / text /
  // button style). Returns null when hidden, so the page reserves no height and
  // the footer moves up. Defaults reproduce the site's established look.
  function renderClosingCta(cfg) {
    if (!cfg) return null;
    var cc = (cfg.content && cfg.content.closingCta) || {};
    if (cc.enabled === false) return null; // show / hide (absent = visible)
    var k = colors(cfg);
    ensureStyle(k);

    var b = bgFor(cc.background, k);
    var onDarkBg = b.dark;
    // Text style: 'auto' (default) follows the background; light/dark force it.
    var textLight = (cc.textStyle === 'light') ? true : (cc.textStyle === 'dark') ? false : onDarkBg;
    var titleColor = textLight ? k.onDark : k.ink;
    var bodyColor = textLight ? k.onDarkDim : k.body;

    var action = closingDestination(cfg, cc);
    var btnStyle = buttonStyleFor(cc.buttonStyle, onDarkBg, k);

    var kids = [];
    // The subtle grid + glow belong to the dark treatments (original design);
    // they add nothing on a light/transparent background, so skip them there.
    if (onDarkBg) {
      kids.push(h('div', { key: 'grid', 'aria-hidden': 'true', style: { position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(252,251,248,0.5) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(252,251,248,0.5) 0.5px, transparent 0.5px)', backgroundSize: '72px 72px', opacity: 0.025 } }));
      kids.push(h('div', { key: 'glow', 'aria-hidden': 'true', style: { position: 'absolute', top: '30%', left: '50%', width: 'min(760px,92%)', height: '400px', transform: 'translate(-50%,-50%)', zIndex: 0, background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' } }));
    }
    kids.push(h('div', { key: 'inner', style: { position: 'relative', zIndex: 1, maxWidth: '820px', margin: '0 auto' } },
      h('h2', { style: { fontFamily: FONT, fontWeight: 600, fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.4, margin: '0 0 32px', textWrap: 'pretty', color: titleColor } }, cc.title || ''),
      h('p', { style: { fontSize: '16px', lineHeight: 1.9, color: bodyColor, maxWidth: '600px', margin: '0 auto 52px' } }, cc.body || ''),
      h('a', { href: action.href, target: action.target, rel: 'noopener', className: 'sc-closing-btn', style: btnStyle },
        h('span', { key: 'l' }, (cc.button && cc.button.label) || ''),
        h('span', { key: 'a', 'aria-hidden': 'true' }, '←')
      )
    ));

    return h('section', {
      id: 'contact', 'data-reveal': 'up',
      style: { position: 'relative', overflow: 'hidden', background: b.bg, color: titleColor, padding: 'clamp(80px,11vw,140px) clamp(20px,6vw,64px)', textAlign: 'center', opacity: 0, transform: 'translateY(16px)', transition: 'opacity 1s cubic-bezier(0.22,0.61,0.36,1), transform 1s cubic-bezier(0.22,0.61,0.36,1)' }
    }, kids);
  }

  // Shared "Organizations" logo wall — ONE CMS-managed component
  // (content.organizations) reusable on any page. Fully content-driven:
  // show/hide the whole section, optional title + description (each with its own
  // show/hide), and an unlimited list of logos. Each item: logo, name, optional
  // url, alt text, display order, and a per-item hide. Returns null when the
  // section is disabled or has no visible logo, so the page reserves no height.
  // Placement on a page is decided by the page (via `position`), not here — this
  // renderer only produces the section. No organization is hardcoded.
  function renderOrganizations(cfg) {
    if (!cfg) return null;
    var org = (cfg.content && cfg.content.organizations) || {};
    if (org.enabled === false) return null;                 // show / hide (absent = visible)
    // Visible items only (drop hidden and any lacking a logo), ordered by `order`.
    var items = (org.items || []).filter(function (o) { return o && !o.hidden && o.logo; });
    items = items.slice().sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
    if (!items.length) return null;                         // nothing to show → no empty section
    var k = colors(cfg);
    ensureStyle(k);

    var head = [];
    if (org.showTitle !== false && org.title) {
      head.push(h('h2', { key: 't', style: { fontFamily: FONT, fontWeight: 700, fontSize: 'clamp(26px,3.2vw,38px)', lineHeight: 1.34, margin: 0, color: k.ink, textWrap: 'pretty' } }, org.title));
    }
    if (org.showDescription && org.body) {
      head.push(h('p', { key: 'd', style: { fontSize: '16px', lineHeight: 1.9, color: k.body, margin: head.length ? '18px 0 0' : 0, maxWidth: '600px', marginInline: 'auto' } }, org.body));
    }

    // Each logo: an <a> (new tab) when a URL exists, else a non-clickable <div>.
    // A broken image hides its own cell so the wall never shows a broken glyph.
    var cells = items.map(function (o, i) {
      var img = h('img', {
        src: o.logo, alt: (o.alt || o.name || ''), loading: 'lazy',
        onError: function (e) { var c = e.target && e.target.parentNode; if (c && c.style) c.style.display = 'none'; },
        style: { maxHeight: '46px', maxWidth: '150px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }
      });
      var url = String(o.url || '').trim();
      var cellStyle = { width: 'clamp(120px,15vw,160px)', height: '64px' };
      if (url) {
        return h('a', { key: i, className: 'sc-org-cell', href: url, target: '_blank', rel: 'noopener', 'aria-label': (o.name || o.alt || ''), style: cellStyle }, img);
      }
      return h('div', { key: i, className: 'sc-org-cell', role: 'img', 'aria-label': (o.name || o.alt || ''), style: cellStyle }, img);
    });

    var grid = h('div', { key: 'grid', style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 'clamp(24px,3.5vw,52px)' } }, cells);

    return h('section', {
      id: 'organizations', 'data-reveal': 'up',
      style: { maxWidth: '1400px', margin: '0 auto', padding: 'clamp(56px,7vw,96px) clamp(20px,6vw,64px)', borderTop: '1px solid ' + k.line, textAlign: 'center', opacity: 0, transform: 'translateY(16px)', transition: 'opacity 1s cubic-bezier(0.22,0.61,0.36,1), transform 1s cubic-bezier(0.22,0.61,0.36,1)' }
    },
      head.length ? h('div', { key: 'head', style: { maxWidth: '640px', margin: '0 auto clamp(40px,5vw,60px)' } }, head) : null,
      grid
    );
  }

  function vals(cfg) {
    var pid = pageId();
    var email = (cfg && cfg.contact && cfg.contact.email) || '';
    return {
      siteHeader: renderHeader(cfg, pid),
      siteFooter: renderFooter(cfg, pid),
      siteClosing: renderClosingCta(cfg),
      // Single-source contact values for page bodies (Contact/Privacy/Terms) so
      // the email/address live only in the CMS, never hardcoded per page.
      contactEmail: email,
      contactEmailHref: email ? ('mailto:' + email) : '',
      contactAddress: (cfg && cfg.contact && cfg.contact.location) || ''
    };
  }

  // Resolve window.SITE (CMS-overlaid, may arrive async) then re-render the
  // page. setTimeout — not rAF — so it also advances in a background tab.
  function watch(cmp) {
    if (cmp.state && cmp.state.cfg) return;
    var tries = 0;
    (function poll() {
      if (window.SITE) { cmp.setState({ cfg: window.SITE }); return; }
      if (tries++ < 400) setTimeout(poll, 30);
    })();
  }

  // Sticky-header shadow on scroll — one global listener, re-queried each tick
  // so it survives component re-renders. Matches the canonical Home behaviour.
  function initScroll() {
    var apply = function () {
      var el = document.querySelector('.sc-site-header');
      if (el) el.style.boxShadow = (window.scrollY > 24) ? '0 1px 0 #E6E0D8' : 'none';
    };
    window.addEventListener('scroll', apply, { passive: true });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initScroll);
  else initScroll();

  window.SiteChrome = {
    pageId: pageId,
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderClosingCta: renderClosingCta,
    renderOrganizations: renderOrganizations,
    vals: vals,
    watch: watch
  };
})();
