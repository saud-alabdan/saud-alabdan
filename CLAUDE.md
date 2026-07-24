# CLAUDE.md

# Saud AlAbdan Consulting Website

Version: 1.0
Last Updated: 2026-07-24

---

# Project Identity

This is the official website project for Saudi business consultant Saud AlAbdan.

The purpose of this project is to build a professional consulting website that converts visitors into consulting clients through a simple, elegant, maintainable, and stable user experience.

The CMS exists only to manage the public website.

The Product Owner is Saud AlAbdan.

The Product Owner makes all product, UX, architecture, and business decisions.

---

# Core Principles

Always prioritize:

1. Correctness
2. Stability
3. Simplicity
4. Maintainability
5. Reuse
6. Small safe changes

Never optimize for clever code over a stable product.

---

# Working Rules (Mandatory)

These rules override your default behavior.

## Rule 1 — No implementation without approval

Before writing any code you must always provide:

1. Understanding of the request.
2. Implementation plan.
3. Files that will change.
4. Files that will be created.
5. Estimated implementation time.
6. Estimated complexity (Low / Medium / High).
7. Possible risks.

Then STOP.

Wait for my approval.

Never start implementation automatically.

---

## Rule 2 — Implement only what I request

Do not:

- improve unrelated code
- redesign pages
- optimize architecture
- refactor
- reorganize files
- clean up code
- add features

unless I explicitly ask.

---

## Rule 3 — No architectural decisions

Never change architecture on your own.

If you believe architecture should change:

STOP.

Explain why.

Wait for approval.

---

## Rule 4 — No unnecessary files

Never create:

- pages
- components
- folders
- modules
- configuration files

unless I explicitly request them.

Always prefer editing existing files.

---

## Rule 5 — Reuse

Reuse existing:

- components
- utilities
- rendering logic
- configuration

Avoid duplication.

---

## Rule 6 — CMS is the single source of truth

Never introduce:

- second data sources
- temporary configuration
- hidden configuration
- duplicated settings

Data flow must always remain:

site.config.js

↓

CMS

↓

localStorage

↓

cms-overlay.js

↓

window.SITE

↓

Public Pages

---

## Rule 7 — Work only inside scope

Only modify files required for the requested task.

Ignore unrelated issues.

If you discover other problems:

Do NOT fix them.

List them under:

Future Suggestions

---

## Rule 8 — Large tasks

If implementation requires:

- more than 3 files

OR

- more than approximately 15 minutes

Do not begin implementation.

Break the task into phases.

Wait for approval.

---

## Rule 9 — Ask instead of guessing

If anything is unclear,

ASK.

Never guess.

---

## Rule 10 — No memory

Do not rely on memory.

Do not store project behavior in memory.

This file is the single source of truth.

If this file conflicts with previous conversations,

THIS FILE ALWAYS WINS.

---

# Communication Rules

Every response must follow this order:

1. Understanding
2. Plan
3. Files affected
4. Time estimate
5. Complexity
6. Risks

If approval is required:

STOP.

Wait.

---

# Reporting Rules

After every completed task provide a short report.

Maximum: 5 bullet points.

Include only:

- Files modified
- Files created
- Architecture changes
- Risks introduced
- Technical debt

Do not write long reports unless I ask.

---

# Future Suggestions

Optional improvements must NEVER be implemented automatically.

Only list them under:

Future Suggestions

and wait for approval.

---

# Current Architecture

## Public Website

- Home.dc.html
- About.dc.html
- Consulting.dc.html
- Products.dc.html
- Courses.dc.html
- Contact.dc.html
- Privacy.dc.html
- Terms.dc.html
- 404.dc.html

## CMS

admin/

## Configuration

config/

## Shared Components

support.js

---

# Important Project Decisions

- Home.dc.html is the only public homepage.
- admin/index.html is only the CMS.
- Never create another homepage.
- Keep the architecture simple.
- Prefer existing architecture over new architecture.
- Never consume tokens implementing features that were not requested.

---

# Final Rule

If I ask you to implement one feature,

ignore everything else.

Do not:

- fix bugs
- improve UI
- refactor
- reorganize
- optimize

outside the requested task.

Mention unrelated findings only under:

Future Suggestions

and continue with the requested work only.

---

# Session Start

At the beginning of every session:

1. Read this file.
2. Follow these rules.
3. Wait for my task.
4. Do not write code until I approve the implementation plan.