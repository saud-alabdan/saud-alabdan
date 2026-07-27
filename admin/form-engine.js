/*
 * form-engine.js — schema-driven form renderer
 * ==============================================================
 * Renders a declarative schema (see schema.js) against a working document and
 * binds every control back into it by path. One engine drives every section —
 * website content AND services — so adding a module is a schema change, never
 * new form code.
 *
 * Node types:
 *   primitive : { type:'text'|'textarea'|'email'|'url'|'number'|'select'|'checkbox'|'color', key, label, hint?, required?, options? }
 *   group     : { type:'group', key, label, fields:[...] }              // nested object
 *   list      : { type:'list', key, label, itemLabel, addLabel, titleKey?, fields:[...] }  // array of objects
 *   list(str) : { type:'list', key, label, itemLabel, addLabel, strings:true }             // array of strings
 *
 * The host passes a ctx: { getDoc, onEdit, rerender } — onEdit fires after a
 * value change; rerender rebuilds the section after a structural (add/remove/
 * move) change. Nothing here knows about saving or the shell.
 */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ── path + dom helpers ───────────────────────────────────────────────── */
  function join(base, key) { return base ? base + '.' + key : key; }
  function getPath(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split('.');
    var last = keys.pop();
    var t = keys.reduce(function (o, k) {
      if (o[k] == null || typeof o[k] !== 'object') o[k] = {};
      return o[k];
    }, obj);
    t[last] = val;
  }
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
  function safeId(s) { return 'f-' + String(s).replace(/[^a-zA-Z0-9]+/g, '-'); }
  function isEmpty(v) { return v === undefined || v === null || (typeof v === 'string' && v.trim() === ''); }

  /* ── validation ───────────────────────────────────────────────────────── */
  function errorFor(node, value) {
    if (node.type === 'image' || node.type === 'file') {
      if (node.required && window.MediaManager.isEmpty(node.type, value)) return 'هذا الحقل مطلوب.';
      return null;
    }
    if (node.required && isEmpty(value)) return 'هذا الحقل مطلوب.';
    if (node.type === 'email' && !isEmpty(value) && !EMAIL_RE.test(String(value).trim()))
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    if (node.type === 'url' && !isEmpty(value) && !/^https?:\/\//i.test(String(value).trim()))
      return 'يجب أن يبدأ الرابط بـ http.';
    return null;
  }

  // Walks a schema and returns [{path, msg}] for every invalid field.
  function collectErrors(fields, base, doc) {
    var errors = [];
    fields.forEach(function (node) {
      var path = join(base, node.key);
      if (node.type === 'group') {
        errors = errors.concat(collectErrors(node.fields, path, doc));
      } else if (node.type === 'list') {
        var arr = getPath(doc, path);
        if (Array.isArray(arr) && !node.strings) {
          arr.forEach(function (_, i) {
            errors = errors.concat(collectErrors(node.fields, path + '.' + i, doc));
          });
        }
      } else {
        var err = errorFor(node, getPath(doc, path));
        if (err) errors.push({ path: path, msg: err });
      }
    });
    return errors;
  }

  /* ── blank item (for list "add") ──────────────────────────────────────── */
  function blankValue(node) {
    switch (node.type) {
      case 'number': return '';
      case 'checkbox': return false;
      case 'select': return node.options && node.options[0] ? node.options[0][0] : '';
      case 'group': return blankItem(node.fields);
      case 'list': return [];
      case 'file': return null;
      case 'image': return '';
      default: return '';
    }
  }
  function blankItem(fields) {
    var obj = {};
    fields.forEach(function (n) { obj[n.key] = blankValue(n); });
    return obj;
  }

  /* ── field renderers ──────────────────────────────────────────────────── */
  function coerce(node, raw) {
    if (node.type === 'number') return raw === '' ? '' : Number(raw);
    return raw;
  }

  function renderField(node, base, ctx) {
    var fullPath = join(base, node.key);
    var value = getPath(ctx.getDoc(), fullPath);
    var id = safeId(fullPath);

    // Media fields delegate to the single reusable Media Manager component.
    if (node.type === 'image' || node.type === 'file') {
      var mfield = el('div', { class: 'field' }, [
        el('label', {}, [
          document.createTextNode(node.label),
          node.required ? el('span', { class: 'req', text: '*' }) : null
        ])
      ]);
      var errEl = el('p', { class: 'error' });
      var control = window.MediaManager.create(node.type, node, value, function (newVal) {
        setPath(ctx.getDoc(), fullPath, newVal);
        var e = errorFor(node, newVal);
        mfield.classList.toggle('has-error', !!e);
        errEl.textContent = e || '';
        ctx.onEdit();
      });
      mfield.appendChild(control);
      if (node.hint) mfield.appendChild(el('p', { class: 'hint', text: node.hint }));
      mfield.appendChild(errEl);
      return mfield;
    }

    // Checkbox has its own inline layout.
    if (node.type === 'checkbox') {
      var box = el('input', { id: id, type: 'checkbox' });
      box.checked = !!value;
      box.addEventListener('change', function () {
        setPath(ctx.getDoc(), fullPath, box.checked);
        // exclusive: only one item in the list may have this flag true (e.g.
        // "featured"). Clear the same key on every sibling, then re-render.
        if (node.exclusive && box.checked) {
          var m = fullPath.match(/^(.*)\.(\d+)\.([^.]+)$/);
          if (m) {
            var arr = getPath(ctx.getDoc(), m[1]);
            var idx = parseInt(m[2], 10);
            var key = m[3];
            if (Array.isArray(arr)) arr.forEach(function (it, i) {
              if (i !== idx && it && typeof it === 'object') it[key] = false;
            });
          }
          ctx.rerender();
        } else {
          ctx.onEdit();
        }
      });
      return el('div', { class: 'field' }, [
        el('div', { class: 'checkbox-row' }, [box, el('label', { for: id, text: node.label })])
      ]);
    }

    var control;
    if (node.type === 'textarea') {
      control = el('textarea', { id: id, rows: '3' });
      control.value = value == null ? '' : String(value);
    } else if (node.type === 'select') {
      control = el('select', { id: id });
      (node.options || []).forEach(function (opt) {
        var o = el('option', { value: opt[0], text: opt[1] });
        if (String(opt[0]) === String(value)) o.setAttribute('selected', 'selected');
        control.appendChild(o);
      });
    } else if (node.type === 'color') {
      control = el('input', { id: id, type: 'color' });
      control.value = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
    } else {
      control = el('input', { id: id, type: node.type === 'number' ? 'number' : (node.type === 'email' ? 'email' : (node.type === 'date' ? 'date' : 'text')) });
      control.value = value == null ? '' : String(value);
    }

    var field = el('div', { class: 'field' }, [
      el('label', { for: id }, [
        document.createTextNode(node.label),
        node.required ? el('span', { class: 'req', text: '*' }) : null
      ]),
      node.type === 'color' ? el('div', { class: 'color-row' }, [control, el('span', { class: 'hint', id: id + '-v', text: control.value })]) : control,
      node.hint ? el('p', { class: 'hint', text: node.hint }) : null,
      el('p', { class: 'error' })
    ]);

    var evt = (node.type === 'select' || node.type === 'color') ? 'change' : 'input';
    control.addEventListener(evt, function () {
      setPath(ctx.getDoc(), fullPath, coerce(node, control.value));
      if (node.type === 'color') { var vlabel = field.querySelector('#' + CSS.escape(id + '-v')); if (vlabel) vlabel.textContent = control.value; }
      validateField(field, node, control.value);
      ctx.onEdit();
    });
    if (node.type === 'color') {
      control.addEventListener('input', function () {
        var vlabel = field.querySelector('#' + CSS.escape(id + '-v')); if (vlabel) vlabel.textContent = control.value;
      });
    }
    return field;
  }

  function validateField(fieldEl, node, value) {
    var err = errorFor(node, value);
    fieldEl.classList.toggle('has-error', !!err);
    var msg = fieldEl.querySelector('.error');
    if (msg) msg.textContent = err || '';
  }

  function renderGroup(node, base, ctx) {
    var path = join(base, node.key);
    var box = el('div', { class: 'group' }, [el('div', { class: 'group-title', text: node.label })]);
    box.appendChild(renderSchema(node.fields, path, ctx));
    return box;
  }

  /* ── rich text ────────────────────────────────────────────────────────────
   * A lightweight contentEditable editor (no external library). The toolbar uses
   * document.execCommand for portable formatting; inline images upload through
   * the shared Media Manager. The stored value is sanitized HTML (whitelist),
   * so the same string can be rendered on the public site as-is. */
  var RT_ALLOWED = { P:1, H2:1, H3:1, BR:1, STRONG:1, B:1, EM:1, I:1, U:1, UL:1, OL:1, LI:1, A:1, IMG:1, BLOCKQUOTE:1 };
  function rtAttrs(tag) { return tag === 'A' ? ['href'] : (tag === 'IMG' ? ['src', 'alt'] : []); }
  function sanitizeHtml(html) {
    var src = document.createElement('div'); src.innerHTML = html || '';
    var out = document.createElement('div');
    (function clean(from, to) {
      Array.prototype.slice.call(from.childNodes).forEach(function (n) {
        if (n.nodeType === 3) { to.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;                       // drop comments etc.
        var tag = n.tagName;
        if (RT_ALLOWED[tag]) {
          var e = document.createElement(tag);
          rtAttrs(tag).forEach(function (a) {
            var v = n.getAttribute(a);
            if (v == null) return;
            if (a === 'href' && /^\s*javascript:/i.test(v)) return;   // block javascript: URLs
            e.setAttribute(a, v);
          });
          if (tag === 'A') { e.setAttribute('target', '_blank'); e.setAttribute('rel', 'noopener'); }
          clean(n, e);
          to.appendChild(e);
        } else {
          clean(n, to);                                     // unwrap disallowed tags, keep contents
        }
      });
    })(src, out);
    return out.innerHTML;
  }

  function rtBtn(label, title, onClick) {
    var b = el('button', { type: 'button', class: 'rt-btn', title: title || label, text: label });
    b.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep editor selection
    b.addEventListener('click', onClick);
    return b;
  }

  function renderRichText(node, base, ctx) {
    var fullPath = join(base, node.key);
    var value = getPath(ctx.getDoc(), fullPath);
    var editor = el('div', { class: 'rt-editor', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true' });
    editor.innerHTML = (typeof value === 'string' ? value : '') || '';

    function sync() { setPath(ctx.getDoc(), fullPath, sanitizeHtml(editor.innerHTML)); ctx.onEdit(); }
    function cmd(command, arg) { editor.focus(); try { document.execCommand(command, false, arg == null ? null : arg); } catch (e) {} sync(); }
    function insertImage() {
      var inp = el('input', { type: 'file', accept: 'image/*' });
      inp.style.display = 'none'; document.body.appendChild(inp);
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; document.body.removeChild(inp);
        if (!f || !window.MediaManager || !window.MediaManager.uploadImage) return;
        window.MediaManager.uploadImage(f).then(function (url) {
          editor.focus();
          try { document.execCommand('insertHTML', false, '<img src="' + url + '" alt="">'); } catch (e) {}
          sync();
        }).catch(function () {});
      };
      inp.click();
    }

    var toolbar = el('div', { class: 'rt-toolbar' }, [
      rtBtn('عنوان', 'عنوان (H2)', function () { cmd('formatBlock', 'H2'); }),
      rtBtn('عنوان فرعي', 'عنوان فرعي (H3)', function () { cmd('formatBlock', 'H3'); }),
      rtBtn('فقرة', 'فقرة', function () { cmd('formatBlock', 'P'); }),
      rtBtn('غامق', 'غامق', function () { cmd('bold'); }),
      rtBtn('مائل', 'مائل', function () { cmd('italic'); }),
      rtBtn('• قائمة', 'قائمة نقطية', function () { cmd('insertUnorderedList'); }),
      rtBtn('1. قائمة', 'قائمة رقمية', function () { cmd('insertOrderedList'); }),
      rtBtn('رابط', 'إضافة رابط', function () { var u = window.prompt('أدخل الرابط (يبدأ بـ http):', 'https://'); if (u) cmd('createLink', u); }),
      rtBtn('صورة', 'إدراج صورة', insertImage)
    ]);

    editor.addEventListener('input', sync);
    editor.addEventListener('blur', sync);

    return el('div', { class: 'field' }, [
      el('label', {}, [document.createTextNode(node.label)]),
      toolbar,
      editor,
      node.hint ? el('p', { class: 'hint', text: node.hint }) : null,
      el('p', { class: 'error' })
    ]);
  }

  function renderList(node, base, ctx) {
    var listPath = join(base, node.key);
    var doc = ctx.getDoc();
    var arr = getPath(doc, listPath);
    if (!Array.isArray(arr)) { arr = []; setPath(doc, listPath, arr); }

    var wrap = el('div', { class: 'list' }, [
      el('div', { class: 'list-head' }, [el('h3', { class: 'list-title', text: node.label })])
    ]);

    arr.forEach(function (item, i) {
      var itemBase = listPath + '.' + i;
      var titleText = node.strings
        ? (node.itemLabel || 'عنصر') + ' ' + (i + 1)
        : (getPath(doc, join(itemBase, node.titleKey || '')) || (node.itemLabel || 'عنصر') + ' ' + (i + 1));

      var ctl = el('div', { class: 'item-ctl' }, [
        ctlBtn('▲', 'تحريك لأعلى', i === 0, function () { move(arr, i, -1, ctx); }),
        ctlBtn('▼', 'تحريك لأسفل', i === arr.length - 1, function () { move(arr, i, 1, ctx); }),
        ctlBtn('✕', 'حذف', false, function () { arr.splice(i, 1); ctx.rerender(); }, true)
      ]);

      var card = el('div', { class: 'list-item' }, [
        el('div', { class: 'item-head' }, [el('span', { class: 'item-title', text: titleText }), ctl])
      ]);

      if (node.strings) {
        var input = el('input', { type: 'text' });
        input.value = item == null ? '' : String(item);
        input.addEventListener('input', function () { arr[i] = input.value; ctx.onEdit(); });
        card.appendChild(el('div', { class: 'field' }, [input]));
      } else {
        card.appendChild(renderSchema(node.fields, itemBase, ctx));
      }
      wrap.appendChild(card);
    });

    var add = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: (node.addLabel || 'إضافة') + ' +' });
    add.addEventListener('click', function () {
      arr.push(node.strings ? '' : blankItem(node.fields));
      ctx.rerender();
    });
    wrap.appendChild(add);
    return wrap;
  }

  function ctlBtn(glyph, title, disabled, onClick, danger) {
    var b = el('button', { class: 'icon-btn' + (danger ? ' danger' : ''), type: 'button', title: title, text: glyph });
    if (disabled) b.disabled = true;
    else b.addEventListener('click', onClick);
    return b;
  }
  function move(arr, i, dir, ctx) {
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    ctx.rerender();
  }

  /* ── entry ────────────────────────────────────────────────────────────── */
  function renderSchema(fields, base, ctx) {
    var frag = document.createDocumentFragment();
    fields.forEach(function (node) {
      if (node.type === 'group') frag.appendChild(renderGroup(node, base, ctx));
      else if (node.type === 'list') frag.appendChild(renderList(node, base, ctx));
      else if (node.type === 'richtext') frag.appendChild(renderRichText(node, base, ctx));
      else frag.appendChild(renderField(node, base, ctx));
    });
    return frag;
  }

  window.FormEngine = {
    renderSchema: renderSchema,
    collectErrors: collectErrors,
    getPath: getPath,
    setPath: setPath,
    sanitizeHtml: sanitizeHtml
  };
})();
