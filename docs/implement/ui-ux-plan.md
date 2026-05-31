# Risk-Based Execution Plan — TalentSync

> Generated: 2026-05-31 11:23 ICT
> Strategy: Sort tasks by codebase risk (lowest first) → build stable prototypes incrementally
> Deadline: 2026-05-31 18:00 ICT (~6.75h remaining)
> Source tasks: 30 UI/UX audit items + 3 M-phase items

---

## Risk Classification Matrix

| Risk Level | Criteria | Examples |
|---|---|---|
| **LOW** | Single file, text/attribute/CSS change, remove dead code, add attributes | String replacement, opacity tweak, aria-labels, delete unused code |
| **MEDIUM** | Single file with new logic, 2-4 file changes, structural layout changes, API wiring | Sort handler, new hooks, conditional rendering |
| **HIGH** | 5+ file refactors, architectural changes, library removal, core user flow changes | Icon library swap, global color replacement, mobile layout restructure |

---

## Prototype 1 — Stable Demo (Low Risk Only)

> **Goal:** Build a visually correct, stable demo version with zero functional regressions.
> **Strategy:** Fix all cosmetic bugs that can't break anything. Skip any logic change.
> **Output:** A demo-ready app that looks professional, no broken features.
> **When:** Executed 2026-05-31 11:23–12:10 ICT ✅ COMPLETE

| Seq | ID | Task | Files | Risk | Est. | Deliverable |
|-----|----|------|-------|------|------|-------------|
| 1.1 | **U2** | Fix Hero overlay opacity (`/100` → `/80`) | `Hero.jsx` | 🟢 LOW | 0.10h | Hero image visible in background |
| 1.2 | **U6** | Fix favicon path (`../client/public/` → `/`) | `index.html` | 🟢 LOW | 0.05h | Favicon works in production build |
| 1.3 | **U5** | Fix footer copyright (2025→2026, Prodigy→TalentSync) | `Footer.jsx` | 🟢 LOW | 0.05h | Correct copyright line |
| 1.4 | **U4** | Fix dead time display (`job.postedAt` → `job.date`) | `JobCard.jsx` | 🟢 LOW | 0.05h | Time labels work (e.g. "3d ago") |
| 1.5 | **U3** | Remove duplicate "Learn More" button | `JobCard.jsx` | 🟢 LOW | 0.10h | Single CTA per card |
| 1.6 | **U12** | Clean Hero imports: remove 6 unused SVG imports | `Hero.jsx` | 🟢 LOW | 0.05h | Clean console, no import warnings |
| 1.7 | **U15** | Show custom scrollbar on horizontal containers (replace `display:none` with styled scrollbar) | `index.css` | 🟢 LOW | 0.10h | RecommendedJobs scrollbar visible |
| 1.8 | **U17** | Move Navbar `<style>` keyframes to `index.css` | `Navbar.jsx`, `index.css` | 🟢 LOW | 0.10h | No duplicate style injection |
| 1.9 | **U18** | Move Footer `<style>` keyframes to `index.css` | `Footer.jsx`, `index.css` | 🟢 LOW | 0.10h | No duplicate style injection |
| 1.10 | **U30** | Remove 675 lines dead sample data from `assets.js` | `assets.js` | 🟢 LOW | 0.10h | Leaner bundle, no dead code |
| 1.11 | **U10** | Fix dead footer links (`<a href="/">` → `href="#"` or real routes) | `Footer.jsx` | 🟢 LOW | 0.10h | Footer links functional |
| 1.12 | **U21** | Fix footer social links (mzherx → project links or generic) | `Footer.jsx` | 🟢 LOW | 0.10h | No personal links in footer |
| 1.13 | **U8** | Fix hardcoded localhost link in AppDownload | `AppDownload.jsx` | 🟢 LOW | 0.10h | No broken dev link in production |
| 1.14 | **U24** | Fix HTML lang (`en` → `vi`) | `index.html` | 🟢 LOW | 0.05h | Correct language declaration |
| 1.15 | **U26** | Add `aria-label` to icon-only buttons (bookmark, close, social) | 3 files | 🟢 LOW | 0.10h | Better accessibility |
| 1.16 | **U29** | Add error recovery UI to ManageJobs | `ManageJobs.jsx` | 🟢 LOW | 0.10h | Retry button on error state |
| 1.17 | **U5*** | Brand rename "Prodigy" text strings only (no component rename) | `Navbar.jsx`, `Footer.jsx`, `Hero.jsx`, `index.html` | 🟢 LOW | 0.20h | All user-visible text says TalentSync |

**Prototype 1 Subtotal: 17 tasks, 1.60h**
> *U5* is a subset of U1 — do the text-level rename only, skip component-level refactor.

### Prototype 1 Verification Checklist
- [x] `npm run build` passes with zero errors (verified 2026-05-31 12:10)
- [ ] Vite dev server loads without console warnings
- [x] Home page: Hero image visible, "TalentSync" branding everywhere (verified via code check)
- [x] Job cards: single "Apply Now" button, time displays correctly (verified via code check)
- [x] Footer: correct copyright, no dead links, no personal social links (verified via code check)
- [x] Scrollbar visible on RecommendedJobs horizontal scroll (verified via code check)
- [x] Favicon loads in browser tab (verified via code check)

---

## Prototype 2 — Interactive Demo (Low + Medium Risk)

> **Goal:** Wire non-functional UI elements, add real behavior, unify visual inconsistencies.
> **Precondition:** Prototype 1 verified and stable.
> **Strategy:** Add logic changes that carry moderate risk. Each change is testable in isolation.
> **When:** Start after Prototype 1 verified → ~12:53 ICT

| Seq | ID | Task | Files | Risk | Est. | Deliverable |
|-----|----|------|-------|------|------|-------------|
| 2.1 | **U9** | Wire "Sort by" dropdown with actual sorting logic | `JobListing.jsx` | 🟡 MEDIUM | 0.15h | Sort dropdown actually sorts jobs |
| 2.2 | **U11** | Wire footer newsletter to actual subscribe API or remove section | `Footer.jsx` | 🟡 MEDIUM | 0.15h | Newsletter functional or removed |
| 2.3 | **U16** | Replace 787-line `Loading.css` with Tailwind skeleton | `Loading.css`, `Loading.jsx` | 🟡 MEDIUM | 0.20h | 90% smaller CSS, faster load |
| 2.4 | **U14** | Fix typography: remove unused Syne font, import Poppins if Dashboard uses it, unify to Outfit | `tailwind.config.js`, `index.css`, `Dashboard.jsx` | 🟡 MEDIUM | 0.15h | Consistent typography app-wide |
| 2.5 | **U19** | Unify Applications page theme (slate-900 → light theme or entire app dark) | `Applications.jsx` | 🟡 MEDIUM | 0.20h | No dark/light theme inconsistency |
| 2.6 | **U20** | Fix ManageJobs applicant count (use real aggregation query or remove stat) | `ManageJobs.jsx` | 🟡 MEDIUM | 0.15h | Stats work or card removed |
| 2.7 | **U22** | Remove Navbar spacer hack (`<div>` → `pt-20` on page container) | `Navbar.jsx` | 🟡 MEDIUM | 0.10h | Clean DOM, proper spacing |
| 2.8 | **U25** | Remove mobile duplicate search input in JobListing | `JobListing.jsx` | 🟡 MEDIUM | 0.10h | No redundant search UI |
| 2.9 | **U27** | Add basic page title management (`document.title` per route) | `App.jsx` or page files | 🟡 MEDIUM | 0.15h | Meaningful browser tab titles |
| 2.10 | **U28** | Add Suspense/Loading boundary for route transitions | `App.jsx` | 🟡 MEDIUM | 0.20h | No blank flash between pages |

**Prototype 2 Subtotal: 10 tasks, 1.55h**

### Prototype 2 Verification Checklist
- [ ] Sort dropdown changes job order in real-time
- [ ] Newsletter section either POSTs to API or is removed
- [ ] Loading state is lightweight (no 787-line CSS)
- [ ] All pages share same font family (Outfit)
- [ ] Applications page matches the rest of the app (light theme)
- [ ] Browser tab shows page-specific title
- [ ] No flash of unstyled content on route change

---

## Prototype 3 — Polished Demo (High Risk + Finalization)

> **Goal:** Cross-file refactors and final deliverables. Only if Prototype 1+2 leave buffer.
> **Precondition:** 2h+ remaining to deadline after Prototype 2 verified.
> **Strategy:** Execute high-risk refactors one at a time. Each must pass build before next.
> **When:** Start only if time permits → ~15:08 ICT

| Seq | ID | Task | Files | Risk | Est. | Deliverable |
|-----|----|------|-------|------|------|-------------|
| 3.1 | **U1*** | Component rename: update all internal variable/class references (if any) | `Navbar.jsx`, `Footer.jsx`, `Hero.jsx` | 🔴 HIGH | 0.05h | Internally consistent naming |
| 3.2 | **U7** | Replace raw `blue-600`/`indigo-600`/`indigo-700` with `primary` from Tailwind config | 12+ files | 🔴 HIGH | 0.40h | Consistent color system |
| 3.3 | **U13** | Unify icon library: remove `react-icons` dependency, convert all to `lucide-react` | 5+ files, `package.json` | 🔴 HIGH | 0.30h | Single icon library |
| 3.4 | **U23** | Fix ViewApplications mobile: restructure columns to stacked card layout | `ViewApplications.jsx` | 🔴 HIGH | 0.25h | Mobile-friendly application list |

**Prototype 3 Subtotal: 4 tasks, 1.00h**

### Prototype 3 Verification Checklist
- [ ] `npm run build` passes after each task
- [ ] All icon instances render correctly (no missing icons)
- [ ] Color system consistent: `primary`/`primary-dark` used everywhere
- [ ] ViewApplications usable on mobile (<640px wide)

---

## M-Phase — Testing, Documentation, Video

> **Precondition:** Prototype 1 verified (minimum). Prototype 2 ideal.
> **Strategy:** Can partially overlap M1 (testing) with Prototype 2. M2 (docs) and M3 (video) are zero-risk and can run in parallel.

| Seq | ID | Task | Risk | Est. | Owner | Notes |
|-----|----|------|------|------|-------|-------|
| M1 | E2E testing (3 flows) | 🟢 ZERO (no code) | 1.50h | Khiem | Can start during Prototype 2 |
| M2 | Technical document | 🟢 ZERO (docs only) | 1.50h | Khiem | Can run parallel to anything |
| M3 | Demo video (10 min) | 🟢 ZERO (recording) | 2.00h | Quốc Hào | Can run parallel to M1/M2 |

---

## Execution Timeline

```
11:23–12:10  PROTOTYPE 1 (1.60h)  ✅ COMPLETE
│  └─ U2,U6,U5,U4,U3,U12,U15,U17,U18,U30,U10,U21,U8,U24,U26,U29,U5*
│     VERIFIED: build passes, no regressions
│
├─ 12:10–18:00  M-PHASE (5.83h available)
│  ├─ M1: E2E testing (1.50h) — 3 flows
│  ├─ M2: Technical doc (1.50h)
│  └─ M3: Demo video (2.00h) — Quốc Hào
│
├─ (OPTIONAL)  12:10–18:00  PROTOTYPE 2 (1.55h)  ← Only if 1.55h+ buffer after M-phase starts
│  └─ U9,U11,U16,U14,U19,U20,U22,U25,U27,U28
│     VERIFY: all interactive elements work
│
├─ (OPTIONAL)  PROTOTYPE 3 (1.00h)  ← Only if 2.55h+ buffer after Prototype 2
│  └─ U1*,U7,U13,U23
│     (Extremely unlikely in remaining time)
│
▼ 18:00 — DEADLINE
```

---

## Risk Mitigation Rules

1. **Commit after every task** — `git add -A && git commit -m "U[N]: [description]"` — enables easy rollback
2. **Build after every task** — `npm run build` in client directory — catch breakage immediately
3. **Prototype gates** — Must verify full checklist before advancing to next prototype
4. **Fallback strategy** — If P1 takes longer than estimated:
   - Skip U22, U25, U27, U28 from Prototype 2 (non-critical interactive features)
   - Proceed directly to M1+writing+M3 with at least Prototype 1 completed

---

## Task Dependencies Within Each Prototype

### Prototype 1 Dependency Graph
```
U2 ──→ U5 ──→ U5* (text rename last, so all text changes are consistent)
│
├─ U6 (parallel)
├─ U4, U3 (parallel, same file: JobCard.jsx — do sequentially)
├─ U12 (parallel)
├─ U15 (parallel)
├─ U17, U18 (parallel)
├─ U30 (parallel)
├─ U10, U21 (parallel, same file: Footer.jsx — do sequentially)
├─ U8 (parallel)
├─ U24 (parallel)
├─ U26 (parallel)
└─ U29 (parallel)

Recommended order for single developer:
U2→U6→U5→U4→U3→U12→U15→U17→U18→U30→U10→U21→U8→U24→U26→U29→U5*
```
*Tasks on different files can be batched in one commit.*

### Prototype 2 Dependency Graph
```
U9 ──→ U11 ──→ U16 ──→ U14 ──→ U19 ──→ U20 ──→ U22 ──→ U25 ──→ U27 ──→ U28
```
*Sequential execution recommended — each adds logic that should be tested independently.*

### Prototype 3 Dependency Graph
```
U7 (run first — affects most files) ──→ U13 (affects files touched by U7)
U23 (independent — do last since it's mobile-only)
```

---

## Summary

| Phase | Tasks | Risk | Est. | Cumulative | Gate | Status |
|-------|-------|------|------|------------|------|--------|
| **Prototype 1** | 17 | 🟢 LOW | 1.60h | 1.60h | Build must pass | ✅ DONE (12:10) |
| **Prototype 2** | 10 | 🟡 MEDIUM | 1.55h | 3.15h | All interactive elements work | ⬜ Optional |
| **Prototype 3** | 4 | 🔴 HIGH | 1.00h | 4.15h | Build + mobile test pass | ⬜ Optional |
| **M-Phase** | 3 | 🟢 ZERO | 5.00h | 9.15h | Final submission | ⬜ To-Do |

**Minimum viable:** Prototype 1 + M-Phase = **6.60h** ✅ (1.60h done, 5.00h remaining)
**Ideal:** Prototype 1 + 2 + M-Phase = **8.15h** (overlaps M1 with P2, fits ~8h effective)
**Full:** All 4 phases = **9.15h** (impossible in 6.75h — requires post-submission work)

**Decision:** Prototype 1 COMPLETE. Proceed to M1+M2+M3 immediately. Prototype 2+3 are post-submission. Time remaining: ~5.83h for E2E (1.5h) + docs (1.5h) + video (2.0h) = 5.0h total, buffer ~0.83h.
