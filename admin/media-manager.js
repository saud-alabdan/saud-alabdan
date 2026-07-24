/*
 * media-manager.js — the ONE reusable media component for the whole CMS
 * ====================================================================
 * Exposes window.MediaManager.create(kind, node, value, onChange) which
 * returns a DOM control. The schema-driven form engine (form-engine.js) calls
 * it for every `image` and `file` node — there is no per-module upload code.
 *
 * kind='image'  → upload / preview / replace / remove, with recommended
 *                 dimensions, supported formats, and max size shown.
 *                 STORED VALUE: a string (a data: URL after upload, or an
 *                 existing relative path from the bundled config). Kept a
 *                 string so the public <img src> consumers keep working.
 * kind='file'   → upload / replace / remove, with filename, file size, and
 *                 supported formats shown.
 *                 STORED VALUE: an object { src, name, size, type } (or null),
 *                 so filename and size can be displayed and persisted.
 *
 * NO BACKEND (this phase): uploads are embedded as data: URLs inside the same
 * document that data-service.js persists (localStorage) and cms-overlay.js
 * applies to the public site. Images are downscaled + re-encoded to WebP to
 * keep the document small. When a backend/object-store lands, only this file
 * changes: upload → POST → store the returned URL; the node types, schema, and
 * every consumer stay identical.
 */
(function () {
  'use strict';

  var IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/svg+xml';
  var IMAGE_MAX = 4 * 1024 * 1024;
  var FILE_MAX = 5 * 1024 * 1024;
  var MAX_DIM = 1600;      // longest side after downscale
  var QUALITY = 0.82;      // WebP quality

  // format label → { accept fragment, extensions }
  var FILE_FORMATS = {
    PDF:  { accept: '.pdf,application/pdf', ext: ['pdf'] },
    DOC:  { accept: '.doc,application/msword', ext: ['doc'] },
    DOCX: { accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: ['docx'] },
    XLS:  { accept: '.xls,application/vnd.ms-excel', ext: ['xls'] },
    XLSX: { accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: ['xlsx'] },
    PPTX: { accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: ['pptx'] },
    ZIP:  { accept: '.zip,application/zip,application/x-zip-compressed', ext: ['zip'] }
  };

  /* ── helpers ──────────────────────────────────────────────────────────── */
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
  function formatBytes(n) {
    if (n == null) return '';
    if (n < 1024) return n + ' بايت';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' كيلوبايت';
    return (n / 1024 / 1024).toFixed(1) + ' ميجابايت';
  }
  function dataUrlBytes(u) {
    var i = u.indexOf(',');
    if (i < 0) return 0;
    return Math.round((u.length - i - 1) * 0.75);
  }
  function basename(p) { return String(p).split(/[\\/]/).pop() || String(p); }
  function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function readDataUrl(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.readAsDataURL(file);
    });
  }
  function scaleImage(file) {
    return createImageBitmap(file).then(function (bmp) {
      try {
        var scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
        var w = Math.max(1, Math.round(bmp.width * scale));
        var h = Math.max(1, Math.round(bmp.height * scale));
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(bmp, 0, 0, w, h);
        return c.toDataURL('image/webp', QUALITY);
      } finally { if (bmp.close) bmp.close(); }
    });
  }
  // Preview only: resolve a relative config path against the site root (the
  // CMS runs from /admin/). Stored value is never rewritten.
  function previewSrc(v) {
    if (!v) return '';
    if (/^data:/.test(v) || /^https?:\/\//i.test(v) || v.charAt(0) === '/') return v;
    return '../' + v;
  }
  function buildAccept(formats) {
    return formats.map(function (f) { return FILE_FORMATS[f] ? FILE_FORMATS[f].accept : ''; }).filter(Boolean).join(',');
  }
  function allowedExts(formats) {
    var set = {};
    formats.forEach(function (f) { (FILE_FORMATS[f] ? FILE_FORMATS[f].ext : []).forEach(function (e) { set[e] = 1; }); });
    return set;
  }

  /* ── image control ────────────────────────────────────────────────────── */
  function createImage(node, value, onChange) {
    var maxSize = node.maxSize || IMAGE_MAX;
    var formats = node.formats || ['JPG', 'PNG', 'WebP'];
    var current = typeof value === 'string' ? value : '';

    var img = el('img', { alt: '' });
    var empty = el('div', { class: 'media-empty' }, [
      el('span', { class: 'media-empty-ico', text: '🖼' }),
      el('span', { text: 'لا توجد صورة — اسحب ملفًا أو اضغط للرفع' })
    ]);
    var preview = el('div', { class: 'media-preview' }, [img, empty]);

    var meta = el('div', { class: 'media-meta' });
    if (node.recommended) meta.appendChild(el('div', { class: 'media-meta-row', text: 'الأبعاد الموصى بها: ' + node.recommended }));
    meta.appendChild(el('div', { class: 'media-meta-row', text: 'الصيغ المدعومة: ' + formats.join('، ') }));
    meta.appendChild(el('div', { class: 'media-meta-row', text: 'الحد الأقصى للحجم: ' + formatBytes(maxSize) }));
    var sizeRow = el('div', { class: 'media-meta-row media-size' });
    meta.appendChild(sizeRow);

    var input = el('input', { type: 'file', accept: IMAGE_ACCEPT, hidden: 'hidden' });
    var btnUpload = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'رفع صورة' });
    var btnReplace = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'استبدال' });
    var btnRemove = el('button', { type: 'button', class: 'btn btn-ghost btn-sm media-remove', text: 'إزالة' });
    var actions = el('div', { class: 'media-actions' }, [btnUpload, btnReplace, btnRemove]);
    var err = el('div', { class: 'media-err' });
    var body = el('div', { class: 'media-body' }, [meta, actions, err]);
    var wrap = el('div', { class: 'media media-image' }, [preview, body, input]);

    function setErr(m) { err.textContent = m || ''; wrap.classList.toggle('has-err', !!m); }
    function render() {
      var has = !!current;
      wrap.classList.toggle('is-filled', has);
      if (has) { img.src = previewSrc(current); img.style.display = 'block'; empty.style.display = 'none'; }
      else { img.removeAttribute('src'); img.style.display = 'none'; empty.style.display = 'flex'; }
      btnUpload.style.display = has ? 'none' : '';
      btnReplace.style.display = has ? '' : 'none';
      btnRemove.style.display = has ? '' : 'none';
      sizeRow.textContent = (has && /^data:/.test(current)) ? ('حجم الصورة: ' + formatBytes(dataUrlBytes(current))) : '';
    }
    function ingest(file) {
      setErr('');
      if (!file) return;
      if (file.type && IMAGE_ACCEPT.indexOf(file.type) < 0) { setErr('صيغة الصورة غير مدعومة.'); return; }
      if (file.size > maxSize) { setErr('حجم الملف يتجاوز الحد المسموح (' + formatBytes(maxSize) + ').'); return; }
      var task = file.type === 'image/svg+xml'
        ? readDataUrl(file)
        : scaleImage(file).catch(function () { return readDataUrl(file); });
      task.then(function (url) { current = url; onChange(current); render(); })
          .catch(function () { setErr('تعذّر قراءة الصورة.'); });
    }

    btnUpload.onclick = btnReplace.onclick = function () { input.click(); };
    btnRemove.onclick = function () { current = ''; setErr(''); onChange(''); render(); };
    input.onchange = function () { var f = input.files && input.files[0]; if (f) ingest(f); input.value = ''; };
    preview.addEventListener('click', function () { if (!current) input.click(); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      preview.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); wrap.classList.add('is-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      preview.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); wrap.classList.remove('is-drag'); });
    });
    preview.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) ingest(f);
    });

    render();
    return wrap;
  }

  /* ── file control ─────────────────────────────────────────────────────── */
  function createFile(node, value, onChange) {
    var maxSize = node.maxSize || FILE_MAX;
    var formats = node.formats || ['PDF'];
    var accept = buildAccept(formats);
    var exts = allowedExts(formats);
    // Normalize: an old plain-string URL becomes a minimal object.
    var current = (value && typeof value === 'object') ? value
      : (value ? { src: value, name: basename(value), size: 0, type: '' } : null);

    var badge = el('div', { class: 'media-file-badge' });
    var fname = el('div', { class: 'media-file-name' });
    var fsub = el('div', { class: 'media-file-sub' });
    var fileRow = el('div', { class: 'media-file-row' }, [badge, el('div', { class: 'media-file-info' }, [fname, fsub])]);

    var meta = el('div', { class: 'media-meta' });
    meta.appendChild(el('div', { class: 'media-meta-row', text: 'الصيغ المدعومة: ' + formats.join('، ') }));
    meta.appendChild(el('div', { class: 'media-meta-row', text: 'الحد الأقصى للحجم: ' + formatBytes(maxSize) }));

    var input = el('input', { type: 'file', accept: accept, hidden: 'hidden' });
    var btnUpload = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'رفع ملف' });
    var btnReplace = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'استبدال' });
    var btnRemove = el('button', { type: 'button', class: 'btn btn-ghost btn-sm media-remove', text: 'إزالة' });
    var actions = el('div', { class: 'media-actions' }, [btnUpload, btnReplace, btnRemove]);
    var err = el('div', { class: 'media-err' });
    var body = el('div', { class: 'media-body' }, [fileRow, meta, actions, err]);
    var wrap = el('div', { class: 'media media-file' }, [body, input]);

    function setErr(m) { err.textContent = m || ''; wrap.classList.toggle('has-err', !!m); }
    function render() {
      var has = !!(current && current.src);
      wrap.classList.toggle('is-filled', has);
      if (has) {
        badge.textContent = (extOf(current.name) || 'ملف').toUpperCase();
        fname.textContent = current.name || 'ملف';
        fsub.textContent = current.size ? formatBytes(current.size) : '';
      } else {
        badge.textContent = '—';
        fname.textContent = 'لا يوجد ملف';
        fsub.textContent = '';
      }
      btnUpload.style.display = has ? 'none' : '';
      btnReplace.style.display = has ? '' : 'none';
      btnRemove.style.display = has ? '' : 'none';
    }
    function ingest(file) {
      setErr('');
      if (!file) return;
      var ext = extOf(file.name);
      if (ext && !exts[ext]) { setErr('نوع الملف غير مدعوم. المسموح: ' + formats.join('، ') + '.'); return; }
      if (file.size > maxSize) { setErr('حجم الملف يتجاوز الحد المسموح (' + formatBytes(maxSize) + ').'); return; }
      readDataUrl(file).then(function (url) {
        current = { src: url, name: file.name, size: file.size, type: file.type || '' };
        onChange(current); render();
      }).catch(function () { setErr('تعذّر قراءة الملف.'); });
    }

    btnUpload.onclick = btnReplace.onclick = function () { input.click(); };
    btnRemove.onclick = function () { current = null; setErr(''); onChange(null); render(); };
    input.onchange = function () { var f = input.files && input.files[0]; if (f) ingest(f); input.value = ''; };
    ['dragenter', 'dragover'].forEach(function (ev) {
      wrap.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); wrap.classList.add('is-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      wrap.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); wrap.classList.remove('is-drag'); });
    });
    wrap.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) ingest(f);
    });

    render();
    return wrap;
  }

  function create(kind, node, value, onChange) {
    return kind === 'file' ? createFile(node, value, onChange) : createImage(node, value, onChange);
  }

  // Exposed so the engine's empty-check / validation matches the stored shape.
  function isEmpty(kind, value) {
    return kind === 'file' ? !(value && value.src) : !(typeof value === 'string' && value);
  }

  window.MediaManager = { create: create, isEmpty: isEmpty };
})();
