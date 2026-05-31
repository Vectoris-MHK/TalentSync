# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-31 ICT **(PROTOTYPE 1 COMPLETE — 17/30 UI/UX tasks done, build verified + CV Recommendation feature added — N tasks inserted before M)**
> Deadline: 2026-05-31 18:00 ICT (~remaining)
> Elapsed total: ~7.85h (R1→L6 + Prototype 1)
> Working buffer: **TIGHT — see forward pass for current estimate**

---

## 0. Context: Prototype 1 + CV Recommendation — 13 UI/UX Tasks + CV Feature + Submission Remain

**All base frontend code is written and running.** Two new scopes added:

1. **Prototype 1 (UI/UX):** Comprehensive UI/UX audit on 2026-05-31 identified 30 visual/functional issues. Task inventory: `docs/implement/ui-ux-audit.md`. Execution plan: `docs/implement/ui-ux-plan.md`. **Prototype 1 (17 LOW-risk tasks) executed 2026-05-31 11:23–12:10 ICT — `npm run build` passes, zero regressions.**

2. **CV-based Recommendation:** New scope — CV upload → OCR/extract → embed → `$vectorSearch` → ranked job results.

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

**Event tracking audit:**

| Event      | Weight | Status                                                                     | Decision         |
| ---------- | ------ | -------------------------------------------------------------------------- | ---------------- |
| `view`     | 1      | ✅ Done — ApplyJob mount + JobListing IntersectionObserver                 | —                |
| `apply`    | 5      | ✅ Done — auto-created server-side in `applyForJob()`                      | —                |
| `bookmark` | 3      | ✅ Done — JobCard.jsx L6                                                   | —                |
| `search`   | 4      | ❌ Skip — Hero search has no `jobId` context; `view` events serve as proxy | Intentional skip |

**New scope added (2026-05-31) — CV Recommendation:**

| Task | Description                                                | Duration |
| ---- | ---------------------------------------------------------- | -------- |
| N1   | Backend upload CV endpoint + multer validation             | 0.50h    |
| N2   | CV extraction service (pdf-parse / mammoth / tesseract.js) | 0.75h    |
| N3   | CV embedding + `$vectorSearch` aggregation pipeline        | 0.75h    |
| N4   | Match reasons + recommendation log                         | 0.50h    |
| N5   | Frontend `CVRecommendationPage.jsx`                        | 1.00h    |
| N6   | CV recommendation E2E test                                 | 0.50h    |

---

## 1. Task Network

```
✅ R1→R2→R3→R4.1→R4.2→R4.3→E→T→F→K→L→L6 (ALL DONE — backend + frontend 100%)
                                         │
                                         ▼
                          ✅ Prototype1(1.60) ──→ N(4.0) ──→ M(5.0)
```

| Branch | Tasks | Description |
| ------ | ----- | ----------- |
| R1→L6 | 16 tasks | All backend + frontend code — **100% DONE** |
| **P1**  | U1–U30 (Prototype 1 subset) | 17 LOW-risk UI/UX fixes — **✅ DONE (1.60h)** |
| **N**  | N1–N6 | CV-based recommendation extension (4.00h) |
| **M**  | M1–M3 | E2E test + technical doc + demo video (5.0h) |

P1+P2+P3 remaining (U7,U9,U11,U13,U14,U16,U19,U20,U22,U23,U25,U27,U28 — 13 tasks, 2.70h) are non-critical — float time post-deadline.

---

## 2. Task List with Dependencies & Duration

| ID     | Task                                                           | Duration (h) | Dependencies | Epic    | Status   |
| ------ | -------------------------------------------------------------- | ------------ | ------------ | ------- | -------- |
| R1     | Create M10 cluster + DB user + network access + get URI        | 0.33         | —            | 2       | ✅ Done  |
| R2     | Update `server/.env` MONGODB_URI                               | 0.08         | R1           | 2       | ✅ Done  |
| R3     | Refactor 5 scripts: hardcoded URI → `process.env.MONGODB_URI`  | 0.17         | R2           | 2       | ✅ Done  |
| R3.1   | SRV DNS fix: force Google DNS + fix URLSearchParams            | 0.25         | R3           | 2       | ✅ Done  |
| R4.1   | Re-run `seedData.js` (11 companies, 36 jobs, 10 users)         | 0.17         | R3.1         | 3.2     | ✅ Done  |
| R4.2   | Re-run `seedEmbeddings.js` (36/36 embedded, 0 fails)           | 0.33         | R4.1         | 3.2     | ✅ Done  |
| R4.3   | Re-run `seedEvents.js` (215 events, 10 users)                  | 0.17         | R4.1         | 3.2     | ✅ Done  |
| B      | `embeddingService.js`                                          | 0.50         | —            | 4.1     | ✅ Done  |
| C      | Auto-embed on postJob()                                        | 0.17         | B            | 4.1     | ✅ Done  |
| E      | Atlas Vector Search Index `idx_jobs_vector`                    | 0.33         | R4.2         | 4.2     | ✅ Done  |
| T      | `testVectorSearch.js` — 3/3 queries PASS                       | 0.17         | E            | 4.2     | ✅ Done  |
| F      | `GET /api/jobs/recommend-content` (8-stage pipeline)           | 1.00         | E, B         | 4.3     | ✅ Done  |
| H      | User behavior tracking API                                     | 0.50         | —            | 5.1     | ✅ Done  |
| I      | User profile embedding + preferences API                       | 0.67         | H            | 5.2     | ✅ Done  |
| J      | Collaborative filtering API                                    | 0.67         | H            | 5.3     | ✅ Done  |
| K      | `GET /api/jobs/recommend-feed` (hybrid blender)                | 0.50         | F, I, J      | 5.4     | ✅ Done  |
| L      | Frontend (RecommendedJobs + Onboarding + tracking)             | 2.00         | K            | 6.1     | ✅ Done  |
| L6     | `JobCard.jsx` bookmark event (weight=3)                        | 0.25         | L            | 6.1     | ✅ Done  |
| **P1** | **Prototype 1 UI/UX fixes (17 LOW-risk tasks)**                | **1.60**     | L6           | 6.4     | ✅ Done  |
| **N1** | **Backend upload CV endpoint + multer validation**             | **0.50**     | P1           | 4.5     | ⬜ To-Do |
| **N2** | **CV extraction service (pdf-parse / mammoth / tesseract.js)** | **0.75**     | N1           | 4.5     | ⬜ To-Do |
| **N3** | **CV embedding + `$vectorSearch` aggregation pipeline**        | **0.75**     | N2, E, B, F  | 4.5     | ⬜ To-Do |
| **N4** | **Match reasons + recommendation log**                         | **0.50**     | N3           | 4.5     | ⬜ To-Do |
| **N5** | **Frontend `CVRecommendationPage.jsx`**                        | **1.00**     | N3           | 6.1     | ⬜ To-Do |
| **N6** | **CV recommendation E2E test**                                 | **0.50**     | N4, N5       | 6.2     | ⬜ To-Do |
| **M**  | **E2E test + technical doc + demo video**                      | **5.00**     | N6           | 6.2-6.3 | ⬜ To-Do |

**Backend core recommendation:** 15/15 done (100%)
**CV-based recommendation extension:** 0/6 done (To-Do)
**Frontend tasks:** 2/2 done (100%)
**UI/UX tasks:** 17/30 done (57%) — Prototype 1 complete
**Total remaining:** 7 tasks (CV: 4.00h + M: 5.00h) = 9.00h

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID     | ES (h)   | EF (h)    | Notes                                        |
| ------ | -------- | --------- | -------------------------------------------- |
| R1→L6  | 0.00     | 5.25      | ✅ All done                                  |
| **P1** | **5.25** | **6.85**  | **Prototype 1 done ✅**                      |
| **N1** | **6.85** | **7.35**  | Backend CV upload endpoint                   |
| **N2** | **7.35** | **8.10**  | CV extraction service                        |
| **N3** | **8.10** | **8.85**  | CV embedding + `$vectorSearch` pipeline      |
| **N4** | **8.85** | **9.35**  | Match reasons + recommendation log           |
| **N5** | **8.10** | **9.10**  | Frontend CV page (parallel with N4)          |
| **N6** | **9.35** | **9.85**  | CV E2E test (after N4 + N5 both done → 9.35) |
| **M**  | **9.85** | **14.85** | E2E test + docs + video                      |

---

## 4. Critical Path

```
P1 ──→ N1 ──→ N2 ──→ N3 ──→ N4 ──→ N6 ──→ M
                          └──→ N5 ──┘
```

| Step | Task                                                        | ES    | EF     | Duration |
| ---- | ----------------------------------------------------------- | ----- | ------ | -------- |
| 1    | P1: Prototype 1 UI/UX fixes (17 tasks)                      | 5.25  | 6.85   | 1.60h    |
| 2    | N1: Backend upload CV endpoint + multer validation          | 6.85  | 7.35   | 0.50h    |
| 3    | N2: CV extraction service                                   | 7.35  | 8.10   | 0.75h    |
| 4    | N3: CV embedding + `$vectorSearch` aggregation              | 8.10  | 8.85   | 0.75h    |
| 5    | N4: Match reasons + recommendation log                      | 8.85  | 9.35   | 0.50h    |
| 6    | N6: CV recommendation E2E test                              | 9.35  | 9.85   | 0.50h    |
| 7    | M: E2E test + technical doc + demo video                    | 9.85  | 14.85  | 5.00h    |

| Metric                     | Value                                                |
| -------------------------- | ---------------------------------------------------- |
| Critical path remaining    | **9.00h** (N1→N2→N3→N4→N6→M)                        |
| Elapsed (actual)           | ~6.85h                                               |
| Time remaining to deadline | **Varies — check actual clock**                      |
| Deadline risk              | **HIGH** — 9h remaining work vs deadline today       |
| Backend status             | **100% COMPLETE** (15/15 tasks)                      |
| Frontend status            | **100% COMPLETE** (L + L6 done)                      |
| UI/UX status               | **57% COMPLETE** (17/30 done, Prototype 1 verified)  |
| CV recommendation status   | **0% — To-Do** (6 tasks, 4.00h)                      |

---

## 5. Non-Critical Tasks (Float)

| Task                         | Float | Notes                                                                                                |
| ---------------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| All R1→L6 tasks              | ∞     | Done — no changes needed                                                                             |
| P1 remaining (U7,U9,U11)     | ∞     | 3 P1 tasks deferred — non-critical for submission                                                    |
| P2 remaining (U13,U14,U16,U19,U20) | ∞ | 5 P2 tasks deferred — post-submission polish                                                         |
| P3 remaining (U22,U23,U25,U27,U28) | ∞ | 5 P3 tasks deferred — post-submission polish                                                         |
| N5 (Frontend CV page)        | 0.25h | Can start at N3 EF (8.85), must finish by N6 ES (9.35)                                              |
| `search` event               | ∞     | Intentionally skipped — no jobId context in Hero search bar; view proxy                              |

---

## 6. Execution Order (Single Phase — Today)

| Step | Task                                                        | Duration | Owner    | Status   |
| ---- | ----------------------------------------------------------- | -------- | -------- | -------- |
| 1    | **Prototype 1:** 17 LOW-risk UI/UX fixes (U1–U6, U8, U10, U12, U15, U17, U18, U21, U24, U26, U29, U30) | 1.60h | Khiem | ✅ Done |
| 2    | **N1:** Backend upload CV endpoint + multer validation      | 0.50h    | Khiem    | ⬜ To-Do |
| 3    | **N2:** CV extraction service (pdf-parse / mammoth / tesseract) | 0.75h | Khiem    | ⬜ To-Do |
| 4    | **N3:** CV embedding + `$vectorSearch` aggregation pipeline | 0.75h    | Khiem    | ⬜ To-Do |
| 5    | **N4:** Match reasons + recommendation log                  | 0.50h    | Khiem    | ⬜ To-Do |
| 6    | **N5:** Frontend `CVRecommendationPage.jsx`                 | 1.00h    | Khiem    | ⬜ To-Do |
| 7    | **N6:** CV recommendation E2E test                          | 0.50h    | Khiem    | ⬜ To-Do |
| 8    | **M1:** E2E testing (4 flows)                               | 1.50h    | Khiem    | ⬜ To-Do |
| 9    | **M2:** Technical document                                  | 1.50h    | Khiem    | ⬜ To-Do |
| 10   | **M3:** Demo video (10 min)                                 | 2.00h    | Quốc Hào | ⬜ To-Do |

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
| ~~UI/UX Prototype 1~~                | ~~Time buffer~~           | ✅ Done, build verified                                             |
| OCR accuracy thấp với CV scan        | Medium                    | Fallback message + allow re-upload; PDF/DOCX text extraction first  |
| CV parsing không chuẩn               | Low                       | MVP dùng raw CV text để embedding — không cần parse structured profile |
| Embedding dimension mismatch         | Low                       | Reuse `embeddingService.js` + 3072d model — same as job embeddings  |
| `$vectorSearch` query fail           | Low                       | Reuse `idx_jobs_vector` — verified active via testVectorSearch.js   |
| Privacy risk khi lưu CV raw text     | Medium                    | Không lưu full raw text — chỉ lưu preview 500 ký tự + metadata      |
| **Deadline risk với scope mới**      | **HIGH**                  | **9h work còn lại, deadline hôm nay. Cắt N4 (match reasons) nếu cần** |
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
CV recommendation:  TO-DO — 6 tasks (N1→N6), 4.00h
Remaining:          CV feature (N: 4.0h) + E2E/Docs/Video (M: 5.0h) = 9.0h
Deadline:           2026-05-31 18:00 VNT
```

## 9. What Changed Since Last CPM Update

| Change                          | Reason                                                          |
| ------------------------------- | --------------------------------------------------------------- |
| **L → ✅ Done**                 | All frontend components implemented + bugs fixed                |
| **L6 → ✅ Done**                | bookmark event wired in JobCard.jsx                             |
| **N1–N6 added**                 | New scope: CV-based Recommendation feature                      |
| **Prototype 1 → ✅ Done**       | 17 LOW-risk UI/UX fixes executed, build verified (2026-05-31 12:10) |
| **P0 complete**                 | All 6 critical brand/visual bugs fixed (U1–U6)                  |
| **P1 50% complete**             | U8, U10, U12 done; U7, U9, U11 deferred (non-blocking)          |
| **P2+P3 partially done**       | 8 of 19 tasks done via Prototype 1 (scrollbars, keyframes, social, aria, errors, dead code, lang, favicon) |
| **Critical path updated**       | P1 → N1 → N2 → N3 → N4 → N6 → M                                |
| **M dependency changed**        | M now depends on N6                                             |
| **Deadline risk: MODERATE → HIGH** | 9h remaining, deadline same-day                                 |
| **Execution Order updated**     | Prototype 1 ✅ → N1–N6 → M1–M3                                  |
