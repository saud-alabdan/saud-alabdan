# Admin Dashboard (CMS foundation)

A standalone, no-build admin app that manages the site's content model. It is
fully isolated from the public website — it only **reads** `../config/site.config.js`
to source current values and never writes to the public files.

## Files

| File              | Role |
|-------------------|------|
| `index.html`      | Shell markup: sidebar + main panel + toast. |
| `styles.css`      | Brand-matched styling (palette mirrors `THEME.color`), light/dark, RTL, responsive. |
| `data-service.js` | **The only data seam.** `window.SiteContent.load()` / `.save()`. API-first. |
| `schema.js`       | Declarative model of every editable section (`window.CMS_SCHEMA`). |
| `media-manager.js`| The **one** reusable media component (`window.MediaManager`) for all image & file fields. |
| `form-engine.js`  | Generic schema-driven renderer (`window.FormEngine`): fields, groups, repeatable lists, media. |
| `app.js`          | Shell logic: grouped nav, routing, global save/revert, per-section dirty tracking, normalization. |

## Running it

It's static, but browsers block sibling `fetch`/script loads over `file://`
inconsistently, so serve the **site root** (the folder containing `config/` and
`admin/`) over HTTP:

```
cd "Saud AlAbdan consulting website"
python -m http.server 8777
# open http://127.0.0.1:8777/admin/index.html
```

## Data model & persistence

The dashboard edits the **whole `window.SITE` document** — the exact JSON shape
`config/site.config.js` produces and a future backend will store. Persistence is
API-first (chosen direction):

- `GET /api/site-content` → the document
- `PUT /api/site-content` ← the document (whole-doc replace)

There is **no backend in this phase**, so `data-service.js` persists to
`localStorage` (key `saud-site-content`): `load()` is API → saved local doc →
bundled config; `save()` is API → localStorage. When the backend lands, delete
the localStorage fallbacks — **nothing else changes.**

## Public-site integration

The public pages read the saved document through `config/cms-overlay.js`, which
installs a getter on `window.SITE` that returns the localStorage document and
ignores `config/site.config.js`'s assignment (so script ordering is irrelevant;
with nothing saved it is a no-op and the bundled config wins). It is included in
the real `<head>` of each integrated public page, before the runtime boots.

**End-to-end loop:** edit in the CMS → Save (writes localStorage) → refresh the
public page → the overlay applies it → the page renders the new content.

**Same-origin requirement:** the CMS and the public pages must be opened from the
**same origin** (e.g. both under `http://127.0.0.1:8777/…`) so they share
`localStorage`. Opening the public page via `file://` will not see CMS saves. Use
a full page refresh (not just a `#hash` change, which does not reload).

Integrated so far: **`Home.dc.html`** (full page) and **`Consulting.dc.html`**
(its consultation cards — see below). Every public page renders its shared
header / footer / final-CTA from `window.SITE` via `config/site-chrome.js`; the
remaining page bodies (Contact / Privacy / Terms) still hardcode their content.

## Consultation Management

The **"إدارة الاستشارات"** CMS section (schema id `consultations`, under
`services.consultations`) is the **single source** for the consultation cards on
the public Consulting page. Each item: title, description, price, currency,
session duration, features (dynamic list), CTA label, CTA destination, display
order, featured (exclusive — only one, enforced by the engine's `exclusive`
checkbox flag), and active/inactive. Create / edit / delete / reorder come from
the generic list engine; enable/disable is the `active` field.

`Consulting.dc.html` renders these dynamically: it loads `config/site.config.js`
+ `config/cms-overlay.js`, and its component's `renderVals()` reads
`services.consultations`, keeps only `active` items, sorts by `order`, formats
price/duration, and feeds an `sc-for` grid. The section is wrapped in
`sc-if="hasConsultations"`, so with no active items the page looks unchanged.
Seed defaults live in `site.config.js` (`SERVICES.consultations`); new items
appear on the page automatically with no layout edits.

## Current status

**Website content — fully editable** (group «محتوى الموقع»): Identity, SEO,
Navigation, WhatsApp, Hero, Topics, Method, Stats, Why, Closing CTA, Footer,
Social, Theme. Includes repeatable lists (add / remove / reorder), nested lists
(footer columns → links), selects, checkboxes, and colour pickers. Editing
`site.*` and `whatsapp.number/message` auto-syncs the derived `brand`/`contact`
aliases and `whatsapp.link` (see `normalizeDoc` in `app.js`).

**Services — fully editable** (group «الخدمات»), a NEW model under
`doc.services` (not yet consumed by the public site):

- `consultations` — title, summary, duration, price, currency, active
- `plans` (Pricing) — name, price, currency, period, description, feature list, featured, active
- `products` (Digital products) — title, description, price, currency, format, url, active
- `courses` (Training) — title, description, duration, level, price, currency, active

Editing is deferred only in polish, per direction — the modules are functional.
The services schema is an initial model; adjust field sets in `schema.js` freely.

## Media Manager

One component (`media-manager.js`) handles **all** images and files across the
CMS — there is no per-module upload code. It is wired into the form engine as
two schema node types:

- **`image`** — upload / preview / replace / remove, showing recommended
  dimensions, supported formats, and max size. Uploaded images are downscaled
  and re-encoded (WebP where supported) to keep the document small. **Stored as
  a string** (a `data:` URL, or an existing relative path) so the public
  `<img src>` consumers keep working unchanged.
- **`file`** — upload / replace / remove, showing filename, file size, and
  supported formats (PDF / DOCX / XLSX / ZIP …). **Stored as an object**
  `{ src, name, size, type }` so filename and size can be shown and persisted.

Both support drag-and-drop and enforce the per-field `maxSize`. Add a media
field anywhere by putting an `image`/`file` node in a schema — no other code.
Optional node props: `recommended`, `formats`, `maxSize`, `hint`, `required`.

**No backend (this phase):** uploads are embedded as `data:` URLs inside the
same document that persists to `localStorage` and reaches the public site via
`config/cms-overlay.js`. This is why images are downscaled and files are size-
capped (`localStorage` is ~5 MB). When a backend/object-store lands, only
`media-manager.js` changes: upload → POST → store the returned URL; the node
types, schema, and every consumer stay identical.

## WhatsApp Integration

The **"إعدادات واتساب"** CMS section (`whatsapp`) is the single source for all
WhatsApp behaviour: `enabled`, `number`, `message`, `buttonLabel`,
`businessHours`, and `floating { enabled, position(left|right), showOnAll,
showOn{home,contact} }`. `normalizeDoc` (app.js) rebuilds
`whatsapp.link` from number+message on every edit.

`config/whatsapp-button.js` is the **one** reusable floating button. Include it
in a page's `<head>` (after config + overlay); it reads `window.SITE.whatsapp`,
derives the page id from the filename, and renders the button only when
`enabled && floating.enabled && number && (showOnAll || showOn[pageId])`. It is
styled from `theme.color` and needs no per-page code — a future page gets the
button by adding the one script tag.

Consultation card CTAs (`Consulting.dc.html`) now default to the WhatsApp link
(`wa.me/<number>?text=<message>`, new tab) **unless** the consultation has a
custom `ctaHref`. Pages with the button: `Home.dc.html`, `Consulting.dc.html`.

## How to add / change an editable section (the reusable pattern)

Everything is schema-driven, so there is **no per-section form code**:

1. Add (or edit) an entry in `SECTIONS` in `schema.js` with a `base` document
   path and a `fields` array. Node types: `text`, `textarea`, `email`, `url`,
   `number`, `select`, `checkbox`, `color`, `group` (nested object), and `list`
   (repeatable — add `strings:true` for a list of plain strings).
2. If several sections share a `base` (like the services collections under
   `services`), give each a distinct `dirtyPath` so the sidebar "unsaved" dot is
   accurate.
3. If a field has a derived alias the public site reads, mirror it in
   `normalizeDoc` (`app.js`).

No changes to `data-service.js`, `form-engine.js`, or the shell chrome are needed.

## Note on the public-site page migration

Migrating Consulting / Contact / Privacy / Terms into the config system
is intentionally **out of scope** for this foundation. Those pages currently
hardcode their content and use a separate `oklch()` color system. When that
migration happens, this dashboard already has the seam to manage them: add their
content under the document (e.g. a `pages` group) and follow the editable-section
pattern above.
