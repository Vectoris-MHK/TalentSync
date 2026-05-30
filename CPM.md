# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-30 18:40 ICT **(FRONTEND DONE — E2E Test + Docs + Video only)**
> Deadline: 2026-05-31 18:00 ICT (~23h còn lại)
> Elapsed this session: ~3h (R1→R4 + SRV DNS fix + E + T + F + K + DRY fix)
> Working hours: ~5h/ngày ≈ 15h thực tế còn lại

---

## 0. Context: BACKEND COMPLETE

**All server-side code is written, verified, and running.** No backend work remains. Frontend and submission deliverables are the only outstanding items.

**Done this session (3h):**
- Atlas restart: M10 cluster, DB user, network, DNS fix, re-seed all data
- 5 script refactors (hardcoded URI → process.env.MONGODB_URI)
- DRY fix: db.js imports shared uriFromSrv()
- Vector Search Index `idx_jobs_vector` — ClickOps deployed + verified
- `GET /api/jobs/recommend-content` — `$vectorSearch` + 8-stage Aggregation Pipeline
- `GET /api/jobs/recommend-feed` — hybrid blender (3 modes: hybrid, preferences, popular)
- `testVectorSearch.js` — 3/3 Vietnamese queries PASS

---

## 1. Task Network

```
✅ R1→R2→R3→R4.1→R4.2→R4.3→E→T→F→K (ALL DONE — ~3h actual, backend 100% complete)
                                       │
                                       ▼
                              L(2.0) ──→ M(5.0)
```

---

## 2. Task List with Dependencies & Duration

| ID | Task | Duration (h) | Dependencies | Epic | Status |
|----|------|-------------|--------------|------|--------|
| R1 | Create M10 cluster + DB user + network access + get URI | 0.33 | — | 2 | ✅ Done |
| R2 | Update `server/.env` MONGODB_URI | 0.08 | R1 | 2 | ✅ Done |
| R3 | Refactor 5 scripts: hardcoded URI → `process.env.MONGODB_URI` | 0.17 | R2 | 2 | ✅ Done |
| R3.1 | SRV DNS fix: force Google DNS + fix URLSearchParams | 0.25 | R3 | 2 | ✅ Done |
| R4.1 | Re-run `seedData.js` (11 companies, 36 jobs, 10 users) | 0.17 | R3.1 | 3.2 | ✅ Done |
| R4.2 | Re-run `seedEmbeddings.js` (36/36 embedded, 0 fails) | 0.33 | R4.1 | 3.2 | ✅ Done |
| R4.3 | Re-run `seedEvents.js` (215 events, 10 users) | 0.17 | R4.1 | 3.2 | ✅ Done |
| B | `embeddingService.js` | 0.50 | — | 4.1 | ✅ Done |
| C | Auto-embed on postJob() | 0.17 | B | 4.1 | ✅ Done |
| E | Atlas Vector Search Index `idx_jobs_vector` | 0.33 | R4.2 | 4.2 | ✅ Done |
| T | `testVectorSearch.js` — 3/3 queries PASS | 0.17 | E | 4.2 | ✅ Done |
| F | `GET /api/jobs/recommend-content` (8-stage pipeline) | 1.00 | E, B | 4.3 | ✅ Done |
| H | User behavior tracking API | 0.50 | — | 5.1 | ✅ Done |
| I | User profile embedding + preferences API | 0.67 | H | 5.2 | ✅ Done |
| J | Collaborative filtering API | 0.67 | H | 5.3 | ✅ Done |
| K | `GET /api/jobs/recommend-feed` (hybrid blender) | 0.50 | F, I, J | 5.4 | ✅ Done |
| **L** | **Frontend (RecommendedJobs + Onboarding + tracking)** | **2.00** | K | 6.1 | ⬜ To-Do |
| **M** | **E2E test + technical doc + demo video** | **5.00** | L | 6.2-6.3 | ⬜ To-Do |

**Backend tasks:** 15/15 done (100%)
**Total remaining:** 2 tasks, 7.00h

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID | ES (h) | EF (h) | Notes |
|----|--------|--------|-------|
| R1→K | 0.00 | 3.00 | ✅ All done (~3h actual, with SRV DNS debugging) |
| **L** | **3.00** | **5.00** | **Frontend integration (can start now)** |
| **M** | **5.00** | **10.00** | **E2E test + docs + video** |

---

## 4. Critical Path

```
L ──→ M
```

| Step | Task | ES | EF | Duration |
|------|------|----|----|----------|
| 1 | L: Frontend (RecommendedJobs + Onboarding + event tracking) | 3.00 | 5.00 | 2.00h |
| 2 | M: E2E test + technical doc + demo video | 5.00 | 10.00 | 5.00h |

| Metric | Value |
|--------|-------|
| Critical path remaining | **7.00h** |
| Elapsed (actual) | ~3.0h |
| Working buffer to deadline | ~43.8h |
| Deadline risk | **LOW** — 43.8h buffer vs 7.0h remaining work |
| Backend status | **100% COMPLETE** (15/15 tasks) |

---

## 5. Non-Critical Tasks (Float)

| Task | Float | Notes |
|------|-------|-------|
| All R1→K tasks | ∞ | Done — no changes needed |
| Frontend event tracking | 0h | Part of L — IntersectionObserver + useEffect view events |
| Explanation badges | Included in L | Can cut if time-constrained (low-priority polish) |

---

## 6. Execution Order (Single Phase)

| Step | Task | Duration | Owner |
|------|------|----------|-------|
| 1 | L1: Create `RecommendedJobs.jsx` component | 0.50h | Khiem |
| 2 | L2: Update `Home.jsx` — insert RecommendedJobs | 0.25h | Khiem |
| 3 | L3: Replace `findSimilarJobs` in `ApplyJob.jsx` | 0.25h | Khiem |
| 4 | L4: Create `OnboardingModal.jsx` | 0.50h | Khiem |
| 5 | L5: Frontend event tracking (ApplyJob + JobListing) | 0.50h | Khiem |
| 6 | M1: E2E testing (3 flows) | 1.50h | Khiem |
| 7 | M2: Technical document | 1.50h | Khiem |
| 8 | M3: Demo video (10 min) | 2.00h | Quốc Hào |

---

## 7. Rủi ro & Mitigation

| Rủi ro | Impact | Mitigation |
|--------|--------|-----------|
| ~~SRV DNS fails for new cluster~~ | ~~Block all connections~~ | ✅ Fixed |
| ~~IP whitelist blocks scripts~~ | ~~Block seeding~~ | ✅ Fixed |
| ~~OpenAI rate limit~~ | ~~Slow embedding~~ | ✅ 36/36 passed |
| ~~Atlas Search Index not available~~ | ~~Showstopper~~ | ✅ Active, verified |
| ~~Collaborative filtering complex~~ | ~~No time~~ | ✅ Done, 13-stage pipeline |
| Frontend component complexity | Medium | Can cut explanation badges; use simple horizontal scroll |
| Clerk auth in frontend API calls | Medium | Pattern already exists in codebase — reuse getToken() pattern |
| Demo video recording | Medium | Quốc Hào handles; script provided in WBS |
| Còn ~46.8h, critical path 7.0h | LOW risk | Buffer ~43h |

---

## 8. Summary

```
Backend status:     100% COMPLETE — 15/15 tasks done
                     - Atlas M10 cluster + Vector Search Index + DNS fix
                     - 36 jobs embedded (OpenAI text-embedding-3-large, 3072d)
                     - 215 events for 10 users
                     - 3 recommendation APIs: recommend-content, collaborative, recommend-feed
                     - $vectorSearch + Aggregation Pipeline verified active
                     - User profile embedding (weighted avg + unit vec normalization)
Remaining:           Frontend (L: 2.0h) + E2E/Docs/Video (M: 5.0h) = 7.0h
Elapsed this session: ~3.0h
Available time:      46.8h (1.95 days to deadline)
Working buffer:      ~43h
Deadline:            2026-05-31 18:00 VNT
```

## 9. What Changed Since Last CPM Update

| Change | Reason |
|--------|--------|
| **E → ✅ Done** | Atlas Vector Search Index deployed via ClickOps |
| **T → ✅ Done** | testVectorSearch.js created + 3/3 Vietnamese queries PASS |
| **F → ✅ Done** | recommend-content API with $vectorSearch + 8-stage pipeline |
| **K → ✅ Done** | recommend-feed hybrid blender (3 modes: hybrid, preferences, popular) |
| **DRY fix** | db.js now imports uriFromSrv instead of duplicating resolver logic |
| **Critical path -1.67h** | E, T, F, K removed from path (all done); L→M only remains |
| **Buffer ~43h** | 46.8h total - 3h elapsed = still extremely safe |
| **Backend: 100%** | All 15 backend tasks complete — focus shifts entirely to frontend |
| **Epic 4+5: COMPLETE** | Semantic Search Engine + Behavior-Based Recommendation fully done |
