/*
 * app.js — Admin Dashboard shell
 * ==============================================================
 * Wiring only. All form rendering is delegated to FormEngine (form-engine.js)
 * driven by CMS_SCHEMA (schema.js); all persistence goes through SiteContent
 * (data-service.js). Edits accumulate across sections in one working document
 * and are persisted (whole-doc) by a single Save.
 */
(function () {
  'use strict';

  var GROUPS = window.CMS_SCHEMA.GROUPS;
  var SECTIONS = window.CMS_SCHEMA.SECTIONS;
  var SERVICES_DEFAULT = window.CMS_SCHEMA.SERVICES_DEFAULT;
  var FE = window.FormEngine;

  var state = { doc: null, original: null, activeId: null };

  var $ = function (s) { return document.querySelector(s); };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sectionById(id) { return SECTIONS.filter(function (s) { return s.id === id; })[0]; }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ── Document normalization ───────────────────────────────────────────────
   * config/site.config.js derives the brand and contact aliases from site
   * and builds whatsapp.link from number+message. The editor exposes the
   * canonical fields (site fields, whatsapp number/message); this keeps the
   * derived aliases in sync so the emitted document stays consistent. */
  function normalizeDoc(doc) {
    // Single source of truth for the email: it must live only in site.email.
    // A legacy "email" social channel used to carry its own address — a second,
    // divergent copy. Adopt any such address into site.email, then drop it from
    // the channel so an email can never be stored in two places again. The
    // footer icon derives its mailto from site.email, so the displayed email
    // and the generated link always come from the same source.
    if (Array.isArray(doc.social) && doc.site) {
      doc.social.forEach(function (s) {
        if (!s || s.type !== 'email') return;
        var addr = String(s.href || '').replace(/^mailto:/i, '').trim();
        if (addr) doc.site.email = addr;
        if ('href' in s) delete s.href;
      });
    }
    if (doc.site) {
      doc.brand = doc.brand || {}; doc.contact = doc.contact || {};
      doc.brand.name = doc.site.name;
      doc.brand.tagline = doc.site.tagline;
      doc.brand.heroKicker = doc.site.heroKicker;
      doc.brand.portrait = doc.site.portrait;
      doc.contact.email = doc.site.email;
      doc.contact.phone = doc.site.phone;
      doc.contact.location = doc.site.location;
      doc.contact.copyright = doc.site.copyright;
    }
    if (doc.whatsapp) {
      var n = doc.whatsapp.number || '';
      var m = doc.whatsapp.message || '';
      doc.whatsapp.link = 'https://wa.me/' + n + '?text=' + encodeURIComponent(m);
    }
    return doc;
  }

  /* ── Services migration (one-time, non-destructive) ───────────────────────
   * Packages & Pricing was merged into Consultations. On load we upgrade any
   * previously saved document to the merged model so the editor and the public
   * renderer stay consistent. Idempotent: safe to run on every load.
   *   • drop the obsolete `services.plans` collection.
   *   • default `priceType` to 'fixed' (the pre-existing numeric behaviour).
   *   • carry the old exclusive `featured` flag into the new `badge` text. */
  function migrateServices(doc) {
    if (!doc.services) return;
    if ('plans' in doc.services) delete doc.services.plans;
    var list = doc.services.consultations;
    if (Array.isArray(list)) list.forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      if (x.priceType == null) x.priceType = 'fixed';
      if (x.badge == null) x.badge = x.featured ? 'الأكثر طلبًا' : '';
      if ('featured' in x) delete x.featured;
    });
  }

  /* ── Boot / auth gate ─────────────────────────────────────────────────────
   * When Supabase is configured, writing requires a signed-in session, so an
   * unauthenticated visitor sees the login screen first. When Supabase is not
   * configured (credentials not filled in yet), the CMS still opens on the
   * bundled config (read-only) so the workflow is unchanged for setup. */
  /* ── Existing-image source for the Media Manager ──────────────────────────
   * Walks the schema over the working document and collects every image-typed
   * field's current value (including images inside lists). This powers the
   * shared image control's "choose existing" action so a logo/portrait/cover
   * can be reused without re-uploading — no separate media library or backend. */
  function collectDocImages() {
    var doc = state.doc;
    if (!doc) return [];
    var out = [];
    function join(b, k) { return b ? b + '.' + k : k; }
    function walk(fields, base) {
      (fields || []).forEach(function (node) {
        var path = join(base, node.key);
        if (node.type === 'group') walk(node.fields, path);
        else if (node.type === 'list') {
          var arr = FE.getPath(doc, path);
          if (Array.isArray(arr) && !node.strings) arr.forEach(function (_, i) { walk(node.fields, path + '.' + i); });
        } else if (node.type === 'image') {
          var v = FE.getPath(doc, path);
          if (typeof v === 'string' && v) out.push({ url: v, label: node.label });
        }
      });
    }
    SECTIONS.forEach(function (sec) { walk(sec.fields, sec.base); });
    return out;
  }

  function start() {
    wireChrome();
    if (window.MediaManager && window.MediaManager.setImageSource) window.MediaManager.setImageSource(collectDocImages);
    gate();
  }

  function gate() {
    if (window.SB && window.SB.configured() && !window.SB.isAuthed()) {
      renderLogin();
      $('#app').setAttribute('aria-busy', 'false');
      return;
    }
    boot();
  }

  function boot() {
    window.SiteContent.load().then(function (doc) {
      if (!doc.services) doc.services = clone(SERVICES_DEFAULT);
      migrateServices(doc);
      normalizeDoc(doc);
      state.original = clone(doc);
      state.doc = clone(doc);
      renderSourceBadge();
      renderAuthControls();
      buildNav();
      var initial = (location.hash || '').replace('#', '');
      selectSection(sectionById(initial) ? initial : SECTIONS[0].id);
      $('#app').setAttribute('aria-busy', 'false');
    }).catch(function (err) {
      $('#panel').appendChild(el('div', { class: 'form-note', text: 'تعذّر تحميل الإعدادات: ' + err.message }));
      $('#app').setAttribute('aria-busy', 'false');
    });
  }

  /* Login screen (only when Supabase is configured and no session). */
  function renderLogin() {
    state.activeId = null;
    $('#nav').textContent = '';
    $('#topbar-actions').textContent = '';
    $('#section-title').textContent = 'تسجيل الدخول';
    $('#section-desc').textContent = 'أدخل بيانات الدخول لإدارة المحتوى.';
    var panel = $('#panel');
    panel.textContent = '';

    var email = el('input', { id: 'login-email', type: 'email', autocomplete: 'username' });
    var pass = el('input', { id: 'login-pass', type: 'password', autocomplete: 'current-password' });
    var errEl = el('p', { class: 'error' });
    var btn = el('button', { class: 'btn btn-primary', type: 'submit', text: 'دخول' });
    var form = el('form', { class: 'form login-form' }, [
      el('div', { class: 'field' }, [el('label', { for: 'login-email', text: 'البريد الإلكتروني' }), email]),
      el('div', { class: 'field' }, [el('label', { for: 'login-pass', text: 'كلمة المرور' }), pass]),
      errEl, btn
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.textContent = '';
      btn.disabled = true; btn.textContent = 'جارٍ الدخول…';
      window.SB.signIn(email.value.trim(), pass.value).then(function () {
        gate();
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = 'دخول';
        errEl.textContent = 'تعذّر تسجيل الدخول: ' + (err.message || '');
      });
    });
    panel.appendChild(form);
  }

  /* Sign-out control in the sidebar footer (only when signed in). */
  function renderAuthControls() {
    var foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    var existing = document.getElementById('btn-signout');
    if (existing) existing.parentNode.removeChild(existing);
    if (window.SB && window.SB.configured() && window.SB.isAuthed()) {
      var btn = el('button', { class: 'btn btn-ghost btn-sm', id: 'btn-signout', type: 'button', text: 'تسجيل الخروج' });
      btn.addEventListener('click', function () { window.SB.signOut().then(function () { location.reload(); }); });
      foot.appendChild(btn);
    }
  }

  function renderSourceBadge() {
    var b = $('#source-badge');
    var src = window.SiteContent.source;
    if (src === 'api') { b.className = 'badge badge-api'; b.textContent = 'المصدر: الخادم'; }
    else if (src === 'local') { b.className = 'badge badge-api'; b.textContent = 'المصدر: آخر نسخة محفوظة'; }
    else { b.className = 'badge badge-bundled'; b.textContent = 'المصدر: الإعداد الأصلي'; }
  }

  function wireChrome() {
    var app = $('#app');
    $('#menu-toggle').addEventListener('click', function () { app.classList.toggle('nav-open'); });
    window.addEventListener('beforeunload', function (e) {
      if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  /* ── Sidebar (grouped) ────────────────────────────────────────────────── */
  function buildNav() {
    var nav = $('#nav');
    nav.textContent = '';
    GROUPS.forEach(function (g) {
      nav.appendChild(el('div', { class: 'section-group-label', text: g.label }));
      SECTIONS.filter(function (s) { return s.group === g.id; }).forEach(function (sec) {
        var item = el('button', { class: 'nav-item', 'data-id': sec.id, type: 'button' }, [
          el('span', { class: 'nav-label', text: sec.label }),
          el('span', { class: 'nav-dot', 'aria-hidden': 'true' })
        ]);
        item.addEventListener('click', function () { selectSection(sec.id); });
        nav.appendChild(item);
      });
    });
  }

  function refreshNavDots() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
      var sec = sectionById(item.getAttribute('data-id'));
      item.classList.toggle('is-active', sec.id === state.activeId);
      var dp = sec.dirtyPath || sec.base;
      var dirty = JSON.stringify(FE.getPath(state.doc, dp)) !== JSON.stringify(FE.getPath(state.original, dp));
      item.classList.toggle('is-dirty', dirty);
    });
  }

  function selectSection(id) {
    state.activeId = id;
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    $('#app').classList.remove('nav-open');
    var sec = sectionById(id);
    $('#section-title').textContent = sec.label;
    $('#section-desc').textContent = sec.desc || '';
    renderPanel(sec);
    refreshNavDots();
  }

  /* ── Panel ────────────────────────────────────────────────────────────── */
  var ctx = {
    getDoc: function () { return state.doc; },
    onEdit: function () { normalizeDoc(state.doc); updateActions(); refreshNavDots(); },
    rerender: function () { renderPanel(sectionById(state.activeId)); updateActions(); refreshNavDots(); }
  };

  function renderPanel(sec) {
    var panel = $('#panel');
    panel.textContent = '';
    var form = el('form', { class: 'form', novalidate: 'novalidate' });
    form.appendChild(FE.renderSchema(sec.fields, sec.base, ctx));
    panel.appendChild(form);
    renderActions();
    updateActions();
  }

  function renderActions() {
    var actions = $('#topbar-actions');
    actions.textContent = '';
    var revert = el('button', { class: 'btn btn-ghost', id: 'btn-revert', type: 'button', text: 'تراجع' });
    var save = el('button', { class: 'btn btn-primary', id: 'btn-save', type: 'button', text: 'حفظ التغييرات' });
    revert.addEventListener('click', onRevert);
    save.addEventListener('click', onSave);
    actions.appendChild(revert);
    actions.appendChild(save);
  }

  function activeSection() { return sectionById(state.activeId); }
  function activeErrors() {
    var sec = activeSection();
    return FE.collectErrors(sec.fields, sec.base, state.doc);
  }
  function isDirty() { return JSON.stringify(state.doc) !== JSON.stringify(state.original); }

  function updateActions() {
    var save = $('#btn-save'); var revert = $('#btn-revert');
    if (!save) return;
    var dirty = isDirty();
    save.disabled = !dirty || activeErrors().length > 0;
    revert.disabled = !dirty;
  }

  function onRevert() {
    state.doc = clone(state.original);
    renderPanel(activeSection());
    refreshNavDots();
    toast('تم التراجع عن كل التغييرات غير المحفوظة', 'warn');
  }

  function onSave() {
    var errs = activeErrors();
    if (errs.length) { toast('يرجى تصحيح الحقول المميّزة أولًا', 'err'); return; }
    var save = $('#btn-save');
    save.disabled = true; save.textContent = 'جارٍ الحفظ…';
    window.SiteContent.save(state.doc).then(function (res) {
      save.textContent = 'حفظ التغييرات';
      if (res.persisted) {
        state.original = clone(state.doc);
        window.SiteContent.source = 'api';
        updateActions();
        refreshNavDots();
        toast('تم الحفظ — حدّث الموقع لرؤية التغييرات', 'ok');
        renderSourceBadge();
      } else {
        updateActions(); // still dirty → Save stays available
        if (res.via === 'unconfigured') toast('Supabase غير مُهيّأ — تعذّر الحفظ', 'err');
        else toast('تعذّر الحفظ: ' + (res.error || 'خطأ غير معروف'), 'err');
        // Session likely expired — return to the login screen.
        if (window.SB && window.SB.configured() && !window.SB.isAuthed()) renderLogin();
      }
    });
  }

  /* ── Toast ────────────────────────────────────────────────────────────── */
  var toastTimer = null;
  function toast(msg, kind) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' toast-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 3200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
