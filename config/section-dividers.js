/*
 * section-dividers.js — the ONE reusable Section Divider design system
 * ====================================================================
 * A premium, CMS-managed set of divider styles that refine the vertical flow
 * BETWEEN existing sections. It adds NO section and removes NONE; it only draws
 * a calm, architectural transition in the gap between two sections.
 *
 * Same integration contract as config/site-chrome.js:
 *   window.SectionDividers.render(cfg) -> a decorative React element (or null)
 *
 * A page drops {{ dividerAfterX }} tokens between its sections and maps each to
 * render(cfg) in renderVals — exactly how the shared Organizations wall is
 * placed. Every divider on the page is identical (one system, one look), driven
 * entirely by content.sectionDividers in the CMS:
 *
 *   enabled            show / hide the whole system (off = original layout)
 *   style              'A' minimal line · 'B' geometric scale · 'C' soft glow
 *   opacity            overall presence            (0–100 %)
 *   thickness          hairline / mark weight      (px)
 *   accentIntensity    olive saturation of lines   (0–100 %)
 *   ornament           show / hide the centered ornament
 *   density            number of ornamental marks / ticks / glow layers
 *   spacingTop         space above the divider     (px)
 *   spacingBottom      space below the divider     (px)
 *
 * Design language (shared across A/B/C so they read as one family): a fine olive
 * hairline, architectural symmetry, and a small rotated-square (diamond) motif.
 * Olive only — the accent is the brand PRIMARY token, never the brown accent.
 *
 * Adding a new style later = one more branch in buildInner() + one option in the
 * CMS select. Nothing else changes. All colour comes from theme tokens; sizes
 * are the CMS values (no hidden hardcoded look).
 *
 * Lightweight & safe: pure CSS/inline SVG-free markup, no images, no listeners,
 * no animation. Every divider is aria-hidden (decorative), so it is invisible to
 * assistive tech and never interferes with the reveal animations (it carries no
 * data-reveal and starts fully painted).
 */
(function () {
  'use strict';

  function h() { return window.React.createElement.apply(null, arguments); }

  // Defaults — kept identical to config/site.config.js content.sectionDividers,
  // so the system looks the same whether or not a value was saved.
  var DEFAULTS = {
    enabled: true, style: 'A', opacity: 100, thickness: 1,
    accentIntensity: 55, ornament: true, density: 3,
    spacingTop: 56, spacingBottom: 56
  };

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  // "#48553F" -> "72,85,63" (olive). Falls back to the olive primary token.
  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return '72,85,63';
    var i = parseInt(m[1], 16);
    return ((i >> 16) & 255) + ',' + ((i >> 8) & 255) + ',' + (i & 255);
  }

  function conf(cfg) {
    var d = (cfg && cfg.content && cfg.content.sectionDividers) || {};
    return {
      enabled: d.enabled !== false,                               // absent = on
      style: (d.style || DEFAULTS.style),
      opacity: clamp(num(d.opacity, DEFAULTS.opacity), 0, 100) / 100,
      thickness: clamp(num(d.thickness, DEFAULTS.thickness), 0.5, 6),
      intensity: clamp(num(d.accentIntensity, DEFAULTS.accentIntensity), 0, 100) / 100,
      ornament: d.ornament !== false,                             // absent = on
      density: clamp(Math.round(num(d.density, DEFAULTS.density)), 1, 9),
      top: clamp(num(d.spacingTop, DEFAULTS.spacingTop), 0, 240),
      bottom: clamp(num(d.spacingBottom, DEFAULTS.spacingBottom), 0, 240)
    };
  }

  // When the system is on, the divider OWNS the transition, so the plain
  // hairline borders the affected sections already carry are hidden (otherwise a
  // second line would sit a spacing-gap away and read as an accident). Gated on
  // the html.sd-on class, so turning dividers OFF restores the original borders
  // exactly — nothing about the base layout is permanently altered.
  var STYLE_ID = 'sd-divider-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.sd-slot{width:100%;box-sizing:border-box;}' +
      '.sd-slot *{box-sizing:border-box;}' +
      'html.sd-on #how,html.sd-on #stats,html.sd-on #why,html.sd-on #consultations{border-top-color:transparent!important;}';
    document.head.appendChild(s);
  }

  var ON_CLASS = 'sd-on';
  function applyOn(on) {
    try { document.documentElement.classList.toggle(ON_CLASS, !!on); } catch (e) {}
  }

  /* ── STYLE A — minimal architectural line ────────────────────────────────
   * A fine olive hairline that fades out at both ends, with a small centered
   * ornament (a hollow diamond flanked by graduated dots). density = number of
   * centre marks. ornament off = a clean fading hairline, nothing else. */
  function styleA(o, line, orn) {
    var halfBase = 'flex:1 1 auto;min-width:36px;height:' + o.thickness + 'px;';
    var left = '<span style="' + halfBase + 'background:linear-gradient(to left,' + line + ',transparent);"></span>';
    var right = '<span style="' + halfBase + 'background:linear-gradient(to right,' + line + ',transparent);"></span>';
    var center = '<span style="width:26px;"></span>';
    if (o.ornament) {
      var n = o.density, mid = (n - 1) / 2, marks = [];
      for (var i = 0; i < n; i++) {
        var dist = Math.abs(i - mid);
        if (dist < 0.6) {
          marks.push('<span style="display:block;width:9px;height:9px;transform:rotate(45deg);border:' + o.thickness + 'px solid ' + orn + ';"></span>');
        } else {
          var dot = dist <= 1.6 ? 5 : 3.5;
          marks.push('<span style="display:block;width:' + dot + 'px;height:' + dot + 'px;border-radius:50%;background:' + orn + ';"></span>');
        }
      }
      center = '<span style="display:inline-flex;align-items:center;gap:11px;padding:0 16px;flex:0 0 auto;">' + marks.join('') + '</span>';
    }
    return '<div style="display:flex;align-items:center;justify-content:center;max-width:560px;margin:0 auto;">' + left + center + right + '</div>';
  }

  /* ── STYLE B — geometric construction scale ──────────────────────────────
   * A hairline crossed by evenly spaced vertical ticks, graduated tallest at the
   * centre — an architect's measure, perfectly symmetric. density = tick count
   * (forced odd for a true centre). ornament = a centred diamond accent. */
  function styleB(o, line, orn) {
    var n = Math.max(3, o.density); if (n % 2 === 0) n += 1;
    var mid = (n - 1) / 2, ticks = [];
    for (var i = 0; i < n; i++) {
      var t = mid === 0 ? 0 : Math.abs(i - mid) / mid;          // 0 centre .. 1 edge
      if (i === mid && o.ornament) {
        ticks.push('<span style="position:relative;display:inline-flex;width:12px;height:12px;align-items:center;justify-content:center;">' +
          '<span style="display:block;width:9px;height:9px;transform:rotate(45deg);border:' + o.thickness + 'px solid ' + orn + ';"></span></span>');
      } else {
        var hgt = Math.round(6 + (1 - t) * 11);                  // ~17px centre → ~6px edge
        ticks.push('<span style="display:block;width:' + o.thickness + 'px;height:' + hgt + 'px;background:' + line + ';"></span>');
      }
    }
    var row = '<div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:clamp(9px,2vw,18px);">' + ticks.join('') + '</div>';
    var rule = '<div style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);height:' + o.thickness + 'px;z-index:0;background:linear-gradient(to right,transparent,' + line + ' 16%,' + line + ' 84%,transparent);"></div>';
    return '<div style="position:relative;max-width:560px;margin:0 auto;">' + rule + row + '</div>';
  }

  /* ── STYLE C — soft transition glow ──────────────────────────────────────
   * No hard line: layered, very low-opacity olive radial fields that blend one
   * section into the next (the section borders are already suppressed above).
   * density = number of layered glows (depth). ornament = a faint centred
   * diamond focal point. */
  function styleC(o, rgb) {
    var strong = 'rgba(' + rgb + ',' + (o.intensity * 0.17).toFixed(3) + ')';
    var soft = 'rgba(' + rgb + ',' + (o.intensity * 0.06).toFixed(3) + ')';
    var layers = [
      '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,90%);height:100%;background:radial-gradient(ellipse 62% 58% at 50% 50%,' + strong + ' 0%,' + soft + ' 44%,transparent 72%);"></div>'
    ];
    if (o.density >= 2) layers.push('<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1120px,100%);height:128%;background:radial-gradient(ellipse 60% 54% at 50% 50%,' + soft + ' 0%,transparent 70%);"></div>');
    if (o.density >= 5) layers.push('<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(400px,58%);height:66%;background:radial-gradient(ellipse 58% 60% at 50% 50%,' + strong + ' 0%,transparent 66%);"></div>');
    var focal = '';
    if (o.ornament) {
      var oc = 'rgba(' + rgb + ',' + Math.min(1, o.intensity * 0.85).toFixed(3) + ')';
      focal = '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(45deg);width:8px;height:8px;border:' + o.thickness + 'px solid ' + oc + ';"></div>';
    }
    return '<div style="position:relative;max-width:1120px;margin:0 auto;height:clamp(120px,20vw,196px);pointer-events:none;">' + layers.join('') + focal + '</div>';
  }

  function buildInner(o, cfg) {
    var C = (cfg && cfg.theme && cfg.theme.color) || {};
    var rgb = hexToRgb(C.primary || '#48553F');                  // olive PRIMARY token
    var line = 'rgba(' + rgb + ',' + o.intensity.toFixed(3) + ')';
    var orn = 'rgba(' + rgb + ',' + Math.min(1, o.intensity * 1.12).toFixed(3) + ')';
    switch (o.style) {
      case 'B': return styleB(o, line, orn);
      case 'C': return styleC(o, rgb);
      case 'A':
      default: return styleA(o, line, orn);
    }
  }

  // The single reusable divider. Returns a decorative element for the current
  // CMS style, or null when the system is disabled (page then reserves no height
  // and the original borders return).
  function render(cfg) {
    var o = conf(cfg);
    if (!o.enabled) { applyOn(false); return null; }
    ensureStyle();
    applyOn(true);
    var hpad = 'clamp(20px,6vw,64px)';
    return h('div', {
      className: 'sd-slot', 'aria-hidden': 'true', role: 'presentation',
      style: { padding: o.top + 'px ' + hpad + ' ' + o.bottom + 'px', opacity: o.opacity }
    }, h('div', { dangerouslySetInnerHTML: { __html: buildInner(o, cfg) } }));
  }

  window.SectionDividers = { render: render, DEFAULTS: DEFAULTS };
})();
