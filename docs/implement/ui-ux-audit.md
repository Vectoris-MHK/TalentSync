# UI/UX Audit — Task List

> Generated: 2026-05-31 11:15 ICT
> Source: Comprehensive audit of 12 components, 7 pages, CSS, and Tailwind config
> Backend & frontend are functionally complete — this addresses visual quality, consistency, and polish

---

## P0 — Critical (Must fix before demo video)

| # | Issue | File | Estimate |
|---|---|---|---|
| **U1** | **Brand rename: "Prodigy" → "TalentSync"** — Navbar (`Navbar.jsx:48`), Footer (`Footer.jsx:116,323`), Hero (`Hero.jsx:92`), page `<title>` (`index.html:7`). Calltoaction.jsx and AppDownload.jsx did not contain "Prodigy" text. | 4 files + index.html | 0.25h |
| **U2** | **Fix Hero background overlay** — `from-blue-900/100 to-cyan-700/100` with `mix-blend-multiply` makes the background image invisible (`Hero.jsx:79`) | Hero.jsx | 0.10h |
| **U3** | **Remove duplicate "Learn More" button** — both buttons navigate to `/apply-job/${job._id}` and scroll to top (`JobCard.jsx:169-186`) | JobCard.jsx | 0.10h |
| **U4** | **Fix dead time display** — `getTimePassed` reads `job.postedAt` but data model uses `job.date` → always shows "Recently posted" (`JobCard.jsx:21-31`) | JobCard.jsx | 0.05h |
| **U5** | **Fix footer copyright** — says "© 2025 Prodigy", should be "© 2026 TalentSync" (`Footer.jsx:327`) | Footer.jsx | 0.05h |
| **U6** | **Fix favicon path** — references `../client/public/newFavicon.svg` (relative outside build dir, 404 in production) (`index.html:8`) | index.html | 0.05h |

**P0 Subtotal: 0.60h**

---

## P1 — High (Should fix before demo video)

| # | Issue | File | Estimate |
|---|---|---|---|
| **U7** | **Apply `primary` color from Tailwind config** — `#004AAD` defined but unused; all components use raw `blue-600`/`indigo-600`/`indigo-700` — replace with `primary` consistently across ALL components | 12+ files | 0.40h |
| **U8** | **Fix hardcoded localhost link** — `AppDownload.jsx:167` has `href="http://localhost:5173/apply-job/680bb7839f1dfc75766deffe"` — use navigate() or backendUrl-relative path | AppDownload.jsx | 0.10h |
| **U9** | **Wire "Sort by" dropdown** — no onChange handler, purely decorative (`JobListing.jsx:350-357`) | JobListing.jsx | 0.15h |
| **U10** | **Fix all dead footer links** — every `<a href="/">` points home with no actual routes (`Footer.jsx:123-274`) — either create pages or use `href="#"` | Footer.jsx | 0.15h |
| **U11** | **Remove fake footer newsletter** — visual feedback only, no API, data silently lost (`Footer.jsx:8-14`) — either wire to backend or remove section | Footer.jsx | 0.15h |
| **U12** | **Remove Hero dead code** — 6 SVG company logos imported but never used (lines 10-15) | Hero.jsx | 0.10h |

**P1 Subtotal: 1.05h**

---

## P2 — Medium (Nice to have before demo, fix before submission)

| # | Issue | File | Estimate |
|---|---|---|---|
| **U13** | **Unify icon library** — `react-icons/fi` AND `lucide-react` both used (`ApplyJob.jsx:16`, `JobCard.jsx:4`, `Applications.jsx:11`) — pick one (recommended: lucide-react) and remove `react-icons` dependency | 5+ files + package.json | 0.30h |
| **U14** | **Fix typography confusion** — Tailwind config sets `fontFamily.primary: "Syne"` but never used; global CSS forces `Outfit`; Dashboard uses `font-[Poppins]` not imported (`tailwind.config.js:36`, `index.css:9`, `Dashboard.jsx:57`) | tailwind.config.js, index.css, Dashboard.jsx | 0.15h |
| **U15** | **Unhide scrollbars** — `::-webkit-scrollbar { display: none }` hides ALL scrollbars including RecommendedJobs horizontal scroll, making it undiscoverable (`index.css:19-21`) | index.css | 0.10h |
| **U16** | **Replace 787-line Loading.css** — complex 3D CSS animation for simple loading state — replace with Tailwind skeleton/animation (`Loading.css` → 20 lines) | Loading.css | 0.20h |
| **U17** | **Move `<style>` from Navbar sent-share-component to index.css** — keyframes injected on every render, duplicates (`Navbar.jsx:100-108`) | Navbar.jsx, index.css | 0.10h |
| **U18** | **Move `<style>` from Footer to index.css** — same pattern as Navbar (`Footer.jsx:341-351`) | Footer.jsx, index.css | 0.10h |
| **U19** | **Fix Dashboard theme island** — Applications page uses `bg-slate-900` dark theme while every other page is light (`Applications.jsx:132`) — unify app-wide | Applications.jsx | 0.25h |
| **U20** | **Fix ManageJobs `applicants` field** — `job.applicants` used for stats count but Job model has no such field (`ManageJobs.jsx:116`) | ManageJobs.jsx | 0.15h |
| **U21** | **Fix Footer social links** — hardcoded to mzherx/mzhrx personal Github/Twitter (`Footer.jsx:288,293,298`) | Footer.jsx | 0.10h |

**P2 Subtotal: 1.45h**

---

## P3 — Low (Post-submission polish)

| # | Issue | File | Estimate |
|---|---|---|---|
| **U22** | **Remove Navbar spacer hack** — `<div className="h-2">` to prevent content jump (`Navbar.jsx:31`) — use `pt-20` on page container instead | Navbar.jsx | 0.10h |
| **U23** | **Fix ViewApplications mobile** — `max-md:hidden` on Job Position and Location columns (`ViewApplications.jsx:213,219`) — stack info vertically in card layout | ViewApplications.jsx | 0.30h |
| **U24** | **Fix HTML lang** — Vietnamese app with `lang="en"` (`index.html:2`) → change to `lang="vi"` | index.html | 0.05h |
| **U25** | **Remove JobListing mobile duplicate search** — separate search input does same thing as Hero (`JobListing.jsx:319-334`) | JobListing.jsx | 0.10h |
| **U26** | **Add `aria-label` to icon-only buttons** — bookmark, close buttons, social icons (`JobCard.jsx:92`, `Footer.jsx:288-307`, `RecruiterLogin.jsx:463`) | 3 files | 0.15h |
| **U27** | **Add page `<title>` management** — always "Job Portal" regardless of page (`index.html:7`) — use `document.title` per route or react-helmet-async | index.html + App.jsx | 0.20h |
| **U28** | **Add route-level loading states** — only `<Loading />` on ApplyJob initial load; other pages have no transition indicator | App.jsx | 0.25h |
| **U29** | **Add error recovery UI to ManageJobs** — uses Loading but has no error/retry state (`ManageJobs.jsx:64`) | ManageJobs.jsx | 0.15h |
| **U30** | **Remove unused `assets.js` sample data** — `manageJobsData`, `jobsApplied`, `viewApplicationsPageData`, `jobsData` (675 lines of dead sample data) — all live data comes from API (`assets.js:151-971`) | assets.js | 0.10h |

**P3 Subtotal: 1.40h**

---

## Summary

| Priority | Items | Estimate | Status |
|---|---|---|---|
| **P0 — Critical** | U1–U6 | 0.60h | ✅ DONE (6/6, Prototype 1) |
| **P1 — High** | U7–U12 | 1.05h | 🔄 3/6 (U8, U10, U12 done; U7, U9, U11 deferred) |
| **P2 — Medium** | U13–U21 | 1.45h | 🔄 4/9 (U15, U17, U18, U21 done; U13, U14, U16, U19, U20 deferred) |
| **P3 — Low** | U22–U30 | 1.40h | 🔄 4/9 (U24, U26, U29, U30 done; U22, U23, U25, U27, U28 deferred) |
| **TOTAL** | 30 tasks | 4.50h | 🔄 17/30 (57%) — Prototype 1 verified |

**Execution strategy:** See `docs/implement/ui-ux-plan.md` for risk-based execution order, prototype gates, and timeline.
