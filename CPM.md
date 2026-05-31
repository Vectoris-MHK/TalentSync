# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-31 12:10 ICT **(PROTOTYPE 1 COMPLETE — 17/30 UI/UX tasks done, build verified)**
> Deadline: 2026-05-31 18:00 ICT (~5.83h còn lại)
> Elapsed total: ~6.25h (R1→L6 + Prototype 1)
> Working buffer: ~0.83h (**IMPROVED — Prototype 1 finished 0.82h under estimate**)

---

## 0. Context: Prototype 1 Done — 13 UI/UX Tasks + Submission Remain

**All frontend and backend code is functionally complete.** A comprehensive UI/UX audit on 2026-05-31 identified 30 visual/functional issues. Task inventory: `docs/implement/ui-ux-audit.md`. Execution plan: `docs/implement/ui-ux-plan.md`. **Prototype 1 (17 LOW-risk tasks) executed 2026-05-31 11:23–12:10 ICT — `npm run build` passes, zero regressions.**

**Done in Prototype 1 (this session):**

| Priority | Tasks Done | Details |
|----------|-----------|---------|
| P0 (6/6) | U1, U2, U3, U4, U5, U6 | Brand rename, Hero overlay, duplicate button, dead time, copyright, favicon |
| P1 (3/6) | U8, U10, U12 | localhost link, dead footer links, Hero unused imports |
| P2 (4/9) | U15, U17, U18, U21 | Scrollbars, Navbar/Footer `<style>` keyframes, social links |
| P3 (4/9) | U24, U26, U29, U30 | HTML lang, aria-labels, error recovery, dead sample data |

**13 UI/UX tasks remaining (2.70h):**
- P1: U7 (primary color, 0.40h), U9 (sort dropdown, 0.15h), U11 (newsletter, 0.15h) — 0.70h
- P2: U13, U14, U16, U19, U20 — 1.05h
- P3: U22, U23, U25, U27, U28 — 0.95h

**UI/UX Audit (2026-05-31):**

| Priority | Tasks | Estimate | Status |
| -------- | ----- | -------- | ------ |
| P0 — Critical | U1–U6: Brand rename, Hero overlay, duplicate buttons, dead time, copyright, favicon | 0.60h | ✅ DONE |
| P1 — High | U7–U12: Primary color, localhost link, sort dropdown, dead links, fake newsletter, Hero imports | 1.05h | 🔄 3/6 (U8, U10, U12 done) |
| P2 — Medium | U13–U21: Icon lib, typography, scrollbars, Loading.css, inline styles, dark theme, social links | 1.45h | 🔄 4/9 (U15, U17, U18, U21 done) |
| P3 — Low | U22–U30: Spacer, mobile, lang, duplicate search, aria, titles, loading, errors, dead data | 1.40h | 🔄 4/9 (U24, U26, U29, U30 done) |

---

## 1. Task Network

```
✅ R1→R2→R3→R4.1→R4.2→R4.3→E→T→F→K→L→L6 (ALL DONE — backend + frontend 100%)
                                        │
                                        ▼
                         ✅ Prototype1(1.60) ──→ M(5.0)
```

| Branch | Tasks | Description |
| ------ | ----- | ----------- |
| R1→L6 | 16 tasks | All backend + frontend code — **100% DONE** |
| **P1**  | U1–U30 (Prototype 1 subset) | 17 LOW-risk UI/UX fixes — **✅ DONE (1.60h)** |
| **M**  | M1–M3 | E2E test + technical doc + demo video (5.0h) |

P1+P2+P3 remaining (U7,U9,U11,U13,U14,U16,U19,U20,U22,U23,U25,U27,U28 — 13 tasks, 2.70h) are non-critical — float time post-deadline.

---

## 2. Task List with Dependencies & Duration

| ID     | Task                                                          | Duration (h) | Dependencies | Epic    | Status   |
| ------ | ------------------------------------------------------------- | ------------ | ------------ | ------- | -------- |
| R1     | Create M10 cluster + DB user + network access + get URI       | 0.33         | —            | 2       | ✅ Done  |
| R2     | Update `server/.env` MONGODB_URI                              | 0.08         | R1           | 2       | ✅ Done  |
| R3     | Refactor 5 scripts: hardcoded URI → `process.env.MONGODB_URI` | 0.17         | R2           | 2       | ✅ Done  |
| R3.1   | SRV DNS fix: force Google DNS + fix URLSearchParams           | 0.25         | R3           | 2       | ✅ Done  |
| R4.1   | Re-run `seedData.js` (11 companies, 36 jobs, 10 users)        | 0.17         | R3.1         | 3.2     | ✅ Done  |
| R4.2   | Re-run `seedEmbeddings.js` (36/36 embedded, 0 fails)          | 0.33         | R4.1         | 3.2     | ✅ Done  |
| R4.3   | Re-run `seedEvents.js` (215 events, 10 users)                 | 0.17         | R4.1         | 3.2     | ✅ Done  |
| B      | `embeddingService.js`                                         | 0.50         | —            | 4.1     | ✅ Done  |
| C      | Auto-embed on postJob()                                       | 0.17         | B            | 4.1     | ✅ Done  |
| E      | Atlas Vector Search Index `idx_jobs_vector`                   | 0.33         | R4.2         | 4.2     | ✅ Done  |
| T      | `testVectorSearch.js` — 3/3 queries PASS                      | 0.17         | E            | 4.2     | ✅ Done  |
| F      | `GET /api/jobs/recommend-content` (8-stage pipeline)          | 1.00         | E, B         | 4.3     | ✅ Done  |
| H      | User behavior tracking API                                    | 0.50         | —            | 5.1     | ✅ Done  |
| I      | User profile embedding + preferences API                      | 0.67         | H            | 5.2     | ✅ Done  |
| J      | Collaborative filtering API                                   | 0.67         | H            | 5.3     | ✅ Done  |
| K      | `GET /api/jobs/recommend-feed` (hybrid blender)               | 0.50         | F, I, J      | 5.4     | ✅ Done  |
| L      | Frontend (RecommendedJobs + Onboarding + tracking)            | 2.00         | K            | 6.1     | ✅ Done  |
| L6     | `JobCard.jsx` bookmark event (weight=3)                       | 0.25         | L            | 6.1     | ✅ Done  |
| **P1** | **Prototype 1 UI/UX fixes (17 LOW-risk tasks)**               | **1.60**     | L6           | 6.4     | ✅ Done  |
| **M**  | **E2E test + technical doc + demo video**                     | **5.00**     | P1           | 6.2-6.3 | ⬜ To-Do |

**Backend tasks:** 15/15 done (100%)
**Frontend tasks:** 2/2 done (100%)
**UI/UX tasks:** 17/30 done (57%) — Prototype 1 complete
**Total remaining:** 1 task, 5.00h

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID     | ES (h)   | EF (h)    | Notes                       |
| ------ | -------- | --------- | --------------------------- |
| R1→L6  | 0.00     | 5.25      | ✅ All done                 |
| **P1** | **5.25** | **6.85**  | **Prototype 1 done ✅**     |
| **M**  | **6.85** | **11.85** | **E2E test + docs + video** |

---

## 4. Critical Path

```
P1 ──→ M
```

| Step | Task                                          | ES    | EF     | Duration |
| ---- | --------------------------------------------- | ----- | ------ | -------- |
| 1    | P1: Prototype 1 UI/UX fixes (17 tasks)        | 5.25  | 6.85   | 1.60h    |
| 2    | M: E2E test + technical doc + demo video       | 6.85  | 11.85  | 5.00h    |

| Metric                     | Value                                                |
| -------------------------- | ---------------------------------------------------- |
| Critical path remaining    | **5.00h**                                            |
| Elapsed (actual)           | ~6.85h                                               |
| Time remaining to deadline | **~5.83h** (deadline 2026-05-31 18:00 ICT)          |
| Working buffer             | **~0.83h**                                           |
| Deadline risk              | **MODERATE** — 5.83h available vs 5.00h required     |
| Backend status             | **100% COMPLETE** (15/15 tasks)                      |
| Frontend status            | **100% COMPLETE** (L + L6 done)                      |
| UI/UX status               | **57% COMPLETE** (17/30 done, Prototype 1 verified)  |

---

## 5. Non-Critical Tasks (Float)

| Task                         | Float | Notes                                                                                                |
| ---------------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| All R1→L6 tasks              | ∞     | Done — no changes needed                                                                             |
| P1 remaining (U7,U9,U11)     | ∞     | 3 P1 tasks deferred — non-critical for submission                                                    |
| P2 remaining (U13,U14,U16,U19,U20) | ∞ | 5 P2 tasks deferred — post-submission polish                                                         |
| P3 remaining (U22,U23,U25,U27,U28) | ∞ | 5 P3 tasks deferred — post-submission polish                                                         |

---

## 6. Execution Order (Single Phase — Today)

| Step | Task                                                    | Duration | Owner    | Status   |
| ---- | ------------------------------------------------------- | -------- | -------- | -------- |
| 1    | **Prototype 1:** 17 LOW-risk UI/UX fixes (U1–U6, U8, U10, U12, U15, U17, U18, U21, U24, U26, U29, U30) | 1.60h | Khiem | ✅ Done |
| 2    | **M1:** E2E testing (3 flows)                           | 1.50h    | Khiem    | ⬜ To-Do |
| 3    | **M2:** Technical document                              | 1.50h    | Khiem    | ⬜ To-Do |
| 4    | **M3:** Demo video (10 min)                             | 2.00h    | Quốc Hào | ⬜ To-Do |

---

## 7. Rủi ro & Mitigation

| Rủi ro                               | Impact                    | Mitigation                                                          |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------------- |
| ~~SRV DNS fails for new cluster~~    | ~~Block all connections~~ | ✅ Fixed                                                            |
| ~~IP whitelist blocks scripts~~      | ~~Block seeding~~         | ✅ Fixed                                                            |
| ~~OpenAI rate limit~~                | ~~Slow embedding~~        | ✅ 36/36 passed                                                     |
| ~~Atlas Search Index not available~~ | ~~Showstopper~~           | ✅ Active, verified                                                 |
| ~~Collaborative filtering complex~~  | ~~No time~~               | ✅ Done, 13-stage pipeline                                          |
| ~~Clerk auth in frontend~~           | ~~Medium~~                | ✅ Pattern established                                              |
| ~~UI/UX Prototype 1~~                | ~~Time buffer~~           | ✅ Done 12:10, build verified, 0.83h buffer gained                  |
| **Time: 5.83h available vs 5.00h required** | **MODERATE**       | 0.83h buffer — comfortable for E2E + docs + video                   |
| Demo video recording                 | Medium                    | Quốc Hào handles; script provided in WBS                            |
| Vercel deployment issues             | Low                       | Server + client deploy scripts already tested                       |

---

## 8. Summary

```
Backend status:     100% COMPLETE — 15/15 tasks done
Frontend status:    100% COMPLETE — L + L6 done
                     - RecommendedJobs + OnboardingModal + event tracking + bookmark
UI/UX status:       57% COMPLETE — 17/30 done (Prototype 1 verified)
                     - P0: 6/6 ✅ | P1: 3/6 🔄 | P2: 4/9 🔄 | P3: 4/9 🔄
Remaining:          M(5.0h) = E2E test + docs + video
Available time:     ~5.83h (deadline 2026-05-31 18:00 VNT)
Working buffer:     ~0.83h ✅ IMPROVED (was ~0.10h CRITICAL)
Deadline:           2026-05-31 18:00 VNT
```

## 9. What Changed Since Last CPM Update

| Change                   | Reason                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| **Prototype 1 → ✅ Done** | 17 LOW-risk UI/UX fixes executed, build verified (2026-05-31 12:10) |
| **Buffer improved**      | 0.10h → 0.83h — Prototype 1 finished 0.82h under estimate       |
| **Risk downgraded**      | CRITICAL → MODERATE — 5.83h available for 5.00h M-phase          |
| **P0 complete**          | All 6 critical brand/visual bugs fixed (U1–U6)                  |
| **P1 50% complete**      | U8, U10, U12 done; U7, U9, U11 deferred (non-blocking)          |
| **P2+P3 partially done** | 8 of 19 tasks done via Prototype 1 (scrollbars, keyframes, social, aria, errors, dead code, lang, favicon) |
| **Execution order updated** | Section 6 collapsed to single row: Prototype 1 ✅ → M-phase   |
