# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-30 ICT **(FRONTEND DONE — bookmark event + E2E Test + Docs + Video only)**
> Deadline: 2026-05-31 18:00 ICT (~23h còn lại)
> Elapsed this session: ~3h (R1→R4 + SRV DNS fix + E + T + F + K + DRY fix)
> Working hours: ~5h/ngày ≈ 15h thực tế còn lại

---

## 0. Context: FRONTEND COMPLETE (1 micro-task pending)

**All frontend code is written and running.** One micro-task remaining before E2E: bookmark event in `JobCard.jsx`.

**Done this session (frontend):**

- `RecommendedJobs.jsx` — horizontal scroll, skeleton, empty state, per-card badges
- `Home.jsx` — RecommendedJobs auth-gated + OnboardingModal trigger
- `ApplyJob.jsx` — recommend-content API + view event on mount
- `OnboardingModal.jsx` — 6 categories, submit/skip flow
- `JobListing.jsx` — IntersectionObserver view event tracking
- `JobCard.jsx` — recommendBadge prop rendering
- `requireAuth()` middleware added to all protected routes
- `CLERK_PUBLISHABLE_KEY` added to server `.env`
- `VITE_BACKEND_URL` fixed in client `.env`
- `MONGODB_URI` duplicate key bug fixed
- `<style jsx>` → `<style>` fixed in Navbar + Footer
- `JobCategories` + `JobLocations` Việt hóa (6 categories, 63 tỉnh thành)

**Event tracking audit (2026-05-30):**

| Event      | Weight | Status                                                                     | Decision         |
| ---------- | ------ | -------------------------------------------------------------------------- | ---------------- |
| `view`     | 1      | ✅ Done — ApplyJob mount + JobListing IntersectionObserver                 | —                |
| `apply`    | 5      | ✅ Done — auto-created server-side in `applyForJob()`                      | —                |
| `bookmark` | 3      | ⬜ Missing — `JobCard.jsx` bookmark button is UI-only                      | **Implement**    |
| `search`   | 4      | ❌ Skip — Hero search has no `jobId` context; `view` events serve as proxy | Intentional skip |

---

## 1. Task Network

```
✅ R1→R2→R3→R4.1→R4.2→R4.3→E→T→F→K (ALL DONE — ~3h actual, backend 100% complete)
                                       │
                                       ▼
                              L(2.0) ──→ L6(0.25) ──→ M(5.0)
```

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
| **L**  | **Frontend (RecommendedJobs + Onboarding + tracking)**        | **2.00**     | K            | 6.1     | ✅ Done  |
| **L6** | **`JobCard.jsx` bookmark event (weight=3)**                   | **0.25**     | L            | 6.1     | ✅ Done  |
| **M**  | **E2E test + technical doc + demo video**                     | **5.00**     | L6           | 6.2-6.3 | ⬜ To-Do |

**Backend tasks:** 15/15 done (100%)
**Frontend tasks:** 2/2 done (100%)
**Total remaining:** 1 task, 5.00h

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID     | ES (h)   | EF (h)    | Notes                       |
| ------ | -------- | --------- | --------------------------- |
| R1→K   | 0.00     | 3.00      | ✅ All done                 |
| **L**  | **3.00** | **5.00**  | ✅ Frontend done            |
| **L6** | **5.00** | **5.25**  | ✅ bookmark event done      |
| **M**  | **5.25** | **10.25** | **E2E test + docs + video** |

---

## 4. Critical Path

```
L ──→ L6 ──→ M
```

| Step | Task                                                        | ES   | EF    | Duration |
| ---- | ----------------------------------------------------------- | ---- | ----- | -------- |
| 1    | L: Frontend (RecommendedJobs + Onboarding + event tracking) | 3.00 | 5.00  | 2.00h    |
| 2    | L6: `JobCard.jsx` bookmark event (weight=3)                 | 5.00 | 5.25  | 0.25h    |
| 3    | M: E2E test + technical doc + demo video                    | 5.25 | 10.25 | 5.00h    |

| Metric                     | Value                                      |
| -------------------------- | ------------------------------------------ |
| Critical path remaining    | **5.25h**                                  |
| Elapsed (actual)           | ~5.0h                                      |
| Working buffer to deadline | ~17.75h                                    |
| Deadline risk              | **LOW** — 17.75h buffer vs 5.25h remaining |
| Backend status             | **100% COMPLETE** (15/15 tasks)            |
| Frontend status            | **100% COMPLETE** (L + L6 done)            |

---

## 5. Non-Critical Tasks (Float)

| Task                    | Float         | Notes                                                                   |
| ----------------------- | ------------- | ----------------------------------------------------------------------- |
| All R1→K tasks          | ∞             | Done — no changes needed                                                |
| Frontend event tracking | 0h            | Part of L — IntersectionObserver + useEffect view events                |
| `search` event          | ∞             | Intentionally skipped — no jobId context in Hero search bar; view proxy |
| Explanation badges      | Included in L | Can cut if time-constrained (low-priority polish)                       |

---

## 6. Execution Order (Single Phase)

| Step | Task                                                | Duration | Owner    |
| ---- | --------------------------------------------------- | -------- | -------- |
| 1    | L1: Create `RecommendedJobs.jsx` component          | 0.50h    | Khiem    |
| 2    | L2: Update `Home.jsx` — insert RecommendedJobs      | 0.25h    | Khiem    |
| 3    | L3: Replace `findSimilarJobs` in `ApplyJob.jsx`     | 0.25h    | Khiem    |
| 4    | L4: Create `OnboardingModal.jsx`                    | 0.50h    | Khiem    |
| 5    | L5: Frontend event tracking (ApplyJob + JobListing) | 0.50h    | Khiem    |
| 6    | L6: `JobCard.jsx` bookmark event (weight=3)         | 0.25h    | Khiem    |
| 7    | M1: E2E testing (3 flows)                           | 1.50h    | Khiem    |
| 8    | M2: Technical document                              | 1.50h    | Khiem    |
| 9    | M3: Demo video (10 min)                             | 2.00h    | Quốc Hào |

---

## 7. Rủi ro & Mitigation

| Rủi ro                               | Impact                    | Mitigation                                                    |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------- |
| ~~SRV DNS fails for new cluster~~    | ~~Block all connections~~ | ✅ Fixed                                                      |
| ~~IP whitelist blocks scripts~~      | ~~Block seeding~~         | ✅ Fixed                                                      |
| ~~OpenAI rate limit~~                | ~~Slow embedding~~        | ✅ 36/36 passed                                               |
| ~~Atlas Search Index not available~~ | ~~Showstopper~~           | ✅ Active, verified                                           |
| ~~Collaborative filtering complex~~  | ~~No time~~               | ✅ Done, 13-stage pipeline                                    |
| Frontend component complexity        | Medium                    | Can cut explanation badges; use simple horizontal scroll      |
| Clerk auth in frontend API calls     | Medium                    | Pattern already exists in codebase — reuse getToken() pattern |
| Demo video recording                 | Medium                    | Quốc Hào handles; script provided in WBS                      |
| Còn ~46.8h, critical path 7.0h       | LOW risk                  | Buffer ~43h                                                   |

---

## 8. Summary

```
Backend status:     100% COMPLETE — 15/15 tasks done
Frontend status:    100% COMPLETE — L + L6 done
                     - RecommendedJobs + OnboardingModal + event tracking
                     - requireAuth() middleware + env fixes + Việt hóa UI
                     - bookmark event in JobCard.jsx ✅
Remaining:           E2E/Docs/Video (M: 5.0h) = 5.0h
Available time:      ~23h (deadline 2026-05-31 18:00 VNT)
Working buffer:      ~17.75h
Deadline:            2026-05-31 18:00 VNT
```

## 9. What Changed Since Last CPM Update

| Change                   | Reason                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| **L → ✅ Done**          | All frontend components implemented + bugs fixed                 |
| **RecommendedJobs.jsx**  | Horizontal scroll, skeleton, per-card badges, recommend-feed API |
| **OnboardingModal.jsx**  | 6 categories, submit/skip, POST /api/users/preferences           |
| **ApplyJob.jsx**         | recommend-content API + view event on mount                      |
| **JobListing.jsx**       | IntersectionObserver view event tracking                         |
| **requireAuth() fix**    | All protected routes now properly guarded                        |
| **Env fixes**            | CLERK_PUBLISHABLE_KEY, VITE_BACKEND_URL, MONGODB_URI duplicate   |
| **style jsx fix**        | Navbar + Footer: Next.js syntax → standard `<style>`             |
| **Việt hóa**             | JobCategories (6) + JobLocations (63 tỉnh thành)                 |
| **L6 added**             | Event audit: bookmark (weight=3) missing in JobCard.jsx          |
| **search event skipped** | No jobId context in Hero search bar — view events serve as proxy |
| **Critical path +0.25h** | L6 inserted before M; buffer still 17.75h                        |
