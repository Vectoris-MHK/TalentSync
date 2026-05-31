# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-31 11:15 ICT **(UI/UX AUDIT COMPLETE — 30 issues, P0+P1=1.65h critical, P2+P3=2.85h non-critical)**
> Deadline: 2026-05-31 18:00 ICT (~6.75h còn lại)
> Elapsed total: ~5h (R1→K + L + L6)
> Working buffer: ~0.10h (**CRITICAL — leaves almost zero margin**)

---

## 0. Context: CODE COMPLETE — UI/UX Polish + Submission Only

**All frontend and backend code is functionally complete.** A comprehensive UI/UX audit on 2026-05-31 identified 30 visual/functional issues. Task inventory: `docs/implement/ui-ux-audit.md`. Execution plan: `docs/implement/ui-ux-plan.md`. P0+P1 (11 tasks, 1.65h) are critical path — must be fixed before demo video recording. P2+P3 (19 tasks, 2.85h) are non-critical and deferred to post-submission.

**Done in prior sessions:**

- `RecommendedJobs.jsx` — horizontal scroll, skeleton, empty state, per-card badges
- `Home.jsx` — RecommendedJobs auth-gated + OnboardingModal trigger
- `ApplyJob.jsx` — recommend-content API + view event on mount
- `OnboardingModal.jsx` — 6 categories, submit/skip flow
- `JobListing.jsx` — IntersectionObserver view event tracking
- `JobCard.jsx` — recommendBadge prop rendering + bookmark event
- `requireAuth()` middleware, env fixes, Việt hóa, style fixes — all done

**UI/UX Audit (2026-05-31):**

| Priority | Tasks | Estimate | Status |
| -------- | ----- | -------- | ------ |
| P0 — Critical | U1–U6: Brand rename, Hero overlay, duplicate buttons, dead time, copyright, favicon | 0.60h | ⬜ To-Do |
| P1 — High | U7–U12: Primary color, localhost link, sort dropdown, dead links, fake newsletter, Hero imports | 1.05h | ⬜ To-Do |
| P2 — Medium | U13–U21: Icon lib, typography, scrollbars, Loading.css, inline styles, dark theme, social links | 1.45h | ⬜ To-Do (post-submission) |
| P3 — Low | U22–U30: Spacer, mobile, lang, duplicate search, aria, titles, loading, errors, dead data | 1.40h | ⬜ To-Do (post-submission) |

---

## 1. Task Network

```
✅ R1→R2→R3→R4.1→R4.2→R4.3→E→T→F→K→L→L6 (ALL DONE — backend + frontend 100%)
                                        │
                                        ▼
                              U(1.65) ──→ M(5.0)
```

| Branch | Tasks | Description |
| ------ | ----- | ----------- |
| R1→L6 | 16 tasks | All backend + frontend code — **100% DONE** |
| **U**  | U1–U12 | P0 + P1 UI/UX fixes (11 tasks, 1.65h) |
| **M**  | M1–M3 | E2E test + technical doc + demo video (5.0h) |

P2+P3 (U13–U30, 2.85h) are non-critical — float time post-deadline.

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
| **U**  | **P0+P1 UI/UX fixes (U1–U12, 11 tasks)**                     | **1.65**     | L6           | 6.4     | ⬜ To-Do |
| **M**  | **E2E test + technical doc + demo video**                     | **5.00**     | U            | 6.2-6.3 | ⬜ To-Do |

**Backend tasks:** 15/15 done (100%)
**Frontend tasks:** 2/2 done (100%)
**UI/UX tasks:** 0/11 done (0%) — P0+P1 only
**Total remaining:** 2 tasks, 6.65h

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID     | ES (h)   | EF (h)    | Notes                       |
| ------ | -------- | --------- | --------------------------- |
| R1→L6  | 0.00     | 5.25      | ✅ All done                 |
| **U**  | **5.25** | **6.90**  | **P0+P1 UI/UX fixes**      |
| **M**  | **6.90** | **11.90** | **E2E test + docs + video** |

---

## 4. Critical Path

```
U ──→ M
```

| Step | Task                                          | ES    | EF     | Duration |
| ---- | --------------------------------------------- | ----- | ------ | -------- |
| 1    | U: P0+P1 UI/UX fixes (U1–U12, 11 tasks)       | 5.25  | 6.90   | 1.65h    |
| 2    | M: E2E test + technical doc + demo video       | 6.90  | 11.90  | 5.00h    |

| Metric                     | Value                                                |
| -------------------------- | ---------------------------------------------------- |
| Critical path remaining    | **6.65h**                                            |
| Elapsed (actual)           | ~5.25h                                               |
| Time remaining to deadline | **~6.75h** (deadline 2026-05-31 18:00 ICT)          |
| Working buffer             | **~0.10h**                                           |
| Deadline risk              | **CRITICAL** — 6.75h available vs 6.65h required     |
| Backend status             | **100% COMPLETE** (15/15 tasks)                      |
| Frontend status            | **100% COMPLETE** (L + L6 done)                      |
| UI/UX status               | **0% COMPLETE** (0/11 P0+P1 done)                    |

---

## 5. Non-Critical Tasks (Float)

| Task                         | Float | Notes                                                                                                |
| ---------------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| All R1→L6 tasks              | ∞     | Done — no changes needed                                                                             |
| P2 fixes (U13–U21)           | ∞     | Deferred to post-submission — no deadline dependency                                                 |
| P3 fixes (U22–U30)           | ∞     | Deferred to post-submission — no deadline dependency                                                 |

---

## 6. Execution Order (Single Phase — Today)

| Step | Task                                                    | Duration | Owner    | Status   |
| ---- | ------------------------------------------------------- | -------- | -------- | -------- |
| 1    | **U1:** Brand rename Prodigy → TalentSync (5 files)     | 0.25h    | Khiem    | ⬜ To-Do |
| 2    | **U2:** Fix Hero overlay opacity                        | 0.10h    | Khiem    | ⬜ To-Do |
| 3    | **U3:** Remove duplicate Learn More button              | 0.10h    | Khiem    | ⬜ To-Do |
| 4    | **U4:** Fix dead time display (postedAt → date)         | 0.05h    | Khiem    | ⬜ To-Do |
| 5    | **U5:** Fix footer copyright (2025→2026, Prodigy→TalentSync) | 0.05h | Khiem  | ⬜ To-Do |
| 6    | **U6:** Fix favicon path for production build           | 0.05h    | Khiem    | ⬜ To-Do |
| 7    | **U7:** Apply `primary` color consistently (12+ files)  | 0.40h    | Khiem    | ⬜ To-Do |
| 8    | **U8:** Fix hardcoded localhost link in AppDownload     | 0.10h    | Khiem    | ⬜ To-Do |
| 9    | **U9:** Wire Sort by dropdown in JobListing             | 0.15h    | Khiem    | ⬜ To-Do |
| 10   | **U10:** Fix dead footer links                          | 0.15h    | Khiem    | ⬜ To-Do |
| 11   | **U11:** Wire or remove fake newsletter                 | 0.15h    | Khiem    | ⬜ To-Do |
| 12   | **U12:** Clean up Hero imports + fix logo URLs          | 0.10h    | Khiem    | ⬜ To-Do |
| 13   | **M1:** E2E testing (3 flows)                           | 1.50h    | Khiem    | ⬜ To-Do |
| 14   | **M2:** Technical document                              | 1.50h    | Khiem    | ⬜ To-Do |
| 15   | **M3:** Demo video (10 min)                             | 2.00h    | Quốc Hào | ⬜ To-Do |

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
| **Time: 6.75h available vs 6.65h required** | **CRITICAL**       | Execute P0+P1 in parallel where possible; skip P2+P3 entirely       |
| P0+P1 takes longer than estimated    | **SHOWSTOPPER**           | Cut P1 items U7–U12 first; P0 items U1–U6 are non-negotiable        |
| Demo video recording                 | Medium                    | Quốc Hào handles; script provided in WBS                            |
| Vercel deployment issues             | Low                       | Server + client deploy scripts already tested                       |

---

## 8. Summary

```
Backend status:     100% COMPLETE — 15/15 tasks done
Frontend status:    100% COMPLETE — L + L6 done
                     - RecommendedJobs + OnboardingModal + event tracking + bookmark
UI/UX status:       0% COMPLETE — 0/11 P0+P1 done
Remaining:          U(1.65h) + M(5.0h) = 6.65h
Available time:     ~6.75h (deadline 2026-05-31 18:00 VNT)
Working buffer:     ~0.10h ⚠️ CRITICAL
Deadline:           2026-05-31 18:00 VNT
```

## 9. What Changed Since Last CPM Update

| Change                   | Reason                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| **L → ✅ Done**          | All frontend components implemented + bugs fixed                 |
| **L6 → ✅ Done**         | Bookmark event wired in JobCard.jsx (was incorrectly marked ⬜)   |
| **U added**              | UI/UX audit revealed 30 visual/functional issues (2026-05-31)    |
| **U on critical path**   | P0+P1 (U1–U12) inserted before M — blocks demo recording         |
| **Buffer collapsed**     | 17.75h → 0.10h — P0+P1 fixes consume all remaining time buffer   |
| **Risk raised to CRITICAL** | 0.10h buffer leaves zero margin for error; strict execution needed |
| **P2+P3 deferred**       | U13–U30 (2.85h) intentionally excluded — not submission-blocking  |
