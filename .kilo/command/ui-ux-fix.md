# /ui-ux-fix — Execute Prototype 1 UI/UX Fixes

> This prompt is for another agent to pick up and execute autonomously.
> Context: TalentSync hackathon project, deadline 2026-05-31 18:00 ICT.

## Your Task

Execute **ONLY Prototype 1** (17 LOW-risk tasks, 1.60h) from the UI/UX execution plan. Do NOT touch Prototype 2, 3, or M-Phase tasks.

## Input Files (load before starting)

```
@docs/implement/ui-ux-plan.md       ← Prototype 1 section (lines 20-57), dependency graph (lines 172-192), risk rules (lines 161-168)
@docs/implement/ui-ux-audit.md      ← Full diagnoses for U1-U6, U10, U12, U15, U17, U18, U21, U24, U26, U29, U30
@docs/implement/codebase.md         ← Code conventions, component pattern, Tailwind config, CSS location
@docs/implement/context.md          ← Current infrastructure state
```

## Execution Rules

1. **Commit after every task**: `git add -A && git commit -m "U[N]: [short description]"`
2. **Build after every task**: `npm run build` in `client/` directory — catch breakage immediately
3. **Never skip the build check** — if build fails, fix before proceeding to next task
4. **Tasks touching the same file must be sequential**, different files can be batched
5. **Do NOT add any code comments** unless explicitly asked

## Execution Order

Execute in this exact order. Verify build passes between each sequential group:

| Step | Tasks | Files |
|------|-------|-------|
| 1 | **U2** — Fix Hero overlay opacity: change `from-blue-900/100 to-cyan-700/100` to `from-blue-900/80 to-cyan-700/80` | `client/src/components/Hero.jsx` |
| 2 | **U6** — Fix favicon path: change `href="../client/public/newFavicon.svg"` to `href="/newFavicon.svg"` | `client/index.html` |
| 3 | **U5** — Fix footer copyright: change "© 2025 Prodigy" to "© 2026 TalentSync" | `client/src/components/Footer.jsx` |
| 4 | **U4** — Fix dead time display: change `new Date(job.postedAt)` to `new Date(job.date)` in `getTimePassed` function | `client/src/components/JobCard.jsx` |
| 5 | **U3** — Remove duplicate "Learn More" button: delete the second button (the one without `bg-primary` class, typically the outline variant) | `client/src/components/JobCard.jsx` |
| 6 | **U12** — Clean Hero imports: remove 6 unused SVG imports (company logos), remove unused `assets` properties reference | `client/src/components/Hero.jsx` |
| 7 | **U15** — Unhide scrollbars: replace `::-webkit-scrollbar { display: none }` with a styled custom scrollbar (thin, semi-transparent) | `client/src/index.css` |
| 8 | **U17** — Move Navbar `<style>` keyframes: extract the CSS from JSX `<style>` tag into `index.css`, remove the `<style>` JSX from component | `client/src/components/Navbar.jsx`, `client/src/index.css` |
| 9 | **U18** — Move Footer `<style>` keyframes: extract the CSS from JSX `<style>` tag into `index.css`, remove the `<style>` JSX from component | `client/src/components/Footer.jsx`, `client/src/index.css` |
| 10 | **U30** — Remove dead sample data: delete `manageJobsData`, `jobsApplied`, `viewApplicationsPageData`, `jobsData` from `assets.js` (lines 151-971), keep only `JobCategories` and `JobLocations` | `client/src/assets/assets.js` |
| 11 | **U10** — Fix dead footer links: replace `href="/"` with `href="#"` on all footer link columns that have no real routes | `client/src/components/Footer.jsx` |
| 12 | **U21** — Fix footer social links: replace mzherx/mzhrx Github/Twitter URLs with generic `#` or project placeholders | `client/src/components/Footer.jsx` |
| 13 | **U8** — Fix hardcoded localhost: replace `href="http://localhost:5173/apply-job/680bb7839f1dfc75766deffe"` with a React Router `<Link>` or remove the hardcoded link entirely | `client/src/components/AppDownload.jsx` |
| 14 | **U24** — Fix HTML lang: change `<html lang="en">` to `<html lang="vi">` | `client/index.html` |
| 15 | **U26** — Add `aria-label` to icon-only buttons: add labels to bookmark button in JobCard, close button in RecruiterLogin, social icon links in Footer | `client/src/components/JobCard.jsx`, `client/src/components/RecruiterLogin.jsx`, `client/src/components/Footer.jsx` |
| 16 | **U29** — Add error recovery to ManageJobs: add error state with retry button when data fetch fails, wrap the existing `if (isLoading)` check | `client/src/pages/ManageJobs.jsx` |
| 17 | **U5*** — Brand rename "Prodigy" → "TalentSync": find-and-replace "Prodigy" in all user-visible strings across these files (Navbar, Footer line 116+323, Hero, Calltoaction, AppDownload, index.html title) — do NOT rename CSS classes, variable names, or imports | `client/src/components/Navbar.jsx`, `client/src/components/Footer.jsx`, `client/src/components/Hero.jsx`, `client/src/components/Calltoaction.jsx`, `client/src/components/AppDownload.jsx`, `client/index.html` |

## Prototype 1 Gate (MUST verify before stopping)

After completing all 17 steps, run this checklist:
- [ ] `npm run build` passes with zero errors in `client/`
- [ ] Git status shows only these 12 files modified: `Hero.jsx`, `index.html`, `Footer.jsx`, `JobCard.jsx`, `index.css`, `Navbar.jsx`, `assets.js`, `AppDownload.jsx`, `RecruiterLogin.jsx`, `ManageJobs.jsx`, `Calltoaction.jsx`
- [ ] "Prodigy" no longer appears anywhere in user-visible text
- [ ] `git log --oneline` shows 17 commits (or fewer if you batched same-file tasks)

## Files You Should NOT Touch

- All files under `server/`
- `client/src/pages/` except `ManageJobs.jsx`
- `client/src/components/RecommendedJobs.jsx`, `OnboardingModal.jsx`, `Loading.jsx` / `Loading.css`
- `client/src/context/AppContext.jsx`, `client/src/App.jsx`, `client/src/main.jsx`
- `client/tailwind.config.js`, `client/vite.config.js`, `client/.env`, `client/package.json`
- `client/src/pages/Applications.jsx`, `Dashboard.jsx`, `AddJob.jsx`, `ViewApplications.jsx`, `Home.jsx`, `ApplyJob.jsx`
- Any files under `docs/`
- `.env`, `server.js`, `kilo.json`, `AGENTS.md`, `WBS.md`, `CPM.md`

## Key Code Conventions

- All components are functional components with React hooks
- Styling is Tailwind CSS with a custom config (primary: `#004AAD`)
- Global CSS is in `client/src/index.css`
- ESM imports with `.js` extension NOT needed for JSX files (Vite resolves)
- All interactive elements use `className` not `class`
- User-visible text throughout the app is Vietnamese
