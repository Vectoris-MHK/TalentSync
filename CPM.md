# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-31 ICT **(CV Recommendation feature added — N tasks inserted before M)**
> Deadline: 2026-05-31 18:00 ICT (~remaining)
> Elapsed this session: ~3h (R1→R4 + SRV DNS fix + E + T + F + K + DRY fix)
> Working hours: ~5h/ngày ≈ 15h thực tế còn lại

---

## 0. Context: FRONTEND COMPLETE — CV Recommendation feature added

**All base frontend code is written and running.** New scope: CV-based Recommendation (N tasks) inserted before E2E/Docs/Video.

**Done this session (frontend):**

- `RecommendedJobs.jsx` — horizontal scroll, skeleton, empty state, per-card badges
- `Home.jsx` — RecommendedJobs auth-gated + OnboardingModal trigger
- `ApplyJob.jsx` — recommend-content API + view event on mount
- `OnboardingModal.jsx` — 6 categories, submit/skip flow
- `JobListing.jsx` — IntersectionObserver view event tracking
- `JobCard.jsx` — recommendBadge prop rendering + bookmark event (L6)
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
| `bookmark` | 3      | ✅ Done — JobCard.jsx L6                                                   | —                |
| `search`   | 4      | ❌ Skip — Hero search has no `jobId` context; `view` events serve as proxy | Intentional skip |

**New scope added (2026-05-31):**

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
✅ R1→R2→R3→R4.1→R4.2→R4.3→E→T→F→K (ALL DONE — ~3h actual, backend 100% complete)
                                       │
                                       ▼
                              L(2.0) ──→ L6(0.25) ──→ N(4.0) ──→ M(5.0)
```

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
| **L**  | **Frontend (RecommendedJobs + Onboarding + tracking)**         | **2.00**     | K            | 6.1     | ✅ Done  |
| **L6** | **`JobCard.jsx` bookmark event (weight=3)**                    | **0.25**     | L            | 6.1     | ✅ Done  |
| **N1** | **Backend upload CV endpoint + multer validation**             | **0.50**     | L6           | 4.5     | ⬜ To-Do |
| **N2** | **CV extraction service (pdf-parse / mammoth / tesseract.js)** | **0.75**     | N1           | 4.5     | ⬜ To-Do |
| **N3** | **CV embedding + `$vectorSearch` aggregation pipeline**        | **0.75**     | N2, E, B, F  | 4.5     | ⬜ To-Do |
| **N4** | **Match reasons + recommendation log**                         | **0.50**     | N3           | 4.5     | ⬜ To-Do |
| **N5** | **Frontend `CVRecommendationPage.jsx`**                        | **1.00**     | N3           | 6.1     | ⬜ To-Do |
| **N6** | **CV recommendation E2E test**                                 | **0.50**     | N4, N5       | 6.2     | ⬜ To-Do |
| **M**  | **E2E test + technical doc + demo video**                      | **5.00**     | N6           | 6.2-6.3 | ⬜ To-Do |

**Backend core recommendation:** 15/15 done (100%)
**CV-based recommendation extension:** 0/6 done (To-Do)
**Frontend tasks:** 2/2 done (100%)
**Total remaining:** 7 tasks, 9.00h

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID     | ES (h)   | EF (h)    | Notes                                        |
| ------ | -------- | --------- | -------------------------------------------- |
| R1→K   | 0.00     | 3.00      | ✅ All done                                  |
| **L**  | **3.00** | **5.00**  | ✅ Frontend done                             |
| **L6** | **5.00** | **5.25**  | ✅ bookmark event done                       |
| **N1** | **5.25** | **5.75**  | Backend CV upload endpoint                   |
| **N2** | **5.75** | **6.50**  | CV extraction service                        |
| **N3** | **6.50** | **7.25**  | CV embedding + `$vectorSearch` pipeline      |
| **N4** | **7.25** | **7.75**  | Match reasons + recommendation log           |
| **N5** | **6.50** | **7.50**  | Frontend CV page (parallel với N4)           |
| **N6** | **7.75** | **8.25**  | CV E2E test (after N4 + N5 both done → 7.75) |
| **M**  | **8.25** | **13.25** | E2E test + docs + video                      |

---

## 4. Critical Path

```
L ──→ L6 ──→ N1 ──→ N2 ──→ N3 ──→ N4 ──→ N6 ──→ M
                                  └──→ N5 ──┘
```

| Step | Task                                                        | ES   | EF    | Duration |
| ---- | ----------------------------------------------------------- | ---- | ----- | -------- |
| 1    | L: Frontend (RecommendedJobs + Onboarding + event tracking) | 3.00 | 5.00  | 2.00h    |
| 2    | L6: `JobCard.jsx` bookmark event (weight=3)                 | 5.00 | 5.25  | 0.25h    |
| 3    | N1: Backend upload CV endpoint + multer validation          | 5.25 | 5.75  | 0.50h    |
| 4    | N2: CV extraction service                                   | 5.75 | 6.50  | 0.75h    |
| 5    | N3: CV embedding + `$vectorSearch` aggregation              | 6.50 | 7.25  | 0.75h    |
| 6    | N4: Match reasons + recommendation log                      | 7.25 | 7.75  | 0.50h    |
| 7    | N6: CV recommendation E2E test                              | 7.75 | 8.25  | 0.50h    |
| 8    | M: E2E test + technical doc + demo video                    | 8.25 | 13.25 | 5.00h    |

| Metric                     | Value                                        |
| -------------------------- | -------------------------------------------- |
| Critical path remaining    | **9.00h** (N1→N2→N3→N4→N6→M)                 |
| Elapsed (actual)           | ~5.25h                                       |
| Working buffer to deadline | ~8.75h (deadline ~18h away, 9h work remains) |
| Deadline risk              | **MEDIUM** — buffer tight with new CV scope  |
| Backend core status        | **100% COMPLETE** (15/15 tasks)              |
| CV recommendation status   | **0% — To-Do** (6 tasks, 4.00h)              |
| Frontend status            | **100% COMPLETE** (L + L6 done)              |

---

## 5. Non-Critical Tasks (Float)

| Task                    | Float         | Notes                                                                   |
| ----------------------- | ------------- | ----------------------------------------------------------------------- |
| All R1→K tasks          | ∞             | Done — no changes needed                                                |
| Frontend event tracking | 0h            | Part of L — IntersectionObserver + useEffect view events                |
| `search` event          | ∞             | Intentionally skipped — no jobId context in Hero search bar; view proxy |
| Explanation badges      | Included in L | Done — per-card MODE_BADGE                                              |
| N5 (Frontend CV page)   | 0.25h         | Can start at N3 EF (6.50), must finish by N6 ES (7.75)                  |

---

## 6. Execution Order (Single Phase)

| Step | Task                                                        | Duration | Owner    |
| ---- | ----------------------------------------------------------- | -------- | -------- |
| 1    | L1: Create `RecommendedJobs.jsx` component                  | 0.50h    | Khiem    |
| 2    | L2: Update `Home.jsx` — insert RecommendedJobs              | 0.25h    | Khiem    |
| 3    | L3: Replace `findSimilarJobs` in `ApplyJob.jsx`             | 0.25h    | Khiem    |
| 4    | L4: Create `OnboardingModal.jsx`                            | 0.50h    | Khiem    |
| 5    | L5: Frontend event tracking (ApplyJob + JobListing)         | 0.50h    | Khiem    |
| 6    | L6: `JobCard.jsx` bookmark event (weight=3)                 | 0.25h    | Khiem    |
| 7    | N1: Backend upload CV endpoint + multer validation          | 0.50h    | Khiem    |
| 8    | N2: CV extraction service (pdf-parse / mammoth / tesseract) | 0.75h    | Khiem    |
| 9    | N3: CV embedding + `$vectorSearch` aggregation pipeline     | 0.75h    | Khiem    |
| 10   | N4: Match reasons + recommendation log                      | 0.50h    | Khiem    |
| 11   | N5: Frontend `CVRecommendationPage.jsx`                     | 1.00h    | Khiem    |
| 12   | N6: CV recommendation E2E test                              | 0.50h    | Khiem    |
| 13   | M1: E2E testing (4 flows)                                   | 1.50h    | Khiem    |
| 14   | M2: Technical document                                      | 1.50h    | Khiem    |
| 15   | M3: Demo video (10 min)                                     | 2.00h    | Quốc Hào |

---

## 7. Rủi ro & Mitigation

| Rủi ro                               | Impact                    | Mitigation                                                                          |
| ------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------- |
| ~~SRV DNS fails for new cluster~~    | ~~Block all connections~~ | ✅ Fixed                                                                            |
| ~~IP whitelist blocks scripts~~      | ~~Block seeding~~         | ✅ Fixed                                                                            |
| ~~OpenAI rate limit~~                | ~~Slow embedding~~        | ✅ 36/36 passed                                                                     |
| ~~Atlas Search Index not available~~ | ~~Showstopper~~           | ✅ Active, verified                                                                 |
| ~~Collaborative filtering complex~~  | ~~No time~~               | ✅ Done, 13-stage pipeline                                                          |
| Frontend component complexity        | Medium                    | Done — horizontal scroll + badges implemented                                       |
| Clerk auth in frontend API calls     | Medium                    | Pattern already exists in codebase — reuse getToken() pattern                       |
| Demo video recording                 | Medium                    | Quốc Hào handles; script provided in WBS                                            |
| OCR accuracy thấp với CV scan        | Medium                    | Fallback message + allow re-upload; PDF/DOCX text extraction first                  |
| CV parsing không chuẩn               | Low                       | MVP dùng raw CV text để embedding — không cần parse structured profile              |
| Embedding dimension mismatch         | Low                       | Reuse `embeddingService.js` + 3072d model — same as job embeddings                  |
| `$vectorSearch` query fail           | Low                       | Reuse `idx_jobs_vector` — verified active via testVectorSearch.js                   |
| Privacy risk khi lưu CV raw text     | Medium                    | Không lưu full raw text — chỉ lưu preview 500 ký tự + metadata                      |
| **Deadline risk với scope mới**      | **Medium**                | **9h work còn lại, ~18h đến deadline — buffer ~9h. Cắt N4 (match reasons) nếu cần** |

---

## 8. Summary

```
Backend core recommendation: 100% COMPLETE — 15/15 tasks done
CV-based recommendation:     TO-DO — 6 tasks (N1→N6), 4.00h
Frontend base recommendation: 100% COMPLETE — L + L6 done
                     - RecommendedJobs + OnboardingModal + event tracking
                     - requireAuth() middleware + env fixes + Việt hóa UI
                     - bookmark event in JobCard.jsx ✅
Remaining:           CV feature (N: 4.0h) + E2E/Docs/Video (M: 5.0h) = 9.0h
Available time:      ~18h (deadline 2026-05-31 18:00 VNT)
Working buffer:      ~9h
Deadline risk:       MEDIUM — scope expanded +4h; buffer still positive but tight
Deadline:            2026-05-31 18:00 VNT
```

## 9. What Changed Since Last CPM Update

| Change                          | Reason                                                          |
| ------------------------------- | --------------------------------------------------------------- |
| **L → ✅ Done**                 | All frontend components implemented + bugs fixed                |
| **L6 → ✅ Done**                | bookmark event wired in JobCard.jsx                             |
| **N1–N6 added**                 | New scope: CV-based Recommendation feature                      |
| **Critical path +4.00h**        | N1→N2→N3→N4→N6 inserted before M                                |
| **M dependency changed**        | M now depends on N6 (was L6)                                    |
| **Deadline risk: LOW → MEDIUM** | 9h remaining work, ~18h to deadline, buffer ~9h                 |
| **Task Network updated**        | L → L6 → N → M                                                  |
| **Execution Order +6 steps**    | N1–N6 added before M1–M3                                        |
| **Risks +5 rows**               | OCR accuracy, CV parsing, dimension mismatch, privacy, deadline |
